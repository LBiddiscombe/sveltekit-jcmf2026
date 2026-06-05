import type { AnglerState } from './prep-state.svelte';
import type { CatchInfo } from './party/connection.svelte';

export interface BiggestFishInfo {
	weightOz: number;
	species: string;
	caughtAtMs: number;
}

export interface RankEntry {
	name: string;
	weight: number;
	fishCount: number;
	score: number;
	biggestFish: BiggestFishInfo | null;
	isPlayer: boolean;
	image: string;
	pegName: string;
}

function toEntry(a: AnglerState): RankEntry {
	return {
		name: a.name,
		weight: a.totalWeightOz,
		fishCount: a.catch.length,
		score: a.score,
		biggestFish: a.biggestFish
			? {
					weightOz: a.biggestFish.weightOz,
					species: a.biggestFish.species,
					caughtAtMs: a.biggestFish.caughtAtMs
				}
			: null,
		isPlayer: a.isPlayer,
		image: a.image,
		pegName: a.pegName
	};
}

function compareByWinCondition(a: RankEntry, b: RankEntry, winConditionKey: string): number {
	const byScore = b.score - a.score;
	if (byScore !== 0) return byScore;

	if (winConditionKey === 'biggest') {
		return (a.biggestFish?.caughtAtMs ?? Infinity) - (b.biggestFish?.caughtAtMs ?? Infinity);
	}
	if (winConditionKey === 'count') {
		return b.weight - a.weight;
	}

	return b.fishCount - a.fishCount;
}

export function rankAnglers(anglers: AnglerState[], winConditionKey: string): RankEntry[] {
	return [...anglers].map(toEntry).sort((a, b) => compareByWinCondition(a, b, winConditionKey));
}

export function rankFromCatchEvents(
	events: CatchInfo[],
	winConditionKey: string,
	playerName: string,
	playerAvatar: string
): RankEntry[] {
	const map = new Map<
		string,
		{
			name: string;
			totalOz: number;
			count: number;
			biggest: BiggestFishInfo | null;
		}
	>();

	for (const c of events) {
		const entry = map.get(c.anglerName) ?? {
			name: c.anglerName,
			totalOz: 0,
			count: 0,
			biggest: null as BiggestFishInfo | null
		};
		entry.totalOz += c.weightOz;
		entry.count += 1;
		if (!entry.biggest || c.weightOz > entry.biggest.weightOz) {
			entry.biggest = {
				weightOz: c.weightOz,
				species: c.species,
				caughtAtMs: c.caughtAtMs
			};
		}
		map.set(c.anglerName, entry);
	}

	return [...map.values()]
		.map((e) => ({
			name: e.name,
			weight: e.totalOz,
			fishCount: e.count,
			score:
				winConditionKey === 'count'
					? e.count
					: winConditionKey === 'biggest'
						? (e.biggest?.weightOz ?? 0)
						: e.totalOz,
			biggestFish: e.biggest,
			isPlayer: e.name === playerName,
			image: e.name === playerName ? playerAvatar : '',
			pegName: ''
		}))
		.sort((a, b) => compareByWinCondition(a, b, winConditionKey));
}
