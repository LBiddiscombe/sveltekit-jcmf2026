import { describe, it, expect } from 'vitest';
import { FishingLoop } from './loop';
import type { FishData } from './population';
import type { Species, TackleSelection } from '$lib/data';

const roach: Species = {
	name: 'Roach',
	record: 68,
	strata: ['Top', 'Middle', 'Bottom'],
	description: '',
	preferences: { flow: 0.3, clarity: 0.5, substrate: 0.7, vegetation: 0.6, shelter: 0.5 },
	tolerances: {},
	classifications: [
		{ label: 'Small', maxOz: 8, preferredBaits: ['maggot', 'caster'] },
		{ label: '', maxOz: 34, preferredBaits: ['maggot', 'caster', 'worm'] },
		{ label: 'Specimen', maxOz: 51, preferredBaits: ['worm', 'bread'] },
		{ label: 'Monster', maxOz: Infinity, preferredBaits: ['worm', 'bread'] }
	]
};

const carp: Species = {
	name: 'Carp',
	record: 1089,
	strata: ['Bottom'],
	description: '',
	preferences: { flow: 0.2, clarity: 0.4, substrate: 0.9, vegetation: 0.6, shelter: 0.5 },
	tolerances: {},
	classifications: [
		{ label: 'Small', maxOz: 64, preferredBaits: ['pellet', 'sweetcorn'] },
		{ label: '', maxOz: 544, preferredBaits: ['pellet', 'sweetcorn'] },
		{ label: 'Specimen', maxOz: 816, preferredBaits: ['boilie'] },
		{ label: 'Monster', maxOz: Infinity, preferredBaits: ['boilie'] }
	]
};

const speciesList = [roach, carp];

const tackle: TackleSelection = {
	rod: { name: 'Float', image: 'rod-float.png', deter: 0.1 },
	reel: { name: 'Fixed Spool', image: 'reel-fixed-spool.png', deter: 0.2 },
	line: { name: '4 lb', image: 'line.png', size: 64, minOz: 3, maxOz: 160, deter: 0.15 },
	hook: { name: '16', image: 'hook.png', size: 16, minOz: 10, maxOz: 200, deter: 0.15 },
	bait: { name: 'maggot', image: 'maggot.png', minOz: 1, maxOz: 512 },
	strata: 'Bottom',
	castStrength: 'Medium'
};

const baitMismatchTackle: TackleSelection = {
	...tackle,
	bait: { name: 'boilie', image: 'boilie.png', minOz: 8, maxOz: Infinity }
};

const smallRoach: FishData = {
	id: 'fish-1',
	species: 'Roach',
	strata: 'Bottom',
	classificationLabel: 'Small',
	tierIndex: 0,
	weightOz: 12,
	castStrength: 'Medium',
	preferredBait: 'maggot'
};

const monsterRoach: FishData = {
	id: 'fish-2',
	species: 'Roach',
	strata: 'Bottom',
	classificationLabel: 'Monster',
	tierIndex: 3,
	weightOz: 60,
	castStrength: 'Medium',
	preferredBait: 'maggot'
};

const smallCarp: FishData = {
	id: 'fish-3',
	species: 'Carp',
	strata: 'Bottom',
	classificationLabel: 'Small',
	tierIndex: 0,
	weightOz: 32,
	castStrength: 'Medium',
	preferredBait: 'pellet'
};

const mediumRoach: FishData = {
	id: 'fish-4',
	species: 'Roach',
	strata: 'Bottom',
	classificationLabel: '',
	tierIndex: 1,
	weightOz: 20,
	castStrength: 'Medium',
	preferredBait: 'maggot'
};

const population: FishData[] = [smallRoach, monsterRoach, smallCarp, mediumRoach];

function noopRemove(_id: string) {
	/* no-op */
}

function collectRemoveCalls(): { fn: (id: string) => void; ids: string[] } {
	const ids: string[] = [];
	return {
		fn: (id: string) => ids.push(id),
		ids
	};
}

describe('FishingLoop', () => {
	describe('cast — fish selection', () => {
		it('selects a fish matching bait, strata, and weight gates', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, false, () => 0.1);
			const event = loop.cast(population, noopRemove);
			expect(event).toBeNull();
			expect(loop.phase).toBe('waiting');
			expect(loop.currentFish).not.toBeNull();
			expect(loop.currentFish!.species).toBe('Roach');
		});

		it('returns null when no fish matches bait (blank cast)', () => {
			const loop = new FishingLoop(baitMismatchTackle, 5, speciesList, false, () => 0.1);
			const event = loop.cast(population, noopRemove);
			expect(event).toBeNull();
			expect(loop.phase).toBe('waiting');
			expect(loop.currentFish).toBeNull();
		});

		it('returns null when fish is below line minOz (LineShyGate)', () => {
			const heavyLineTackle: TackleSelection = {
				...tackle,
				line: { name: '15 lb', image: 'line.png', size: 240, minOz: 100, maxOz: 1100, deter: 0.5 }
			};
			const loop = new FishingLoop(heavyLineTackle, 5, speciesList, false, () => 0.1);
			const event = loop.cast(population, noopRemove);
			expect(event).toBeNull();
		});

		it('uses RNG to pick among candidates', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, false, () => 0.99);
			const event = loop.cast(population, noopRemove);
			expect(event).toBeNull();
			expect(loop.currentFish!.id).toBe('fish-4');
		});
	});

	describe('tick', () => {
		it('advances remaining time', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, false, () => 0);
			loop.cast(population, noopRemove);

			const beforeMs = loop.remainingMs;
			loop.tick(100);
			expect(loop.remainingMs).toBe(beforeMs - 100);
		});

		it('triggers bite when timer expires and starts bite window', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, false, () => 0);
			loop.cast(population, noopRemove);

			const event = loop.tick(loop.remainingMs);
			expect(event).toEqual({ type: 'bite' });
			expect(loop.phase).toBe('bite');
			expect(loop.biteWindowTotal).toBeGreaterThan(0);
			expect(loop.biteWindowRemaining).toBe(loop.biteWindowTotal);
		});

		it('emits biteExpired when bite window expires', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, false, () => 0);
			loop.cast(population, noopRemove);
			loop.tick(loop.remainingMs);
			expect(loop.phase).toBe('bite');

			const event = loop.tick(loop.biteWindowRemaining + 10);
			expect(event).toEqual({ type: 'biteExpired' });
			expect(loop.phase).toBe('lost');
		});

		it('redistributes fish and retries after blank patience delay', () => {
			let redistributed = false;
			const redistributeFn = () => {
				redistributed = true;
			};
			const loop = new FishingLoop(
				baitMismatchTackle,
				5,
				speciesList,
				false,
				() => 0,
				redistributeFn
			);
			loop.cast(population, noopRemove);
			expect(loop.phase).toBe('waiting');
			expect(loop.currentFish).toBeNull();

			const event = loop.tick(29999);
			expect(event).toBeNull();
			expect(redistributed).toBe(false);

			const nextEvent = loop.tick(1);
			expect(nextEvent).toBeNull();
			expect(redistributed).toBe(true);
			expect(loop.currentFish).toBeNull();
		});
	});

	describe('bot strike delay', () => {
		it('skill 10 max strike delay is ~3s, skill 1 max is ~10s', () => {
			const formula = (skill: number) => 10_000 - (skill - 1) * (7_000 / 9);
			expect(formula(10)).toBeCloseTo(3000, -2);
			expect(formula(1)).toBeCloseTo(10000, -2);
		});

		it('bot auto-strikes after delay elapses', () => {
			const loop = new FishingLoop(tackle, 10, speciesList, true, () => 0);
			loop.cast(population, noopRemove);

			const biteEvent = loop.tick(loop.remainingMs);
			expect(biteEvent).toEqual({ type: 'bite' });
			expect(loop.phase).toBe('bite');

			const strikeEvent = loop.tick(100);
			expect(strikeEvent).toBeNull();
			expect(loop.phase).toBe('reeling');
		});

		it('bot misses bite if delay exceeds bite window (biteExpired)', () => {
			const loop = new FishingLoop(tackle, 1, speciesList, true, () => 0.999);
			loop.cast(population, noopRemove);

			const event = loop.tick(loop.remainingMs);
			expect(event).toEqual({ type: 'biteExpired' });
			expect(loop.phase).toBe('lost');
		});
	});

	describe('bot reel delay', () => {
		it('bot auto-reels after skill-based delay and catches fish', () => {
			const loop = new FishingLoop(tackle, 10, speciesList, true, () => 0);
			loop.cast(population, noopRemove);
			loop.tick(loop.remainingMs);
			loop.tick(100);
			expect(loop.phase).toBe('reeling');

			const event = loop.tick(100);
			expect(event).not.toBeNull();
			expect(event!.type).toBe('fishCaught');
			expect(loop.phase).toBe('caught');
		});
	});

	describe('bot auto-recast', () => {
		it('bot auto-recasts instantly after caught', () => {
			const loop = new FishingLoop(tackle, 10, speciesList, true, () => 0);
			loop.cast(population, noopRemove);
			loop.tick(loop.remainingMs);
			loop.tick(100);
			loop.tick(100);
			expect(loop.phase).toBe('caught');

			loop.tick(1);
			expect(loop.phase).toBe('waiting');
		});

		it('bot auto-recasts instantly after lost', () => {
			const loop = new FishingLoop(tackle, 1, speciesList, true, () => 0.999);
			loop.cast(population, noopRemove);
			loop.tick(loop.remainingMs);
			expect(loop.phase).toBe('lost');

			loop.tick(1);
			expect(loop.phase).toBe('waiting');
		});
	});

	describe('bot tackle change on blank cycles', () => {
		it('calls onBlankCycle callback after 2 blank-cast cycles', () => {
			let tackleSwitchCount = 0;
			const onCycle = () => {
				tackleSwitchCount++;
				return { ...tackle };
			};

			const loop = new FishingLoop(
				baitMismatchTackle,
				5,
				speciesList,
				true,
				() => 0.1,
				undefined,
				onCycle
			);
			loop.cast(population, noopRemove);
			expect(loop.currentFish).toBeNull();

			loop.tick(30000);
			expect(tackleSwitchCount).toBe(0);

			loop.tick(30000);
			expect(tackleSwitchCount).toBe(1);
		});

		it('does not change tackle if tackle update finds a fish between blank cycles', () => {
			let tackleSwitchCount = 0;
			const onCycle = () => {
				tackleSwitchCount++;
				return { ...tackle };
			};

			const loop = new FishingLoop(
				baitMismatchTackle,
				5,
				speciesList,
				true,
				() => 0.1,
				undefined,
				onCycle
			);
			loop.cast(population, noopRemove);
			expect(loop.currentFish).toBeNull();

			loop.tick(30000);

			loop.updateTackle(tackle);
			expect(loop.currentFish).not.toBeNull();
			expect(tackleSwitchCount).toBe(0);
		});
	});

	describe('bot strike has no skill roll — HookRangeCheck only', () => {
		it('bot with skill 0 succeeds on strike if hook handles the fish', () => {
			const loop = new FishingLoop(tackle, 0, speciesList, true, () => 0);
			loop.cast(population, noopRemove);
			loop.tick(loop.remainingMs);
			expect(loop.phase).toBe('bite');

			const event = loop.tick(100);
			expect(event).toBeNull();
			expect(loop.phase).toBe('reeling');
		});

		it('bot strike fails via HookRangeCheck not skill roll', () => {
			const smallHookTackle: TackleSelection = {
				...tackle,
				hook: { name: '22', image: 'hook.png', size: 22, minOz: 1, maxOz: 50, deter: 0 }
			};
			const loop = new FishingLoop(smallHookTackle, 10, speciesList, true, () => 0.45);
			loop.cast(population, noopRemove);
			loop.tick(loop.remainingMs);
			expect(loop.phase).toBe('bite');

			const delay = 10_000 - 9 * (7_000 / 9);
			const event = loop.tick(delay + 1);
			expect(event).toEqual({ type: 'hookBroken' });
			expect(loop.phase).toBe('lost');
		});
	});

	describe('recast', () => {
		it('resets to idle', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, false, () => 0);
			loop.cast(population, noopRemove);
			loop.resetCast();
			expect(loop.phase).toBe('idle');
			expect(loop.currentFish).toBeNull();
			expect(loop.remainingMs).toBe(0);
			expect(loop.biteWindowRemaining).toBe(0);
			expect(loop.biteWindowTotal).toBe(0);
		});
	});

	describe('strike', () => {
		it('player succeeds without skill roll (HookRangeCheck passes)', () => {
			const loop = new FishingLoop(tackle, 0, speciesList, false, () => 0.3);
			loop.cast(population, noopRemove);
			loop.tick(loop.remainingMs);
			expect(loop.phase).toBe('bite');

			const event = loop.strike();
			expect(event).toBeNull();
			expect(loop.phase).toBe('reeling');
		});

		it('returns hookBroken when fish exceeds hook maxOz', () => {
			const smallHookTackle: TackleSelection = {
				...tackle,
				hook: { name: '22', image: 'hook.png', size: 22, minOz: 1, maxOz: 50, deter: 0 }
			};
			const loop = new FishingLoop(smallHookTackle, 5, speciesList, false, () => 0.4);
			loop.cast(population, noopRemove);
			loop.tick(loop.remainingMs);
			expect(loop.phase).toBe('bite');

			const event = loop.strike();
			expect(event).toEqual({ type: 'hookBroken' });
			expect(loop.phase).toBe('lost');
		});

		it('returns null if not in bite phase', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, false, () => 0);
			expect(loop.strike()).toBeNull();
		});

		it('clears bite window on strike', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, false, () => 0);
			loop.cast(population, noopRemove);
			loop.tick(loop.remainingMs);
			expect(loop.biteWindowRemaining).toBeGreaterThan(0);

			loop.strike();
			expect(loop.biteWindowRemaining).toBe(0);
			expect(loop.biteWindowTotal).toBe(0);
		});
	});

	describe('reel', () => {
		it('succeeds and records caught fish — player must tick through reel timer then land', () => {
			const { fn, ids } = collectRemoveCalls();
			const loop = new FishingLoop(tackle, 5, speciesList, false, () => 0.3);
			loop.cast(population, fn);
			loop.tick(loop.remainingMs);
			loop.strike();
			expect(loop.phase).toBe('reeling');

			loop.tick(loop.reelTimerRemaining);
			expect(loop.phase).toBe('landing');

			const event = loop.reel();
			expect(event).toEqual({
				type: 'fishCaught',
				species: 'Roach',
				classificationLabel: 'Small',
				weightOz: 12
			});
			expect(loop.phase).toBe('caught');
			expect(loop.caughtFish).toHaveLength(1);
			expect(ids).toContain('fish-1');
		});

		it('player clicking too early during reel timer loses the fish', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, false, () => 0.3);
			loop.cast(population, noopRemove);
			loop.tick(loop.remainingMs);
			loop.strike();
			expect(loop.phase).toBe('reeling');

			const event = loop.reel();
			expect(event).toEqual({ type: 'fishGotAway' });
			expect(loop.phase).toBe('lost');
		});

		it('fails for oversized fish with unlucky roll — at landing', () => {
			const heavyFish: FishData = {
				id: 'fish-heavy',
				species: 'Roach',
				strata: 'Bottom',
				classificationLabel: '',
				tierIndex: 1,
				weightOz: 200,
				castStrength: 'Medium',
				preferredBait: 'maggot'
			};
			const heavyPopulation = [heavyFish];
			const loop = new FishingLoop(tackle, 5, speciesList, false, () => 0.5);
			loop.cast(heavyPopulation, noopRemove);
			loop.tick(loop.remainingMs);
			loop.strike();

			loop.tick(loop.reelTimerRemaining);
			expect(loop.phase).toBe('landing');

			const event = loop.reel();
			expect(event).toEqual({ type: 'lineBroke' });
			expect(loop.phase).toBe('lost');
		});

		it('returns null if not in reeling or landing phase', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, false, () => 0);
			expect(loop.reel()).toBeNull();
		});

		it('tooMuchSlackLine when landing window expires', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, false, () => 0.1);
			loop.cast(population, noopRemove);
			loop.tick(loop.remainingMs);
			loop.strike();
			loop.tick(loop.reelTimerRemaining);
			expect(loop.phase).toBe('landing');

			const event = loop.tick(loop.landingWindowRemaining + 1);
			expect(event).toEqual({ type: 'tooMuchSlackLine' });
			expect(loop.phase).toBe('lost');
		});
	});

	describe('returnToCast', () => {
		it('resets to idle after a catch', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, false, () => 0.3);
			loop.cast(population, noopRemove);
			loop.tick(loop.remainingMs);
			loop.strike();
			loop.tick(loop.reelTimerRemaining);
			loop.reel();
			expect(loop.phase).toBe('caught');

			loop.returnToCast();
			expect(loop.phase).toBe('idle');
			expect(loop.currentFish).toBeNull();
			expect(loop.biteWindowRemaining).toBe(0);
		});
	});

	describe('full linear flow', () => {
		it('cast → wait → bite → strike → reel → landing → reel → caught', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, false, () => 0.3);

			expect(loop.phase).toBe('idle');

			loop.cast(population, noopRemove);
			expect(loop.phase).toBe('waiting');

			loop.tick(loop.remainingMs);
			expect(loop.phase).toBe('bite');
			expect(loop.biteWindowTotal).toBeGreaterThan(0);

			loop.strike();
			expect(loop.phase).toBe('reeling');
			expect(loop.reelTimerMs).toBeGreaterThan(0);
			expect(loop.reelTimerRemaining).toBe(loop.reelTimerMs);

			loop.tick(loop.reelTimerRemaining);
			expect(loop.phase).toBe('landing');

			loop.reel();
			expect(loop.phase).toBe('caught');
			expect(loop.caughtFish).toHaveLength(1);

			loop.returnToCast();
			expect(loop.phase).toBe('idle');
		});
	});
});
