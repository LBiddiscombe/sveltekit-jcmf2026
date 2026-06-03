import { describe, it, expect } from 'vitest';
import { FishingLoop } from './loop';
import type { FishData } from './population';
import type { Species, TackleSelection } from '$lib/data';

const roach: Species = {
	name: 'Roach',
	cautionMs: 3000,
	record: 68,
	strata: ['Top', 'Middle', 'Bottom'],
	description: '',
	preferences: { flow: 0.3, clarity: 0.5, substrate: 0.7, vegetation: 0.6, shelter: 0.5 },
	tolerances: {},
	pattern: [],
	classifications: [
		{
			id: 'small',
			label: 'Small',
			maxOz: 8,
			biteSizeExtraMs: 2000,
			preferredBaits: ['maggot', 'caster']
		},
		{
			id: 'medium',
			label: '',
			maxOz: 34,
			biteSizeExtraMs: 5000,
			preferredBaits: ['maggot', 'caster', 'worm']
		},
		{
			id: 'specimen',
			label: 'Specimen',
			maxOz: 51,
			biteSizeExtraMs: 60000,
			preferredBaits: ['worm', 'bread']
		},
		{
			id: 'monster',
			label: 'Monster',
			maxOz: Infinity,
			biteSizeExtraMs: 120000,
			preferredBaits: ['worm', 'bread']
		}
	]
};

const carp: Species = {
	name: 'Carp',
	cautionMs: 12000,
	record: 1089,
	strata: ['Bottom'],
	description: '',
	preferences: { flow: 0.2, clarity: 0.4, substrate: 0.9, vegetation: 0.6, shelter: 0.5 },
	tolerances: {},
	pattern: [],
	classifications: [
		{
			id: 'small',
			label: 'Small',
			maxOz: 64,
			biteSizeExtraMs: 2000,
			preferredBaits: ['pellet', 'sweetcorn']
		},
		{
			id: 'medium',
			label: '',
			maxOz: 544,
			biteSizeExtraMs: 5000,
			preferredBaits: ['pellet', 'sweetcorn']
		},
		{
			id: 'specimen',
			label: 'Specimen',
			maxOz: 816,
			biteSizeExtraMs: 60000,
			preferredBaits: ['boilie']
		},
		{
			id: 'monster',
			label: 'Monster',
			maxOz: Infinity,
			biteSizeExtraMs: 120000,
			preferredBaits: ['boilie']
		}
	]
};

const speciesList = [roach, carp];

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
	preferredBait: 'maggot',
	pattern: [],
	stepMs: 1000
};

const monsterRoach: FishData = {
	id: 'fish-2',
	species: 'Roach',
	strata: 'Bottom',
	classificationLabel: 'Monster',
	tierIndex: 3,
	weightOz: 60,
	castStrength: 'Medium',
	preferredBait: 'maggot',
	pattern: [],
	stepMs: 1000
};

const smallCarp: FishData = {
	id: 'fish-3',
	species: 'Carp',
	strata: 'Bottom',
	classificationLabel: 'Small',
	tierIndex: 0,
	weightOz: 32,
	castStrength: 'Medium',
	preferredBait: 'pellet',
	pattern: [],
	stepMs: 1000
};

const mediumRoach: FishData = {
	id: 'fish-4',
	species: 'Roach',
	strata: 'Bottom',
	classificationLabel: '',
	tierIndex: 1,
	weightOz: 20,
	castStrength: 'Medium',
	preferredBait: 'maggot',
	pattern: [],
	stepMs: 1000
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
			const loop = new FishingLoop(tackle, 5, speciesList, () => 0.1);
			const event = loop.cast(population, noopRemove);
			expect(event).toBeNull();
			expect(loop.phase).toBe('waiting');
			expect(loop.currentFish).not.toBeNull();
			expect(loop.currentFish!.species).toBe('Roach');
		});

		it('returns null when no fish matches bait (blank cast)', () => {
			const loop = new FishingLoop(baitMismatchTackle, 5, speciesList, () => 0.1);
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
			const loop = new FishingLoop(heavyLineTackle, 5, speciesList, () => 0.1);
			const event = loop.cast(population, noopRemove);
			expect(event).toBeNull();
		});

		it('uses RNG to pick among candidates', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, () => 0.99);
			const event = loop.cast(population, noopRemove);
			expect(event).toBeNull();
			expect(loop.currentFish!.id).toBe('fish-4');
		});
	});

	describe('tick', () => {
		it('advances remaining time', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, () => 0);
			loop.cast(population, noopRemove);

			const beforeMs = loop.remainingMs;
			loop.tick(100);
			expect(loop.remainingMs).toBe(beforeMs - 100);
		});

		it('triggers bite when timer expires and starts bite window', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, () => 0);
			loop.cast(population, noopRemove);

			const event = loop.tick(loop.remainingMs);
			expect(event).toEqual({ type: 'bite' });
			expect(loop.phase).toBe('bite');
			expect(loop.biteWindowTotal).toBeGreaterThan(0);
			expect(loop.biteWindowRemaining).toBe(loop.biteWindowTotal);
		});

		it('emits biteExpired when bite window expires', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, () => 0);
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
			const loop = new FishingLoop(baitMismatchTackle, 5, speciesList, () => 0, redistributeFn);
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

	describe('recast', () => {
		it('resets to idle', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, () => 0);
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
		it('succeeds without skill roll (HookRangeCheck passes)', () => {
			const loop = new FishingLoop(tackle, 0, speciesList, () => 0.3);
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
			const loop = new FishingLoop(smallHookTackle, 5, speciesList, () => 0.4);
			loop.cast(population, noopRemove);
			loop.tick(loop.remainingMs);
			expect(loop.phase).toBe('bite');

			const event = loop.strike();
			expect(event).toEqual({ type: 'hookBroken' });
			expect(loop.phase).toBe('lost');
		});

		it('returns null if not in bite phase', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, () => 0);
			expect(loop.strike()).toBeNull();
		});

		it('clears bite window on strike', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, () => 0);
			loop.cast(population, noopRemove);
			loop.tick(loop.remainingMs);
			expect(loop.biteWindowRemaining).toBeGreaterThan(0);

			loop.strike();
			expect(loop.biteWindowRemaining).toBe(0);
			expect(loop.biteWindowTotal).toBe(0);
		});
	});

	describe('handleReelingOutcome', () => {
		it('returns null when not in reeling phase', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, () => 0.3);
			expect(loop.handleReelingOutcome('caught')).toBeNull();
			expect(loop.handleReelingOutcome('lost')).toBeNull();
		});

		it('returns null when no current fish', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, () => 0.3);
			loop.phase = 'reeling';
			expect(loop.handleReelingOutcome('caught')).toBeNull();
		});

		it('returns fishGotAway and sets phase to lost when result is lost', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, () => 0.3);
			loop.cast(population, noopRemove);
			loop.tick(loop.remainingMs);
			loop.strike();
			expect(loop.phase).toBe('reeling');

			const event = loop.handleReelingOutcome('lost');
			expect(event).toEqual({ type: 'fishGotAway' });
			expect(loop.phase).toBe('lost');
		});

		it('succeeds and catches fish within line capacity', () => {
			const { fn, ids } = collectRemoveCalls();
			const loop = new FishingLoop(tackle, 5, speciesList, () => 0.1);
			loop.cast(population, fn);
			loop.tick(loop.remainingMs);
			loop.strike();
			expect(loop.phase).toBe('reeling');

			const event = loop.handleReelingOutcome('caught');
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
	});

	describe('returnToCast', () => {
		it('resets to idle after a catch', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, () => 0.3);
			loop.cast(population, noopRemove);
			loop.tick(loop.remainingMs);
			loop.strike();
			loop.handleReelingOutcome('caught');
			expect(loop.phase).toBe('caught');

			loop.returnToCast();
			expect(loop.phase).toBe('idle');
			expect(loop.currentFish).toBeNull();
			expect(loop.biteWindowRemaining).toBe(0);
		});
	});

	describe('full linear flow', () => {
		it('cast → wait → bite → strike → handleReelingOutcome → caught', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, () => 0.3);

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

			loop.handleReelingOutcome('caught');
			expect(loop.phase).toBe('caught');
			expect(loop.caughtFish).toHaveLength(1);

			loop.returnToCast();
			expect(loop.phase).toBe('idle');
		});
	});
});
