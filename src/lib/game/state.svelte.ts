import { baits, venues } from '$lib/data';
import type { Rod, Reel, Line, Hook, Bait, Venue, Lake } from '$lib/data';

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
	mode = $state<'session' | 'match'>('session');
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

	init(mode: 'session' | 'match') {
		this.mode = mode;
		this.phase = 'prep';
		this.venueName = '';
		this.lakeName = '';
		this.playerPeg = undefined;
		this.timeLimitMinutes = undefined;
		this.timeRemainingSeconds = 0;
		this.anglers = [];
	}

	setVenue(name: string) {
		this.venueName = name;
		if (!this.anglers.some((a) => a.isPlayer)) {
			this.anglers.push({
				id: 'player',
				name: 'You',
				isPlayer: true,
				pegName: '',
				phase: 'cast',
				tackle: { ...defaultTackle },
				totalWeightOz: 0,
				biggestFish: null,
				catch: []
			});
		}
	}

	setLake(name: string) {
		this.lakeName = name;
	}

	setPeg(peg: string) {
		this.playerPeg = peg;
		const player = this.playerAngler;
		if (player) player.pegName = peg;
	}

	setTimeLimit(minutes: number) {
		this.timeLimitMinutes = minutes;
		this.timeRemainingSeconds = minutes * 60;
	}

	updateTackle(tackle: TackleSelection) {
		const player = this.playerAngler;
		if (player) player.tackle = tackle;
	}

	startFishing() {
		this.phase = this.mode === 'match' ? 'draw' : 'fishing';
	}

	startDraw() {
		this.phase = 'draw';
	}

	startGame() {
		this.phase = 'fishing';
		this.generateFish();
	}

	endGame() {
		this.phase = 'results';
	}

	private generateFish() {
		/* stub — fish population generated here for all pegs */
	}
}

export const gameState = new GameState();
