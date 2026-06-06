import { SvelteMap } from 'svelte/reactivity';
import { species } from '$lib/data';
import type { Venue, Lake, TackleSelection, CaughtFish } from '$lib/data';
import { populatePeg, reassignDynamicProperties } from './population';
import type { FishData } from './population';
import { FishingLoop } from './loop';
import type { FishingEvent, PlayerLoopSnapshot } from './loop';
import { BotController } from './bot-controller';
import type { BotControllerSaveData } from './bot-controller';
import { pickBotTackle } from './tackle-utils';
import type { AnglerState, GamePhase } from './prep-state.svelte';
import { MatchTimer } from './match-timer.svelte';
import type { MatchRules } from './match-rules';
import { defaultMatchRules } from './match-rules';
import { recordCatch, type ScorecardResult } from './scorecard.svelte';
import { saveMatch } from './save.svelte';
import type { SavedMatchData } from './save.svelte';

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
	matchRules: MatchRules = $state(defaultMatchRules());

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
	private botCaughtIndex = new SvelteMap<string, number>();

	onCatch:
		| ((info: {
				species: string;
				classificationLabel: string;
				weightOz: number;
				anglerName: string;
				pegName: string;
				points: number;
		  }) => void)
		| null = null;

	private playerPeg = '';

	get playerAngler(): AnglerState | undefined {
		return this.anglers.find((a) => a.isPlayer);
	}

	beginFishing(
		anglers: AnglerState[],
		venue: Venue,
		lake: Lake,
		timeLimitMinutes?: number,
		matchRules?: MatchRules
	) {
		const player = anglers.find((a) => a.isPlayer);
		if (!player?.pegName) {
			throw new Error('Peg must be selected before fishing');
		}

		this.anglers = anglers;
		this.playerPeg = player.pegName;
		this.matchRules = matchRules ?? defaultMatchRules({ timeLimitMinutes: timeLimitMinutes ?? 5 });

		this.matchTimer.setTimeLimit(timeLimitMinutes);

		this.phase = 'fishing';
		this.catchAudit = [];
		this.initialTackleChosen = false;
		this.sessionStartMs = Date.now();
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
				pickBotTackle(bot.skill, peg, lake, this.matchRules.speciesFilterKind)
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

	private syncBotAngler(angler: AnglerState, loop: FishingLoop): ScorecardResult | null {
		const lastSync = this.botCaughtIndex.get(angler.id) ?? 0;
		if (loop.caughtFish.length > lastSync) {
			const newFish = loop.caughtFish[loop.caughtFish.length - 1];
			const result = recordCatch(angler, newFish, this.matchRules);
			this.botCaughtIndex.set(angler.id, loop.caughtFish.length);

			if (result.qualifies) {
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
			return result;
		}
		return null;
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
				const cardResult = this.syncBotAngler(angler, loop);
				if (cardResult?.qualifies) {
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

		for (const peg of lake.pegs) {
			const hasAngler = this.anglers.some((a) => a.pegName === peg.name);
			if (!hasAngler) continue;

			this.pegPopulations.set(peg.name, populatePeg(lake, peg, species, lake.fishPerPeg));
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
				const fish: CaughtFish = {
					species: event.species,
					tierIndex: event.tierIndex,
					classificationLabel: event.classificationLabel,
					weightOz: event.weightOz,
					caughtAtMs: Date.now()
				};
				const { qualifies, points } = recordCatch(player, fish, this.matchRules);
				if (qualifies) {
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
						pegName: player.pegName,
						points
					});
				}
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
		this.botCaughtIndex.clear();
	}

	saveSnapshot(venueName?: string, lakeName?: string, matchStartTime?: number): SavedMatchData {
		const botControllers: Record<string, BotControllerSaveData> = {};
		for (const [id, controller] of this.botControllers) {
			botControllers[id] = controller.saveSnapshot();
		}

		const botCaughtIndex: Record<string, number> = {};
		for (const [id, index] of this.botCaughtIndex) {
			botCaughtIndex[id] = index;
		}

		const pegPopulations: Record<string, FishData[]> = {};
		for (const [name, pop] of this.pegPopulations) {
			pegPopulations[name] = pop;
		}

		return {
			version: 1,
			venueName: venueName ?? '',
			lakeName: lakeName ?? '',
			playerPeg: this.playerPeg,
			matchRules: this.matchRules,
			timeLimitMinutes: Math.ceil(this.matchTimer.timeRemainingSeconds / 60),
			matchStartTime: matchStartTime ?? 0,
			anglers: this.anglers,
			catchAudit: [...this.catchAudit],
			sessionStartMs: this.sessionStartMs,
			initialTackleChosen: this.initialTackleChosen,
			timerRemainingSeconds: this.matchTimer.timeRemainingSeconds,
			timerExpired: this.matchTimer.timeExpired,
			weighInEarlyActive: this.matchTimer.weighInEarlyActive,
			pegPopulations,
			playerLoop: this.playerLoop?.saveSnapshot() ?? null,
			botControllers,
			botCaughtIndex
		};
	}

	restoreFromSave(data: SavedMatchData, lake: Lake) {
		this.phase = 'fishing';
		this.anglers = data.anglers;
		this.matchRules = data.matchRules;
		this.catchAudit = data.catchAudit;
		this.sessionStartMs = data.sessionStartMs;
		this.initialTackleChosen = data.initialTackleChosen;
		this.playerPeg = data.playerPeg;
		this.botCatchFeed = [];
		this.lastEvent = null;
		this.onCatch = null;

		this.matchTimer.timeRemainingSeconds = data.timerRemainingSeconds;
		this.matchTimer.timeExpired = data.timerExpired;
		this.matchTimer.weighInEarlyActive = data.weighInEarlyActive;

		this.pegPopulations = new SvelteMap();
		for (const [name, pop] of Object.entries(data.pegPopulations)) {
			this.pegPopulations.set(name, pop);
		}

		const playerAngler = this.playerAngler;

		if (data.playerLoop && playerAngler) {
			const loop = new FishingLoop(
				playerAngler.tackle,
				playerAngler.skill,
				species,
				undefined,
				() => {
					const pop = this.pegPopulations.get(this.playerPeg);
					if (pop) reassignDynamicProperties(pop, species);
				}
			);
			const pop = this.pegPopulations.get(this.playerPeg) ?? [];
			if (data.playerLoop.phase === 'reeling' || data.playerLoop.phase === 'striking') {
				data.playerLoop.phase = 'idle';
				data.playerLoop.currentFish = null;
			}
			loop.loadSnapshot(data.playerLoop, pop, (id) => this.removeFishFromPeg(this.playerPeg, id));
			this.playerLoop = loop;
		}

		this.botControllers = new SvelteMap();
		for (const angler of this.anglers) {
			if (angler.isPlayer) continue;
			const savedController = data.botControllers[angler.id];
			if (!savedController) continue;

			const peg = lake.pegs.find((p) => p.name === angler.pegName);
			if (!peg) continue;

			const loop = new FishingLoop(angler.tackle, angler.skill, species, undefined, () => {
				const pop = this.pegPopulations.get(angler.pegName);
				if (pop) reassignDynamicProperties(pop, species);
			});

			const controller = new BotController(loop, angler.skill, Math.random, () =>
				pickBotTackle(angler.skill, peg, lake, this.matchRules.speciesFilterKind)
			);

			const pop = this.pegPopulations.get(angler.pegName) ?? [];
			if (savedController.loop.phase === 'reeling' || savedController.loop.phase === 'striking') {
				savedController.loop.phase = 'idle';
				savedController.loop.currentFish = null;
			}
			controller.loadSnapshot(savedController, pop, (id) =>
				this.removeFishFromPeg(angler.pegName, id)
			);

			this.botControllers.set(angler.id, controller);
		}

		this.botCaughtIndex = new SvelteMap();
		for (const [id, index] of Object.entries(data.botCaughtIndex)) {
			this.botCaughtIndex.set(id, index);
		}

		this.syncPlayerState();
	}

	saveToStorage(venueName?: string, lakeName?: string, matchStartTime?: number) {
		saveMatch(this.saveSnapshot(venueName, lakeName, matchStartTime));
	}
}

export const gameState = new GameState();
