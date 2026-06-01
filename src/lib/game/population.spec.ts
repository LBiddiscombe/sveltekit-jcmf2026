import { describe, it, expect, beforeEach } from 'vitest';
import {
	passesTolerances,
	populatePeg,
	reassignDynamicProperties,
	fishMatchScore,
	weightedSelectIndex,
	resetIds
} from './population';
import type { FishData } from './population';
import type { EnvironmentalFeatures, Lake, Peg, Species } from '$lib/data';

const mockSpecies: Species[] = [
	{
		name: 'Roach',
		cautionMs: 3000,
		record: 68,
		strata: ['Top', 'Middle', 'Bottom'],
		description: '',
		preferences: { flow: 0.3, clarity: 0.5, substrate: 0.7, vegetation: 0.6, shelter: 0.5 },
		tolerances: {},
		pattern: [],
		classifications: [
			{ id: 'small', label: 'Small', maxOz: 8, biteSizeExtraMs: 2000, preferredBaits: [] },
			{ id: 'medium', label: '', maxOz: 34, biteSizeExtraMs: 5000, preferredBaits: [] },
			{ id: 'specimen', label: 'Specimen', maxOz: 51, biteSizeExtraMs: 60000, preferredBaits: [] },
			{
				id: 'monster',
				label: 'Monster',
				maxOz: Infinity,
				biteSizeExtraMs: 120000,
				preferredBaits: []
			}
		]
	},
	{
		name: 'Perch',
		cautionMs: 4000,
		record: 99,
		strata: ['Middle', 'Bottom'],
		description: '',
		preferences: { flow: 0.2, clarity: 0.6, substrate: 0.5, vegetation: 0.8, shelter: 0.6 },
		tolerances: {},
		pattern: [],
		classifications: [
			{ id: 'small', label: 'Small', maxOz: 8, biteSizeExtraMs: 2000, preferredBaits: [] },
			{ id: 'medium', label: '', maxOz: 49, biteSizeExtraMs: 5000, preferredBaits: [] },
			{ id: 'specimen', label: 'Specimen', maxOz: 75, biteSizeExtraMs: 60000, preferredBaits: [] },
			{
				id: 'monster',
				label: 'Monster',
				maxOz: Infinity,
				biteSizeExtraMs: 120000,
				preferredBaits: []
			}
		]
	},
	{
		name: 'Pike',
		cautionMs: 9000,
		record: 749,
		strata: ['Top', 'Middle', 'Bottom'],
		description: '',
		preferences: { flow: 0.2, clarity: 0.6, substrate: 0.6, vegetation: 0.9, shelter: 0.8 },
		tolerances: {},
		pattern: [],
		classifications: [
			{ id: 'small', label: 'Jack', maxOz: 80, biteSizeExtraMs: 2000, preferredBaits: [] },
			{ id: 'medium', label: '', maxOz: 374, biteSizeExtraMs: 5000, preferredBaits: [] },
			{ id: 'specimen', label: 'Specimen', maxOz: 561, biteSizeExtraMs: 60000, preferredBaits: [] },
			{
				id: 'monster',
				label: 'Monster',
				maxOz: Infinity,
				biteSizeExtraMs: 120000,
				preferredBaits: []
			}
		]
	}
];

const mockPeg: Peg = {
	name: '1',
	description: '',
	features: { flow: 0.3, clarity: 0.5, substrate: 0.7, vegetation: 0.6, shelter: 0.5 }
};

const mockLake: Lake = {
	name: 'Test Lake',
	fishCount: 100,
	species: [
		{ name: 'Roach', frequency: 10 },
		{ name: 'Perch', frequency: 8 },
		{ name: 'Pike', frequency: 1 }
	],
	pegs: [mockPeg]
};

describe('fishMatchScore', () => {
	it('returns 1 for an identical match', () => {
		const species = mockSpecies[0];
		const score = fishMatchScore(species, mockPeg.features);
		expect(score).toBe(1);
	});

	it('returns < 1 for a mismatch', () => {
		const species = mockSpecies[2];
		const score = fishMatchScore(species, mockPeg.features);
		expect(score).toBeLessThan(1);
	});

	it('returns a non-zero score for a partial match', () => {
		const species: Species = {
			...mockSpecies[0],
			preferences: { flow: 0.7, clarity: 0.5, substrate: 0.3, vegetation: 0.4, shelter: 0.5 },
			tolerances: {}
		};
		const features: EnvironmentalFeatures = {
			flow: 0.3,
			clarity: 0.5,
			substrate: 0.7,
			vegetation: 0.6,
			shelter: 0.5
		};
		const score = fishMatchScore(species, features);
		expect(score).toBeGreaterThan(0);
		expect(score).toBeLessThan(1);
	});
});

describe('passesTolerances', () => {
	const baseFeatures: EnvironmentalFeatures = {
		flow: 0.5,
		clarity: 0.5,
		substrate: 0.5,
		vegetation: 0.5,
		shelter: 0.5
	};

	it('returns true when no tolerances are defined', () => {
		const species: Species = {
			name: 'Roach',
			cautionMs: 3000,
			record: 68,
			strata: ['Bottom'],
			description: '',
			preferences: { flow: 0.5, clarity: 0.5, substrate: 0.5, vegetation: 0.5, shelter: 0.5 },
			tolerances: {},
			pattern: [],
			classifications: []
		};
		expect(passesTolerances(species, baseFeatures)).toBe(true);
	});

	it('returns true when all tolerances pass', () => {
		const species: Species = {
			name: 'Roach',
			cautionMs: 3000,
			record: 68,
			strata: ['Bottom'],
			description: '',
			preferences: { flow: 0.5, clarity: 0.5, substrate: 0.5, vegetation: 0.5, shelter: 0.5 },
			tolerances: {
				flow: { min: 0.3, max: 0.7 },
				clarity: { min: 0.3, max: 0.7 },
				substrate: { min: 0.3, max: 0.7 },
				vegetation: { min: 0.3, max: 0.7 },
				shelter: { min: 0.3, max: 0.7 }
			},
			pattern: [],
			classifications: []
		};
		expect(passesTolerances(species, baseFeatures)).toBe(true);
	});

	it('returns false when flow is below tolerance min', () => {
		const species: Species = {
			name: 'Roach',
			cautionMs: 3000,
			record: 68,
			strata: ['Bottom'],
			description: '',
			preferences: { flow: 0.5, clarity: 0.5, substrate: 0.5, vegetation: 0.5, shelter: 0.5 },
			tolerances: { flow: { min: 0.5, max: 1.0 } },
			pattern: [],
			classifications: []
		};
		expect(passesTolerances(species, { ...baseFeatures, flow: 0.3 })).toBe(false);
	});

	it('returns false when flow is above tolerance max', () => {
		const species: Species = {
			name: 'Roach',
			cautionMs: 3000,
			record: 68,
			strata: ['Bottom'],
			description: '',
			preferences: { flow: 0.5, clarity: 0.5, substrate: 0.5, vegetation: 0.5, shelter: 0.5 },
			tolerances: { flow: { min: 0.0, max: 0.4 } },
			pattern: [],
			classifications: []
		};
		expect(passesTolerances(species, { ...baseFeatures, flow: 0.5 })).toBe(false);
	});

	it('returns false when clarity is below tolerance min', () => {
		const species: Species = {
			name: 'Roach',
			cautionMs: 3000,
			record: 68,
			strata: ['Bottom'],
			description: '',
			preferences: { flow: 0.5, clarity: 0.5, substrate: 0.5, vegetation: 0.5, shelter: 0.5 },
			tolerances: { clarity: { min: 0.6, max: 1.0 } },
			pattern: [],
			classifications: []
		};
		expect(passesTolerances(species, { ...baseFeatures, clarity: 0.5 })).toBe(false);
	});

	it('returns false when substrate is above tolerance max', () => {
		const species: Species = {
			name: 'Roach',
			cautionMs: 3000,
			record: 68,
			strata: ['Bottom'],
			description: '',
			preferences: { flow: 0.5, clarity: 0.5, substrate: 0.5, vegetation: 0.5, shelter: 0.5 },
			tolerances: { substrate: { min: 0.0, max: 0.4 } },
			pattern: [],
			classifications: []
		};
		expect(passesTolerances(species, { ...baseFeatures, substrate: 0.5 })).toBe(false);
	});

	it('returns false when vegetation is below tolerance min', () => {
		const species: Species = {
			name: 'Roach',
			cautionMs: 3000,
			record: 68,
			strata: ['Bottom'],
			description: '',
			preferences: { flow: 0.5, clarity: 0.5, substrate: 0.5, vegetation: 0.5, shelter: 0.5 },
			tolerances: { vegetation: { min: 0.6, max: 1.0 } },
			pattern: [],
			classifications: []
		};
		expect(passesTolerances(species, { ...baseFeatures, vegetation: 0.5 })).toBe(false);
	});

	it('returns false when shelter is above tolerance max', () => {
		const species: Species = {
			name: 'Roach',
			cautionMs: 3000,
			record: 68,
			strata: ['Bottom'],
			description: '',
			preferences: { flow: 0.5, clarity: 0.5, substrate: 0.5, vegetation: 0.5, shelter: 0.5 },
			tolerances: { shelter: { min: 0.0, max: 0.4 } },
			pattern: [],
			classifications: []
		};
		expect(passesTolerances(species, { ...baseFeatures, shelter: 0.5 })).toBe(false);
	});

	it('returns true when feature equals tolerance boundary (min edge)', () => {
		const species: Species = {
			name: 'Roach',
			cautionMs: 3000,
			record: 68,
			strata: ['Bottom'],
			description: '',
			preferences: { flow: 0.5, clarity: 0.5, substrate: 0.5, vegetation: 0.5, shelter: 0.5 },
			tolerances: { flow: { min: 0.5, max: 1.0 } },
			pattern: [],
			classifications: []
		};
		expect(passesTolerances(species, baseFeatures)).toBe(true);
	});

	it('returns true when feature equals tolerance boundary (max edge)', () => {
		const species: Species = {
			name: 'Roach',
			cautionMs: 3000,
			record: 68,
			strata: ['Bottom'],
			description: '',
			preferences: { flow: 0.5, clarity: 0.5, substrate: 0.5, vegetation: 0.5, shelter: 0.5 },
			tolerances: { flow: { min: 0.0, max: 0.5 } },
			pattern: [],
			classifications: []
		};
		expect(passesTolerances(species, baseFeatures)).toBe(true);
	});

	it('handles undefined tolerance dimensions as not dealbreakers', () => {
		const species: Species = {
			name: 'Roach',
			cautionMs: 3000,
			record: 68,
			strata: ['Bottom'],
			description: '',
			preferences: { flow: 0.5, clarity: 0.5, substrate: 0.5, vegetation: 0.5, shelter: 0.5 },
			tolerances: {
				flow: { min: 0.4, max: 0.6 },
				clarity: { min: 0.4, max: 0.6 }
			},
			pattern: [],
			classifications: []
		};
		const features: EnvironmentalFeatures = {
			flow: 0.5,
			clarity: 0.5,
			substrate: 0.1,
			vegetation: 0.1,
			shelter: 0.1
		};
		expect(passesTolerances(species, features)).toBe(true);
	});
});

describe('weightedSelectIndex', () => {
	it('picks index 0 when it is the only weight', () => {
		expect(weightedSelectIndex([10], Math.random)).toBe(0);
	});

	it('picks index 0 when roll falls in its range', () => {
		const rng = () => 0.05;
		expect(weightedSelectIndex([10, 1], rng)).toBe(0);
	});

	it('picks index 1 when roll falls in its range', () => {
		const rng = () => 0.95;
		expect(weightedSelectIndex([10, 1], rng)).toBe(1);
	});

	it('returns -1 when all weights are zero', () => {
		expect(weightedSelectIndex([0, 0], Math.random)).toBe(-1);
	});
});

function cycleRng(values: number[]): () => number {
	let i = 0;
	return () => values[i++ % values.length];
}

describe('populatePeg', () => {
	beforeEach(() => {
		resetIds();
	});

	it('returns the requested count of fish', () => {
		const fish = populatePeg(mockLake, mockPeg, mockSpecies, 10, () => 0.5);
		expect(fish).toHaveLength(10);
	});

	it('gives each fish a unique id', () => {
		const fish = populatePeg(mockLake, mockPeg, mockSpecies, 100, () => 0.5);
		const ids = fish.map((f) => f.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('distributes more fish to species with higher frequency when peg matches both equally', () => {
		const peg: Peg = {
			name: 'neutral',
			description: '',
			features: { flow: 0.25, clarity: 0.55, substrate: 0.6, vegetation: 0.7, shelter: 0.55 }
		};
		const rng = cycleRng([0.05, 0.15, 0.3, 0.5, 0.7, 0.85, 0.95]);
		const fish = populatePeg(mockLake, peg, mockSpecies, 700, rng);
		const roachCount = fish.filter((f) => f.species === 'Roach').length;
		const perchCount = fish.filter((f) => f.species === 'Perch').length;
		const pikeCount = fish.filter((f) => f.species === 'Pike').length;
		expect(roachCount).toBeGreaterThan(pikeCount);
		expect(perchCount).toBeGreaterThan(pikeCount);
	});

	it('skips species not found in the species list', () => {
		const lake: Lake = {
			...mockLake,
			species: [{ name: 'UnknownSpecies', frequency: 100 }, ...mockLake.species]
		};
		const fish = populatePeg(lake, mockPeg, mockSpecies, 50, () => 0.5);
		expect(fish.every((f) => f.species !== 'UnknownSpecies')).toBe(true);
	});

	it('assigns a weight within species record for monster tier', () => {
		// Pair (species rng < 0.565 → Roach, tier rng > 0.95 → Monster)
		const targets: number[] = [];
		for (let i = 0; i < 100; i++) {
			targets.push(0.5, 0.99);
		}
		const rng = cycleRng(targets);
		const fish = populatePeg(mockLake, mockPeg, mockSpecies, 100, rng);
		const roachFish = fish.filter(
			(f) => f.species === 'Roach' && f.classificationLabel === 'Monster'
		);
		expect(roachFish.length).toBeGreaterThan(0);
		for (const f of roachFish) {
			expect(f.weightOz).toBeLessThanOrEqual(68);
			expect(f.weightOz).toBeGreaterThanOrEqual(1);
		}
	});

	it('assigns weight within classification bounds', () => {
		const rng = cycleRng([0.01, 0.1, 0.3, 0.5, 0.7, 0.99]);
		const fish = populatePeg(mockLake, mockPeg, mockSpecies, 600, rng);
		for (const f of fish) {
			expect(f.weightOz).toBeGreaterThanOrEqual(1);
		}
	});
});

describe('reassignDynamicProperties', () => {
	it('sets strata, castStrength, and preferredBait on existing fish', () => {
		const fish: FishData[] = [
			{
				id: 'fish-1',
				species: 'Roach',
				strata: '',
				classificationLabel: 'Small',
				tierIndex: 0,
				weightOz: 4,
				castStrength: '',
				preferredBait: '',
				pattern: [],
				stepMs: 1000
			}
		];

		reassignDynamicProperties(fish, mockSpecies, () => 0.1);

		expect(fish[0].strata).toBe('Top');
		expect(fish[0].castStrength).toBe('Short');
		expect(fish[0].preferredBait).toBe('');
	});

	it('sets preferredBait from the fish classification when available', () => {
		const species: Species[] = [
			{
				name: 'Roach',
				cautionMs: 3000,
				record: 68,
				strata: ['Bottom'],
				description: '',
				preferences: { flow: 0.5, clarity: 0.5, substrate: 0.5, vegetation: 0.5, shelter: 0.5 },
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
					{ id: 'medium', label: '', maxOz: 34, biteSizeExtraMs: 5000, preferredBaits: ['maggot'] },
					{
						id: 'specimen',
						label: 'Specimen',
						maxOz: 51,
						biteSizeExtraMs: 60000,
						preferredBaits: ['worm']
					},
					{
						id: 'monster',
						label: 'Monster',
						maxOz: Infinity,
						biteSizeExtraMs: 120000,
						preferredBaits: ['boilie']
					}
				]
			}
		];

		const fish: FishData[] = [
			{
				id: 'fish-1',
				species: 'Roach',
				strata: '',
				classificationLabel: 'Small',
				tierIndex: 0,
				weightOz: 4,
				castStrength: '',
				preferredBait: '',
				pattern: [],
				stepMs: 1000
			},
			{
				id: 'fish-2',
				species: 'Roach',
				strata: '',
				classificationLabel: '',
				tierIndex: 1,
				weightOz: 20,
				castStrength: '',
				preferredBait: '',
				pattern: [],
				stepMs: 1000
			},
			{
				id: 'fish-3',
				species: 'Roach',
				strata: '',
				classificationLabel: 'Specimen',
				tierIndex: 2,
				weightOz: 40,
				castStrength: '',
				preferredBait: '',
				pattern: [],
				stepMs: 1000
			}
		];

		reassignDynamicProperties(fish, species, () => 0.1);

		// tierIndex 0 → preferredBaits: ['maggot', 'caster'] → rng=0.1, floor(0.1*2)=0 → 'maggot'
		expect(fish[0].preferredBait).toBe('maggot');
		// tierIndex 1 → preferredBaits: ['maggot'] → floor(0.1*1)=0 → 'maggot'
		expect(fish[1].preferredBait).toBe('maggot');
		// tierIndex 2 → preferredBaits: ['worm'] → floor(0.1*1)=0 → 'worm'
		expect(fish[2].preferredBait).toBe('worm');
	});
});

describe('deterministic RNG', () => {
	beforeEach(() => {
		resetIds();
	});

	it('produces identical results for the same seed', () => {
		const calls: number[] = [];
		const rng = () => {
			calls.push(calls.length);
			return 0.5;
		};

		const a = populatePeg(mockLake, mockPeg, mockSpecies, 10, rng);
		resetIds();
		const b = populatePeg(mockLake, mockPeg, mockSpecies, 10, rng);

		expect(a).toEqual(b);
	});
});
