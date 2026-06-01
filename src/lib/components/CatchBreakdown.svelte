<script lang="ts">
	import { species } from '$lib/data';
	import type { Species } from '$lib/data/types';
	import { formatWeight } from '$lib/utils/format';

	const fishImages = import.meta.glob<string>('$lib/assets/images/fish/*.PNG', {
		eager: true,
		query: '?url',
		import: 'default'
	});

	const TIER_WIDTHS = [80, 160, 240, 240] as const;
	const MONSTER_HEIGHT = 1.5;

	function getTier(speciesData: Species, weightOz: number): { width: number; heightScale: number } {
		const tiers = speciesData.classifications;
		if (weightOz <= tiers[0].maxOz) return { width: TIER_WIDTHS[0], heightScale: 1 };
		if (weightOz <= tiers[1].maxOz) return { width: TIER_WIDTHS[1], heightScale: 1 };
		if (weightOz <= tiers[2].maxOz) return { width: TIER_WIDTHS[2], heightScale: 1 };
		return { width: TIER_WIDTHS[3], heightScale: MONSTER_HEIGHT };
	}

	function fishImgUrl(speciesName: string): string {
		const key = `/src/lib/assets/images/fish/${speciesName.toLowerCase()}.PNG`;
		return fishImages[key] ?? '';
	}

	let {
		speciesGroups,
		totalFish,
		totalWeightOz,
		biggestFish
	}: {
		speciesGroups: Map<
			string,
			{ count: number; totalWeight: number; biggestWeight: number; biggestLabel: string }
		>;
		totalFish: number;
		totalWeightOz: number;
		biggestFish: { species: string; weightOz: number; classificationLabel: string } | null;
	} = $props();

	let rows = $derived([...speciesGroups].sort((a, b) => b[1].totalWeight - a[1].totalWeight));

	let bestSpeciesData = $derived(
		biggestFish ? species.find((s) => s.name === biggestFish.species) ?? null : null
	);

	let bestTier = $derived(
		bestSpeciesData && biggestFish ? getTier(bestSpeciesData, biggestFish.weightOz) : null
	);

	let bestImgUrl = $derived(biggestFish ? fishImgUrl(biggestFish.species) : '');
</script>

	<div class="flex flex-1 flex-col">
	<div class="flex flex-col items-center gap-4 px-4 pb-4 pt-4">
		{#if totalFish > 0}
		<p class="text-xl text-gray-900">{totalFish} fish, {formatWeight(totalWeightOz)}</p>
		{/if}

		{#if totalFish > 0 && biggestFish && bestTier}
		<div class="w-full max-w-sm rounded-lg bg-accent/20 p-4 text-center">
			<p class="text-xs uppercase tracking-wider text-gray-500">Best Fish</p>
			{#if bestImgUrl}
			<div class="flex justify-center" style="transform: scaleY({bestTier.heightScale}); transform-origin: bottom;">
				<img
					src={bestImgUrl}
					alt={biggestFish.species}
					style="width: min({bestTier.width}px, 100%)"
					loading="eager"
				/>
			</div>
			{/if}
			<p class="text-xl font-bold text-gray-900">{biggestFish.species}</p>
			<p class="text-2xl font-black text-accent">{formatWeight(biggestFish.weightOz)}</p>
			{#if biggestFish.classificationLabel}
			<span class="inline-block mt-1 rounded-full bg-accent/30 px-3 py-0.5 text-xs font-semibold text-gray-700">
				{biggestFish.classificationLabel}
			</span>
			{/if}
		</div>
		{/if}
	</div>

	<div class="flex-1 overflow-y-auto px-4">
		<div class="flex flex-col items-center pb-4">
			{#if totalFish === 0}
			<p class="text-base text-gray-600">No fish were caught</p>
			{:else}
			<div class="w-full max-w-sm space-y-2">
				{#each rows as [speciesName, group] (speciesName)}
				{@const imgUrl = fishImgUrl(speciesName)}
				<div class="flex items-center gap-3 rounded-lg border border-olive bg-surface/30 p-3">
					{#if imgUrl}
					<div class="h-10 w-10 shrink-0 overflow-hidden">
						<img src={imgUrl} alt={speciesName} class="h-full w-full object-contain" loading="eager" />
					</div>
					{:else}
					<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-olive/30 text-base font-bold text-gray-700">
						{speciesName[0]}
					</div>
					{/if}
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-bold text-gray-900">{speciesName}</p>
						<p class="text-xs text-gray-600">{group.count} fish &middot; {formatWeight(group.totalWeight)}</p>
					</div>
					<span class="shrink-0 text-right text-xs text-gray-600">
						Best: {formatWeight(group.biggestWeight)}
					</span>
				</div>
				{/each}
			</div>
			{/if}
		</div>
	</div>

	<div class="flex justify-center px-4 pb-6 pt-2">
		<a
			href="/menu"
			class="inline-flex min-h-[44px] items-center justify-center rounded bg-primary px-6 py-3 text-center text-white no-underline hover:bg-primary/80"
		>
			Main Menu
		</a>
	</div>
</div>
