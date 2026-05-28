<script lang="ts">
	import { SvelteMap } from 'svelte/reactivity';
	import { page } from '$app/state';
	import { prepState } from '$lib/game/prep-state.svelte';
	import { gameState } from '$lib/game/state.svelte';
	import { multiplayer } from '$lib/game/party/connection.svelte';
	import DebugPanel from '$lib/components/DebugPanel.svelte';
	import Leaderboard from './Leaderboard.svelte';
	import { formatWeight } from '$lib/utils/format';

	let isMulti = $derived(page.url.searchParams.has('multi'));
	let mode = $derived(isMulti ? 'multiplayer' : prepState.mode);
	let playerAngler = $derived(gameState.playerAngler);
	let anglers = $derived(gameState.anglers);
	let debugMode = $state(false);

	let multiLeaderboard = $derived.by(() => {
		if (!isMulti) return [];
		const totals = new SvelteMap<string, { name: string; totalOz: number; count: number }>();
		for (const c of multiplayer.catchEvents) {
			const e = totals.get(c.anglerName) ?? {
				name: c.anglerName,
				totalOz: 0,
				count: 0
			};
			e.totalOz += c.weightOz;
			e.count += 1;
			totals.set(c.anglerName, e);
		}
		return [...totals.values()].sort((a, b) => b.totalOz - a.totalOz);
	});

	let speciesGroups = $derived.by(() => {
		const map = new SvelteMap<
			string,
			{ count: number; totalWeight: number; biggestWeight: number; biggestLabel: string }
		>();
		for (const fish of playerAngler?.catch ?? []) {
			const g = map.get(fish.species) ?? {
				count: 0,
				totalWeight: 0,
				biggestWeight: 0,
				biggestLabel: ''
			};
			g.count += 1;
			g.totalWeight += fish.weightOz;
			if (fish.weightOz > g.biggestWeight) {
				g.biggestWeight = fish.weightOz;
				g.biggestLabel = fish.classificationLabel;
			}
			map.set(fish.species, g);
		}
		return map;
	});

	let totalFish = $derived(playerAngler?.catch.length ?? 0);
	let totalWeightOz = $derived(playerAngler?.totalWeightOz ?? 0);

	let btnHref = $derived('/menu');

	const pegImages = import.meta.glob<string>('$lib/assets/images/pegs/*.jpeg', {
		eager: true,
		query: '?url',
		import: 'default'
	});
	const botImages = import.meta.glob<string>('$lib/assets/images/bots/*.jpeg', {
		eager: true,
		query: '?url',
		import: 'default'
	});

	function pegImg(filename: string | undefined): string {
		return filename ? (pegImages[`/src/lib/assets/images/pegs/${filename}`] ?? '') : '';
	}

	function botImg(filename: string): string {
		return botImages[`/src/lib/assets/images/bots/${filename}`] ?? '';
	}
</script>

<div class="min-h-dvh lg:flex lg:flex-row">
	<div class="flex min-h-dvh flex-1 flex-col items-center justify-center gap-6 p-4">
		<h1 class="text-2xl font-bold text-dark-teal sm:text-3xl md:text-4xl">
			{isMulti ? 'Match Results' : mode === 'match' ? 'Match Results' : 'Session Results'}
		</h1>

		{#if isMulti || mode === 'match'}
			{#if isMulti && multiLeaderboard.length === 0}
				<p class="text-base text-muted">No fish were caught</p>
			{:else if !isMulti && mode === 'match' && anglers.every((a) => a.catch.length === 0)}
				<p class="text-base text-muted">No fish were caught</p>
			{:else}
				<Leaderboard
					{anglers}
					multiEntries={multiLeaderboard}
					{isMulti}
					multiPlayerName={multiplayer.playerName}
					{pegImg}
					{botImg}
					{formatWeight}
				/>
			{/if}
			{#if isMulti}
				<div class="mt-4 w-full max-w-md">
					<h2 class="mb-2 text-xl font-bold text-dark-teal">Your Catch</h2>
					{#if totalFish === 0}
						<p class="text-base text-muted">No fish were caught</p>
					{:else}
						<div class="space-y-2">
							{#each [...speciesGroups] as [species, group] (species)}
								<div class="rounded border border-olive bg-surface/30 p-2 text-sm text-dark-teal">
									<div class="flex items-baseline justify-between gap-2">
										<span>{species}</span>
										<span class="text-nowrap"
											>{group.count} @ {formatWeight(group.totalWeight)}</span
										>
									</div>
									<div class="mt-0.5 text-sm text-muted">
										Best: {formatWeight(group.biggestWeight)}
										{group.biggestLabel}
									</div>
								</div>
							{/each}
							<div
								class="flex justify-between rounded border border-olive bg-surface/30 p-2 font-bold text-dark-teal text-sm"
							>
								<span>Total</span>
								<span>{totalFish} fish, {formatWeight(totalWeightOz)}</span>
							</div>
						</div>
					{/if}
				</div>
			{/if}
		{:else}
			<p class="text-xl text-muted">Your catch — species, weight, count</p>
			{#if totalFish === 0}
				<p class="text-base text-muted">No fish were caught</p>
			{:else}
				<div class="w-full max-w-xs space-y-2">
					{#each [...speciesGroups] as [species, group] (species)}
						<div class="rounded border border-olive bg-surface/30 p-2 text-sm text-dark-teal">
							<div class="flex items-baseline justify-between gap-2">
								<span>{species}</span>
								<span class="text-nowrap">{group.count} @ {formatWeight(group.totalWeight)}</span>
							</div>
							<div class="mt-0.5 text-sm text-muted">
								Best: {formatWeight(group.biggestWeight)}
								{group.biggestLabel}
							</div>
						</div>
					{/each}
					<div
						class="flex justify-between rounded border border-olive bg-surface/30 p-2 font-bold text-dark-teal text-sm"
					>
						<span>Total</span>
						<span>{totalFish} fish, {formatWeight(totalWeightOz)}</span>
					</div>
				</div>
			{/if}
		{/if}
		<a
			{...{ href: btnHref }}
			class="mt-4 inline-flex min-h-[44px] items-center justify-center rounded bg-primary px-6 py-3 text-center text-white no-underline hover:bg-primary/80"
		>
			Main Menu
		</a>
	</div>

	{#if debugMode}
		<div class="hidden lg:block">
			<DebugPanel />
		</div>
	{/if}
</div>

<button
	onclick={() => (debugMode = !debugMode)}
	class="fixed top-4 right-4 z-50 hidden cursor-pointer rounded-lg bg-black/30 px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:bg-black/50 hover:text-white/80 lg:block"
>
	{debugMode ? 'hide debug' : 'debug'}
</button>
