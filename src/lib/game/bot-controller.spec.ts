import { describe, it, expect, vi } from 'vitest';
import { FishingLoop } from './loop';
import { BotController } from './bot-controller';
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
		{ id: 'small', label: 'Small', maxOz: 8, preferredBaits: ['maggot', 'caster'] },
		{ id: 'medium', label: '', maxOz: 34, preferredBaits: ['maggot', 'caster', 'worm'] },
		{ id: 'specimen', label: 'Specimen', maxOz: 51, preferredBaits: ['worm', 'bread'] },
		{ id: 'monster', label: 'Monster', maxOz: Infinity, preferredBaits: ['worm', 'bread'] }
	]
};

const speciesList = [roach];

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

const population: FishData[] = [smallRoach];

function noopRemove(_id: string) {
	/* no-op */
}

describe('BotController', () => {
	describe('enterChanging', () => {
		it('sets changing phase on loop and initializes timers', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, () => 0.5);
			const controller = new BotController(loop, 5, () => 0.5);

			controller.enterChanging();
			expect(loop.phase).toBe('changing');
			expect(controller['changingTimer']).toBeGreaterThan(0);
		});
	});

	describe('tick - changing phase', () => {
		it('recasts when changing timer expires', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, () => 0.1);
			loop.preparePopulation(population, noopRemove);
			const controller = new BotController(loop, 5, () => 0);

			controller.enterChanging();
			expect(loop.phase).toBe('changing');

			controller.tick(controller['changingTimer'] + 1);
			expect(loop.phase).toBe('waiting');
			expect(loop.currentFish).not.toBeNull();
		});
	});

	describe('tick - bite phase', () => {
		it('auto-strikes after skill delay', () => {
			const loop = new FishingLoop(tackle, 10, speciesList, () => 0.5);
			loop.preparePopulation(population, noopRemove);
			const controller = new BotController(loop, 10, () => 0.5);
			// loop rng=0.5 gives biteTime ~19500ms so biteWindow=5000ms
			// controller rng=0.5 gives skillDelay ~1500ms

			loop.cast(population, noopRemove);
			loop.tick(loop.remainingMs);
			expect(loop.phase).toBe('bite');

			controller.tick(1);
			const delay = controller['autoActionTimer'];
			expect(delay).toBeGreaterThan(0);

			controller.tick(delay + 1);
			expect(loop.phase).toBe('reeling');
		});

		it('does not strike before skill delay', () => {
			const loop = new FishingLoop(tackle, 10, speciesList, () => 0.5);
			loop.preparePopulation(population, noopRemove);
			const controller = new BotController(loop, 10, () => 0.5);

			loop.cast(population, noopRemove);
			loop.tick(loop.remainingMs);
			expect(loop.phase).toBe('bite');

			controller.tick(1);
			expect(loop.phase).toBe('bite');
			expect(controller['autoActionTimer']).toBeGreaterThan(0);
		});

		it('higher skill means shorter skill delay', () => {
			const c1 = new BotController(new FishingLoop(tackle, 10, speciesList, () => 0), 10, () => 0.5);
			const c2 = new BotController(new FishingLoop(tackle, 1, speciesList, () => 0), 1, () => 0.5);

			c1.enterChanging();
			c2.enterChanging();
			expect(c1['changingTimer']).toBeLessThan(c2['changingTimer']);
		});
	});

	describe('tick - reeling phase', () => {
		it('auto-reels with capacity check after skill delay', () => {
			const loop = new FishingLoop(tackle, 10, speciesList, () => 0.5);
			loop.preparePopulation(population, noopRemove);
			const controller = new BotController(loop, 10, () => 0.5);
			// loop rng=0.5 gives biteWindow=5000ms — enough for both
			// bite skillDelay and reel skillDelay (~1500ms each)

			loop.cast(population, noopRemove);
			loop.tick(loop.remainingMs);
			expect(loop.phase).toBe('bite');

			controller.tick(1);
			const biteDelay = controller['autoActionTimer'];
			controller.tick(biteDelay + 1);
			expect(loop.phase).toBe('reeling');

			controller.tick(1);
			const reelDelay = controller['autoActionTimer'];
			expect(reelDelay).toBeGreaterThan(0);

			const event = controller.tick(reelDelay + 1);
			expect(event).toEqual({
				type: 'fishCaught',
				species: 'Roach',
				classificationLabel: 'Small',
				weightOz: 12
			});
			expect(loop.phase).toBe('caught');
			expect(loop.caughtFish).toHaveLength(1);
		});

		it('does not reel before skill delay', () => {
			const loop = new FishingLoop(tackle, 10, speciesList, () => 0.5);
			loop.preparePopulation(population, noopRemove);
			const controller = new BotController(loop, 10, () => 0.5);

			loop.cast(population, noopRemove);
			loop.tick(loop.remainingMs);
			expect(loop.phase).toBe('bite');

			controller.tick(1);
			const biteDelay = controller['autoActionTimer'];
			controller.tick(biteDelay + 1);
			expect(loop.phase).toBe('reeling');

			controller.tick(1);
			expect(loop.phase).toBe('reeling');
		});

		it('reelWithCapacityCheck catches fish within line capacity', () => {
			const loop = new FishingLoop(tackle, 5, speciesList, () => 0.99);
			loop.preparePopulation(population, noopRemove);

			loop.cast(population, noopRemove);
			loop.tick(loop.remainingMs);
			loop.strike();
			expect(loop.phase).toBe('reeling');

			const event = loop.reelWithCapacityCheck();
			expect(event).toEqual({
				type: 'fishCaught',
				species: 'Roach',
				classificationLabel: 'Small',
				weightOz: 12
			});
			expect(loop.phase).toBe('caught');
		});
	});

	describe('tick - waiting blank casting', () => {
		it('calls onBlankCycle after 2 blank patience cycles', () => {
			const loop = new FishingLoop(baitMismatchTackle, 5, speciesList, () => 0);
			loop.cast(population, noopRemove);
			expect(loop.phase).toBe('waiting');
			expect(loop.isBlankCasting).toBe(true);

			const onBlankCycle = vi.fn(() => null);
			const controller = new BotController(loop, 5, () => 0, onBlankCycle);

			controller.tick(FishingLoop.BLANK_PATIENCE_DELAY);
			expect(onBlankCycle).toHaveBeenCalledTimes(0);

			controller.tick(FishingLoop.BLANK_PATIENCE_DELAY);
			expect(onBlankCycle).toHaveBeenCalledTimes(1);

			controller.tick(FishingLoop.BLANK_PATIENCE_DELAY);
			expect(onBlankCycle).toHaveBeenCalledTimes(2);
		});
	});

	describe('full bot flow (rng=0, instant delays)', () => {
		it('cast → wait → bite → auto-strike → reeling → auto-reel → caught', () => {
			const loop = new FishingLoop(tackle, 10, speciesList, () => 0);
			loop.preparePopulation(population, noopRemove);
			const controller = new BotController(loop, 10, () => 0);

			loop.cast(population, noopRemove);
			expect(loop.phase).toBe('waiting');

			loop.tick(loop.remainingMs);
			expect(loop.phase).toBe('bite');

			controller.tick(1);
			expect(loop.phase).toBe('reeling');

			const event = controller.tick(1);
			expect(event).toEqual({
				type: 'fishCaught',
				species: 'Roach',
				classificationLabel: 'Small',
				weightOz: 12
			});
			expect(loop.phase).toBe('caught');
			expect(loop.caughtFish).toHaveLength(1);
		});
	});
});
