import { partyUrl } from './host';
import type { SpeciesFilterKind } from '../match-rules';

export type MultiplayerPhase =
	| 'idle'
	| 'connecting'
	| 'lobby'
	| 'fishing'
	| 'grace-period'
	| 'results';

export interface PlayerInfo {
	name: string;
	image: string;
	pegName: string;
}

export interface CatchInfo {
	anglerName: string;
	pegName: string;
	species: string;
	classificationLabel: string;
	weightOz: number;
	caughtAtMs: number;
	points: number;
}

export class MultiplayerConnection {
	phase = $state<MultiplayerPhase>('idle');
	joinCode = $state('');
	connectionId = $state('');
	playerName = $state('');
	playerAvatar = $state('');
	isHost = $state(false);
	hostName = $state('');
	players = $state<PlayerInfo[]>([]);
	startTime = $state<number | null>(null);
	timeLimitMinutes = $state(0);
	winConditionKey = $state('weight');
	speciesFilterKind = $state<SpeciesFilterKind>('all');
	catchEvents = $state<CatchInfo[]>([]);
	ownPeg = $state<string | null>(null);
	error = $state<string | null>(null);

	private ws: WebSocket | null = null;
	private roomId = '';

	disconnect() {
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
		this.reset();
	}

	private reset() {
		this.phase = 'idle';
		this.joinCode = '';
		this.connectionId = '';
		this.playerName = '';
		this.playerAvatar = '';
		this.isHost = false;
		this.hostName = '';
		this.players = [];
		this.startTime = null;
		this.timeLimitMinutes = 0;
		this.winConditionKey = 'weight';
		this.speciesFilterKind = 'all';
		this.catchEvents = [];
		this.ownPeg = null;
		this.error = null;
		this.roomId = '';
	}

	createRoom(
		name: string,
		timeLimitMinutes: number,
		image: string = '',
		winConditionKey: string = 'weight',
		speciesFilterKind: SpeciesFilterKind = 'all'
	) {
		this.playerName = name;
		this.playerAvatar = image;
		this.timeLimitMinutes = timeLimitMinutes;
		this.winConditionKey = winConditionKey;
		this.speciesFilterKind = speciesFilterKind;
		this.isHost = true;
		this.roomId = this.generateCode();
		this.phase = 'connecting';
		this.connect();
	}

	joinRoom(name: string, code: string, image: string = '') {
		this.playerName = name;
		this.playerAvatar = image;
		this.roomId = code.toUpperCase();
		this.isHost = false;
		this.phase = 'connecting';
		this.connect();
	}

	private generateCode(): string {
		const chars = 'BCDFGHJKLMNPRTVWXYZ2346789';
		let code = '';
		for (let i = 0; i < 4; i++) {
			code += chars[Math.floor(Math.random() * chars.length)];
		}
		return code;
	}

	private connect() {
		if (this.ws) this.ws.close();

		const url = partyUrl(this.roomId);
		this.ws = new WebSocket(url);

		this.ws.onopen = () => {
			if (this.isHost) {
				this.send({
					type: 'create-room',
					name: this.playerName,
					image: this.playerAvatar,
					timeLimitMinutes: this.timeLimitMinutes,
					winConditionKey: this.winConditionKey,
					speciesFilterKind: this.speciesFilterKind
				});
			} else {
				this.send({ type: 'join-room', name: this.playerName, image: this.playerAvatar });
			}
		};

		this.ws.onmessage = (event: MessageEvent) => {
			try {
				const data = JSON.parse(event.data);
				this.handleMessage(data);
			} catch {
				/* ignore malformed messages */
			}
		};

		this.ws.onclose = () => {
			if (this.phase === 'connecting' || this.phase === 'lobby') {
				this.error = 'Connection lost';
			}
			this.phase = 'idle';
		};

		this.ws.onerror = () => {
			this.error = 'Connection failed';
			this.phase = 'idle';
		};
	}

	private send(msg: object) {
		if (this.ws?.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify(msg));
		}
	}

	private handleMessage(data: Record<string, unknown>) {
		switch (data.type) {
			case 'room-created': {
				this.joinCode = typeof data.joinCode === 'string' ? data.joinCode : '';
				break;
			}

			case 'room-state': {
				this.phase = 'lobby';
				this.players = Array.isArray(data.players) ? (data.players as PlayerInfo[]) : [];
				this.hostName = typeof data.hostName === 'string' ? data.hostName : '';
				this.timeLimitMinutes =
					typeof data.timeLimitMinutes === 'number' ? data.timeLimitMinutes : 0;
				this.winConditionKey =
					typeof data.winConditionKey === 'string' ? data.winConditionKey : 'weight';
				this.speciesFilterKind =
					typeof data.speciesFilterKind === 'string'
						? (data.speciesFilterKind as SpeciesFilterKind)
						: 'all';
				this.joinCode = typeof data.joinCode === 'string' ? data.joinCode : '';
				this.ownPeg = this.players.find((p) => p.name === this.playerName)?.pegName ?? null;
				break;
			}

			case 'player-joined': {
				this.players = Array.isArray(data.players) ? (data.players as PlayerInfo[]) : [];
				break;
			}

			case 'player-left': {
				this.players = Array.isArray(data.players) ? (data.players as PlayerInfo[]) : [];
				break;
			}

			case 'game-start': {
				this.phase = 'fishing';
				this.startTime = typeof data.startTime === 'number' ? data.startTime : Date.now();
				if (typeof data.timeLimitMinutes === 'number') {
					this.timeLimitMinutes = data.timeLimitMinutes;
				}
				if (typeof data.winConditionKey === 'string') {
					this.winConditionKey = data.winConditionKey;
				}
				if (typeof data.speciesFilterKind === 'string') {
					this.speciesFilterKind = data.speciesFilterKind as SpeciesFilterKind;
				}
				break;
			}

			case 'time-up': {
				this.phase = 'grace-period';
				break;
			}

			case 'catch': {
				const catchEvent: CatchInfo = {
					anglerName: typeof data.anglerName === 'string' ? data.anglerName : '',
					pegName: typeof data.pegName === 'string' ? data.pegName : '',
					species: typeof data.species === 'string' ? data.species : '',
					classificationLabel:
						typeof data.classificationLabel === 'string' ? data.classificationLabel : '',
					weightOz: typeof data.weightOz === 'number' ? data.weightOz : 0,
					caughtAtMs: typeof data.caughtAtMs === 'number' ? data.caughtAtMs : 0,
					points: typeof data.points === 'number' ? data.points : 0
				};
				this.catchEvents = [...this.catchEvents, catchEvent];
				break;
			}

			case 'game-over': {
				this.phase = 'results';
				if (Array.isArray(data.catchAudit)) {
					this.catchEvents = data.catchAudit as CatchInfo[];
				}
				break;
			}

			case 'error': {
				this.error = typeof data.message === 'string' ? data.message : 'Unknown error';
				break;
			}
		}
	}

	startGame() {
		this.send({ type: 'start-game' });
	}

	sendCatch(info: Omit<CatchInfo, 'caughtAtMs'>) {
		this.send({
			type: 'catch',
			...info,
			caughtAtMs: Date.now()
		});
	}

	sendDoneFishing() {
		this.send({ type: 'done-fishing' });
	}

	leave() {
		this.disconnect();
	}

	get ownPlayerInfo(): PlayerInfo | null {
		return this.players.find((p) => p.name === this.playerName) ?? null;
	}

	get otherPlayers(): PlayerInfo[] {
		return this.players.filter((p) => p.name !== this.playerName);
	}
}

export const multiplayer = new MultiplayerConnection();
