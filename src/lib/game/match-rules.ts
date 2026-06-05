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

export interface SpeciesGroupProfile {
	species: string[];
	fallbackPresetNames: string[];
	forcedStrata?: string;
}

const SPECIES_GROUP_PROFILES: Record<Exclude<SpeciesFilterKind, 'all'>, SpeciesGroupProfile> = {
	silverfish: {
		species: ['Roach', 'Rudd', 'Dace', 'Grayling'],
		fallbackPresetNames: ['Tiddler Basher', 'Light', 'Medium']
	},
	predators: {
		species: ['Perch', 'Pike', 'Eel'],
		fallbackPresetNames: ['Predator']
	},
	carps: {
		species: ['Carp', 'Crucian', 'Chub'],
		fallbackPresetNames: ['Light', 'Medium', 'Heavy']
	},
	'bottom-dwellers': {
		species: ['Barbel', 'Bream', 'Tench'],
		fallbackPresetNames: ['Light', 'Medium', 'Heavy'],
		forcedStrata: 'Bottom'
	}
};

export function speciesFilterAccepts(filter: SpeciesFilterKind, species: string): boolean {
	if (filter === 'all') return true;
	const profile = SPECIES_GROUP_PROFILES[filter];
	return profile ? profile.species.includes(species) : false;
}

export function resolveSpeciesGroup(kind: SpeciesFilterKind): SpeciesGroupProfile | null {
	if (kind === 'all') return null;
	return SPECIES_GROUP_PROFILES[kind] ?? null;
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
