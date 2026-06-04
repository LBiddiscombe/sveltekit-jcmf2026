import type { TackleSelection } from '$lib/data';
import { FishingLoop } from './loop';
import type { FishingEvent } from './loop';

function skillDelay(skill: number, rng: () => number): number {
	const maxDelay = 10_000 - (skill - 1) * (7_000 / 9);
	return Math.floor(rng() * maxDelay);
}

export class BotController {
	private changingTimer = 0;
	private autoActionTimer = 0;
	private blankCycleCount = 0;
	private botBlankPatienceMs = 0;
	private onBlankCycle: (() => TackleSelection | null) | undefined;

	constructor(
		readonly loop: FishingLoop,
		private skill: number,
		private rng: () => number,
		onBlankCycle?: () => TackleSelection | null
	) {
		this.onBlankCycle = onBlankCycle;
	}

	enterChanging(): void {
		this.loop.enterChanging();
		this.changingTimer = skillDelay(this.skill, this.rng);
		this.blankCycleCount = 0;
		this.autoActionTimer = 0;
		this.botBlankPatienceMs = 0;
	}

	tick(elapsedMs: number): FishingEvent | null {
		const event = this.loop.tick(elapsedMs);
		const prevCatchCount = this.loop.caughtFish.length;
		this.tickAutoDecisions(elapsedMs);
		if (this.loop.caughtFish.length > prevCatchCount) {
			const last = this.loop.caughtFish[this.loop.caughtFish.length - 1];
			return {
				type: 'fishCaught',
				species: last.species,
				classificationLabel: last.classificationLabel,
				weightOz: last.weightOz,
				tierIndex: last.tierIndex
			};
		}
		return event;
	}

	private tickAutoDecisions(elapsedMs: number): void {
		switch (this.loop.phase) {
			case 'changing':
				this.tickChanging(elapsedMs);
				break;
			case 'bite':
				this.tickBite(elapsedMs);
				break;
			case 'reeling':
				this.tickReeling(elapsedMs);
				break;
			case 'waiting':
				this.tickWaiting(elapsedMs);
				break;
		}
	}

	private tickChanging(elapsedMs: number): void {
		this.changingTimer -= elapsedMs;
		if (this.changingTimer <= 0) {
			const newTackle = this.onBlankCycle?.() ?? null;
			if (newTackle) {
				this.loop.updateTackle(newTackle);
				this.blankCycleCount = 0;
			}
			this.loop.recast();
		}
	}

	private tickBite(elapsedMs: number): void {
		if (this.loop.phase !== 'bite') {
			this.autoActionTimer = 0;
			return;
		}
		if (this.autoActionTimer === 0) {
			this.autoActionTimer = skillDelay(this.skill, this.rng);
		}
		this.autoActionTimer -= elapsedMs;
		if (this.autoActionTimer <= 0) {
			this.loop.strike();
			this.autoActionTimer = 0;
		}
	}

	private tickReeling(elapsedMs: number): void {
		if (this.loop.phase !== 'reeling') {
			this.autoActionTimer = 0;
			return;
		}
		if (this.autoActionTimer === 0) {
			this.autoActionTimer = skillDelay(this.skill, this.rng);
		}
		this.autoActionTimer -= elapsedMs;
		if (this.autoActionTimer <= 0) {
			this.loop.reelWithCapacityCheck();
			this.autoActionTimer = 0;
		}
	}

	private tickWaiting(elapsedMs: number): void {
		if (this.loop.isBlankCasting) {
			this.botBlankPatienceMs += elapsedMs;
			if (this.botBlankPatienceMs >= FishingLoop.BLANK_PATIENCE_DELAY) {
				this.botBlankPatienceMs = 0;
				this.blankCycleCount++;
				if (this.blankCycleCount >= 2 && this.onBlankCycle) {
					const newTackle = this.onBlankCycle();
					if (newTackle) {
						this.loop.updateTackle(newTackle);
						this.blankCycleCount = 0;
					}
				}
			}
		} else {
			this.botBlankPatienceMs = 0;
			if (this.loop.currentFish) {
				this.blankCycleCount = 0;
			}
		}
	}
}
