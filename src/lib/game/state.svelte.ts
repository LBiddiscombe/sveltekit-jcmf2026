import { baits, bots, venues } from '$lib/data';
import type { Rod, Reel, Line, Hook, Bait, Venue, Lake } from '$lib/data';
import type { GameMode } from './prep-flow';

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
	weightOz: number;
}

export interface TackleSelection {
	rod: Rod;
	reel: Reel;
	line: Line;
	hook: Hook;
	bait: Bait;
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
	}

	finishGame() {
		this.phase = 'results';
	}

	private generateFish() {
		/* stub — fish population generated here for all pegs */
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
