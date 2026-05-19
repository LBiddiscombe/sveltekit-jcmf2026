/**
 * Environmental feature ratings (0-1 scale)
 * Used to describe water conditions and habitat characteristics
 */
export interface EnvironmentalFeatures {
	flow: number;
	clarity: number;
	substrate: number;
	vegetation: number;
	shelter: number;
}

/**
 * Individual fishing peg/swim within a lake
 */
export interface Peg {
	name: string;
	description: string;
	features: EnvironmentalFeatures;
	image?: string;
}

/**
 * Lake with fishing pegs and fish species
 */
export interface Lake {
	name: string;
	image?: string;
	fishCount: number;
	species: string[];
	pegs: Peg[];
}

/**
 * Fishing venue containing multiple lakes
 */
export interface Venue {
	name: string;
	image: string;
	lakes: Lake[];
}

/**
 * Fish size classification with associated baits
 */
export interface FishClassification {
	label: string;
	maxOz: number;
	preferredBaits: string[];
}

/**
 * Fish species with characteristics and fishing information
 */
export interface Species {
	name: string;
	record: number;
	frequency: number;
	strata: string[];
	description: string;
	preferences: EnvironmentalFeatures;
	classifications: FishClassification[];
}

/**
 * Bait type with weight range
 */
export interface Bait {
	name: string;
	minOz: number;
	maxOz: number;
}

/**
 * Fishing rod type
 */
export interface Rod {
	name: string;
	deter: number;
}

/**
 * Fishing reel type
 */
export interface Reel {
	name: string;
	deter: number;
}

/**
 * Fishing line specification
 */
export interface Line {
	name: string;
	size: number;
	minOz: number;
	maxOz: number;
	deter: number;
}

/**
 * Fishing hook specification
 */
export interface Hook {
	name: string;
	size: number;
	minOz: number;
	maxOz: number;
	deter: number;
}
