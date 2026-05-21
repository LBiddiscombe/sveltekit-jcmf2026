import { describe, it, expect, beforeEach } from 'vitest';
import { populatePeg, fishMatchScore, weightedSelectIndex, resetIds } from './population';
import type { EnvironmentalFeatures, Lake, Peg, Species } from '$lib/data';

const mockSpecies: Species[] = [
	{
		name: 'Roach',
		record: 68,
		strata: ['Top', 'Middle', 'Bottom'],
		description: '',
		preferences: { flow: 0.3, clarity: 0.5, substrate: 0.7, vegetation: 0.6, shelter: 0.5 },
		tolerances: {},
		classifications: [
			{ label: 'Small', maxOz: 8, preferredBaits: [] },
			{ label: '', maxOz: 34, preferredBaits: [] },
			{ label: 'Specimen', maxOz: 51, preferredBaits: [] },
			{ label: 'Monster', maxOz: Infinity, preferredBaits: [] }
		]
	},
	{
		name: 'Perch',
		record: 99,
		strata: ['Middle', 'Bottom'],
		description: '',
		preferences: { flow: 0.2, clarity: 0.6, substrate: 0.5, vegetation: 0.8, shelter: 0.6 },
		tolerances: {},
		classifications: [
			{ label: 'Small', maxOz: 8, preferredBaits: [] },
			{ label: '', maxOz: 49, preferredBaits: [] },
			{ label: 'Specimen', maxOz: 75, preferredBaits: [] },
			{ label: 'Monster', maxOz: Infinity, preferredBaits: [] }
		]
	},
	{
		name: 'Pike',
		record: 749,
		strata: ['Top', 'Middle', 'Bottom'],
		description: '',
		preferences: { flow: 0.2, clarity: 0.6, substrate: 0.6, vegetation: 0.9, shelter: 0.8 },
		tolerances: {},
		classifications: [
			{ label: 'Jack', maxOz: 80, preferredBaits: [] },
			{ label: '', maxOz: 374, preferredBaits: [] },
			{ label: 'Specimen', maxOz: 561, preferredBaits: [] },
			{ label: 'Monster', maxOz: Infinity, preferredBaits: [] }
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
