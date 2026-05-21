import type { EnvironmentalFeatures, Species, TackleSelection } from '$lib/data';
import type { FishData } from './population';
import { fishMatchScore } from './population';

export interface CaughtFish {
	species: string;
	classificationLabel: string;
	weightOz: number;
}

export type FishingPhase =
	| 'idle'
	| 'waiting'
	| 'bite'
	| 'striking'
	| 'reeling'
	| 'netting'
	| 'caught'
	| 'lost'
	| 'finished';

export type FishingEvent =
	| { type: 'bite' }
	| { type: 'fishCaught'; species: string; classificationLabel: string; weightOz: number }
	| { type: 'fishLost' }
	| { type: 'blankCast' };

export class FishingLoop {
	phase: FishingPhase = 'idle';
	currentFish: FishData | null = null;
	remainingMs = 0;
	caughtFish: CaughtFish[] = [];

	private speciesMap: Map<string, Species>;

	constructor(
		private tackle: TackleSelection,
		private skill: number,
		private pegFeatures: EnvironmentalFeatures,
		speciesList: Species[],
		private rng: () => number = Math.random
	) {
		this.speciesMap = new Map(speciesList.map((s) => [s.name, s]));
	}

	updateTackle(tackle: TackleSelection): void {
		this.tackle = tackle;
	}

	private selectFish(population: FishData[]): FishData | null {
		const candidates = population.filter((fish) => {
			if (fish.strata !== this.tackle.strata) return false;
			if (fish.castStrength !== this.tackle.castStrength) return false;
			return fish.preferredBait === this.tackle.bait.name;
		});

		if (candidates.length === 0) return null;
		return candidates[Math.floor(this.rng() * candidates.length)];
	}

	private calcBiteTime(fish: FishData): number {
		const species = this.speciesMap.get(fish.species);
		if (!species) return 5000;
		const match = fishMatchScore(species, this.pegFeatures);
		const base = 2000 + this.rng() * 5000;
		const matchFactor = 2 - match;
		const deterTotal =
			this.tackle.rod.deter +
			this.tackle.reel.deter +
			this.tackle.line.deter +
			this.tackle.hook.deter;
		const deterFactor = 1 + deterTotal;
		return Math.floor(base * matchFactor * deterFactor);
	}

	cast(population: FishData[], _removeFn: (id: string) => void): FishingEvent | null {
		const fish = this.selectFish(population);
		this.currentFish = fish;
		this.phase = 'waiting';

		if (!fish) {
			return { type: 'blankCast' };
		}

		this.remainingMs = this.calcBiteTime(fish);
		return null;
	}

	tick(elapsedMs: number): FishingEvent | null {
		if (this.phase !== 'waiting' || !this.currentFish) return null;

		this.remainingMs -= elapsedMs;

		if (this.remainingMs <= 0) {
			this.phase = 'bite';
			return { type: 'bite' };
		}

		return null;
	}

	recast(): void {
		this.phase = 'idle';
		this.currentFish = null;
		this.remainingMs = 0;
	}

	strike(): FishingEvent | null {
		if (this.phase !== 'bite' || !this.currentFish) return null;

		this.phase = 'striking';

		const success = this.rng() < 0.5 + this.skill * 0.05;
		if (!success) {
			this.phase = 'lost';
			return { type: 'fishLost' };
		}

		this.phase = 'reeling';
		return null;
	}

	reel(): FishingEvent | null {
		if (this.phase !== 'reeling' || !this.currentFish) return null;

		const capacity = this.tackle.line.maxOz;
		const success = this.currentFish.weightOz <= capacity || this.rng() < 0.3;
		if (!success) {
			this.phase = 'lost';
			return { type: 'fishLost' };
		}

		this.phase = 'netting';
		return null;
	}

	net(): FishingEvent | null {
		if (this.phase !== 'netting' || !this.currentFish) return null;

		const fish = this.currentFish;
		this.caughtFish.push({
			species: fish.species,
			classificationLabel: fish.classificationLabel,
			weightOz: fish.weightOz
		});
		this.phase = 'caught';
		return {
			type: 'fishCaught',
			species: fish.species,
			classificationLabel: fish.classificationLabel,
			weightOz: fish.weightOz
		};
	}

	returnToCast(): void {
		this.phase = 'idle';
		this.currentFish = null;
		this.remainingMs = 0;
	}
}
