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
	| { type: 'biteExpired' }
	| { type: 'fishCaught'; species: string; classificationLabel: string; weightOz: number }
	| { type: 'fishLost' }
	| { type: 'hookBroken' }
	| { type: 'blankCast' };

const PLAYER_RECAST_DELAY_CAUGHT = 2500;
const PLAYER_RECAST_DELAY_LOST = 2500;

export class FishingLoop {
	phase: FishingPhase = 'idle';
	currentFish: FishData | null = null;
	remainingMs = 0;
	caughtFish: CaughtFish[] = [];
	biteWindowRemaining = 0;
	biteWindowTotal = 0;

	private speciesMap: Map<string, Species>;
	private population: FishData[] = [];
	private removeFn: (id: string) => void = () => {};
	private recastCountdown = 0;
	private lastComputedBiteTime = 0;
	private blankPatienceMs = 0;
	private blankMessageTimer = 0;
	private blankCastEmitted = false;
	private redistributeFn: (() => void) | undefined;

	private static readonly BLANK_PATIENCE_DELAY = 30000;
	private static readonly BLANK_MESSAGE_DURATION = 3000;

	constructor(
		private tackle: TackleSelection,
		private skill: number,
		speciesList: Species[],
		private isBot: boolean,
		private rng: () => number = Math.random,
		redistributeFn?: () => void
	) {
		this.redistributeFn = redistributeFn;
		this.speciesMap = new Map(speciesList.map((s) => [s.name, s]));
	}

	get isBlankCasting(): boolean {
		return this.phase === 'waiting' && this.currentFish === null;
	}

	get isBlankCastMessageActive(): boolean {
		return this.blankMessageTimer > 0;
	}

	updateTackle(tackle: TackleSelection): void {
		this.tackle = tackle;
	}

	private calcBiteWindow(biteTime: number): number {
		return Math.max(1000, Math.min(5000, Math.floor(biteTime * 0.3)));
	}

	private selectFish(population: FishData[]): FishData | null {
		const candidates = population.filter((fish) => {
			if (fish.strata !== this.tackle.strata) return false;
			if (fish.castStrength !== this.tackle.castStrength) return false;
			if (fish.preferredBait !== this.tackle.bait.name) return false;
			if (fish.weightOz < this.tackle.bait.minOz || fish.weightOz > this.tackle.bait.maxOz)
				return false;
			if (fish.weightOz < this.tackle.line.minOz) return false;
			if (fish.weightOz < this.tackle.hook.minOz) return false;
			return true;
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

	cast(population: FishData[], removeFn: (id: string) => void): FishingEvent | null {
		this.population = population;
		this.removeFn = removeFn;

		const fish = this.selectFish(population);
		this.currentFish = fish;
		this.phase = 'waiting';
		this.biteWindowRemaining = 0;
		this.biteWindowTotal = 0;
		this.lastComputedBiteTime = 0;

		if (!fish) {
			this.blankPatienceMs = 0;
			this.blankMessageTimer = 0;
			this.blankCastEmitted = false;
			return null;
		}

		this.remainingMs = this.calcBiteTime(fish);
		this.lastComputedBiteTime = this.remainingMs;
		this.recastCountdown = 0;
		return null;
	}

	private autocast(): FishingEvent | null {
		return this.cast(this.population, this.removeFn);
	}

	tick(elapsedMs: number): FishingEvent | null {
		if (!this.currentFish && this.phase !== 'waiting') return null;

		if (this.phase === 'waiting') {
			if (!this.currentFish) {
				this.blankPatienceMs += elapsedMs;

				if (this.blankPatienceMs >= FishingLoop.BLANK_PATIENCE_DELAY && !this.blankCastEmitted) {
					this.blankCastEmitted = true;
					this.blankMessageTimer = FishingLoop.BLANK_MESSAGE_DURATION;
					return { type: 'blankCast' };
				}

				if (this.blankMessageTimer > 0) {
					this.blankMessageTimer -= elapsedMs;
				}

				if (this.blankCastEmitted && this.blankMessageTimer <= 0) {
					this.blankPatienceMs = 0;
					this.blankCastEmitted = false;
					this.redistributeFn?.();
					const fish = this.selectFish(this.population);
					if (fish) {
						this.currentFish = fish;
						this.remainingMs = this.calcBiteTime(fish);
						this.lastComputedBiteTime = this.remainingMs;
					}
				}

				return null;
			}

			if (this.recastCountdown > 0) {
				this.recastCountdown -= elapsedMs;
				if (this.recastCountdown <= 0) {
					return this.autocast();
				}
				return null;
			}

			this.remainingMs -= elapsedMs;
			if (this.remainingMs <= 0) {
				this.phase = 'bite';
				this.biteWindowTotal = this.calcBiteWindow(this.lastComputedBiteTime);
				this.biteWindowRemaining = this.biteWindowTotal;
				return { type: 'bite' };
			}
			return null;
		}

		if (this.phase === 'bite') {
			if (this.isBot) {
				return this.strike();
			}
			this.biteWindowRemaining -= elapsedMs;
			if (this.biteWindowRemaining <= 0) {
				this.phase = 'lost';
				this.biteWindowRemaining = 0;
				this.recastCountdown = PLAYER_RECAST_DELAY_LOST;
				return { type: 'biteExpired' };
			}
			return null;
		}

		if (this.phase === 'caught' || this.phase === 'lost') {
			if (this.recastCountdown > 0) {
				this.recastCountdown -= elapsedMs;
				if (this.recastCountdown <= 0) {
					return this.autocast();
				}
			}
			return null;
		}

		return null;
	}

	resetCast(): void {
		this.phase = 'idle';
		this.currentFish = null;
		this.remainingMs = 0;
		this.biteWindowRemaining = 0;
		this.biteWindowTotal = 0;
		this.recastCountdown = 0;
		this.blankPatienceMs = 0;
		this.blankMessageTimer = 0;
		this.blankCastEmitted = false;
	}

	strike(): FishingEvent | null {
		if (this.phase !== 'bite' || !this.currentFish) return null;

		this.phase = 'striking';

		const fish = this.currentFish;

		if (fish.weightOz > this.tackle.hook.maxOz) {
			this.phase = 'lost';
			this.biteWindowRemaining = 0;
			this.biteWindowTotal = 0;
			this.recastCountdown = this.isBot ? 0 : PLAYER_RECAST_DELAY_LOST;
			return { type: 'hookBroken' };
		}

		if (fish.weightOz < this.tackle.hook.minOz) {
			this.phase = 'lost';
			this.biteWindowRemaining = 0;
			this.biteWindowTotal = 0;
			this.recastCountdown = this.isBot ? 0 : PLAYER_RECAST_DELAY_LOST;
			return { type: 'fishLost' };
		}

		if (this.isBot) {
			const success = this.rng() < 0.5 + this.skill * 0.05;
			if (!success) {
				this.phase = 'lost';
				this.biteWindowRemaining = 0;
				this.biteWindowTotal = 0;
				this.recastCountdown = 0;
				return { type: 'fishLost' };
			}
		}

		this.biteWindowRemaining = 0;
		this.biteWindowTotal = 0;
		this.phase = 'reeling';
		return null;
	}

	reel(): FishingEvent | null {
		if (this.phase !== 'reeling' || !this.currentFish) return null;

		const capacity = this.tackle.line.maxOz;
		const success = this.currentFish.weightOz <= capacity || this.rng() < 0.3;
		if (!success) {
			this.phase = 'lost';
			this.recastCountdown = this.isBot ? 0 : PLAYER_RECAST_DELAY_LOST;
			return { type: 'fishLost' };
		}

		this.phase = 'netting';
		return null;
	}

	net(): FishingEvent | null {
		if (this.phase !== 'netting' || !this.currentFish) return null;

		const fish = this.currentFish;
		this.removeFn(fish.id);
		this.population = this.population.filter((f) => f.id !== fish.id);
		this.caughtFish.push({
			species: fish.species,
			classificationLabel: fish.classificationLabel,
			weightOz: fish.weightOz
		});
		this.phase = 'caught';
		this.recastCountdown = this.isBot ? 0 : PLAYER_RECAST_DELAY_CAUGHT;
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
		this.biteWindowRemaining = 0;
		this.biteWindowTotal = 0;
		this.blankPatienceMs = 0;
		this.blankMessageTimer = 0;
		this.blankCastEmitted = false;
	}
}
