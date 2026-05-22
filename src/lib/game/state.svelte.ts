import { SvelteMap } from 'svelte/reactivity';
import { baits, bots, venues, species, presets, resolvePreset, tacticalOverride } from '$lib/data';
import type { Venue, Lake, TackleSelection, Peg } from '$lib/data';
import type { GameMode } from './prep-flow';
import {
	populatePeg,
	reassignDynamicProperties,
	resetIds,
	passesTolerances,
	fishMatchScore,
	weightedSelectIndex
} from './population';
import type { FishData } from './population';
import { FishingLoop } from './loop';
import type { FishingEvent, FishingPhase } from './loop';

export type GamePhase = 'prep' | 'draw' | 'fishing' | 'results';

export interface CaughtFish {
	species: string;
	classificationLabel: string;
	weightOz: number;
}

export interface AnglerState {
	id: string;
	name: string;
	isPlayer: boolean;
	skill: number;
	pegName: string;
	phase: FishingPhase;
	tackle: TackleSelection;
	totalWeightOz: number;
	biggestFish: CaughtFish | null;
	catch: CaughtFish[];
}

const defaultTackle: TackleSelection = {
	rod: { name: 'Float', image: 'rod-float.png', deter: 0.1 },
	reel: { name: 'Fixed Spool', image: 'reel-fixed-spool.png', deter: 0.2 },
	line: { name: '4 lb', image: 'line.png', size: 64, minOz: 3, maxOz: 160, deter: 0.15 },
	hook: { name: '16', image: 'hook.png', size: 16, minOz: 10, maxOz: 200, deter: 0.15 },
	bait: baits[0],
	strata: 'Bottom',
	castStrength: 'Medium'
};

export class GameState {
	phase = $state<GamePhase>('prep');
	mode = $state<GameMode>('session');
	venueName = $state('');
	lakeName = $state('');
	playerPeg = $state<string | undefined>();
	timeLimitMinutes = $state<number | undefined>();
	timeRemainingSeconds = $state(0);
	anglers = $state<AnglerState[]>([]);
	pegPopulations = new SvelteMap<string, FishData[]>();
	playerLoop: FishingLoop | null = null;
	botLoops = new SvelteMap<string, FishingLoop>();
	playerPhase = $state<FishingPhase | null>(null);
	playerRemainingMs = $state(0);
	playerBiteWindowRemaining = $state(0);
	playerBiteWindowTotal = $state(0);
	playerReelTimerMs = $state(0);
	playerReelTimerRemaining = $state(0);
	playerLandingWindowMs = $state(0);
	playerLandingWindowRemaining = $state(0);
	playerCaughtCount = $state(0);
	playerBlankCasting = $state(false);
	lastEvent = $state<FishingEvent | null>(null);

	get venue(): Venue | undefined {
		return this.venueName ? venues.find((v) => v.name === this.venueName) : undefined;
	}

	get lake(): Lake | undefined {
		return this.lakeName ? this.venue?.lakes.find((l) => l.name === this.lakeName) : undefined;
	}

	get playerAngler(): AnglerState | undefined {
		return this.anglers.find((a) => a.isPlayer);
	}

	get currentTackle(): TackleSelection {
		return this.playerAngler?.tackle ?? { ...defaultTackle };
	}

	private reset(mode: GameMode) {
		this.mode = mode;
		this.phase = 'prep';
		this.venueName = '';
		this.lakeName = '';
		this.playerPeg = undefined;
		this.timeLimitMinutes = undefined;
		this.timeRemainingSeconds = 0;
		this.anglers = [];
		this.pegPopulations.clear();
		this.playerLoop = null;
		this.botLoops.clear();
		this.playerPhase = null;
		this.playerRemainingMs = 0;
		this.playerBiteWindowRemaining = 0;
		this.playerBiteWindowTotal = 0;
		this.playerReelTimerMs = 0;
		this.playerReelTimerRemaining = 0;
		this.playerLandingWindowMs = 0;
		this.playerLandingWindowRemaining = 0;
		this.playerCaughtCount = 0;
		this.playerBlankCasting = false;
		this.lastEvent = null;
		resetIds();
	}

	private ensurePlayerAngler(): AnglerState {
		const existing = this.playerAngler;
		if (existing) return existing;

		const player: AnglerState = {
			id: 'player',
			name: 'You',
			isPlayer: true,
			skill: 0,
			pegName: '',
			phase: 'idle',
			tackle: { ...defaultTackle },
			totalWeightOz: 0,
			biggestFish: null,
			catch: []
		};

		this.anglers.push(player);
		return player;
	}

	private requireVenue(): Venue {
		const venue = this.venue;
		if (!venue) {
			throw new Error('Venue must be selected before this action');
		}
		return venue;
	}

	private requireLake(): Lake {
		const lake = this.lake;
		if (!lake) {
			throw new Error('Lake must be selected before this action');
		}
		return lake;
	}

	startSession() {
		this.reset('session');
	}

	startMatch() {
		this.reset('match');
	}

	selectVenue(name: string) {
		const venue = venues.find((v) => v.name === name);
		if (!venue) {
			throw new Error(`Venue not found: ${name}`);
		}

		this.venueName = venue.name;
		this.lakeName = '';
		this.playerPeg = undefined;
		const player = this.ensurePlayerAngler();
		player.pegName = '';
	}

	selectLake(name: string) {
		const venue = this.requireVenue();
		const lake = venue.lakes.find((l) => l.name === name);
		if (!lake) {
			throw new Error(`Lake not found at venue ${venue.name}: ${name}`);
		}

		this.lakeName = lake.name;
		this.playerPeg = undefined;
		const player = this.ensurePlayerAngler();
		player.pegName = '';
	}

	assignPeg(peg: string) {
		const lake = this.requireLake();
		if (!lake.pegs.some((p) => p.name === peg)) {
			throw new Error(`Peg not found at lake ${lake.name}: ${peg}`);
		}

		this.playerPeg = peg;
		const player = this.ensurePlayerAngler();
		player.pegName = peg;
	}

	setMatchTimeLimit(minutes: number) {
		if (this.mode !== 'match') {
			throw new Error('Match time limit can only be set in match mode');
		}

		this.timeLimitMinutes = minutes;
		this.timeRemainingSeconds = minutes * 60;
	}

	drawMatch() {
		if (this.mode !== 'match') {
			throw new Error('Draw can only happen in match mode');
		}

		this.anglers = this.anglers.filter((a) => a.isPlayer);

		const lake = this.requireLake();
		const pegs = [...lake.pegs];

		for (let i = pegs.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[pegs[i], pegs[j]] = [pegs[j], pegs[i]];
		}

		const playerPeg = pegs[0];
		this.playerPeg = playerPeg.name;
		const player = this.ensurePlayerAngler();
		player.pegName = playerPeg.name;

		const botPool = [...bots];
		const botCount = pegs.length - 1;

		for (let i = 0; i < botCount; i++) {
			const botIndex = Math.floor(Math.random() * botPool.length);
			const botDef = botPool.splice(botIndex, 1)[0];
			const peg = pegs[i + 1];

			const botTackle = this.pickBotTackle(botDef.skill, peg);

			const botAngler: AnglerState = {
				id: `bot-${botDef.name.toLowerCase()}`,
				name: botDef.name,
				isPlayer: false,
				skill: botDef.skill,
				pegName: peg.name,
				phase: 'idle',
				tackle: botTackle,
				totalWeightOz: 0,
				biggestFish: null,
				catch: []
			};

			this.anglers.push(botAngler);
		}
	}

	chooseTackle(tackle: TackleSelection) {
		const player = this.ensurePlayerAngler();
		player.tackle = tackle;
	}

	beginFishing() {
		this.requireVenue();
		this.requireLake();
		if (this.mode === 'session' && !this.playerPeg) {
			throw new Error('Peg must be selected before fishing in session mode');
		}

		this.phase = 'fishing';
		this.generateFish();
		this.initPlayerLoop();
		this.initBotLoops();

		this.cast();
		for (const [, loop] of this.botLoops) {
			const botAngler = [...this.anglers].find(
				(a) => !a.isPlayer && a.pegName === this.anglerPegForLoop(loop)
			);
			if (botAngler) {
				const pop = this.getPegPopulation(botAngler.pegName);
				loop.cast(pop, (id) => this.removeFishFromPeg(botAngler.pegName, id));
			}
		}
	}

	private anglerPegForLoop(loop: FishingLoop): string | undefined {
		for (const [id] of this.botLoops) {
			if (this.botLoops.get(id) === loop) {
				return this.anglers.find((a) => a.id === id)?.pegName;
			}
		}
		return undefined;
	}

	private initPlayerLoop() {
		const player = this.playerAngler;
		const peg = player ? this.lake?.pegs.find((p) => p.name === player.pegName) : undefined;
		if (!player || !peg) {
			this.playerLoop = null;
			return;
		}

		this.playerLoop = new FishingLoop(
			player.tackle,
			player.skill,
			species,
			false,
			undefined,
			() => {
				const pop = this.pegPopulations.get(this.playerPeg ?? '');
				if (pop) reassignDynamicProperties(pop, species);
			}
		);
		this.syncPlayerState();
	}

	private initBotLoops() {
		this.botLoops.clear();

		for (const bot of this.anglers) {
			if (bot.isPlayer) continue;

			const peg = this.lake?.pegs.find((p) => p.name === bot.pegName);
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
				() => this.pickBotTackle(bot.skill, peg)
			);

			this.botLoops.set(bot.id, loop);
		}
	}

	private syncPlayerState() {
		this.playerPhase = this.playerLoop?.phase ?? null;
		this.playerRemainingMs = this.playerLoop?.remainingMs ?? 0;
		this.playerBiteWindowRemaining = this.playerLoop?.biteWindowRemaining ?? 0;
		this.playerBiteWindowTotal = this.playerLoop?.biteWindowTotal ?? 0;
		this.playerReelTimerMs = this.playerLoop?.reelTimerMs ?? 0;
		this.playerReelTimerRemaining = this.playerLoop?.reelTimerRemaining ?? 0;
		this.playerLandingWindowMs = this.playerLoop?.landingWindowMs ?? 0;
		this.playerLandingWindowRemaining = this.playerLoop?.landingWindowRemaining ?? 0;
		this.playerCaughtCount = this.playerLoop?.caughtFish.length ?? 0;
		this.playerBlankCasting = this.playerLoop?.isBlankCasting ?? false;
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

	finishGame() {
		this.phase = 'results';
	}

	private generateFish() {
		this.pegPopulations.clear();
		const lake = this.requireLake();
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

	private pickBotTackle(skill: number, peg: Peg): TackleSelection {
		const lake = this.lake;
		if (!lake) return { ...defaultTackle };

		const speciesChance = Math.min(1, skill * 0.1);

		if (Math.random() < speciesChance) {
			const weights = lake.species.map((ls) => {
				const sp = species.find((s) => s.name === ls.name);
				if (!sp) return 0;
				if (!passesTolerances(sp, peg.features)) return 0;
				return ls.frequency * fishMatchScore(sp, peg.features);
			});

			const idx = weightedSelectIndex(weights, Math.random);
			if (idx !== -1) {
				const targetName = lake.species[idx].name;
				const preset = presets.find((p) => p.targetSpecies === targetName);
				if (preset) {
					const tackle = resolvePreset(preset);
					const sp = species.find((s) => s.name === targetName) ?? null;
					const { strata, castStrength } = tacticalOverride(sp, tackle.rod.name);
					return { ...tackle, strata, castStrength };
				}
			}
		}

		const generalPresets = presets.filter((p) => !p.targetSpecies);
		const preset = generalPresets[Math.floor(Math.random() * generalPresets.length)];
		const tackle = resolvePreset(preset);
		const { strata, castStrength } = tacticalOverride(null, tackle.rod.name);
		return { ...tackle, strata, castStrength };
	}

	cast(): FishingEvent | null {
		this.syncLoopTackle();
		const pop = this.getPegPopulation(this.playerPeg ?? '');
		const event =
			this.playerLoop?.cast(pop, (id) => this.removeFishFromPeg(this.playerPeg ?? '', id)) ?? null;
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
			}
		}

		const event = this.playerLoop?.tick(elapsedMs) ?? null;
		if (event) this.lastEvent = event;
		this.syncPlayerState();

		if (!event && this.playerPhase === 'waiting') {
			if (this.playerLoop?.currentFish) {
				this.lastEvent = null;
			} else if (
				this.lastEvent?.type !== 'blankCast' ||
				!this.playerLoop?.isBlankCastMessageActive
			) {
				this.lastEvent = null;
			}
		}

		if (this.playerPhase === 'idle') {
			const pop = this.getPegPopulation(this.playerPeg ?? '');
			const castEvent =
				this.playerLoop?.cast(pop, (id) => this.removeFishFromPeg(this.playerPeg ?? '', id)) ??
				null;
			this.lastEvent = castEvent;
			this.syncPlayerState();
			return castEvent;
		}

		return event;
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

	init(mode: GameMode) {
		if (mode === 'match') {
			this.startMatch();
			return;
		}

		this.startSession();
	}

	setVenue(name: string) {
		this.selectVenue(name);
	}

	setLake(name: string) {
		this.selectLake(name);
	}

	setPeg(peg: string) {
		this.assignPeg(peg);
	}

	setTimeLimit(minutes: number) {
		this.setMatchTimeLimit(minutes);
	}

	updateTackle(tackle: TackleSelection) {
		this.chooseTackle(tackle);
		if (this.playerLoop && this.playerPhase !== null) {
			this.playerLoop.updateTackle(tackle);
		}
	}

	startFishing() {
		this.beginFishing();
	}

	startGame() {
		this.beginFishing();
	}

	endGame() {
		this.finishGame();
	}
}

export const gameState = new GameState();
