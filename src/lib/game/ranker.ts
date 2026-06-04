import type { AnglerState } from './prep-state.svelte';

export interface RankEntry {
	name: string;
	score: number;
	fishCount: number;
	biggestFish: { weightOz: number; species: string } | null;
	isPlayer: boolean;
	image: string;
	pegName: string;
}

export function rankAnglers(anglers: AnglerState[]): RankEntry[] {
	return [...anglers]
		.sort((a, b) => b.score - a.score)
		.map((a) => ({
			name: a.name,
			score: a.score,
			fishCount: a.catch.length,
			biggestFish: a.biggestFish
				? { weightOz: a.biggestFish.weightOz, species: a.biggestFish.species }
				: null,
			isPlayer: a.isPlayer,
			image: a.image,
			pegName: a.pegName
		}));
}
