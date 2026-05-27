import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from './state.svelte';
import type { AnglerState } from './prep-state.svelte';
import type { Lake, Venue, TackleSelection } from '$lib/data';
import { defaultTackle } from './tackle-utils';

const venue: Venue = {
	name: 'Test Venue',
	image: 'test.jpeg',
	lakes: [
		{
			name: 'Test Lake',
			fishCount: 100,
			species: [
				{ name: 'Roach', frequency: 10 },
				{ name: 'Carp', frequency: 5 }
			],
			pegs: [
				{
					name: '1',
					description: '',
					features: { flow: 0.5, clarity: 0.5, substrate: 0.5, vegetation: 0.5, shelter: 0.5 }
				},
				{
					name: '2',
					description: '',
					features: { flow: 0.5, clarity: 0.5, substrate: 0.5, vegetation: 0.5, shelter: 0.5 }
				}
			]
		}
	]
};

const lake: Lake = venue.lakes[0];

const tackle: TackleSelection = {
	rod: { name: 'Float', image: 'rod-float.png', deter: 0.1 },
	reel: { name: 'Fixed Spool', image: 'reel-fixed-spool.png', deter: 0.2 },
	line: { name: '4 lb', image: 'line.png', size: 64, minOz: 3, maxOz: 160, deter: 0.15 },
	hook: { name: '16', image: 'hook.png', size: 16, minOz: 10, maxOz: 200, deter: 0.15 },
	bait: { name: 'maggot', image: 'maggot.png', minOz: 1, maxOz: 512 },
	strata: 'Bottom',
	castStrength: 'Medium'
};

function makePlayer(pegName = '1'): AnglerState[] {
	return [
		{
			id: 'player',
			name: 'You',
			image: '',
			isPlayer: true,
			skill: 5,
			pegName,
			phase: 'idle',
			tackle: { ...tackle },
			totalWeightOz: 0,
			biggestFish: null,
			catch: []
		}
	];
}

function makeBotAngler(): AnglerState {
	return {
		id: 'bot-1',
		name: 'Bot',
		image: '',
		isPlayer: false,
		skill: 10,
		pegName: '2',
		phase: 'idle',
		tackle: { ...tackle },
		totalWeightOz: 0,
		biggestFish: null,
		catch: []
	};
}

/**
 * Force the timer to expire on the next tick by setting
 * a tiny positive value that one tick (100ms) will exhaust.
 */
function armExpiry(gs: GameState) {
	gs.timeRemainingSeconds = 0.001;
}

describe('GameState match ending', () => {
	let gs: GameState;

	beforeEach(() => {
		gs = new GameState();
	});

	it('finishGame transitions to results phase', () => {
		gs.beginFishing(makePlayer(), venue, lake, 10);
		expect(gs.phase).toBe('fishing');
		gs.finishGame();
		expect(gs.phase).toBe('results');
	});

	it('enters results when time expires and player is idle', () => {
		gs.beginFishing(makePlayer(), venue, lake, 0.001);
		gs.tick(100);
		expect(gs.phase).toBe('results');
		expect(gs.timeExpired).toBe(true);
	});

	it('enters results when time expires and player is waiting', () => {
		gs.beginFishing(makePlayer(), venue, lake, 0.001);
		gs.cast();
		gs.tick(100);
		expect(gs.phase).toBe('results');
		expect(gs.timeExpired).toBe(true);
	});

	it('does not finish game when time expires but player is in reeling', () => {
		gs.beginFishing(makePlayer(), venue, lake, 10);
		gs.cast();
		gs.tick(100);

		const loop = gs.playerLoop!;
		loop.phase = 'reeling';
		loop.currentFish = {
			id: 'f1',
			species: 'Roach',
			strata: 'Bottom',
			classificationLabel: 'Small',
			tierIndex: 0,
			weightOz: 12,
			castStrength: 'Medium',
			preferredBait: 'maggot'
		};
		loop.reelTimerMs = 5000;
		loop.reelTimerRemaining = 5000;

		armExpiry(gs);
		gs.tick(100);

		expect(gs.timeExpired).toBe(true);
		expect(gs.phase).toBe('fishing');
		expect(gs.playerLoop!.phase).toBe('reeling');
	});

	it('allows player to finish reeling when time expires, then ends after catch', () => {
		gs.beginFishing(makePlayer(), venue, lake, 10);
		gs.cast();
		gs.tick(100);

		const loop = gs.playerLoop!;
		loop.phase = 'reeling';
		loop.currentFish = {
			id: 'f1',
			species: 'Roach',
			strata: 'Bottom',
			classificationLabel: 'Small',
			tierIndex: 0,
			weightOz: 12,
			castStrength: 'Medium',
			preferredBait: 'maggot'
		};
		loop.reelTimerMs = 100;
		loop.reelTimerRemaining = 100;

		armExpiry(gs);
		gs.tick(100);

		expect(gs.timeExpired).toBe(true);
		expect(gs.phase).toBe('fishing');

		loop.tick(loop.reelTimerRemaining);
		expect(loop.phase).toBe('landing');

		loop.reel();
		expect(loop.phase).toBe('caught');

		gs.tick(100);
		expect(gs.phase).toBe('results');
	});

	it('resets player to idle when time expires and not in reeling/landing', () => {
		gs.beginFishing(makePlayer(), venue, lake, 10);
		gs.cast();
		gs.tick(100);

		const loop = gs.playerLoop!;
		loop.phase = 'lost';

		armExpiry(gs);
		gs.tick(100);

		expect(gs.timeExpired).toBe(true);
		expect(gs.phase).toBe('results');
		expect(gs.playerSnapshot?.phase).toBe('idle');
	});

	it('does not reset player cast when in landing state after time expires', () => {
		gs.beginFishing(makePlayer(), venue, lake, 10);
		gs.cast();
		gs.tick(100);

		const loop = gs.playerLoop!;
		loop.phase = 'landing';
		loop.currentFish = {
			id: 'f1',
			species: 'Roach',
			strata: 'Bottom',
			classificationLabel: 'Small',
			tierIndex: 0,
			weightOz: 12,
			castStrength: 'Medium',
			preferredBait: 'maggot'
		};
		loop.landingWindowMs = 2000;
		loop.landingWindowRemaining = 2000;

		armExpiry(gs);
		gs.tick(100);

		expect(gs.timeExpired).toBe(true);
		expect(loop.phase).toBe('landing');
		expect(gs.phase).toBe('fishing');
	});

	it('match ends immediately when caught/lost after time expired', () => {
		gs.beginFishing(makePlayer(), venue, lake, 10);
		gs.cast();
		gs.tick(100);

		const loop = gs.playerLoop!;
		loop.phase = 'caught';
		loop.currentFish = null;

		armExpiry(gs);
		gs.tick(100);

		expect(gs.phase).toBe('results');
	});

	it('sets bot to finished when time expires and not in reeling/caught', () => {
		const anglers = [...makePlayer(), makeBotAngler()];
		gs.beginFishing(anglers, venue, lake, 0.001);
		gs.tick(100);

		const botState = gs.anglers.find((a) => a.id === 'bot-1');
		expect(botState?.phase).toBe('finished');
	});

	it('bot in caught state at time expiry is finished immediately (no grace period for bots)', () => {
		const anglers = [...makePlayer(), makeBotAngler()];
		gs.beginFishing(anglers, venue, lake, 10);
		gs.cast();
		gs.tick(100);

		const botLoop = gs.botLoops.get('bot-1')!;
		botLoop.phase = 'caught';
		botLoop.currentFish = null;

		const playerLoop = gs.playerLoop!;
		playerLoop.phase = 'idle';

		armExpiry(gs);
		gs.tick(100);

		expect(gs.phase).toBe('results');

		const botState = gs.anglers.find((a) => a.id === 'bot-1');
		expect(botState?.phase).toBe('finished');
	});

	it('bot in reeling at time expiry is finished immediately (no grace period for bots)', () => {
		const anglers = [...makePlayer(), makeBotAngler()];
		gs.beginFishing(anglers, venue, lake, 10);

		const botLoop = gs.botLoops.get('bot-1')!;
		botLoop.phase = 'reeling';
		botLoop.currentFish = {
			id: 'f1',
			species: 'Roach',
			strata: 'Bottom',
			classificationLabel: 'Small',
			tierIndex: 0,
			weightOz: 12,
			castStrength: 'Medium',
			preferredBait: 'maggot'
		};

		armExpiry(gs);
		gs.tick(100);

		const botState = gs.anglers.find((a) => a.id === 'bot-1');
		expect(botState?.phase).toBe('finished');
	});

	it('no time limit means game never auto-ends', () => {
		gs.beginFishing(makePlayer(), venue, lake);
		expect(gs.timeExpired).toBe(false);
		expect(gs.timeRemainingSeconds).toBe(0);
		gs.tick(999999);
		expect(gs.timeExpired).toBe(false);
		expect(gs.phase).toBe('fishing');
	});

	it('multiple ticks after game is results are harmless', () => {
		gs.beginFishing(makePlayer(), venue, lake, 0.001);
		gs.tick(100);
		expect(gs.phase).toBe('results');
		gs.tick(1000);
		expect(gs.phase).toBe('results');
	});

	/* ─── BUG REGRESSION TESTS ─── */

	it('beginFishing with timeLimitMinutes=0 sets timeExpired immediately and game ends on first tick', () => {
		gs.beginFishing(makePlayer(), venue, lake, 0);
		expect(gs.timeExpired).toBe(true);
		expect(gs.timeRemainingSeconds).toBe(0);

		gs.tick(100);
		expect(gs.phase).toBe('results');
	});

	it('player cannot fish when timeRemainingSeconds starts at 0', () => {
		gs.beginFishing(makePlayer(), venue, lake, 0);
		expect(gs.timeExpired).toBe(true);

		gs.cast();

		gs.tick(100);
		expect(gs.phase).toBe('results');
		expect(gs.playerSnapshot?.phase).toBe('idle');
	});

	/* ─── MULTIPLAYER REGRESSION TESTS ─── */

	it('beginFishing with defaultTackle (multiplayer path) enters changing phase', () => {
		const player: AnglerState = {
			id: 'player',
			name: 'TestPlayer',
			image: '',
			isPlayer: true,
			skill: 0,
			pegName: '1',
			phase: 'idle',
			tackle: { ...defaultTackle },
			totalWeightOz: 0,
			biggestFish: null,
			catch: []
		};
		gs.beginFishing([player], venue, lake);
		expect(gs.phase).toBe('fishing');
		expect(gs.initialTackleChosen).toBe(false);
		expect(gs.playerSnapshot?.phase).toBe('changing');
		expect(gs.playerLoop).not.toBeNull();
	});

	it('multiplayer path: after tackle confirm, auto-cast begins waiting phase', () => {
		const player: AnglerState = {
			id: 'player',
			name: 'TestPlayer',
			image: '',
			isPlayer: true,
			skill: 0,
			pegName: '1',
			phase: 'idle',
			tackle: { ...defaultTackle },
			totalWeightOz: 0,
			biggestFish: null,
			catch: []
		};
		gs.beginFishing([player], venue, lake);
		expect(gs.playerSnapshot?.phase).toBe('changing');

		gs.updateTackle({ ...defaultTackle });
		gs.finishChangingTackle();

		expect(gs.initialTackleChosen).toBe(true);
		expect(gs.playerSnapshot?.phase).toBe('idle');

		gs.tick(100);
		expect(gs.playerSnapshot?.phase).toBe('waiting');
	});
});
