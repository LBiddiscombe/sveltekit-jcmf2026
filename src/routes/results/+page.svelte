<script lang="ts">
	import { SvelteMap } from 'svelte/reactivity';
	import { page } from '$app/state';
	import { prepState } from '$lib/game/prep-state.svelte';
	import { gameState } from '$lib/game/state.svelte';
	import { multiplayer } from '$lib/game/party/connection.svelte';
	import DebugPanel from '$lib/components/DebugPanel.svelte';
	import Leaderboard from './Leaderboard.svelte';
	import CatchBreakdown from './CatchBreakdown.svelte';
	import { formatWeight } from '$lib/utils/format';

	let isMulti = $derived(page.url.searchParams.has('multi'));
	let mode = $derived(isMulti ? 'multiplayer' : prepState.mode);
	let isCompetitive = $derived(isMulti || mode === 'match');
	let playerAngler = $derived(gameState.playerAngler);
	let anglers = $derived(gameState.anglers);
	let debugMode = $state(false);

	let winConditionKey = $derived(
		isMulti ? multiplayer.winConditionKey : gameState.matchRules.winConditionKey
	);

	let catchEvents = $derived(multiplayer.catchEvents);

	let leaderboardEmpty = $derived(
		isMulti ? catchEvents.length === 0 : anglers.every((a) => a.catch.length === 0)
	);

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
	let playerBiggestFish = $derived(playerAngler?.biggestFish ?? null);

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
	{#if isCompetitive}
		<div class="flex min-h-dvh flex-1 flex-col items-center justify-center gap-6 p-4">
			{#if leaderboardEmpty}
				<h1 class="text-2xl font-bold text-dark-teal sm:text-3xl md:text-4xl">Match Results</h1>
				<p class="text-base text-muted">No fish were caught</p>
			{:else}
				<Leaderboard
					{anglers}
					{catchEvents}
					{isMulti}
					multiPlayerName={multiplayer.playerName}
					multiPlayerAvatar={multiplayer.playerAvatar}
					{pegImg}
					{botImg}
					{formatWeight}
					{winConditionKey}
				/>
			{/if}
			<a
				{...{ href: '/menu' }}
				class="inline-flex min-h-11 items-center justify-center rounded bg-primary px-6 py-3 text-center text-white no-underline hover:bg-primary/80"
			>
				Main Menu
			</a>
		</div>
	{:else}
		<div class="flex min-h-dvh flex-1 flex-col">
			<h1
				class="flex-none px-4 pt-8 text-center text-2xl font-bold text-dark-teal sm:text-3xl md:text-4xl"
			>
				Session Results
			</h1>
			<CatchBreakdown {speciesGroups} {totalFish} {totalWeightOz} biggestFish={playerBiggestFish} />
		</div>
	{/if}

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
