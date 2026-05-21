import type { Species, TackleSelection } from '$lib/data';
import type { FishData } from './population';

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

	private static readonly SPECIES_CAUTION: Record<string, number> = {
		Dace: 2000,
		Roach: 3000,
		Rudd: 3000,
		Perch: 4000,
		Grayling: 4000,
		Bream: 5000,
		Crucian: 5000,
		Chub: 6000,
		Barbel: 7000,
		Eel: 8000,
		Pike: 9000,
		Tench: 10000,
		Carp: 12000
	};

	private static readonly SIZE_MAX = [2000, 5000, 10000, 16000];

	private calcBiteTime(fish: FishData): number {
		const species = this.speciesMap.get(fish.species);
		if (!species) return 5000;
		const base = 2000 + this.rng() * 5000;
		const deterTotal =
			this.tackle.rod.deter +
			this.tackle.reel.deter +
			this.tackle.line.deter +
			this.tackle.hook.deter;
		const deterMax = deterTotal * 50_000;
		const speciesMax = FishingLoop.SPECIES_CAUTION[species.name] ?? 5000;
		const tierIndex = Math.min(fish.tierIndex, FishingLoop.SIZE_MAX.length - 1);
		const sizeMax = FishingLoop.SIZE_MAX[tierIndex];
		return Math.floor(base + this.rng() * (deterMax + speciesMax + sizeMax));
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
