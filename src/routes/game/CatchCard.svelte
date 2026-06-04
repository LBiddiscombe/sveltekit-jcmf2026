<script lang="ts">
	import { formatWeight } from '$lib/utils/format';
	import type { CaughtFish } from '$lib/data';

	let {
		catchList = [],
		totalWeight = 0,
		matchScore = '',
		scoreLabel = 'score',
		biggestFish = null
	}: {
		catchList: CaughtFish[];
		totalWeight: number;
		matchScore: string;
		scoreLabel: string;
		biggestFish: CaughtFish | null;
	} = $props();

	let recent = $derived([...catchList].reverse().slice(0, 3));
</script>

<div
	class="w-full max-w-sm rounded-xl bg-linear-to-b from-dark-teal/30 to-dark-teal/20 p-3 text-white"
	style="backdrop-filter: blur(4px)"
>
	<div class="mb-2 flex items-center justify-between">
		<div class="flex items-baseline gap-1 rounded-full bg-white/10 px-3 py-1">
			<span class="text-base font-bold tabular-nums text-white">{catchList.length}</span>
			<span class="text-sm text-white/60">fish</span>
		</div>
		<div class="flex items-baseline gap-1 rounded-full bg-white/10 px-3 py-1">
			{#if matchScore}
				<span class="text-base font-bold tabular-nums text-white">{matchScore}</span>
				<span class="text-sm text-white/60">{scoreLabel}</span>
			{:else}
				<span class="text-base font-bold tabular-nums text-white">{formatWeight(totalWeight)}</span>
				<span class="text-sm text-white/60">total</span>
			{/if}
		</div>
	</div>

	{#if biggestFish}
		<div
			class="mb-2 flex items-center gap-2 rounded-lg bg-linear-to-r from-amber-500/20 to-amber-500/5 px-2.5 py-1.5"
		>
			<span class="text-base">🏆</span>
			<div class="min-w-0 flex-1">
				<p class="truncate text-sm font-semibold text-amber-300">
					{biggestFish.classificationLabel}
					{biggestFish.species}
				</p>
			</div>
			<span class="shrink-0 text-sm font-bold tabular-nums text-amber-300">
				{formatWeight(biggestFish.weightOz)}
			</span>
		</div>
	{/if}

	{#if recent.length > 0}
		<div class="space-y-0.5">
			{#each recent as fish (fish.caughtAtMs)}
				<div class="flex items-center justify-between rounded-md bg-white/10 px-2.5 py-1.5">
					<div class="flex items-center gap-1.5 min-w-0">
						<span class="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/70"></span>
						<span class="truncate text-sm text-white/80"
							>{fish.classificationLabel} {fish.species}</span
						>
					</div>
					<span class="shrink-0 text-sm tabular-nums text-white/50"
						>{formatWeight(fish.weightOz)}</span
					>
				</div>
			{/each}
		</div>
	{:else}
		<div class="flex items-center justify-center gap-1.5 py-4 text-sm text-white/40">
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M18.364 5.636a9 9 0 11-12.728 0M12 2v4M12 10v.01"
				/>
			</svg>
			<span>No fish caught yet</span>
		</div>
	{/if}
</div>
