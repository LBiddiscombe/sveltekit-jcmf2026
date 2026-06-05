<script lang="ts">
	import { species } from '$lib/data';
	import type { Species } from '$lib/data/types';
	import { getPBs, clearPBs } from '$lib/game/pbs';
	import type { PBEntry } from '$lib/game/pbs';
	import { formatWeight } from '$lib/utils/format';

	const fishImages = import.meta.glob<string>('$lib/assets/images/fish/*.PNG', {
		eager: true,
		query: '?url',
		import: 'default'
	});

	const TIER_WIDTHS = [80, 160, 240, 240] as const;
	const MONSTER_HEIGHT = 1.5;

	let pbs = $state(getPBs());

	let speciesCaught = $derived(Object.keys(pbs).length);
	let totalSpecies = $derived(species.length);

	let specimensCaught = $derived.by(() => {
		let count = 0;
		for (const s of species) {
			const pb = pbs[s.name];
			if (!pb) continue;
			if (pb.weightOz > s.classifications[1].maxOz) count++;
		}
		return count;
	});

	let monstersCaught = $derived.by(() => {
		let count = 0;
		for (const s of species) {
			const pb = pbs[s.name];
			if (!pb) continue;
			const specimenMax = s.classifications[2].maxOz;
			if (pb.weightOz > specimenMax) count++;
		}
		return count;
	});

	function getTier(speciesData: Species, weightOz: number): { width: number; heightScale: number } {
		const tiers = speciesData.classifications;
		if (weightOz <= tiers[0].maxOz) return { width: TIER_WIDTHS[0], heightScale: 1 };
		if (weightOz <= tiers[1].maxOz) return { width: TIER_WIDTHS[1], heightScale: 1 };
		if (weightOz <= tiers[2].maxOz) return { width: TIER_WIDTHS[2], heightScale: 1 };
		return { width: TIER_WIDTHS[3], heightScale: MONSTER_HEIGHT };
	}

	function getClassificationLabel(speciesData: Species, weightOz: number): string {
		const tiers = speciesData.classifications;
		if (weightOz <= tiers[0].maxOz) return tiers[0].label;
		if (weightOz <= tiers[1].maxOz) return tiers[1].label;
		if (weightOz <= tiers[2].maxOz) return tiers[2].label;
		return tiers[3].label;
	}

	function fishImgUrl(speciesName: string): string {
		const key = `/src/lib/assets/images/fish/${speciesName.toLowerCase()}.PNG`;
		return fishImages[key] ?? '';
	}

	function handleResetAll() {
		if (window.confirm('Reset all personal bests? This cannot be undone.')) {
			clearPBs();
			pbs = {};
		}
	}

	function hasPB(speciesName: string): PBEntry | null {
		return pbs[speciesName] ?? null;
	}
</script>

<div class="mx-auto max-w-2xl px-4 py-8">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold text-dark-teal sm:text-3xl">Fish Log</h1>
		<button
			onclick={handleResetAll}
			class="cursor-pointer rounded bg-red-500/80 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
		>
			Reset All PBs
		</button>
	</div>

	<div class="mb-6 grid grid-cols-3 gap-3">
		<div class="flex flex-col items-center gap-2 rounded-xl border border-olive bg-white/70 p-4">
			<span class="text-3xl">🐟</span>
			<span class="text-4xl font-black text-dark-teal">{speciesCaught}</span>
			<span class="-mt-1 text-xs text-muted">of {totalSpecies}</span>
			<div class="mt-1 h-2 w-full overflow-hidden rounded-full bg-primary/20">
				<div
					class="h-full rounded-full bg-primary transition-all"
					style="width: {(speciesCaught / totalSpecies) * 100}%"
				></div>
			</div>
			<span class="text-xs font-bold uppercase tracking-wide text-dark-teal">Species</span>
		</div>

		<div class="flex flex-col items-center gap-2 rounded-xl border border-olive bg-white/70 p-4">
			<span class="text-3xl">⭐</span>
			<span class="text-4xl font-black text-dark-teal">{specimensCaught}</span>
			<span class="-mt-1 text-xs text-muted">of {totalSpecies}</span>
			<div class="mt-1 h-2 w-full overflow-hidden rounded-full bg-accent/20">
				<div
					class="h-full rounded-full bg-accent transition-all"
					style="width: {(specimensCaught / totalSpecies) * 100}%"
				></div>
			</div>
			<span class="text-xs font-bold uppercase tracking-wide text-dark-teal">Specimens</span>
		</div>

		<div class="flex flex-col items-center gap-2 rounded-xl border border-olive bg-white/70 p-4">
			<span class="text-3xl">👑</span>
			<span class="text-4xl font-black text-dark-teal">{monstersCaught}</span>
			<span class="-mt-1 text-xs text-muted">of {totalSpecies}</span>
			<div class="mt-1 h-2 w-full overflow-hidden rounded-full bg-danger/20">
				<div
					class="h-full rounded-full bg-danger transition-all"
					style="width: {(monstersCaught / totalSpecies) * 100}%"
				></div>
			</div>
			<span class="text-xs font-bold uppercase tracking-wide text-dark-teal">Monsters</span>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
		{#each species as s (s.name)}
			{@const pb = hasPB(s.name)}
			{@const tier = pb ? getTier(s, pb.weightOz) : { width: TIER_WIDTHS[1], heightScale: 1 }}
			{@const imgUrl = fishImgUrl(s.name)}
			{@const label = pb ? getClassificationLabel(s, pb.weightOz) : ''}
			<div class="flex flex-col items-center gap-3 rounded-xl border border-olive bg-white/70 p-5">
				<p class="relative z-10 text-lg font-bold text-dark-teal [text-shadow:0_0_8px_white,0_0_4px_white]">{s.name}</p>
				{#if imgUrl}
					<div
						class="flex items-center justify-center {pb ? '' : 'opacity-15'}"
						style="transform: scaleY({tier.heightScale}); transform-origin: bottom;"
					>
						<img
							src={imgUrl}
							alt={s.name}
							class="max-w-full"
							style="width: min({tier.width}px, 100%)"
							loading="eager"
						/>
					</div>
				{/if}
				<div class="text-center">
					{#if pb}
						<p class="text-base font-bold text-accent">{label} {formatWeight(pb.weightOz)}</p>
					{:else}
						<p class="text-sm text-muted">Not yet caught</p>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	<div class="mt-8 text-center">
		<a
			href="/menu"
			class="inline-flex rounded bg-primary px-6 py-3 text-white no-underline hover:bg-primary/80"
		>
			Back to Menu
		</a>
	</div>
</div>
