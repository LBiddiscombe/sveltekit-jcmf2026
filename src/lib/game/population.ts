import type { EnvironmentalFeatures, Lake, Peg, Species } from '$lib/data';

export function passesTolerances(species: Species, features: EnvironmentalFeatures): boolean {
	const t = species.tolerances;
	const f = features;
	if (t.flow !== undefined && (f.flow < t.flow.min || f.flow > t.flow.max)) return false;
	if (t.clarity !== undefined && (f.clarity < t.clarity.min || f.clarity > t.clarity.max))
		return false;
	if (t.substrate !== undefined && (f.substrate < t.substrate.min || f.substrate > t.substrate.max))
		return false;
	if (
		t.vegetation !== undefined &&
		(f.vegetation < t.vegetation.min || f.vegetation > t.vegetation.max)
	)
		return false;
	if (t.shelter !== undefined && (f.shelter < t.shelter.min || f.shelter > t.shelter.max))
		return false;
	return true;
}

export interface FishData {
	id: string;
	species: string;
	strata: string;
	classificationLabel: string;
	tierIndex: number;
	weightOz: number;
	castStrength: string;
	preferredBait: string;
}

const TIER_WEIGHTS = [0.6, 0.28, 0.1, 0.02];
const CAST_STRENGTHS = ['Short', 'Medium', 'Long'];

let nextId = 0;

function generateId(): string {
	return `fish-${nextId++}`;
}

export function resetIds() {
	nextId = 0;
}

export function fishMatchScore(species: Species, features: EnvironmentalFeatures): number {
	const p = species.preferences;
	const f = features;
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
			strata: species.strata[Math.floor(rng() * species.strata.length)],
			classificationLabel: classification.label,
			tierIndex: tierIdx,
			weightOz,
			castStrength: CAST_STRENGTHS[Math.floor(rng() * CAST_STRENGTHS.length)],
			preferredBait:
				classification.preferredBaits.length > 0
					? classification.preferredBaits[Math.floor(rng() * classification.preferredBaits.length)]
					: ''
		});
	}

	return fish;
}
