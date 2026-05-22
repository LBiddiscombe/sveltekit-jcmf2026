import { bots, venues } from '$lib/data';
import type { Venue, Lake, TackleSelection } from '$lib/data';
import type { GameMode } from './prep-flow';
import { resetIds } from './population';
import type { FishingPhase } from './loop';
import { defaultTackle, pickBotTackle } from './tackle-utils';

export type GamePhase = 'idle' | 'fishing' | 'results';

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

export class PrepState {
	mode = $state<GameMode>('session');
	venueName = $state('');
	lakeName = $state('');
	playerPeg = $state<string | undefined>();
	timeLimitMinutes = $state<number | undefined>();
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
		if (!venue) throw new Error('Venue must be selected before this action');
		return venue;
	}

	private requireLake(): Lake {
		const lake = this.lake;
		if (!lake) throw new Error('Lake must be selected before this action');
		return lake;
	}

	init(mode: GameMode) {
		this.mode = mode;
		this.venueName = '';
		this.lakeName = '';
		this.playerPeg = undefined;
		this.timeLimitMinutes = undefined;
		this.anglers = [];
		resetIds();
	}

	startSession() {
		this.init('session');
	}

	startMatch() {
		this.init('match');
	}

	selectVenue(name: string) {
		const venue = venues.find((v) => v.name === name);
		if (!venue) throw new Error(`Venue not found: ${name}`);

		this.venueName = venue.name;
		this.lakeName = '';
		this.playerPeg = undefined;
		const player = this.ensurePlayerAngler();
		player.pegName = '';
	}

	selectLake(name: string) {
		const venue = this.requireVenue();
		const lake = venue.lakes.find((l) => l.name === name);
		if (!lake) throw new Error(`Lake not found at venue ${venue.name}: ${name}`);

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
	}

	drawMatch() {
		if (this.mode !== 'match') throw new Error('Draw can only happen in match mode');

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

			const botTackle = pickBotTackle(botDef.skill, peg, lake);

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
}

export const prepState = new PrepState();
