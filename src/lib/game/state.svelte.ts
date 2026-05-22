import { SvelteMap } from 'svelte/reactivity';
import { species } from '$lib/data';
import type { Venue, Lake, TackleSelection } from '$lib/data';
import { populatePeg, reassignDynamicProperties, resetIds } from './population';
import type { FishData } from './population';
import { FishingLoop } from './loop';
import type { FishingEvent, PlayerLoopSnapshot } from './loop';
import { pickBotTackle } from './tackle-utils';
import type { AnglerState, GamePhase } from './prep-state.svelte';

export { type GamePhase, type AnglerState } from './prep-state.svelte';

export interface BotCatchEvent {
	name: string;
	pegName: string;
	classificationLabel: string;
	species: string;
}

export class GameState {
	phase = $state<GamePhase>('idle');
	timeRemainingSeconds = $state(0);
	anglers = $state<AnglerState[]>([]);
	pegPopulations = new SvelteMap<string, FishData[]>();
	playerLoop: FishingLoop | null = null;
	botLoops = new SvelteMap<string, FishingLoop>();
	playerSnapshot = $state<PlayerLoopSnapshot | null>(null);
	lastEvent = $state<FishingEvent | null>(null);
	botCatchFeed = $state<BotCatchEvent[]>([]);

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

		if (timeLimitMinutes) {
			this.timeRemainingSeconds = timeLimitMinutes * 60;
		}

		this.phase = 'fishing';
		resetIds();
		this.generateFish(lake);

		this.playerLoop = this.createPlayerLoop(lake, player);
		this.initBotLoops(lake);

		for (const pegName of this.pegPopulations.keys()) {
			const pop = this.pegPopulations.get(pegName);
			if (!pop) continue;

			const angler = this.anglers.find((a) => a.pegName === pegName);
			const loop = angler?.isPlayer ? this.playerLoop : this.botLoops.get(angler?.id ?? '');

			if (loop) {
				loop.cast(pop, (id) => this.removeFishFromPeg(pegName, id));
			}
		}
	}

	private createPlayerLoop(lake: Lake, player: AnglerState): FishingLoop | null {
		const peg = lake.pegs.find((p) => p.name === player.pegName);
		if (!peg) return null;

		const loop = new FishingLoop(player.tackle, player.skill, species, false, undefined, () => {
			const pop = this.pegPopulations.get(this.playerPeg);
			if (pop) reassignDynamicProperties(pop, species);
		});
		this.syncPlayerState();
		return loop;
	}

	private initBotLoops(lake: Lake) {
		this.botLoops.clear();

		for (const bot of this.anglers) {
			if (bot.isPlayer) continue;

			const peg = lake.pegs.find((p) => p.name === bot.pegName);
			if (!peg) continue;

			const loop = new FishingLoop(
				bot.tackle,
				bot.skill,
				species,
				true,
				undefined,
				() => {
					const pop = this.pegPopulations.get(bot.pegName);
					if (pop) reassignDynamicProperties(pop, species);
				},
				() => pickBotTackle(bot.skill, peg, lake)
			);

			this.botLoops.set(bot.id, loop);
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
		angler.phase = loop.phase;
		angler.tackle = loop['tackle' as keyof FishingLoop] as unknown as TackleSelection;
		if (loop.caughtFish.length > angler.catch.length) {
			const newFish = loop.caughtFish[loop.caughtFish.length - 1];
			angler.catch.push(newFish);
			angler.totalWeightOz += newFish.weightOz;
			if (!angler.biggestFish || newFish.weightOz > angler.biggestFish.weightOz) {
				angler.biggestFish = { ...newFish };
			}
		}
	}

	updateTackle(tackle: TackleSelection) {
		const player = this.playerAngler;
		if (player) player.tackle = tackle;
		if (this.playerLoop && this.playerSnapshot?.phase) {
			this.playerLoop.updateTackle(tackle);
		}
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
		if (this.phase === 'fishing' && this.timeRemainingSeconds > 0) {
			this.timeRemainingSeconds = Math.max(0, this.timeRemainingSeconds - elapsedMs / 1000);

			if (this.timeRemainingSeconds <= 0) {
				this.cutOffBots();
				this.finishGame();
				return null;
			}
		}

		for (const [id, loop] of this.botLoops) {
			const angler = this.anglers.find((a) => a.id === id);
			if (!angler || angler.phase === 'finished') continue;

			const event = loop.tick(elapsedMs);
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

		const event = this.playerLoop?.tick(elapsedMs) ?? null;
		if (event) this.lastEvent = event;
		this.syncPlayerState();

		if (!event && this.playerSnapshot?.phase === 'waiting') {
			if (this.playerLoop?.currentFish) {
				this.lastEvent = null;
			} else if (
				this.lastEvent?.type !== 'blankCast' ||
				!this.playerLoop?.isBlankCastMessageActive
			) {
				this.lastEvent = null;
			}
		}

		if (this.playerSnapshot?.phase === 'idle') {
			const pop = this.getPegPopulation(this.playerPeg);
			const castEvent =
				this.playerLoop?.cast(pop, (id) => this.removeFishFromPeg(this.playerPeg, id)) ?? null;
			this.lastEvent = castEvent;
			this.syncPlayerState();
			return castEvent;
		}

		return event;
	}

	finishGame() {
		this.phase = 'results';
		this.botCatchFeed = [];
	}

	private cutOffBots() {
		for (const [id, loop] of this.botLoops) {
			const angler = this.anglers.find((a) => a.id === id);
			if (!angler) continue;

			if (loop.phase === 'reeling' || loop.phase === 'caught') {
				continue;
			}

			loop.phase = 'finished';
			angler.phase = 'finished';
		}
	}

	private generateFish(lake: Lake) {
		this.pegPopulations.clear();
		const countPerPeg = Math.floor(lake.fishCount / lake.pegs.length);

		for (const peg of lake.pegs) {
			this.pegPopulations.set(peg.name, populatePeg(lake, peg, species, countPerPeg));
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

	reel(): FishingEvent | null {
		this.syncLoopTackle();
		const event = this.playerLoop?.reel() ?? null;
		if (event?.type === 'fishCaught') {
			const player = this.playerAngler;
			if (player) {
				player.catch.push({
					species: event.species,
					classificationLabel: event.classificationLabel,
					weightOz: event.weightOz
				});
				player.totalWeightOz += event.weightOz;
				if (!player.biggestFish || event.weightOz > player.biggestFish.weightOz) {
					player.biggestFish = {
						species: event.species,
						classificationLabel: event.classificationLabel,
						weightOz: event.weightOz
					};
				}
			}
		}
		this.lastEvent = event;
		this.syncPlayerState();
		return event;
	}

	returnToCast(): void {
		this.playerLoop?.returnToCast();
		this.syncPlayerState();
	}

	endGame() {
		this.finishGame();
	}
}

export const gameState = new GameState();
