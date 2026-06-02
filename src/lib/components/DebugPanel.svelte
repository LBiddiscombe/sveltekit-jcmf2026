<script lang="ts">
	import { gameState } from '$lib/game/state.svelte';
	import { prepState } from '$lib/game/prep-state.svelte';
	import type { TackleSelection } from '$lib/data';
	import { formatWeight, formatShortDuration } from '$lib/utils/format';

	let playerAngler = $derived(gameState.playerAngler);
	let catchAudit = $derived(gameState.catchAudit);
	let mode = $derived(prepState.mode);
	let anglers = $derived(gameState.anglers);
	let pegName = $derived(prepState.playerPeg ?? '');
	let pegFish = $derived(gameState.getPegPopulation(pegName));

	let expanded: Record<string, boolean> = $state({});
	let message = $state('');

	function toggle(key: string) {
		expanded[key] = !expanded[key];
	}

	function tackleSummary(t: TackleSelection): string {
		return `${t.rod.name} / ${t.reel.name} / ${t.hook.name}`;
	}

	function forceFish(fishId: string) {
		if (gameState.playerLoop?.phase !== 'waiting') return;
		const ok = gameState.debugForceFish(fishId);
		message = ok ? 'Fish set — bite in 2s' : 'Fish rejected (hook/line too small)';
		setTimeout(() => (message = ''), 3000);
	}
</script>

<div class="h-dvh w-96 overflow-y-auto border-l border-olive bg-surface/20 p-4 text-xs">
	{#if message}
		<div class="mb-2 rounded bg-amber-900/40 px-2 py-1 text-amber-200">{message}</div>
	{/if}
	<!-- Section 1: Fish distribution -->
	<button
		onclick={() => toggle('fish')}
		class="mb-2 flex w-full cursor-pointer items-center gap-1.5 text-sm font-semibold text-dark-teal"
	>
		<span class="text-muted">{expanded['fish'] ? '▾' : '▸'}</span>
		Peg {pegName} — {pegFish.length} fish
	</button>
	{#if expanded['fish']}
		<div class="space-y-2">
			{#each ['Short', 'Medium', 'Long'] as dist (dist)}
				{@const distFish = [...pegFish.filter((f) => f.castStrength === dist)].sort(
					(a, b) => b.weightOz - a.weightOz
				)}
				<div>
					<button
						onclick={() => toggle(`dist-${dist}`)}
						class="mb-1 flex w-full cursor-pointer items-center gap-1.5 font-semibold text-dark-teal"
					>
						<span class="text-muted">{expanded[`dist-${dist}`] ? '▾' : '▸'}</span>
						{dist} ({distFish.length})
					</button>
					{#if expanded[`dist-${dist}`]}
						{#each ['Top', 'Middle', 'Bottom'] as strata (strata)}
							{@const strataFish = distFish.filter((f) => f.strata === strata)}
							{#if strataFish.length > 0}
								<div class="mb-1 ml-3">
									<button
										onclick={() => toggle(`strata-${dist}-${strata}`)}
										class="flex w-full cursor-pointer items-center gap-1.5 text-muted"
									>
										<span>{expanded[`strata-${dist}-${strata}`] ? '▾' : '▸'}</span>
										{strata} ({strataFish.length})
									</button>
									{#if expanded[`strata-${dist}-${strata}`]}
										{#each strataFish as fish (fish.id)}
											{@const isCurrent = gameState.playerLoop?.currentFish?.id === fish.id}
											<button
												onclick={() => forceFish(fish.id)}
												disabled={gameState.playerLoop?.phase !== 'waiting'}
												class={[
													'w-full cursor-pointer rounded px-4 py-0.5 text-left text-muted transition-colors even:bg-surface/10 disabled:cursor-default disabled:opacity-40',
													isCurrent && 'bg-amber-900/30'
												].join(' ')}
											>
												{#if fish.classificationLabel}{fish.classificationLabel}
												{/if}
												{fish.species}
												{formatWeight(fish.weightOz)}
												({fish.preferredBait})
											</button>
										{/each}
									{/if}
								</div>
							{/if}
						{/each}
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	<!-- Section 2: My catch log -->
	<button
		onclick={() => toggle('catch')}
		class="mb-2 mt-4 flex w-full cursor-pointer items-center gap-1.5 text-sm font-semibold text-dark-teal"
	>
		<span class="text-muted">{expanded['catch'] ? '▾' : '▸'}</span>
		My Catch ({playerAngler?.catch.length ?? 0})
	</button>
	{#if expanded['catch']}
		{#if playerAngler}
			{@const myCatches = catchAudit.filter((e) => e.anglerId === playerAngler.id)}
			{#if myCatches.length === 0}
				<p class="text-muted">No fish caught</p>
			{:else}
				<div class="space-y-1">
					{#each myCatches as entry (entry.caughtAtMs + entry.species)}
						<div class="flex justify-between rounded bg-surface/20 px-2 py-1 text-dark-teal">
							<span class="tabular-nums">{formatShortDuration(entry.caughtAtMs / 1000)}</span>
							<span>{entry.classificationLabel} {entry.species}</span>
							<span class="text-muted">{formatWeight(entry.weightOz)}</span>
						</div>
					{/each}
					<div
						class="flex justify-between rounded bg-surface/30 px-2 py-1 font-bold text-dark-teal"
					>
						<span>Total</span>
						<span>{playerAngler.catch.length} fish, {formatWeight(playerAngler.totalWeightOz)}</span
						>
					</div>
				</div>
			{/if}
		{/if}
	{/if}

	<!-- Section 3: Bot statuses (match only) -->
	{#if mode === 'match'}
		<button
			onclick={() => toggle('bots')}
			class="mb-2 mt-4 flex w-full cursor-pointer items-center gap-1.5 text-sm font-semibold text-dark-teal"
		>
			<span class="text-muted">{expanded['bots'] ? '▾' : '▸'}</span>
			Bots
		</button>
		{#if expanded['bots']}
			{#each anglers.filter((a) => !a.isPlayer) as bot (bot.id)}
				{@const botCatches = catchAudit.filter((e) => e.anglerId === bot.id)}
				<div class="mb-3 rounded border border-olive bg-surface/20 p-2">
					<div class="flex items-baseline justify-between">
						<span class="font-semibold text-dark-teal">{bot.name}</span>
						<span class="text-muted">Peg {bot.pegName}</span>
					</div>
					<div class="mt-1 text-muted">
						<span>{bot.phase}</span>
						<span class="ml-2">Weight: {formatWeight(bot.totalWeightOz)}</span>
					</div>
					<div class="mt-1 truncate text-muted" title={tackleSummary(bot.tackle)}>
						{tackleSummary(bot.tackle)}
					</div>
					{#if botCatches.length > 0}
						<div class="mt-1 space-y-0.5">
							{#each botCatches as entry (entry.caughtAtMs + entry.species)}
								<div class="flex justify-between text-dark-teal">
									<span class="tabular-nums">{formatShortDuration(entry.caughtAtMs / 1000)}</span>
									<span>{entry.classificationLabel} {entry.species}</span>
									<span class="text-muted">{formatWeight(entry.weightOz)}</span>
								</div>
							{/each}
						</div>
					{:else}
						<p class="mt-1 text-muted">No fish caught</p>
					{/if}
				</div>
			{/each}
		{/if}
	{/if}
</div>
