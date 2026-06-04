import type { Lake, Peg, Species } from '$lib/data';
import { passesTolerances, fishMatchScore, weightedSelectIndex } from './env-utils';

export interface FishData {
	id: string;
	species: string;
	strata: string;
	classificationLabel: string;
	tierIndex: number;
	weightOz: number;
	castStrength: string;
	preferredBait: string;
	pattern: number[];
	stepMs: number;
}

const TIER_WEIGHTS = [0.6, 0.28, 0.1, 0.02];
const CAST_STRENGTHS = ['Short', 'Medium', 'Long'];

const STEP_MS_RANGES: [number, number][] = [
	[100, 200],
	[200, 500],
	[300, 800],
	[400, 1000]
];

const MAX_RECORD = 1089;

function calcStepMs(tierIndex: number, record: number): number {
	const [min, max] = STEP_MS_RANGES[tierIndex];
	return Math.round(min + (record / MAX_RECORD) * (max - min));
}

let nextId = 0;

function generateId(): string {
	return `fish-${nextId++}`;
}

export function resetIds() {
	nextId = 0;
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

export function reassignDynamicProperties(
	population: FishData[],
	speciesList: Species[],
	rng: () => number = Math.random
): void {
	const speciesMap = new Map(speciesList.map((s) => [s.name, s]));
	for (const fish of population) {
		const species = speciesMap.get(fish.species);
		if (!species) continue;
		const classification = species.classifications[fish.tierIndex];
		if (!classification) continue;

		fish.strata = species.strata[Math.floor(rng() * species.strata.length)];
		fish.castStrength = CAST_STRENGTHS[Math.floor(rng() * CAST_STRENGTHS.length)];
		fish.preferredBait =
			classification.preferredBaits.length > 0
				? classification.preferredBaits[Math.floor(rng() * classification.preferredBaits.length)]
				: '';
	}
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
		if (!passesTolerances(species, peg.features)) return 0;
		return ls.frequency * fishMatchScore(species, peg.features);
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

		const { min, max } = tierWeightBounds(tierIdx, species.classifications, species.record * 1.05);
		const weightOz = Math.round(randomInRange(min, max, rng));

		fish.push({
			id: generateId(),
			species: species.name,
			strata: '',
			classificationLabel: classification.label,
			tierIndex: tierIdx,
			weightOz,
			castStrength: '',
			preferredBait: '',
			pattern: species.pattern,
			stepMs: calcStepMs(tierIdx, species.record)
		});
	}

	reassignDynamicProperties(fish, speciesList, rng);
	return fish;
}
