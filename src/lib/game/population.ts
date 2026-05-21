import type { Lake, Peg, Species } from '$lib/data';

export interface FishData {
	id: string;
	species: string;
	classificationLabel: string;
	weightOz: number;
}

const TIER_WEIGHTS = [0.5, 0.3, 0.15, 0.05];

let nextId = 0;

function generateId(): string {
	return `fish-${nextId++}`;
}

export function resetIds() {
	nextId = 0;
}

export function fishMatchScore(species: Species, peg: Peg): number {
	const p = species.preferences;
	const f = peg.features;
	const diffs =
		(Math.abs(p.flow - f.flow) +
			Math.abs(p.clarity - f.clarity) +
			Math.abs(p.substrate - f.substrate) +
			Math.abs(p.vegetation - f.vegetation) +
			Math.abs(p.shelter - f.shelter)) /
		5;
	return 1 - diffs;
}

export function weightedSelectIndex(weights: number[], rng: () => number): number {
	const total = weights.reduce((a, b) => a + b, 0);
	if (total <= 0) return -1;
	let roll = rng() * total;
	for (let i = 0; i < weights.length; i++) {
		roll -= weights[i];
		if (roll <= 0) return i;
	}
	return weights.length - 1;
}

function randomInRange(min: number, max: number, rng: () => number): number {
	return min + rng() * (max - min);
}

function tierWeightBounds(
	tierIndex: number,
	classifications: Species['classifications'],
	record: number
): { min: number; max: number } {
	const prevMax = tierIndex > 0 ? classifications[tierIndex - 1].maxOz : 0;
	const tierMax = classifications[tierIndex].maxOz;
	const min = Math.max(1, prevMax + 1);
	const max = tierMax === Infinity ? record : Math.min(tierMax, record);
	return { min: Math.min(min, max), max };
}

export function populatePeg(
	lake: Lake,
	peg: Peg,
	speciesList: Species[],
	count: number,
	rng: () => number = Math.random
): FishData[] {
	const fish: FishData[] = [];
	const speciesMap = new Map(speciesList.map((s) => [s.name, s]));

	const adjustedWeights = lake.species.map((ls) => {
		const species = speciesMap.get(ls.name);
		if (!species) return 0;
		return ls.frequency * fishMatchScore(species, peg);
	});

	for (let i = 0; i < count; i++) {
		const speciesIdx = weightedSelectIndex(adjustedWeights, rng);
		if (speciesIdx === -1) continue;

		const ls = lake.species[speciesIdx];
		const species = speciesMap.get(ls.name);
		if (!species) continue;

		const tierIdx = weightedSelectIndex(TIER_WEIGHTS, rng);
		const classification = species.classifications[tierIdx];
		if (!classification) continue;

		const { min, max } = tierWeightBounds(tierIdx, species.classifications, species.record);
		const weightOz = Math.round(randomInRange(min, max, rng));

		fish.push({
			id: generateId(),
			species: species.name,
			classificationLabel: classification.label,
			weightOz
		});
	}

	return fish;
}
