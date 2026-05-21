<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { tackleFromGameUrl } from '$lib/game/prep-flow';
	import { gameState } from '$lib/game/state.svelte';

	const tackleImages = import.meta.glob<string>('$lib/assets/images/tackle/*.png', {
		eager: true,
		query: '?url',
		import: 'default'
	});
	const baitImages = import.meta.glob<string>('$lib/assets/images/baits/*.png', {
		eager: true,
		query: '?url',
		import: 'default'
	});
	const pegImages = import.meta.glob<string>('$lib/assets/images/pegs/*.jpeg', {
		eager: true,
		query: '?url',
		import: 'default'
	});

	let mode = $derived(gameState.mode);
	let venueName = $derived(gameState.venueName);
	let lakeName = $derived(gameState.lakeName);
	let pegName = $derived(gameState.playerPeg);
	let tackle = $derived(gameState.playerAngler?.tackle);
	let selectedPegData = $derived(gameState.lake?.pegs.find((p) => p.name === pegName) ?? null);
	let playerPhase = $derived(gameState.playerPhase);
	let caughtCount = $derived(gameState.playerCaughtCount);
	let catchList = $derived(gameState.playerAngler?.catch ?? []);
	let lastEvent = $derived(gameState.lastEvent);
	let debugMode = $state(false);
	let intervalId: ReturnType<typeof setInterval> | null = null;

	let pegFish = $derived(gameState.getPegPopulation(gameState.playerPeg ?? ''));

	let biteWindowRatio = $derived(
		playerPhase === 'bite' && gameState.playerBiteWindowTotal > 0
			? gameState.playerBiteWindowRemaining / gameState.playerBiteWindowTotal
			: 1
	);

	let pulseDuration = $derived(`${biteWindowRatio * 2 + 0.5}s`);

	let statusMessage = $derived.by(() => {
		const e = lastEvent;
		if (e?.type === 'fishCaught') {
			const text = `Caught a ${formatWeight(e.weightOz)} ${e.classificationLabel || ''} ${e.species}!`;
			return text.replace(/\s+/g, ' ').trim();
		}
		if (e?.type === 'hookBroken') return 'Hook smashed by big fish!';
		if (e?.type === 'biteExpired') return 'Fish lost interest!';
		if (e?.type === 'fishLost') return 'Missed it!';
		if (e?.type === 'blankCast') return 'Nothing biting yet...';

		if (playerPhase === 'waiting') return 'Line in the water...';
		if (playerPhase === 'bite') return 'Fish biting!';
		if (playerPhase === 'reeling') return 'Reeling in...';
		if (playerPhase === 'netting') return 'Netting...';
		if (playerPhase === 'striking') return 'Striking...';
		if (playerPhase === 'idle') return 'Ready';

		return '';
	});

	function img(item: { image: string }): string {
		return tackleImages[`/src/lib/assets/images/tackle/${item.image}`] ?? '';
	}

	function baitImg(item: { image: string }): string {
		return baitImages[`/src/lib/assets/images/baits/${item.image}`] ?? '';
	}

	function pegImg(filename: string | undefined): string {
		return filename ? (pegImages[`/src/lib/assets/images/pegs/${filename}`] ?? '') : '';
	}

	const tackleUrl = tackleFromGameUrl();

	function formatWeight(oz: number): string {
		const lb = Math.floor(oz / 16);
		const remainder = oz % 16;
		if (lb === 0) return `${oz} oz`;
		if (remainder === 0) return `${lb} lb`;
		return `${lb} lb ${remainder} oz`;
	}

	function handleStrike() {
		gameState.strike();
	}

	function handleReel() {
		gameState.reel();
	}

	function handleNet() {
		gameState.net();
	}

	function handleRecast() {
		gameState.recast();
		gameState.cast();
	}

	function handleChangeTackle() {
		gameState.recast();
		goto(tackleUrl);
	}

	function toggleDebug() {
		if (debugMode) {
			intervalId = setInterval(() => {
				if (
					gameState.playerPhase === 'waiting' ||
					gameState.playerPhase === 'bite' ||
					gameState.playerPhase === 'caught' ||
					gameState.playerPhase === 'lost'
				) {
					gameState.tick(100);
				}
			}, 100);
			debugMode = false;
		} else {
			if (intervalId) {
				clearInterval(intervalId);
				intervalId = null;
			}
			debugMode = true;
		}
	}

	onMount(() => {
		if (gameState.playerPhase === 'idle') {
			gameState.cast();
		}

		intervalId = setInterval(() => {
			if (
				gameState.playerPhase === 'waiting' ||
				gameState.playerPhase === 'bite' ||
				gameState.playerPhase === 'caught' ||
				gameState.playerPhase === 'lost'
			) {
				gameState.tick(100);
			}
		}, 100);

		return () => {
			if (intervalId) clearInterval(intervalId);
		};
	});
</script>

<div class="flex min-h-dvh flex-col items-center gap-4 p-4">
	<!-- Peg image header -->
	<div class="relative w-full overflow-hidden rounded-xl bg-surface/20 sm:max-w-sm">
		<div class="aspect-square">
			{#if selectedPegData?.image && pegImg(selectedPegData.image)}
				<img src={pegImg(selectedPegData.image)} alt="" class="h-full w-full object-contain" />
			{:else}
				<div class="flex h-full w-full items-center justify-center">
					{#if pegName}
						<span class="text-6xl font-bold text-muted">{pegName}</span>
					{/if}
				</div>
			{/if}
		</div>
		<div class="absolute top-3 left-3 rounded-lg bg-black/40 px-2 py-1">
			<p class="text-sm font-semibold tracking-wide text-white/80 uppercase">{venueName}</p>
			<p class="text-xs text-white/60">{lakeName}</p>
			<p class="text-lg font-bold text-white">Peg {pegName}</p>
		</div>
	</div>

	<!-- Phase status -->
	<div class="flex w-full max-w-sm items-center justify-between">
		<div class="flex items-center gap-2">
			<span
				class="inline-block h-3 w-3 rounded-full {playerPhase === 'waiting'
					? 'animate-pulse bg-yellow-400'
					: playerPhase === 'bite'
						? 'animate-ping bg-red-500'
						: playerPhase === 'reeling' || playerPhase === 'netting'
							? 'bg-green-500'
							: playerPhase === 'caught'
								? 'bg-blue-500'
								: 'bg-muted'}"
			></span>
			<span class="text-sm font-medium text-dark-teal">{statusMessage}</span>
		</div>
		<div class="flex items-center gap-2">
			<span class="text-xs text-muted">{caughtCount} caught</span>
			<button
				onclick={toggleDebug}
				class="cursor-pointer text-xs text-muted/40 hover:text-muted/80"
			>
				{debugMode ? 'resume' : 'debug'}
			</button>
		</div>
	</div>

	<!-- Action buttons -->
	<div class="flex w-full max-w-sm flex-col items-center gap-3">
		{#if debugMode}
			<div class="w-full rounded-xl border border-yellow-400/40 bg-yellow-50/50 p-3 text-center">
				<p class="text-xs font-medium text-yellow-700">Game paused — debug mode</p>
			</div>
		{:else if playerPhase === 'waiting'}
			<button
				onclick={handleRecast}
				class="inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center rounded bg-muted px-8 py-3 text-white hover:bg-muted/80"
			>
				Recast
			</button>
		{:else if playerPhase === 'bite'}
			<button
				onclick={handleStrike}
				style="--pulse-duration: {pulseDuration}; opacity: {Math.max(biteWindowRatio, 0.15)}"
				class="bite-pulse inline-flex min-h-[52px] w-full cursor-pointer items-center justify-center rounded bg-red-600 px-8 py-3 text-lg font-bold text-white hover:bg-red-700"
			>
				STRIKE!
			</button>
		{:else if playerPhase === 'reeling'}
			<button
				onclick={handleReel}
				class="inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center rounded bg-primary px-8 py-3 text-lg font-bold text-white hover:bg-primary/80"
			>
				Reel
			</button>
		{:else if playerPhase === 'netting'}
			<button
				onclick={handleNet}
				class="inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center rounded bg-green-600 px-8 py-3 text-lg font-bold text-white hover:bg-green-700"
			>
				Net Fish
			</button>
		{:else if playerPhase === 'caught' || playerPhase === 'lost'}
			<div
				class="w-full rounded-xl border p-4 text-center {playerPhase === 'caught'
					? 'border-blue-400 bg-blue-50'
					: 'border-red-300 bg-red-50'}"
			>
				<p class="text-lg font-bold {playerPhase === 'caught' ? 'text-blue-700' : 'text-red-700'}">
					{statusMessage}
				</p>
			</div>
		{/if}
	</div>

	<!-- Debug panel -->
	{#if debugMode}
		<div class="w-full max-w-sm">
			<div class="mb-1 flex items-center justify-between">
				<h3 class="text-sm font-semibold text-dark-teal">Peg {pegName} — {pegFish.length} fish</h3>
			</div>
			<div
				class="max-h-60 space-y-2 overflow-y-auto rounded-xl border border-olive bg-surface/30 p-3 text-xs"
			>
				{#each ['Short', 'Medium', 'Long'] as dist (dist)}
					{@const distFish = [...pegFish.filter((f) => f.castStrength === dist)].sort(
						(a, b) => b.weightOz - a.weightOz
					)}
					<div>
						<h4 class="mb-1 font-semibold text-dark-teal">{dist} ({distFish.length})</h4>
						{#each ['Top', 'Middle', 'Bottom'] as strata (strata)}
							{@const strataFish = distFish.filter((f) => f.strata === strata)}
							{#if strataFish.length > 0}
								<div class="mb-1 ml-2">
									<h5 class="text-muted">{strata} ({strataFish.length})</h5>
									{#each strataFish as fish (fish.id)}
										<div class="rounded px-2 py-0.5 text-muted even:bg-surface/10">
											{#if fish.classificationLabel}{fish.classificationLabel}
											{/if}
											{fish.species}
											{formatWeight(fish.weightOz)}
											({fish.preferredBait})
										</div>
									{/each}
								</div>
							{/if}
						{/each}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Tackle display (clickable) -->
	{#if tackle}
		<button
			onclick={handleChangeTackle}
			class="w-full cursor-pointer rounded-xl border border-olive bg-surface/30 p-3 text-left sm:max-w-sm"
		>
			<div class="flex items-center justify-center gap-3">
				<div class="flex flex-col items-center gap-0.5">
					<img src={img(tackle.rod)} alt={tackle.rod.name} class="h-6 w-6 rounded object-contain" />
					<span class="text-xs text-muted">{tackle.rod.name}</span>
				</div>
				<div class="flex flex-col items-center gap-0.5">
					<img
						src={img(tackle.reel)}
						alt={tackle.reel.name}
						class="h-6 w-6 rounded object-contain"
					/>
					<span class="text-xs text-muted">{tackle.reel.name}</span>
				</div>
				<div class="flex flex-col items-center gap-0.5">
					<img
						src={img(tackle.line)}
						alt={tackle.line.name}
						class="h-6 w-6 rounded object-contain"
					/>
					<span class="text-xs text-muted">{tackle.line.name}</span>
				</div>
				<div class="flex flex-col items-center gap-0.5">
					<img
						src={img(tackle.hook)}
						alt={tackle.hook.name}
						class="h-6 w-6 rounded object-contain"
					/>
					<span class="text-xs text-muted">{tackle.hook.name}</span>
				</div>
				<div class="flex flex-col items-center gap-0.5">
					<img
						src={baitImg(tackle.bait)}
						alt={tackle.bait.name}
						class="h-6 w-6 rounded object-contain"
					/>
					<span class="text-xs text-muted">{tackle.bait.name}</span>
				</div>
				<div class="flex flex-col items-center gap-0.5">
					<svg viewBox="0 0 24 24" class="h-6 w-6 text-muted">
						<circle cx="4" cy="12" r="2" fill="currentColor" />
						<line
							x1="6"
							y1="12"
							x2={tackle.castStrength === 'Short'
								? '14'
								: tackle.castStrength === 'Medium'
									? '18'
									: '22'}
							y2="12"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
						/>
					</svg>
					<span class="text-xs text-muted">{tackle.castStrength}</span>
				</div>
				<div class="flex flex-col items-center gap-0.5">
					<svg viewBox="0 0 24 24" class="h-6 w-6 text-muted">
						{#each ['Top', 'Middle', 'Bottom'] as layer, i (layer)}
							<rect
								x="6"
								y={4 + i * 6}
								width="12"
								height="4"
								rx="1"
								fill="currentColor"
								opacity={tackle.strata === layer ? 1 : 0.25}
							/>
						{/each}
					</svg>
					<span class="text-xs text-muted">{tackle.strata}</span>
				</div>
			</div>
		</button>
	{/if}

	<!-- Catch list -->
	{#if catchList.length > 0}
		<div class="w-full max-w-sm">
			<h3 class="mb-1 text-sm font-semibold text-dark-teal">Catch</h3>
			<div class="space-y-1">
				{#each catchList as fish (fish.species + fish.weightOz)}
					<div
						class="flex justify-between rounded bg-surface/20 px-3 py-1.5 text-sm text-dark-teal"
					>
						<span>{fish.classificationLabel || ''} {fish.species}</span>
						<span class="text-muted">{formatWeight(fish.weightOz)}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Finish button -->
	<div class="mt-auto flex justify-center pb-2">
		<a
			href="/results"
			onclick={() => gameState.finishGame()}
			class="inline-flex min-h-[44px] items-center justify-center rounded bg-secondary px-6 py-3 text-center text-white no-underline hover:bg-secondary/80"
		>
			{mode === 'match' ? 'End Match' : 'Finish Session'}
		</a>
	</div>
</div>

<style>
	.bite-pulse {
		animation: bite-pulse var(--pulse-duration, 2s) ease-in-out infinite;
	}

	@keyframes bite-pulse {
		0%,
		100% {
			opacity: var(--pulse-opacity, 1);
		}
		50% {
			opacity: calc(var(--pulse-opacity, 1) * 0.5);
		}
	}
</style>
