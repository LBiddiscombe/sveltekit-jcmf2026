import type { CaughtFish } from '$lib/data';
import type { AnglerState } from './prep-state.svelte';
import type { MatchRules } from './match-rules';
import { speciesFilterAccepts, resolveWinCondition } from './match-rules';

export interface ScorecardResult {
	qualifies: boolean;
}

export function recordCatch(
	angler: AnglerState,
	fish: CaughtFish,
	rules: MatchRules
): ScorecardResult {
	angler.catch.push(fish);
	angler.totalWeightOz += fish.weightOz;

	const qualifies = speciesFilterAccepts(rules.speciesFilterKind, fish.species);
	if (qualifies) {
		const wc = resolveWinCondition(rules.winConditionKey);
		if (wc.aggregate === 'max') {
			angler.score = Math.max(angler.score, wc.scoreFish(fish));
		} else {
			angler.score += wc.scoreFish(fish);
		}
	}

	if (!angler.biggestFish || fish.weightOz > angler.biggestFish.weightOz) {
		angler.biggestFish = { ...fish };
	}

	return { qualifies };
}
