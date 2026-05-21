import { SvelteMap } from 'svelte/reactivity';
import { baits, bots, venues, species } from '$lib/data';
import type { Venue, Lake, TackleSelection } from '$lib/data';
import type { GameMode } from './prep-flow';
import { populatePeg, resetIds } from './population';
import type { FishData } from './population';
import { FishingLoop } from './loop';
import type { FishingEvent, FishingPhase } from './loop';

export type GamePhase = 'prep' | 'draw' | 'fishing' | 'results';

export type AnglerPhase =
	| 'cast'
	| 'wait'
	| 'bite'
	| 'strike'
	| 'reel'
	| 'net'
	| 'catch'
	| 'finished';

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
	phase: AnglerPhase;
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
	bait: baits[0]
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
	playerPhase = $state<FishingPhase | null>(null);
	playerRemainingMs = $state(0);
	playerCaughtCount = $state(0);
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
		this.playerPhase = null;
		this.playerRemainingMs = 0;
		this.playerCaughtCount = 0;
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
			phase: 'cast',
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

		// Clear bots from any previous draw so re-draws stay clean
		this.anglers = this.anglers.filter((a) => a.isPlayer);

		const lake = this.requireLake();
		const pegs = [...lake.pegs];

		// Shuffle pegs using Fisher-Yates
		for (let i = pegs.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[pegs[i], pegs[j]] = [pegs[j], pegs[i]];
		}

		// Assign first peg to player
		const playerPeg = pegs[0];
		this.playerPeg = playerPeg.name;
		const player = this.ensurePlayerAngler();
		player.pegName = playerPeg.name;

		// Assign remaining pegs to bots
		const botPool = [...bots];
		const botCount = pegs.length - 1;

		for (let i = 0; i < botCount; i++) {
			const botIndex = Math.floor(Math.random() * botPool.length);
			const botDef = botPool.splice(botIndex, 1)[0];
			const peg = pegs[i + 1];

			const botAngler: AnglerState = {
				id: `bot-${botDef.name.toLowerCase()}`,
				name: botDef.name,
				isPlayer: false,
				skill: botDef.skill,
				pegName: peg.name,
				phase: 'cast',
				tackle: { ...defaultTackle },
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
	}

	private initPlayerLoop() {
		const player = this.playerAngler;
		const peg = player ? this.lake?.pegs.find((p) => p.name === player.pegName) : undefined;
		if (!player || !peg) {
			this.playerLoop = null;
			return;
		}

		this.playerLoop = new FishingLoop(player.tackle, player.skill, peg.features, species, 'Bottom');
		this.syncPlayerState();
	}

	private syncPlayerState() {
		this.playerPhase = this.playerLoop?.phase ?? null;
		this.playerRemainingMs = this.playerLoop?.remainingMs ?? 0;
		this.playerCaughtCount = this.playerLoop?.caughtFish.length ?? 0;
	}

	private syncLoopTackle() {
		const player = this.playerAngler;
		if (this.playerLoop && player) {
			this.playerLoop.updateTackle(player.tackle);
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

	cast(): FishingEvent | null {
		this.syncLoopTackle();
		const pop = this.getPegPopulation(this.playerPeg ?? '');
		const event =
			this.playerLoop?.cast(pop, (id) => this.removeFishFromPeg(this.playerPeg ?? '', id)) ?? null;
		this.syncPlayerState();
		this.lastEvent = event;
		return event;
	}

	tick(elapsedMs: number): FishingEvent | null {
		const event = this.playerLoop?.tick(elapsedMs) ?? null;
		if (event) this.lastEvent = event;
		this.syncPlayerState();
		return event;
	}

	recast(): void {
		this.playerLoop?.recast();
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
		this.lastEvent = event;
		this.syncPlayerState();
		return event;
	}

	net(): FishingEvent | null {
		const event = this.playerLoop?.net() ?? null;
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
