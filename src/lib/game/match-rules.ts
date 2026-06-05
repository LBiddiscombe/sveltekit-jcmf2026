import type { CaughtFish } from '$lib/data';

export type Aggregate = 'sum' | 'max' | 'count';

export interface WinCondition {
	readonly name: string;
	readonly aggregate: Aggregate;
	scoreFish(fish: CaughtFish): number;
}

export type SpeciesFilterKind = 'all' | 'silverfish' | 'predators' | 'carps' | 'bottom-dwellers';

export interface SpeciesFilter {
	kind: SpeciesFilterKind;
}

export interface MatchRules {
	timeLimitMinutes: number;
	winConditionKey: string;
	speciesFilterKind: SpeciesFilterKind;
}

export const SPECIES_GROUPS: Record<string, string[]> = {
	silverfish: ['Roach', 'Rudd', 'Dace', 'Grayling'],
	predators: ['Perch', 'Pike', 'Eel'],
	carps: ['Carp', 'Crucian', 'Chub'],
	'bottom-dwellers': ['Barbel', 'Bream', 'Tench']
};

export function speciesFilterAccepts(filter: SpeciesFilterKind, species: string): boolean {
	if (filter === 'all') return true;
	return SPECIES_GROUPS[filter]?.includes(species) ?? false;
}

const WIN_CONDITIONS: Record<string, WinCondition> = {
	weight: {
		name: 'Weight',
		aggregate: 'sum',
		scoreFish: (f) => f.weightOz
	},
	count: {
		name: 'Count',
		aggregate: 'sum',
		scoreFish: () => 1
	},
	biggest: {
		name: 'Biggest',
		aggregate: 'max',
		scoreFish: (f) => f.weightOz
	}
};

export function resolveWinCondition(key: string): WinCondition {
	const wc = WIN_CONDITIONS[key];
	if (!wc) throw new Error(`Unknown win condition: ${key}`);
	return wc;
}

export function defaultMatchRules(overrides?: Partial<MatchRules>): MatchRules {
	return {
		timeLimitMinutes: 5,
		winConditionKey: 'weight',
		speciesFilterKind: 'all',
		...overrides
	};
}
