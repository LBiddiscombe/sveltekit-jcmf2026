import { describe, it, expect } from 'vitest';
import { FishingLoop } from './loop';
import type { FishData } from './population';
import type { EnvironmentalFeatures, Species, TackleSelection } from '$lib/data';

const features: EnvironmentalFeatures = {
	flow: 0.3,
	clarity: 0.5,
	substrate: 0.7,
	vegetation: 0.6,
	shelter: 0.5
};

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
	classificationLabel: 'Small',
	weightOz: 4,
	castStrength: 'Medium'
};

const monsterRoach: FishData = {
	id: 'fish-2',
	species: 'Roach',
	classificationLabel: 'Monster',
	weightOz: 60,
	castStrength: 'Medium'
};

const smallCarp: FishData = {
	id: 'fish-3',
	species: 'Carp',
	classificationLabel: 'Small',
	weightOz: 32,
	castStrength: 'Medium'
};

const mediumRoach: FishData = {
	id: 'fish-4',
	species: 'Roach',
	classificationLabel: '',
	weightOz: 20,
	castStrength: 'Medium'
};

const population: FishData[] = [smallRoach, monsterRoach, smallCarp, mediumRoach];

function noopRemove(_id: string) {
	/* no-op */
}

describe('FishingLoop', () => {
	describe('cast — fish selection', () => {
		it('selects a fish matching bait and strata', () => {
			// maggot is preferred by Small Roach; Bottom strata includes Roach
			const loop = new FishingLoop(tackle, 5, features, speciesList, () => 0.1);
			const event = loop.cast(population, noopRemove);
			expect(event).toBeNull();
			expect(loop.phase).toBe('waiting');
			expect(loop.currentFish).not.toBeNull();
			expect(loop.currentFish!.species).toBe('Roach');
		});

		it('returns blankCast when no fish matches bait', () => {
			// boilie is not preferred by Roach at Small tier
			const loop = new FishingLoop(baitMismatchTackle, 5, features, speciesList, () => 0.1);
			const event = loop.cast(population, noopRemove);
			expect(event).toEqual({ type: 'blankCast' });
			expect(loop.phase).toBe('waiting');
			expect(loop.currentFish).toBeNull();
		});

		it('returns blankCast when no fish matches strata', () => {
			const loop = new FishingLoop(
				{ ...tackle, strata: 'Surface' },
				5,
				features,
				speciesList,
				() => 0.1
			);
			const event = loop.cast(population, noopRemove);
			expect(event).toEqual({ type: 'blankCast' });
		});

		it('uses RNG to pick among candidates', () => {
			// smallRoach (Small) + mediumRoach (unnamed) both match Bottom + maggot. RNG=0 gives first, RNG=0.99 gives second.
			const loop = new FishingLoop(tackle, 5, features, speciesList, () => 0.99);
			const event = loop.cast(population, noopRemove);
			expect(event).toBeNull();
			// With RNG=0.99 on 2 candidates, floor(0.99*2) = 1, so index 1 = mediumRoach (fish-4)
			expect(loop.currentFish!.id).toBe('fish-4');
		});
	});

	describe('tick', () => {
		it('advances remaining time', () => {
			const loop = new FishingLoop(tackle, 5, features, speciesList, () => 0);
			loop.cast(population, noopRemove);

			const beforeMs = loop.remainingMs;
			loop.tick(100);
			expect(loop.remainingMs).toBe(beforeMs - 100);
		});

		it('triggers bite when timer expires', () => {
			const loop = new FishingLoop(tackle, 5, features, speciesList, () => 0);
			loop.cast(population, noopRemove);

			const event = loop.tick(loop.remainingMs);
			expect(event).toEqual({ type: 'bite' });
			expect(loop.phase).toBe('bite');
		});

		it('returns null when no fish is set (blank cast)', () => {
			const loop = new FishingLoop(baitMismatchTackle, 5, features, speciesList, () => 0);
			loop.cast(population, noopRemove);
			const event = loop.tick(5000);
			expect(event).toBeNull();
		});
	});

	describe('recast', () => {
		it('resets to idle', () => {
			const loop = new FishingLoop(tackle, 5, features, speciesList, () => 0);
			loop.cast(population, noopRemove);
			loop.recast();
			expect(loop.phase).toBe('idle');
			expect(loop.currentFish).toBeNull();
			expect(loop.remainingMs).toBe(0);
		});
	});

	describe('strike', () => {
		it('succeeds and transitions to reeling with favourable RNG', () => {
			const loop = new FishingLoop(tackle, 5, features, speciesList, () => 0.3);
			loop.cast(population, noopRemove);
			loop.tick(loop.remainingMs);
			expect(loop.phase).toBe('bite');

			const event = loop.strike();
			expect(event).toBeNull();
			expect(loop.phase).toBe('reeling');
		});

		it('fails and loses fish on unfavourable RNG', () => {
			// skill=0: threshold = 0.5 + 0 = 0.5. rng=0.6 > 0.5 → fail
			const loop = new FishingLoop(tackle, 0, features, speciesList, () => 0.6);
			loop.cast(population, noopRemove);
			loop.tick(loop.remainingMs);

			const event = loop.strike();
			expect(event).toEqual({ type: 'fishLost' });
			expect(loop.phase).toBe('lost');
		});

		it('returns null if not in bite phase', () => {
			const loop = new FishingLoop(tackle, 5, features, speciesList, () => 0);
			expect(loop.strike()).toBeNull();
		});
	});

	describe('reel', () => {
		it('succeeds when fish weight is within line capacity', () => {
			const loop = new FishingLoop(tackle, 5, features, speciesList, () => 0.3);
			loop.cast(population, noopRemove);
			loop.tick(loop.remainingMs);
			loop.strike();
			expect(loop.phase).toBe('reeling');

			const event = loop.reel();
			expect(event).toBeNull();
			expect(loop.phase).toBe('netting');
		});

		it('fails for oversized fish with unlucky roll', () => {
			// line maxOz=160, smallRoach is 4oz — won't fail. We need a fish > 160oz.
			const heavyFish: FishData = {
				id: 'fish-heavy',
				species: 'Carp',
				classificationLabel: '',
				weightOz: 200,
				castStrength: 'Medium'
			};
			const heavyPopulation = [heavyFish];
			// Need heavy fish to be selectable: carp prefers pellet/sweetcorn, not maggot
			const carpTackle: TackleSelection = {
				...tackle,
				bait: { name: 'pellet', image: 'pellet.png', minOz: 4, maxOz: 512 }
			};
			const loop = new FishingLoop(carpTackle, 5, features, speciesList, () => 0.5);
			loop.cast(heavyPopulation, noopRemove);
			loop.tick(loop.remainingMs);
			loop.strike();

			// reel: 200 > 160 and rng=0.5 >= 0.3 → fail
			const event = loop.reel();
			expect(event).toEqual({ type: 'fishLost' });
			expect(loop.phase).toBe('lost');
		});

		it('returns null if not in reeling phase', () => {
			const loop = new FishingLoop(tackle, 5, features, speciesList, () => 0);
			expect(loop.reel()).toBeNull();
		});
	});

	describe('net', () => {
		it('catches the fish and records it', () => {
			const loop = new FishingLoop(tackle, 5, features, speciesList, () => 0.3);
			loop.cast(population, noopRemove);
			loop.tick(loop.remainingMs);
			loop.strike();
			loop.reel();
			expect(loop.phase).toBe('netting');

			const event = loop.net();
			expect(event).toEqual({
				type: 'fishCaught',
				species: 'Roach',
				classificationLabel: 'Small',
				weightOz: 4
			});
			expect(loop.phase).toBe('caught');
			expect(loop.caughtFish).toHaveLength(1);
			expect(loop.caughtFish[0]).toEqual({
				species: 'Roach',
				classificationLabel: 'Small',
				weightOz: 4
			});
		});

		it('returns null if not in netting phase', () => {
			const loop = new FishingLoop(tackle, 5, features, speciesList, () => 0);
			expect(loop.net()).toBeNull();
		});
	});

	describe('returnToCast', () => {
		it('resets to idle after a catch', () => {
			const loop = new FishingLoop(tackle, 5, features, speciesList, () => 0.3);
			loop.cast(population, noopRemove);
			loop.tick(loop.remainingMs);
			loop.strike();
			loop.reel();
			loop.net();
			expect(loop.phase).toBe('caught');

			loop.returnToCast();
			expect(loop.phase).toBe('idle');
			expect(loop.currentFish).toBeNull();
		});
	});

	describe('full linear flow', () => {
		it('cast → wait → bite → strike → reel → net → caught', () => {
			const loop = new FishingLoop(tackle, 5, features, speciesList, () => 0.3);

			expect(loop.phase).toBe('idle');

			loop.cast(population, noopRemove);
			expect(loop.phase).toBe('waiting');

			loop.tick(loop.remainingMs);
			expect(loop.phase).toBe('bite');

			loop.strike();
			expect(loop.phase).toBe('reeling');

			loop.reel();
			expect(loop.phase).toBe('netting');

			loop.net();
			expect(loop.phase).toBe('caught');
			expect(loop.caughtFish).toHaveLength(1);

			loop.returnToCast();
			expect(loop.phase).toBe('idle');
		});
	});
});
