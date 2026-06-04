import { SvelteMap } from 'svelte/reactivity';
import { species } from '$lib/data';
import type { Venue, Lake, TackleSelection } from '$lib/data';
import { populatePeg, reassignDynamicProperties, resetIds } from './population';
import type { FishData } from './population';
import { FishingLoop } from './loop';
import type { FishingEvent, PlayerLoopSnapshot } from './loop';
import { BotController } from './bot-controller';
import { pickBotTackle } from './tackle-utils';
import type { AnglerState, GamePhase } from './prep-state.svelte';
import { MatchTimer } from './match-timer.svelte';

export { type GamePhase, type AnglerState } from './prep-state.svelte';

export interface BotCatchEvent {
	name: string;
	pegName: string;
	classificationLabel: string;
	species: string;
}

export interface CatchAuditEntry {
	caughtAtMs: number;
	anglerId: string;
	anglerName: string;
	species: string;
	classificationLabel: string;
	weightOz: number;
}

export class GameState {
	matchTimer = new MatchTimer();
	phase = $state<GamePhase>('idle');
	anglers = $state<AnglerState[]>([]);

	get timeRemainingSeconds() {
		return this.matchTimer.timeRemainingSeconds;
	}

	get timeExpired() {
		return this.matchTimer.timeExpired;
	}

	get weighInEarlyActive() {
		return this.matchTimer.weighInEarlyActive;
	}
	pegPopulations = new SvelteMap<string, FishData[]>();
	playerLoop: FishingLoop | null = null;
	botControllers = new SvelteMap<string, BotController>();
	playerSnapshot = $state<PlayerLoopSnapshot | null>(null);
	lastEvent = $state<FishingEvent | null>(null);
	botCatchFeed = $state<BotCatchEvent[]>([]);
	catchAudit = $state<CatchAuditEntry[]>([]);
	sessionStartMs = 0;
	initialTackleChosen = $state(false);

	onCatch:
		| ((info: {
				species: string;
				classificationLabel: string;
				weightOz: number;
				anglerName: string;
				pegName: string;
		  }) => void)
		| null = null;

	private playerPeg = '';

	get playerAngler(): AnglerState | undefined {
		return this.anglers.find((a) => a.isPlayer);
	}

	beginFishing(anglers: AnglerState[], venue: Venue, lake: Lake, timeLimitMinutes?: number) {
		const player = anglers.find((a) => a.isPlayer);
		if (!player?.pegName) {
			throw new Error('Peg must be selected before fishing');
		}

		this.anglers = anglers;
		this.playerPeg = player.pegName;

		this.matchTimer.setTimeLimit(timeLimitMinutes);

		this.phase = 'fishing';
		this.catchAudit = [];
		this.initialTackleChosen = false;
		this.sessionStartMs = Date.now();
		resetIds();
		this.generateFish(lake);

		this.playerLoop = this.createPlayerLoop(lake, player);
		this.initBotControllers(lake);

		for (const pegName of this.pegPopulations.keys()) {
			const pop = this.pegPopulations.get(pegName);
			if (!pop) continue;

			const angler = this.anglers.find((a) => a.pegName === pegName);

			if (angler?.isPlayer && this.playerLoop) {
				this.playerLoop.preparePopulation(pop, (id) => this.removeFishFromPeg(pegName, id));
				this.playerLoop.enterChanging();
			} else {
				const controller = this.botControllers.get(angler?.id ?? '');
				if (controller) {
					controller.loop.preparePopulation(pop, (id) => this.removeFishFromPeg(pegName, id));
					controller.enterChanging();
				}
			}
		}

		this.syncPlayerState();
	}

	private createPlayerLoop(lake: Lake, player: AnglerState): FishingLoop | null {
		const peg = lake.pegs.find((p) => p.name === player.pegName);
		if (!peg) return null;

		const loop = new FishingLoop(player.tackle, player.skill, species, undefined, () => {
			const pop = this.pegPopulations.get(this.playerPeg);
			if (pop) reassignDynamicProperties(pop, species);
		});
		this.syncPlayerState();
		return loop;
	}

	private initBotControllers(lake: Lake) {
		this.botControllers.clear();

		for (const bot of this.anglers) {
			if (bot.isPlayer) continue;

			const peg = lake.pegs.find((p) => p.name === bot.pegName);
			if (!peg) continue;

			const loop = new FishingLoop(bot.tackle, bot.skill, species, undefined, () => {
				const pop = this.pegPopulations.get(bot.pegName);
				if (pop) reassignDynamicProperties(pop, species);
			});

			const controller = new BotController(loop, bot.skill, Math.random, () =>
				pickBotTackle(bot.skill, peg, lake)
			);

			this.botControllers.set(bot.id, controller);
		}
	}

	private syncPlayerState() {
		this.playerSnapshot = this.playerLoop?.getSnapshot() ?? null;
	}

	private syncLoopTackle() {
		const player = this.playerAngler;
		if (this.playerLoop && player) {
			this.playerLoop.updateTackle(player.tackle);
		}
	}

	private syncBotAngler(angler: AnglerState, loop: FishingLoop) {
		if (loop.caughtFish.length > angler.catch.length) {
			const newFish = loop.caughtFish[loop.caughtFish.length - 1];
			angler.catch.push(newFish);
			angler.totalWeightOz += newFish.weightOz;
			if (!angler.biggestFish || newFish.weightOz > angler.biggestFish.weightOz) {
				angler.biggestFish = { ...newFish };
			}
			this.catchAudit = [
				...this.catchAudit,
				{
					caughtAtMs: Date.now() - this.sessionStartMs,
					anglerId: angler.id,
					anglerName: angler.name,
					species: newFish.species,
					classificationLabel: newFish.classificationLabel,
					weightOz: newFish.weightOz
				}
			];
		}
	}

	updateTackle(tackle: TackleSelection) {
		const player = this.playerAngler;
		if (player) player.tackle = tackle;
		if (this.playerLoop) {
			this.playerLoop.updateTackle(tackle);
		}
	}

	beginChangeTackle() {
		this.playerLoop?.enterChanging();
		this.syncPlayerState();
	}

	finishChangingTackle() {
		if (this.playerLoop && this.playerLoop.phase === 'changing') {
			this.playerLoop.phase = 'idle';
		}
		this.initialTackleChosen = true;
		this.syncPlayerState();
	}

	cast(): FishingEvent | null {
		this.syncLoopTackle();
		const pop = this.getPegPopulation(this.playerPeg);
		const event =
			this.playerLoop?.cast(pop, (id) => this.removeFishFromPeg(this.playerPeg, id)) ?? null;
		this.syncPlayerState();
		if (event) this.lastEvent = event;
		return event;
	}

	tick(elapsedMs: number): FishingEvent | null {
		const ms = this.weighInEarlyActive ? elapsedMs * 30 : elapsedMs;

		const wasExpired = this.matchTimer.timeExpired;
		this.matchTimer.tick(elapsedMs);
		if (!wasExpired && this.matchTimer.timeExpired) {
			this.cutOffBots();
		}

		if (this.timeExpired && !this.weighInEarlyActive && this.playerSnapshot?.phase === 'idle') {
			this.finishGame();
			return null;
		}

		for (const [id, controller] of this.botControllers) {
			const angler = this.anglers.find((a) => a.id === id);
			if (!angler || angler.phase === 'finished') continue;

			const loop = controller.loop;
			angler.phase = loop.phase;
			angler.tackle = loop.tackleSelection;

			const event = controller.tick(ms);
			if (event && event.type === 'fishCaught') {
				this.syncBotAngler(angler, loop);
				this.botCatchFeed = [
					...this.botCatchFeed,
					{
						name: angler.name,
						pegName: angler.pegName,
						classificationLabel: event.classificationLabel,
						species: event.species
					}
				];
			}
		}

		if (this.weighInEarlyActive) {
			if (this.playerLoop && this.playerLoop.phase !== 'reeling') {
				this.playerLoop.resetCast();
				this.syncPlayerState();
			}
		} else {
			if (this.timeExpired && this.playerLoop) {
				const phase = this.playerLoop.phase;
				if (phase !== 'reeling') {
					this.playerLoop.resetCast();
					this.syncPlayerState();
				}
			}

			const event = this.playerLoop?.tick(elapsedMs) ?? null;
			if (event) this.lastEvent = event;
			this.syncPlayerState();

			if (this.timeExpired && this.playerLoop) {
				const phase = this.playerLoop.phase;
				if (phase !== 'reeling') {
					this.playerLoop.resetCast();
					this.syncPlayerState();
				}
			}

			if (!event && this.playerSnapshot?.phase === 'waiting') {
				this.lastEvent = null;
			}

			if (this.playerSnapshot?.phase === 'idle' && !this.timeExpired) {
				const pop = this.getPegPopulation(this.playerPeg);
				const castEvent =
					this.playerLoop?.cast(pop, (id) => this.removeFishFromPeg(this.playerPeg, id)) ?? null;
				this.lastEvent = castEvent;
				this.syncPlayerState();
				return castEvent;
			}

			if (this.timeExpired && this.playerSnapshot?.phase === 'idle') {
				this.finishGame();
			}
		}

		if (this.weighInEarlyActive && this.timeExpired) {
			this.finishGame();
		}

		return null;
	}

	weighInEarly() {
		this.matchTimer.weighInEarly();
		if (this.playerLoop) {
			this.playerLoop.resetCast();
		}
		this.syncPlayerState();
	}

	finishGame() {
		this.phase = 'results';
		this.botCatchFeed = [];
	}

	private cutOffBots() {
		for (const [id, controller] of this.botControllers) {
			const angler = this.anglers.find((a) => a.id === id);
			if (!angler) continue;

			controller.loop.phase = 'finished';
			angler.phase = 'finished';
		}
	}

	private generateFish(lake: Lake) {
		this.pegPopulations.clear();
		const isSession = this.anglers.length === 1;

		for (const peg of lake.pegs) {
			const hasAngler = this.anglers.some((a) => a.pegName === peg.name);
			if (!hasAngler) continue;

			const count = isSession ? lake.fishCount : Math.floor(lake.fishCount / lake.pegs.length);

			this.pegPopulations.set(peg.name, populatePeg(lake, peg, species, count));
		}
	}

	getPegPopulation(pegName: string): FishData[] {
		return this.pegPopulations.get(pegName) ?? [];
	}

	removeFishFromPeg(pegName: string, fishId: string): void {
		const pop = this.pegPopulations.get(pegName);
		if (!pop) return;
		this.pegPopulations.set(
			pegName,
			pop.filter((f) => f.id !== fishId)
		);
	}

	resetCast(): void {
		this.playerLoop?.resetCast();
		this.syncPlayerState();
	}

	strike(): FishingEvent | null {
		const event = this.playerLoop?.strike() ?? null;
		this.lastEvent = event;
		this.syncPlayerState();
		return event;
	}

	dismissCaught(): void {
		this.playerLoop?.dismissCaught();
		this.syncPlayerState();
	}

	handleReelingOutcome(result: 'caught' | 'lineBroke' | 'fishGotAway'): FishingEvent | null {
		const event = this.playerLoop?.handleReelingOutcome(result) ?? null;
		if (event) this.lastEvent = event;
		if (event?.type === 'fishCaught') {
			const player = this.playerAngler;
			if (player) {
				player.catch.push({
					species: event.species,
					classificationLabel: event.classificationLabel,
					weightOz: event.weightOz,
					caughtAtMs: Date.now()
				});
				player.totalWeightOz += event.weightOz;
				if (!player.biggestFish || event.weightOz > player.biggestFish.weightOz) {
					player.biggestFish = {
						species: event.species,
						classificationLabel: event.classificationLabel,
						weightOz: event.weightOz,
						caughtAtMs: Date.now()
					};
				}
				this.catchAudit = [
					...this.catchAudit,
					{
						caughtAtMs: Date.now() - this.sessionStartMs,
						anglerId: player.id,
						anglerName: player.name,
						species: event.species,
						classificationLabel: event.classificationLabel,
						weightOz: event.weightOz
					}
				];
				this.onCatch?.({
					species: event.species,
					classificationLabel: event.classificationLabel,
					weightOz: event.weightOz,
					anglerName: player.name,
					pegName: player.pegName
				});
			}
		}
		this.syncPlayerState();
		return event;
	}

	debugForceFish(fishId: string): boolean {
		const angler = this.playerAngler;
		if (!this.playerLoop || !angler) return false;
		if (this.playerLoop.phase !== 'waiting') return false;

		const pop = this.getPegPopulation(this.playerPeg);
		const fish = pop.find((f) => f.id === fishId);
		if (!fish) return false;

		if (fish.weightOz < angler.tackle.hook.minOz) return false;
		if (fish.weightOz < angler.tackle.line.minOz) return false;

		this.playerLoop.currentFish = fish;
		this.playerLoop.remainingMs = 2000;
		this.playerLoop.waitElapsedMs = 0;
		this.playerLoop.blankPatienceMs = 0;
		this.syncPlayerState();
		return true;
	}

	returnToCast(): void {
		this.playerLoop?.returnToCast();
		this.syncPlayerState();
	}

	endGame() {
		this.finishGame();
	}

	forceExpire() {
		this.matchTimer.forceExpire();
	}

	reset() {
		this.matchTimer.reset();
		this.phase = 'idle';
		this.anglers = [];
		this.pegPopulations = new SvelteMap();
		this.playerLoop = null;
		this.botControllers = new SvelteMap();
		this.playerSnapshot = null;
		this.lastEvent = null;
		this.botCatchFeed = [];
		this.catchAudit = [];
		this.sessionStartMs = 0;
		this.initialTackleChosen = false;
		this.onCatch = null;
	}
}

export const gameState = new GameState();
