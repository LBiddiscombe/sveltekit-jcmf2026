import type { EnvironmentalFeatures, Species } from '$lib/data';

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
