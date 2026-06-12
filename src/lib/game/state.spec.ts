import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameState } from './state.svelte';
import type { AnglerState } from './prep-state.svelte';
import type { Lake, Venue, TackleSelection } from '$lib/data';
import { defaultTackle } from './tackle-utils';
import type { FishData } from './population';

const venue: Venue = {
	name: 'Test Venue',
	image: 'test.jpeg',
	lakes: [
		{
			name: 'Test Lake',
			fishPerPeg: 100,
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
	rod: {
		name: 'Float',
		image: 'rod-float.png',
		deter: 0.1,
		rodMultiplier: 1.0,
		allowedCastStrengths: ['Short', 'Medium', 'Long'],
		allowedStrata: ['Top', 'Middle', 'Bottom'],
		maxLineLb: 15,
		requiresReel: true
	},
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
			score: 0,
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
		score: 0,
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
	gs.matchTimer.timeRemainingSeconds = 0.001;
}

describe('GameState match ending', () => {
	let gs: GameState;

	beforeEach(() => {
		gs = new GameState();
	});

	afterEach(() => {
		vi.restoreAllMocks();
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
			preferredBait: 'maggot',
			pattern: [],
			stepMs: 1000
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
			preferredBait: 'maggot',
			pattern: [],
			stepMs: 1000
		};

		armExpiry(gs);
		gs.tick(100);

		expect(gs.timeExpired).toBe(true);
		expect(gs.phase).toBe('fishing');

		gs.handleReelingOutcome('caught');
		expect(loop.phase).toBe('caught');

		gs.tick(100);
		expect(gs.phase).toBe('results');
	});

	it('resets player to idle when time expires and not in reeling', () => {
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

	it('does not reset player cast when in reeling state after time expires', () => {
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
			preferredBait: 'maggot',
			pattern: [],
			stepMs: 1000
		};

		armExpiry(gs);
		gs.tick(100);

		expect(gs.timeExpired).toBe(true);
		expect(loop.phase).toBe('reeling');
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

		const botLoop = gs.botControllers.get('bot-1')!.loop;
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

		const botLoop = gs.botControllers.get('bot-1')!.loop;
		botLoop.phase = 'reeling';
		botLoop.currentFish = {
			id: 'f1',
			species: 'Roach',
			strata: 'Bottom',
			classificationLabel: 'Small',
			tierIndex: 0,
			weightOz: 12,
			castStrength: 'Medium',
			preferredBait: 'maggot',
			pattern: [],
			stepMs: 1000
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

	it('restore from save — idle phase auto-casts on next tick', () => {
		gs.beginFishing(makePlayer(), venue, lake, 10);
		gs.finishChangingTackle();
		gs.tick(100);
		expect(gs.playerSnapshot?.phase).toBe('waiting');

		// Reset to idle (as if match was saved between casts)
		gs.playerLoop!.returnToCast();
		gs.tick(100);
		expect(gs.playerSnapshot?.phase).toBe('waiting');

		gs.playerLoop!.returnToCast();
		const saved = gs.saveSnapshot(venue.name, lake.name, Date.now());
		const gs2 = new GameState();
		gs2.restoreFromSave(saved, lake);
		expect(gs2.phase).toBe('fishing');

		gs2.tick(100);
		expect(gs2.playerSnapshot?.phase).toBe('waiting');
	});

	it('restore from save — waiting phase continues countdown', () => {
		gs.beginFishing(makePlayer(), venue, lake, 10);

		// Insert a controlled fish that WILL match the default tackle
		const matchingFish: FishData = {
			id: 'test-fish-1',
			species: 'Roach',
			strata: 'Bottom',
			classificationLabel: 'Small',
			tierIndex: 0,
			weightOz: 12,
			castStrength: 'Medium',
			preferredBait: 'maggot',
			pattern: [],
			stepMs: 1000
		};
		gs.pegPopulations.set('1', [matchingFish]);
		gs.playerLoop!.preparePopulation([matchingFish], () => {});

		gs.finishChangingTackle();
		gs.tick(100);
		expect(gs.playerSnapshot?.phase).toBe('waiting');

		// tick once more to advance elapsed counters
		gs.tick(100);
		const remainBefore = gs.playerLoop!.remainingMs;
		const waitBefore = gs.playerLoop!.waitElapsedMs;
		expect(remainBefore).toBeGreaterThan(0);
		expect(waitBefore).toBeGreaterThan(0);

		const saved = gs.saveSnapshot(venue.name, lake.name, Date.now());
		const gs2 = new GameState();
		gs2.restoreFromSave(saved, lake);
		expect(gs2.playerSnapshot?.phase).toBe('waiting');
		expect(gs2.playerLoop!.remainingMs).toBe(remainBefore);
		expect(gs2.playerLoop!.waitElapsedMs).toBe(waitBefore);

		gs2.tick(100);
		expect(gs2.playerSnapshot?.phase).toBe('waiting');
		expect(gs2.playerLoop!.remainingMs).toBe(remainBefore - 100);
		expect(gs2.playerLoop!.waitElapsedMs).toBe(waitBefore + 100);
	});

	it('save/restore round-trip preserves loop fields', () => {
		gs.beginFishing(makePlayer(), venue, lake, 10);

		const matchingFish: FishData = {
			id: 'test-fish-1',
			species: 'Roach',
			strata: 'Bottom',
			classificationLabel: 'Small',
			tierIndex: 0,
			weightOz: 12,
			castStrength: 'Medium',
			preferredBait: 'maggot',
			pattern: [],
			stepMs: 1000
		};
		gs.pegPopulations.set('1', [matchingFish]);
		gs.playerLoop!.preparePopulation([matchingFish], () => {});

		gs.finishChangingTackle();
		gs.tick(100);
		gs.tick(100);
		const origRemainingMs = gs.playerLoop!.remainingMs;
		const origWaitElapsedMs = gs.playerLoop!.waitElapsedMs;

		const saved = gs.saveSnapshot(venue.name, lake.name, Date.now());
		expect(saved.playerLoop).not.toBeNull();
		expect(saved.playerLoop!.phase).toBe('waiting');
		expect(saved.playerLoop!.remainingMs).toBe(origRemainingMs);
		expect(saved.playerLoop!.waitElapsedMs).toBe(origWaitElapsedMs);

		const gs2 = new GameState();
		gs2.restoreFromSave(saved, lake);
		expect(gs2.playerLoop).not.toBeNull();
		expect(gs2.playerLoop!.phase).toBe('waiting');
		expect(gs2.playerLoop!.remainingMs).toBe(origRemainingMs);
		expect(gs2.playerLoop!.waitElapsedMs).toBe(origWaitElapsedMs);
	});

	it('restore from save — caught phase resets to idle for auto-cast', () => {
		gs.beginFishing(makePlayer(), venue, lake, 10);

		const matchingFish: FishData = {
			id: 'test-fish-1',
			species: 'Roach',
			strata: 'Bottom',
			classificationLabel: 'Small',
			tierIndex: 0,
			weightOz: 12,
			castStrength: 'Medium',
			preferredBait: 'maggot',
			pattern: [],
			stepMs: 1000
		};
		gs.pegPopulations.set('1', [matchingFish]);
		gs.playerLoop!.preparePopulation([matchingFish], () => {});

		gs.finishChangingTackle();
		gs.tick(100);
		expect(gs.playerSnapshot?.phase).toBe('waiting');

		// Go through the full catch flow to produce 'caught' with recastCountdown=0
		vi.spyOn(Math, 'random').mockReturnValue(0.1);
		gs.playerLoop!.tick(gs.playerLoop!.remainingMs);
		expect(gs.playerLoop!.phase).toBe('bite');

		gs.strike();
		expect(gs.playerSnapshot?.phase).toBe('reeling');

		vi.spyOn(Date, 'now').mockReturnValue(1000);
		gs.handleReelingOutcome('caught');
		expect(gs.playerSnapshot?.phase).toBe('caught');
		expect(gs.lastEvent?.type).toBe('fishCaught');

		const saved = gs.saveSnapshot(venue.name, lake.name, Date.now());
		const gs2 = new GameState();
		gs2.restoreFromSave(saved, lake);

		// After fix: caught phase resets to idle, lastEvent cleared
		expect(gs2.lastEvent).toBeNull();
		expect(gs2.playerSnapshot?.phase).toBe('idle');

		// Next tick auto-casts
		gs2.tick(100);
		expect(gs2.playerSnapshot?.phase).toBe('waiting');
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
			score: 0,
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
			score: 0,
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

	it('bots can land multiple fish in a simulated match window', () => {
		vi.spyOn(Math, 'random').mockReturnValue(0);

		const anglers: AnglerState[] = [...makePlayer(), makeBotAngler()];
		gs.beginFishing(anglers, venue, lake, 5);

		const bot = gs.anglers.find((a) => a.id === 'bot-1');
		const controller = gs.botControllers.get('bot-1');
		expect(bot).toBeDefined();
		expect(controller).toBeDefined();
		if (!bot || !controller) return;

		const botFish: FishData[] = Array.from({ length: 8 }, (_, index) => ({
			id: `bot-fish-${index}`,
			species: 'Roach',
			strata: bot.tackle.strata,
			classificationLabel: 'Small',
			tierIndex: 0,
			weightOz: 12,
			castStrength: bot.tackle.castStrength,
			preferredBait: bot.tackle.bait.name,
			pattern: [],
			stepMs: 1000
		}));

		gs.pegPopulations.set(bot.pegName, botFish);
		controller.loop.preparePopulation(botFish, (id) => gs.removeFishFromPeg(bot.pegName, id));

		const maxElapsed = 60_000;
		let earlyExit = false;
		for (let elapsed = 0; elapsed < maxElapsed && !earlyExit; elapsed += 100) {
			gs.tick(100);
			if (bot.catch.length > 5) {
				earlyExit = true;
			}
		}

		expect(bot.catch.length).toBeGreaterThanOrEqual(2);
		expect(bot.catch.length).toBeLessThanOrEqual(botFish.length);
	});
});

describe('GameState method-level delegation', () => {
	let gs: GameState;

	beforeEach(() => {
		gs = new GameState();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('strike', () => {
		it('returns null when playerLoop is not initialized', () => {
			expect(gs.strike()).toBeNull();
		});

		it('delegates to loop.strike and syncs state', () => {
			gs.beginFishing(makePlayer(), venue, lake, 10);
			gs.cast();
			gs.tick(100);

			const loop = gs.playerLoop!;
			loop.phase = 'bite';
			loop.currentFish = {
				id: 'f1',
				species: 'Roach',
				strata: 'Bottom',
				classificationLabel: 'Small',
				tierIndex: 0,
				weightOz: 12,
				castStrength: 'Medium',
				preferredBait: 'maggot',
				pattern: [],
				stepMs: 1000
			};

			const event = gs.strike();
			expect(event).toBeNull();
			expect(gs.playerSnapshot?.phase).toBe('reeling');
			expect(gs.lastEvent).toBeNull();
		});

		it('returns hookBroken when fish exceeds hook capacity', () => {
			gs.beginFishing(makePlayer(), venue, lake, 10);
			gs.cast();
			gs.tick(100);

			const loop = gs.playerLoop!;
			loop.phase = 'bite';
			loop.currentFish = {
				id: 'f1',
				species: 'Roach',
				strata: 'Bottom',
				classificationLabel: 'Monster',
				tierIndex: 3,
				weightOz: 300,
				castStrength: 'Medium',
				preferredBait: 'maggot',
				pattern: [],
				stepMs: 1000
			};

			const event = gs.strike();
			expect(event).toEqual({ type: 'hookBroken' });
			expect(gs.lastEvent).toEqual({ type: 'hookBroken' });
		});
	});

	describe('handleReelingOutcome', () => {
		it('returns null when playerLoop is not initialized', () => {
			expect(gs.handleReelingOutcome('caught')).toBeNull();
		});

		it('catches fish and updates player state when result is caught', () => {
			gs.beginFishing(makePlayer(), venue, lake, 10);

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
				preferredBait: 'maggot',
				pattern: [],
				stepMs: 1000
			};

			const event = gs.handleReelingOutcome('caught');
			expect(event?.type).toBe('fishCaught');
			const player = gs.playerAngler!;
			expect(player.catch).toHaveLength(1);
			expect(player.totalWeightOz).toBe(12);
			expect(gs.catchAudit).toHaveLength(1);
		});

		it('returns lineBroke when result is lineBroke and does not update player state', () => {
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
				preferredBait: 'maggot',
				pattern: [],
				stepMs: 1000
			};

			const event = gs.handleReelingOutcome('lineBroke');
			expect(event).toEqual({ type: 'lineBroke' });
			expect(gs.lastEvent).toEqual({ type: 'lineBroke' });
			const player = gs.playerAngler!;
			expect(player.catch).toHaveLength(0);
		});

		it('returns fishGotAway when result is fishGotAway and does not update player state', () => {
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
				preferredBait: 'maggot',
				pattern: [],
				stepMs: 1000
			};

			const event = gs.handleReelingOutcome('fishGotAway');
			expect(event).toEqual({ type: 'fishGotAway' });
			expect(gs.lastEvent).toEqual({ type: 'fishGotAway' });
			const player = gs.playerAngler!;
			expect(player.catch).toHaveLength(0);
		});

		it('sets lastEvent on caught outcome', () => {
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
				preferredBait: 'maggot',
				pattern: [],
				stepMs: 1000
			};

			gs.handleReelingOutcome('caught');
			expect(gs.lastEvent?.type).toBe('fishCaught');
		});
	});

	describe('dismissCaught', () => {
		it('is safe when playerLoop is not initialized', () => {
			expect(() => gs.dismissCaught()).not.toThrow();
		});

		it('resets to casting after dismissing caught fish', () => {
			gs.beginFishing(makePlayer(), venue, lake, 10);
			gs.cast();
			gs.tick(100);

			const loop = gs.playerLoop!;
			loop.phase = 'caught';

			gs.dismissCaught();
			expect(gs.playerSnapshot?.phase).toBe('waiting');
		});
	});

	describe('resetCast', () => {
		it('is safe when playerLoop is not initialized', () => {
			expect(() => gs.resetCast()).not.toThrow();
		});

		it('resets player loop to idle', () => {
			gs.beginFishing(makePlayer(), venue, lake, 10);
			gs.cast();
			gs.tick(100);

			const loop = gs.playerLoop!;
			loop.phase = 'lost';

			gs.resetCast();
			expect(gs.playerSnapshot?.phase).toBe('idle');
			expect(gs.playerLoop!.phase).toBe('idle');
		});
	});

	describe('beginChangeTackle / finishChangingTackle', () => {
		it('beginChangeTackle sets loop to changing and syncs state', () => {
			gs.beginFishing(makePlayer(), venue, lake, 10);
			gs.beginChangeTackle();
			expect(gs.playerSnapshot?.phase).toBe('changing');
			expect(gs.playerLoop!.phase).toBe('changing');
		});

		it('finishChangingTackle sets initialTackleChosen and transitions to idle', () => {
			gs.beginFishing(makePlayer(), venue, lake, 10);
			gs.beginChangeTackle();
			expect(gs.initialTackleChosen).toBe(false);

			gs.finishChangingTackle();
			expect(gs.initialTackleChosen).toBe(true);
			expect(gs.playerSnapshot?.phase).toBe('idle');
		});

		it('finishChangingTackle is safe when loop is not in changing phase', () => {
			gs.beginFishing(makePlayer(), venue, lake, 10);
			gs.playerLoop!.phase = 'waiting';

			gs.finishChangingTackle();
			expect(gs.initialTackleChosen).toBe(true);
			expect(gs.playerLoop!.phase).toBe('waiting');
		});
	});

	describe('updateTackle', () => {
		it('updates player tackle and loop tackle', () => {
			gs.beginFishing(makePlayer(), venue, lake, 10);
			const newTackle: TackleSelection = {
				...tackle,
				bait: { name: 'worm', image: 'worm.png', minOz: 2, maxOz: 256 }
			};

			gs.updateTackle(newTackle);
			expect(gs.playerAngler!.tackle.bait.name).toBe('worm');
			expect(gs.playerLoop!.tackleSelection.bait.name).toBe('worm');
		});
	});
});
