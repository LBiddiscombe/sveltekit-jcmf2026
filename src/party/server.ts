import type * as Party from 'partykit/server';

const PEGS = ['1', '2', '3', '4', '5', '6', '7', '8'];
const GRACE_PERIOD_MS = 15_000;

interface PlayerInfo {
	connectionId: string;
	name: string;
	pegName: string;
}

interface CatchEvent {
	anglerName: string;
	pegName: string;
	species: string;
	classificationLabel: string;
	weightOz: number;
	caughtAtMs: number;
}

interface RoomState {
	phase: 'lobby' | 'fishing' | 'grace-period' | 'results';
	hostConnectionId: string;
	hostName: string;
	timeLimitMinutes: number;
	players: PlayerInfo[];
	startTime: number | null;
	catchAudit: CatchEvent[];
	readyConnectionIds: string[];
}

export default class GameRoom implements Party.Server {
	state: RoomState = {
		phase: 'lobby',
		hostConnectionId: '',
		hostName: '',
		timeLimitMinutes: 10,
		players: [],
		startTime: null,
		catchAudit: [],
		readyConnectionIds: []
	};

	constructor(readonly room: Party.Room) {}

	async onStart() {
		const stored = await this.room.storage.get<RoomState>('state');
		if (stored) this.state = stored;
	}

	private save() {
		this.room.storage.put('state', this.state);
	}

	private broadcast(msg: object) {
		this.room.broadcast(JSON.stringify(msg));
	}

	private broadcastExcept(connectionId: string, msg: object) {
		this.room.broadcast(JSON.stringify(msg), [connectionId]);
	}

	private assignPeg(): string | null {
		const taken = new Set(this.state.players.map((p) => p.pegName));
		const free = PEGS.filter((p) => !taken.has(p));
		if (free.length === 0) return null;
		return free[Math.floor(Math.random() * free.length)];
	}

	onConnect(connection: Party.Connection) {
		if (this.state.phase !== 'lobby') {
			connection.send(JSON.stringify({ type: 'error', message: 'Game already in progress' }));
			connection.close();
			return;
		}
	}

	onMessage(message: string | ArrayBuffer | ArrayBufferView, sender: Party.Connection) {
		let data: Record<string, unknown>;
		try {
			data = JSON.parse(message as string);
		} catch {
			return;
		}

		switch (data.type) {
			case 'create-room': {
				if (this.state.hostConnectionId) break;
				const name = typeof data.name === 'string' ? data.name.trim() : 'Host';
				const timeLimit = typeof data.timeLimitMinutes === 'number' ? data.timeLimitMinutes : 10;
				this.state.hostConnectionId = sender.id;
				this.state.hostName = name || 'Host';
				this.state.timeLimitMinutes = timeLimit;
				this.state.startTime = null;
				this.state.catchAudit = [];
				this.state.phase = 'lobby';
				this.state.readyConnectionIds = [];
				const peg = this.assignPeg();
				if (peg) {
					this.state.players.push({
						connectionId: sender.id,
						name: this.state.hostName,
						pegName: peg
					});
				}
				this.save();
				sender.send(
					JSON.stringify({
						type: 'room-created',
						joinCode: this.room.id
					})
				);
				this.broadcastRoomState();
				break;
			}

			case 'join-room': {
				if (this.state.phase !== 'lobby') break;
				const name = typeof data.name === 'string' ? data.name.trim() : 'Angler';
				if (!name) break;
				if (this.state.players.length >= PEGS.length) {
					sender.send(JSON.stringify({ type: 'error', message: 'Room is full' }));
					break;
				}
				if (this.state.players.some((p) => p.connectionId === sender.id)) break;
				const peg = this.assignPeg();
				if (!peg) {
					sender.send(JSON.stringify({ type: 'error', message: 'No pegs available' }));
					break;
				}
				this.state.players.push({ connectionId: sender.id, name, pegName: peg });
				this.save();
				this.broadcastExcept(sender.id, {
					type: 'player-joined',
					name,
					pegName: peg,
					players: this.safePlayers()
				});
				this.broadcastRoomState();
				break;
			}

			case 'start-game': {
				if (sender.id !== this.state.hostConnectionId) break;
				if (this.state.phase !== 'lobby') break;
				this.state.phase = 'fishing';
				this.state.startTime = Date.now();
				this.state.catchAudit = [];
				this.state.readyConnectionIds = [];
				this.save();
				const alarmMs = this.state.timeLimitMinutes * 60 * 1000;
				this.room.storage.setAlarm(Date.now() + alarmMs);
				this.broadcast({
					type: 'game-start',
					startTime: this.state.startTime,
					timeLimitMinutes: this.state.timeLimitMinutes,
					players: this.safePlayers()
				});
				break;
			}

			case 'catch': {
				if (this.state.phase !== 'fishing' && this.state.phase !== 'grace-period') break;
				const catchEvent: CatchEvent = {
					anglerName: typeof data.anglerName === 'string' ? data.anglerName : '',
					pegName: typeof data.pegName === 'string' ? data.pegName : '',
					species: typeof data.species === 'string' ? data.species : '',
					classificationLabel:
						typeof data.classificationLabel === 'string' ? data.classificationLabel : '',
					weightOz: typeof data.weightOz === 'number' ? data.weightOz : 0,
					caughtAtMs: typeof data.caughtAtMs === 'number' ? data.caughtAtMs : 0
				};
				this.state.catchAudit.push(catchEvent);
				this.save();
				this.broadcast({ type: 'catch', ...catchEvent });
				break;
			}

			case 'done-fishing': {
				if (this.state.phase !== 'fishing' && this.state.phase !== 'grace-period') break;
				if (this.state.readyConnectionIds.includes(sender.id)) break;
				this.state.readyConnectionIds.push(sender.id);
				this.save();
				if (this.allPlayersReady()) {
					this.finishGameWithResults();
				}
				break;
			}
		}
	}

	async onClose(connection: Party.Connection) {
		const idx = this.state.players.findIndex((p) => p.connectionId === connection.id);
		if (idx === -1) return;

		const [leaver] = this.state.players.splice(idx, 1);

		if (this.state.phase === 'lobby') {
			if (connection.id === this.state.hostConnectionId) {
				this.broadcast({ type: 'game-over', reason: 'host-disconnected', catchAudit: [] });
				this.state.players = [];
				this.state.hostConnectionId = '';
				this.state.phase = 'results';
			} else {
				this.broadcast({
					type: 'player-left',
					name: leaver.name,
					pegName: leaver.pegName,
					players: this.safePlayers()
				});
			}
		} else if (this.state.phase === 'grace-period') {
			this.state.readyConnectionIds = this.state.readyConnectionIds.filter(
				(id) => id !== connection.id
			);
			if (this.allPlayersReady()) {
				this.finishGameWithResults();
			}
		}

		this.save();
	}

	async onAlarm() {
		if (this.state.phase === 'fishing') {
			this.state.phase = 'grace-period';
			this.save();
			this.broadcast({ type: 'time-up' });
			this.room.storage.setAlarm(Date.now() + GRACE_PERIOD_MS);
			if (this.allPlayersReady()) {
				this.finishGameWithResults();
			}
		} else if (this.state.phase === 'grace-period') {
			this.finishGameWithResults();
		}
	}

	private allPlayersReady(): boolean {
		const playerIds = new Set(this.state.players.map((p) => p.connectionId));
		const activeIds = new Set<string>();
		for (const conn of this.room.getConnections()) {
			if (playerIds.has(conn.id)) activeIds.add(conn.id);
		}
		if (activeIds.size === 0) return false;
		return [...activeIds].every((id) => this.state.readyConnectionIds.includes(id));
	}

	private finishGameWithResults() {
		this.state.phase = 'results';
		this.save();
		this.broadcast({
			type: 'game-over',
			reason: 'time',
			catchAudit: this.state.catchAudit
		});
	}

	private safePlayers() {
		return this.state.players.map((p) => ({ name: p.name, pegName: p.pegName }));
	}

	private broadcastRoomState() {
		this.broadcast({
			type: 'room-state',
			phase: this.state.phase,
			hostName: this.state.hostName,
			hostConnectionId: this.state.hostConnectionId,
			timeLimitMinutes: this.state.timeLimitMinutes,
			joinCode: this.room.id,
			players: this.safePlayers()
		});
	}
}
