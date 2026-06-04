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
 * Species abundance within a lake
 */
export interface LakeSpecies {
	name: string;
	frequency: number;
}

/**
 * Lake with fishing pegs and fish species
 */
export interface Lake {
	name: string;
	image?: string;
	fishCount: number;
	species: LakeSpecies[];
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
	id: string;
	label: string;
	maxOz: number;
	biteSizeExtraMs: number;
	preferredBaits: string[];
}

/**
 * Tolerance range for a single environmental dimension.
 * If a peg's value falls outside [min, max], the species is excluded.
 * Not all dimensions need tolerances — omitted dimensions are never a dealbreaker.
 */
export interface EnvironmentalTolerance {
	min: number;
	max: number;
}

export interface EnvironmentalTolerances {
	flow?: EnvironmentalTolerance;
	clarity?: EnvironmentalTolerance;
	substrate?: EnvironmentalTolerance;
	vegetation?: EnvironmentalTolerance;
	shelter?: EnvironmentalTolerance;
}

/**
 * Fish species with characteristics and fishing information
 */
export interface Species {
	name: string;
	cautionMs: number;
	record: number;
	strata: string[];
	description: string;
	preferences: EnvironmentalFeatures;
	tolerances: EnvironmentalTolerances;
	pattern: number[];
	classifications: FishClassification[];
}

/**
 * Bait type with weight range
 */
export interface Bait {
	name: string;
	image: string;
	minOz: number;
	maxOz: number;
}

/**
 * Fishing rod type
 *
 * Rods define their own constraints on what tackle and tactics can be paired with them.
 * - `allowedCastStrengths`: which cast distances this rod can fish (e.g. Pole cannot cast Long)
 * - `allowedStrata`: which water layers this rod can fish (e.g. Leger is Bottom-only)
 * - `maxLineLb`: maximum line breaking strain this rod supports (e.g. Pole max 6lb)
 * - `requiresReel`: whether the rod needs a real reel (Pole uses "n/a")
 */
export interface Rod {
	name: string;
	image: string;
	deter: number;
	rodMultiplier: number;
	allowedCastStrengths: string[];
	allowedStrata: string[];
	maxLineLb: number;
	requiresReel: boolean;
}

/**
 * Fishing reel type
 */
export interface Reel {
	name: string;
	image: string;
	deter: number;
}

/**
 * Fishing line specification
 */
export interface Line {
	name: string;
	image: string;
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
	image: string;
	size: number;
	minOz: number;
	maxOz: number;
	deter: number;
}

export interface TackleSelection {
	rod: Rod;
	reel: Reel;
	line: Line;
	hook: Hook;
	bait: Bait;
	strata: string;
	castStrength: string;
}

export interface TacklePreset {
	name: string;
	targetSpecies?: string;
	rod: string;
	reel: string;
	line: string;
	hook: string;
	bait: string;
	strata: string;
	castStrength: string;
}

export interface CaughtFish {
	species: string;
	classificationLabel: string;
	weightOz: number;
	caughtAtMs: number;
}
