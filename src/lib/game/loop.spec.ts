import { describe, it, expect } from 'vitest';
import { FishingLoop } from './loop';
import type { FishData } from './population';
import type { Species, TackleSelection } from '$lib/data';

const roach: Species = {
	name: 'Roach',
	record: 68,
	strata: ['Top', 'Middle', 'Bottom'],
	description: '',
	preferences: { flow: 0.3, clarity: 0.5, substrate: 0.7, vegetation: 0.6, shelter: 0.5 },
	tolerances: {},
	classifications: [
		{ label: 'Small', maxOz: 8, preferredBaits: ['maggot', 'caster'] },
		{ label: '', maxOz: 34, preferredBaits: ['maggot', 'caster', 'worm'] },
		{ label: 'Specimen', maxOz: 51, preferredBaits: ['worm', 'bread'] },
		{ label: 'Monster', maxOz: Infinity, preferredBaits: ['worm', 'bread'] }
	]
};

const carp: Species = {
	name: 'Carp',
	record: 1089,
	strata: ['Bottom'],
	description: '',
	preferences: { flow: 0.2, clarity: 0.4, substrate: 0.9, vegetation: 0.6, shelter: 0.5 },
	tolerances: {},
	classifications: [
		{ label: 'Small', maxOz: 64, preferredBaits: ['pellet', 'sweetcorn'] },
		{ label: '', maxOz: 544, preferredBaits: ['pellet', 'sweetcorn'] },
		{ label: 'Specimen', maxOz: 816, preferredBaits: ['boilie'] },
		{ label: 'Monster', maxOz: Infinity, preferredBaits: ['boilie'] }
	]
};

const speciesList = [roach, carp];

const tackle: TackleSelection = {
	rod: { name: 'Float', image: 'rod-float.png', deter: 0.1 },
	reel: { name: 'Fixed Spool', image: 'reel-fixed-spool.png', deter: 0.2 },
	line: { name: '4 lb', image: 'line.png', size: 64, minOz: 3, maxOz: 160, deter: 0.15 },
	hook: { name: '16', image: 'hook.png', size: 16, minOz: 10, maxOz: 200, deter: 0.15 },
	bait: { name: 'maggot', image: 'maggot.png', minOz: 1, maxOz: 512 },
	strata: 'Bottom',
	castStrength: 'Medium'
};

const baitMismatchTackle: TackleSelection = {
	...tackle,
	bait: { name: 'boilie', image: 'boilie.png', minOz: 8, maxOz: Infinity }
};

const smallRoach: FishData = {
	id: 'fish-1',
	species: 'Roach',
	strata: 'Bottom',
	classificationLabel: 'Small',
	tierIndex: 0,
	weightOz: 12,
	castStrength: 'Medium',
	preferredBait: 'maggot'
};

const monsterRoach: FishData = {
	id: 'fish-2',
	species: 'Roach',
	strata: 'Bottom',
	classificationLabel: 'Monster',
	tierIndex: 3,
	weightOz: 60,
	castStrength: 'Medium',
	preferredBait: 'maggot'
};

const smallCarp: FishData = {
	id: 'fish-3',
	species: 'Carp',
	strata: 'Bottom',
	classificationLabel: 'Small',
	tierIndex: 0,
	weightOz: 32,
	castStrength: 'Medium',
	preferredBait: 'pellet'
};

const mediumRoach: FishData = {
	id: 'fish-4',
	species: 'Roach',
	strata: 'Bottom',
	classificationLabel: '',
	tierIndex: 1,
	weightOz: 20,
	castStrength: 'Medium',
	preferredBait: 'maggot'
};

const population: FishData[] = [smallRoach, monsterRoach, smallCarp, mediumRoach];

function noopRemove(_id: string) {
	/* no-op */
}

describe('FishingLoop', () => {
	describe('cast — fish selection', () => {
		it('selects a fish matching bait, strata, and weight gates', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, false, () => 0.1);
			const event = loop.cast(population, noopRemove);
			expect(event).toBeNull();
			expect(loop.phase).toBe('waiting');
			expect(loop.currentFish).not.toBeNull();
			expect(loop.currentFish!.species).toBe('Roach');
		});

		it('returns blankCast when no fish matches bait', () => {
			const loop = new FishingLoop(baitMismatchTackle, 5, speciesList, false, () => 0.1);
			const event = loop.cast(population, noopRemove);
			expect(event).toEqual({ type: 'blankCast' });
			expect(loop.phase).toBe('waiting');
			expect(loop.currentFish).toBeNull();
		});

		it('returns blankCast when no fish matches strata', () => {
			const loop = new FishingLoop(
				{ ...tackle, strata: 'Surface' },
				5,
				speciesList,
				false,
				() => 0.1
			);
			const event = loop.cast(population, noopRemove);
			expect(event).toEqual({ type: 'blankCast' });
		});

		it('returns blankCast when fish is outside bait minOz/maxOz (BaitRangeGate)', () => {
			const smallBaitTackle: TackleSelection = {
				...tackle,
				bait: { name: 'maggot', image: 'maggot.png', minOz: 100, maxOz: 200 }
			};
			const loop = new FishingLoop(smallBaitTackle, 5, speciesList, false, () => 0.1);
			const event = loop.cast(population, noopRemove);
			expect(event).toEqual({ type: 'blankCast' });
		});

		it('returns blankCast when fish is below line minOz (LineShyGate)', () => {
			const heavyLineTackle: TackleSelection = {
				...tackle,
				line: { name: '15 lb', image: 'line.png', size: 240, minOz: 100, maxOz: 1100, deter: 0.5 }
			};
			const loop = new FishingLoop(heavyLineTackle, 5, speciesList, false, () => 0.1);
			const event = loop.cast(population, noopRemove);
			expect(event).toEqual({ type: 'blankCast' });
		});

		it('uses RNG to pick among candidates', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, false, () => 0.99);
			const event = loop.cast(population, noopRemove);
			expect(event).toBeNull();
			expect(loop.currentFish!.id).toBe('fish-4');
		});
	});

	describe('tick', () => {
		it('advances remaining time', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, false, () => 0);
			loop.cast(population, noopRemove);

			const beforeMs = loop.remainingMs;
			loop.tick(100);
			expect(loop.remainingMs).toBe(beforeMs - 100);
		});

		it('triggers bite when timer expires and starts bite window', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, false, () => 0);
			loop.cast(population, noopRemove);

			const event = loop.tick(loop.remainingMs);
			expect(event).toEqual({ type: 'bite' });
			expect(loop.phase).toBe('bite');
			expect(loop.biteWindowTotal).toBeGreaterThan(0);
			expect(loop.biteWindowRemaining).toBe(loop.biteWindowTotal);
		});

		it('emits biteExpired when bite window expires', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, false, () => 0);
			loop.cast(population, noopRemove);
			loop.tick(loop.remainingMs);
			expect(loop.phase).toBe('bite');

			const event = loop.tick(loop.biteWindowRemaining + 10);
			expect(event).toEqual({ type: 'biteExpired' });
			expect(loop.phase).toBe('lost');
		});

		it('auto-recasts after blankCast delay', () => {
			const loop = new FishingLoop(baitMismatchTackle, 5, speciesList, false, () => 0);
			loop.cast(population, noopRemove);
			expect(loop.phase).toBe('waiting');

			const event = loop.tick(1999);
			expect(event).toBeNull();
			expect(loop.phase).toBe('waiting');

			const nextEvent = loop.tick(1);
			expect(nextEvent).toEqual({ type: 'blankCast' });
			expect(loop.phase).toBe('waiting');
		});
	});

	describe('recast', () => {
		it('resets to idle', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, false, () => 0);
			loop.cast(population, noopRemove);
			loop.recast();
			expect(loop.phase).toBe('idle');
			expect(loop.currentFish).toBeNull();
			expect(loop.remainingMs).toBe(0);
			expect(loop.biteWindowRemaining).toBe(0);
			expect(loop.biteWindowTotal).toBe(0);
		});
	});

	describe('strike', () => {
		it('player succeeds without skill roll (HookRangeCheck passes)', () => {
			const loop = new FishingLoop(tackle, 0, speciesList, false, () => 0.3);
			loop.cast(population, noopRemove);
			loop.tick(loop.remainingMs);
			expect(loop.phase).toBe('bite');

			const event = loop.strike();
			expect(event).toBeNull();
			expect(loop.phase).toBe('reeling');
		});

		it('returns hookBroken when fish exceeds hook maxOz', () => {
			const smallHookTackle: TackleSelection = {
				...tackle,
				hook: { name: '22', image: 'hook.png', size: 22, minOz: 1, maxOz: 50, deter: 0 }
			};
			const loop = new FishingLoop(smallHookTackle, 5, speciesList, false, () => 0.4);
			loop.cast(population, noopRemove);
			loop.tick(loop.remainingMs);
			expect(loop.phase).toBe('bite');

			const event = loop.strike();
			expect(event).toEqual({ type: 'hookBroken' });
			expect(loop.phase).toBe('lost');
		});

		it('returns fishLost when fish is below hook minOz', () => {
			const bigHookTackle: TackleSelection = {
				...tackle,
				hook: { name: '2', image: 'hook.png', size: 2, minOz: 100, maxOz: 1100, deter: 0.5 }
			};
			const loop = new FishingLoop(bigHookTackle, 5, speciesList, false, () => 0.1);
			loop.cast(population, noopRemove);
			loop.tick(loop.remainingMs);
			expect(loop.phase).toBe('bite');

			const event = loop.strike();
			expect(event).toEqual({ type: 'fishLost' });
			expect(loop.phase).toBe('lost');
		});

		it('bot strike fails on unfavourable RNG (skill roll)', () => {
			const loop = new FishingLoop(tackle, 0, speciesList, true, () => 0.6);
			loop.cast(population, noopRemove);
			loop.tick(loop.remainingMs);

			const event = loop.strike();
			expect(event).toEqual({ type: 'fishLost' });
			expect(loop.phase).toBe('lost');
		});

		it('bot strike succeeds on favourable RNG', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, true, () => 0.3);
			loop.cast(population, noopRemove);
			loop.tick(loop.remainingMs);

			const event = loop.strike();
			expect(event).toBeNull();
			expect(loop.phase).toBe('reeling');
		});

		it('bot auto-strikes on tick during bite phase', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, true, () => 0.3);
			loop.cast(population, noopRemove);

			const event = loop.tick(loop.remainingMs);
			expect(event).toEqual({ type: 'bite' });
			expect(loop.phase).toBe('bite');

			const strikeEvent = loop.tick(100);
			expect(strikeEvent).toBeNull();
			expect(loop.phase).toBe('reeling');
		});

		it('returns null if not in bite phase', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, false, () => 0);
			expect(loop.strike()).toBeNull();
		});

		it('clears bite window on strike', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, false, () => 0);
			loop.cast(population, noopRemove);
			loop.tick(loop.remainingMs);
			expect(loop.biteWindowRemaining).toBeGreaterThan(0);

			loop.strike();
			expect(loop.biteWindowRemaining).toBe(0);
			expect(loop.biteWindowTotal).toBe(0);
		});
	});

	describe('reel', () => {
		it('succeeds when fish weight is within line capacity', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, false, () => 0.3);
			loop.cast(population, noopRemove);
			loop.tick(loop.remainingMs);
			loop.strike();
			expect(loop.phase).toBe('reeling');

			const event = loop.reel();
			expect(event).toBeNull();
			expect(loop.phase).toBe('netting');
		});

		it('fails for oversized fish with unlucky roll', () => {
			const heavyFish: FishData = {
				id: 'fish-heavy',
				species: 'Roach',
				strata: 'Bottom',
				classificationLabel: '',
				tierIndex: 1,
				weightOz: 200,
				castStrength: 'Medium',
				preferredBait: 'maggot'
			};
			const heavyPopulation = [heavyFish];
			const loop = new FishingLoop(tackle, 5, speciesList, false, () => 0.5);
			loop.cast(heavyPopulation, noopRemove);
			loop.tick(loop.remainingMs);
			loop.strike();

			const event = loop.reel();
			expect(event).toEqual({ type: 'fishLost' });
			expect(loop.phase).toBe('lost');
		});

		it('returns null if not in reeling phase', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, false, () => 0);
			expect(loop.reel()).toBeNull();
		});
	});

	describe('net', () => {
		it('catches the fish and records it', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, false, () => 0.3);
			loop.cast(population, noopRemove);
			loop.tick(loop.remainingMs);
			loop.strike();
			loop.reel();
			expect(loop.phase).toBe('netting');

			const event = loop.net();
			expect(event).toEqual({
				type: 'fishCaught',
				species: 'Roach',
				classificationLabel: 'Small',
				weightOz: 12
			});
			expect(loop.phase).toBe('caught');
			expect(loop.caughtFish).toHaveLength(1);
			expect(loop.caughtFish[0]).toEqual({
				species: 'Roach',
				classificationLabel: 'Small',
				weightOz: 12
			});
		});

		it('does not auto-recast immediately after catch (wait for delay)', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, false, () => 0.3);
			loop.cast(population, noopRemove);
			loop.tick(loop.remainingMs);
			loop.strike();
			loop.reel();
			loop.net();
			expect(loop.phase).toBe('caught');

			const event = loop.tick(100);
			expect(event).toBeNull();
			expect(loop.phase).toBe('caught');
		});

		it('returns null if not in netting phase', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, false, () => 0);
			expect(loop.net()).toBeNull();
		});
	});

	describe('auto-recast', () => {
		it('auto-recasts after caught delay', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, false, () => 0.3);
			loop.cast(population, noopRemove);
			loop.tick(loop.remainingMs);
			loop.strike();
			loop.reel();
			loop.net();
			expect(loop.phase).toBe('caught');

			const event = loop.tick(2500);
			expect(loop.phase).toBe('waiting');
			expect(loop.currentFish).not.toBeNull();
			expect(event).toBeNull();
		});

		it('auto-recasts after lost delay', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, false, () => 0.1);
			loop.cast(population, noopRemove);
			loop.tick(loop.remainingMs);
			expect(loop.phase).toBe('bite');

			loop.tick(loop.biteWindowRemaining + 10);
			expect(loop.phase).toBe('lost');

			const event = loop.tick(2500);
			expect(loop.phase).toBe('waiting');
			expect(event).toBeNull();
		});
	});

	describe('returnToCast', () => {
		it('resets to idle after a catch', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, false, () => 0.3);
			loop.cast(population, noopRemove);
			loop.tick(loop.remainingMs);
			loop.strike();
			loop.reel();
			loop.net();
			expect(loop.phase).toBe('caught');

			loop.returnToCast();
			expect(loop.phase).toBe('idle');
			expect(loop.currentFish).toBeNull();
			expect(loop.biteWindowRemaining).toBe(0);
		});
	});

	describe('full linear flow', () => {
		it('cast → wait → bite → strike → reel → net → caught', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, false, () => 0.3);

			expect(loop.phase).toBe('idle');

			loop.cast(population, noopRemove);
			expect(loop.phase).toBe('waiting');

			loop.tick(loop.remainingMs);
			expect(loop.phase).toBe('bite');
			expect(loop.biteWindowTotal).toBeGreaterThan(0);

			loop.strike();
			expect(loop.phase).toBe('reeling');

			loop.reel();
			expect(loop.phase).toBe('netting');

			loop.net();
			expect(loop.phase).toBe('caught');
			expect(loop.caughtFish).toHaveLength(1);

			loop.returnToCast();
			expect(loop.phase).toBe('idle');
		});
	});
});
