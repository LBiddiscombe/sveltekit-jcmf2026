import { browser } from '$app/environment';
import { bots, venues } from '$lib/data';
import type { Venue, Lake, TackleSelection, CaughtFish } from '$lib/data';
import type { GameMode } from './prep-flow';
import type { FishingPhase } from './loop';
import { defaultTackle, pickBotTackle } from './tackle-utils';

const STORAGE_KEY = 'jcmf-prep';
const AVATAR_KEY = 'jcmf-player-avatar';

export type GamePhase = 'idle' | 'fishing' | 'results';

export interface AnglerState {
	id: string;
	name: string;
	image: string;
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
	playerName = $state('');
	playerAvatar = $state('');
	timeLimitMinutes = $state<number | undefined>();
	matchStartTime = $state<number | undefined>();
	anglers = $state<AnglerState[]>([]);

	constructor() {
		this.restore();
	}

	private restore() {
		if (!browser) return;
		try {
			const raw = sessionStorage.getItem(STORAGE_KEY);
			if (!raw) return;

			const data = JSON.parse(raw) as Record<string, unknown>;

			if (data.mode !== 'session' && data.mode !== 'match') return;
			if (typeof data.venueName !== 'string') return;
			if (typeof data.lakeName !== 'string') return;

			const venue = venues.find((v) => v.name === data.venueName);
			if (!venue) return;
			if (data.lakeName && !venue.lakes.some((l) => l.name === data.lakeName)) return;

			this.mode = data.mode as 'session' | 'match';
			this.venueName = data.venueName;
			this.lakeName = data.lakeName;
			if (typeof data.playerPeg === 'string') this.playerPeg = data.playerPeg;
			if (typeof data.playerName === 'string') this.playerName = data.playerName;
			if (typeof data.playerAvatar === 'string') this.playerAvatar = data.playerAvatar;
			if (typeof data.timeLimitMinutes === 'number') this.timeLimitMinutes = data.timeLimitMinutes;
			if (typeof data.matchStartTime === 'number') this.matchStartTime = data.matchStartTime;
			if (Array.isArray(data.anglers)) this.anglers = data.anglers as AnglerState[];
		} catch {
			sessionStorage.removeItem(STORAGE_KEY);
		}
	}

	private persist() {
		if (!browser) return;
		sessionStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				mode: this.mode,
				venueName: this.venueName,
				lakeName: this.lakeName,
				playerPeg: this.playerPeg,
				playerName: this.playerName,
				playerAvatar: this.playerAvatar,
				timeLimitMinutes: this.timeLimitMinutes,
				matchStartTime: this.matchStartTime,
				anglers: this.anglers
			})
		);
	}

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

	private get resolvedPlayerAvatar(): string {
		return this.playerAvatar || (browser ? (localStorage.getItem(AVATAR_KEY) ?? '') : '');
	}

	private ensurePlayerAngler(): AnglerState {
		const existing = this.playerAngler;
		if (existing) {
			existing.name = this.playerName || existing.name;
			existing.image = this.resolvedPlayerAvatar;
			return existing;
		}

		const player: AnglerState = {
			id: 'player',
			name: this.playerName || 'You',
			image: this.resolvedPlayerAvatar,
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
		this.playerName = '';
		this.playerAvatar = '';
		this.timeLimitMinutes = undefined;
		this.matchStartTime = undefined;
		this.anglers = [];
		if (browser) sessionStorage.removeItem(STORAGE_KEY);
	}

	startMatchTimer() {
		this.matchStartTime = Date.now();
		this.persist();
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
		this.persist();
	}

	selectLake(name: string) {
		const venue = this.requireVenue();
		const lake = venue.lakes.find((l) => l.name === name);
		if (!lake) throw new Error(`Lake not found at venue ${venue.name}: ${name}`);

		this.lakeName = lake.name;
		this.playerPeg = undefined;
		const player = this.ensurePlayerAngler();
		player.pegName = '';
		this.persist();
	}

	assignPeg(peg: string) {
		const lake = this.requireLake();
		if (!lake.pegs.some((p) => p.name === peg)) {
			throw new Error(`Peg not found at lake ${lake.name}: ${peg}`);
		}

		this.playerPeg = peg;
		const player = this.ensurePlayerAngler();
		player.pegName = peg;
		this.persist();
	}

	setMatchTimeLimit(minutes: number) {
		if (this.mode !== 'match') {
			throw new Error('Match time limit can only be set in match mode');
		}
		this.timeLimitMinutes = minutes;
		this.persist();
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
		player.name = this.playerName || 'You';
		player.image = this.playerAvatar;
		player.pegName = playerPeg.name;

		const botPool = this.playerAvatar
			? bots.filter((b) => b.image !== this.playerAvatar)
			: [...bots];
		const botCount = pegs.length - 1;

		for (let i = 0; i < botCount; i++) {
			const botIndex = Math.floor(Math.random() * botPool.length);
			const botDef = botPool.splice(botIndex, 1)[0];
			const peg = pegs[i + 1];

			const botTackle = pickBotTackle(botDef.skill, peg, lake);

			const botAngler: AnglerState = {
				id: `bot-${botDef.name.toLowerCase()}`,
				name: botDef.name,
				image: botDef.image,
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

		this.persist();
	}

	chooseTackle(tackle: TackleSelection) {
		const player = this.ensurePlayerAngler();
		player.tackle = tackle;
		this.persist();
	}
}

export const prepState = new PrepState();
