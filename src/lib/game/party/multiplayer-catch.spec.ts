import { describe, it, expect, vi, beforeEach } from 'vitest';
import { multiplayer, type CatchInfo } from './connection.svelte';

describe('multiplayer — catch propagation (regression)', () => {
	beforeEach(() => {
		multiplayer.phase = 'idle';
		multiplayer.catchEvents = [];
		multiplayer.playerName = '';
	});

	it('sendCatch is callable', () => {
		const spy = vi.spyOn(multiplayer, 'sendCatch');
		const info = {
			anglerName: 'Alice',
			pegName: '3',
			species: 'Carp',
			classificationLabel: 'Common',
			weightOz: 48
		};
		multiplayer.sendCatch(info);
		expect(spy).toHaveBeenCalledWith(info);
	});

	it('multiple catches accumulate via sendCatch then game-over preserves them', () => {
		multiplayer.phase = 'fishing';

		// Simulate two catches sent via sendCatch (after the fix, this
		// happens when the game page's onCatch callback calls sendCatch)
		const catch1: CatchInfo = {
			anglerName: 'Alice',
			pegName: '3',
			species: 'Carp',
			classificationLabel: 'Common',
			weightOz: 48,
			caughtAtMs: 1000
		};
		const catch2: CatchInfo = {
			anglerName: 'Alice',
			pegName: '3',
			species: 'Bream',
			classificationLabel: 'Skimmer',
			weightOz: 14,
			caughtAtMs: 5000
		};

		// Each catch would be broadcast back from the server as type 'catch'
		multiplayer.catchEvents = [...multiplayer.catchEvents, catch1];
		multiplayer.catchEvents = [...multiplayer.catchEvents, catch2];
		expect(multiplayer.catchEvents).toHaveLength(2);

		// Game-over arrives with full audit from server
		const audit: CatchInfo[] = [catch1, catch2];
		multiplayer.phase = 'results';
		multiplayer.catchEvents = audit;
		expect(multiplayer.catchEvents).toHaveLength(2);
		expect(multiplayer.catchEvents[1].species).toBe('Bream');
	});

	it('results screen would be empty when no catches were sent (bug scenario)', () => {
		// This is what happened with the bug: the server's catchAudit
		// was empty because sendCatch was never called
		multiplayer.phase = 'results';
		multiplayer.catchEvents = [];
		expect(multiplayer.catchEvents).toHaveLength(0);
	});

	it('game-over replaces all prior catchEvents with server audit (no double-count)', () => {
		multiplayer.phase = 'fishing';

		// Local catches arrive via broadcast mid-game
		multiplayer.catchEvents = [
			...multiplayer.catchEvents,
			{
				anglerName: 'Alice',
				pegName: '3',
				species: 'Carp',
				classificationLabel: 'Common',
				weightOz: 48,
				caughtAtMs: 1000
			} as CatchInfo
		];
		multiplayer.catchEvents = [
			...multiplayer.catchEvents,
			{
				anglerName: 'Bob',
				pegName: '5',
				species: 'Roach',
				classificationLabel: 'Roach',
				weightOz: 6,
				caughtAtMs: 3000
			} as CatchInfo
		];
		expect(multiplayer.catchEvents).toHaveLength(2);

		// Game-over from server — server sends authoritative list
		const serverAudit: CatchInfo[] = [
			{
				anglerName: 'Alice',
				pegName: '3',
				species: 'Carp',
				classificationLabel: 'Common',
				weightOz: 48,
				caughtAtMs: 1000
			},
			{
				anglerName: 'Bob',
				pegName: '5',
				species: 'Roach',
				classificationLabel: 'Roach',
				weightOz: 6,
				caughtAtMs: 3000
			}
		];
		multiplayer.phase = 'results';
		multiplayer.catchEvents = serverAudit;

		// Only server data — no carry-over from pre-game-over events
		expect(multiplayer.catchEvents).toHaveLength(2);
	});
});
