<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { tackleFromGameUrl } from '$lib/game/prep-flow';
	import { prepState } from '$lib/game/prep-state.svelte';
	import { gameState } from '$lib/game/state.svelte';
	import BotCatchToast from '$lib/components/BotCatchToast.svelte';

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

	let mode = $derived(prepState.mode);
	let venueName = $derived(prepState.venueName);
	let lakeName = $derived(prepState.lakeName);
	let pegName = $derived(prepState.playerPeg);
	let tackle = $derived(gameState.playerAngler?.tackle);
	let selectedPegData = $derived(prepState.lake?.pegs.find((p) => p.name === pegName) ?? null);
	let playerPhase = $derived(gameState.playerSnapshot?.phase ?? null);
	let catchList = $derived(gameState.playerAngler?.catch ?? []);
	let recentCatch = $derived([...catchList].reverse().slice(0, 3));
	let totalWeight = $derived(catchList.reduce((sum: number, f) => sum + f.weightOz, 0));
	let lastEvent = $derived(gameState.lastEvent);
	let debugMode = $state(false);
	let intervalId: ReturnType<typeof setInterval> | null = null;
	let waitSeconds = $state(0);

	$effect(() => {
		if (playerPhase !== 'waiting') {
			waitSeconds = 0;
			return;
		}

		const id = setInterval(() => {
			if (debugMode) return;
			waitSeconds += 0.1;
		}, 100);

		return () => clearInterval(id);
	});

	let pegFish = $derived(gameState.getPegPopulation(prepState.playerPeg ?? ''));

	let reelProgress = $derived(
		gameState.playerSnapshot && gameState.playerSnapshot.reelTimerMs > 0
			? 1 - gameState.playerSnapshot.reelTimerRemaining / gameState.playerSnapshot.reelTimerMs
			: 0
	);

	let reelGradientStyle = $derived.by(() => {
		if (playerPhase !== 'reeling' && playerPhase !== 'landing') return '';
		const p = playerPhase === 'landing' ? 1 : reelProgress;
		const w = 110 - p * 30;
		const h = 90 - p * 20;
		const clear = 92 - p * 42;
		const dark = 0.25 + p * 0.25;
		const edge = 97 - p * 19;
		return `radial-gradient(ellipse ${w}% ${h}% at 50% 100%, transparent ${clear}%, rgba(0,0,0,${dark}) ${edge}%)`;
	});

	let matchTimeDisplay = $derived.by(() => {
		const totalSec = Math.ceil(gameState.timeRemainingSeconds);
		if (totalSec <= 0) return '';
		const m = Math.floor(totalSec / 60);
		const s = totalSec % 60;
		return `${m}m ${s}s`;
	});

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
		if (e?.type === 'fishGotAway') return 'Fish got away!';
		if (e?.type === 'lineBroke') return 'Line broke!';
		if (e?.type === 'tooMuchSlackLine') return 'Too much slack line!';

		if (playerPhase === 'waiting') return `Line in the water (${waitSeconds.toFixed(0)}s)...`;
		if (playerPhase === 'bite') return 'Fish biting!';
		if (playerPhase === 'reeling') return 'Reeling in...';
		if (playerPhase === 'landing') return 'Strike now!';
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

	function handleRecast() {
		waitSeconds = 0;
		gameState.resetCast();
		gameState.cast();
	}

	function handleChangeTackle() {
		gameState.resetCast();
		goto(tackleUrl);
	}

	function handlePegClick() {
		if (playerPhase === 'bite') handleStrike();
		else if (playerPhase === 'landing') handleReel();
	}

	function toggleDebug() {
		if (debugMode) {
			intervalId = setInterval(() => {
				gameState.tick(100);
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

	$effect(() => {
		if (gameState.phase === 'results') {
			goto('/results');
		}
	});

	onMount(() => {
		if (gameState.playerSnapshot?.phase === 'idle') {
			gameState.cast();
		}

		function onKeydown(e: KeyboardEvent) {
			if (e.code !== 'Space' || e.repeat || debugMode) return;
			e.preventDefault();
			const p = gameState.playerSnapshot?.phase;
			if (p === 'bite') handleStrike();
			else if (p === 'reeling') handleReel();
			else if (p === 'landing') handleReel();
			else if (p === 'waiting') handleRecast();
		}

		document.addEventListener('keydown', onKeydown);

		intervalId = setInterval(() => {
			gameState.tick(100);
		}, 100);

		return () => {
			if (intervalId) clearInterval(intervalId);
			document.removeEventListener('keydown', onKeydown);
		};
	});
</script>

<div class="flex min-h-dvh flex-col items-center gap-4 p-4">
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<!-- Peg image header -->
	<div
		class="relative w-full overflow-hidden rounded-xl bg-surface/20 sm:max-w-sm
			{playerPhase === 'bite' || playerPhase === 'landing' ? 'cursor-pointer' : ''}"
		class:strike-glow={playerPhase === 'bite'}
		class:land-glow={playerPhase === 'landing'}
		onclick={handlePegClick}
		onkeydown={(e) => e.key === 'Enter' && handlePegClick()}
		role={playerPhase === 'bite' || playerPhase === 'landing' ? 'button' : undefined}
		tabindex={playerPhase === 'bite' || playerPhase === 'landing' ? 0 : undefined}
	>
		<div class="relative aspect-square">
			{#if selectedPegData?.image && pegImg(selectedPegData.image)}
				<img src={pegImg(selectedPegData.image)} alt="" class="h-full w-full object-contain" />
			{:else}
				<div class="flex h-full w-full items-center justify-center">
					{#if pegName}
						<span class="text-6xl font-bold text-muted">{pegName}</span>
					{/if}
				</div>
			{/if}
			{#if playerPhase === 'reeling' || playerPhase === 'landing'}
				<div
					class="pointer-events-none absolute inset-0"
					style="background: {reelGradientStyle}"
				></div>
			{/if}
		</div>
		<div class="absolute top-3 left-3 rounded-lg bg-black/40 px-2 py-1">
			<p class="text-sm font-semibold tracking-wide text-white/80 uppercase">{venueName}</p>
			<p class="text-xs text-white/60">{lakeName}</p>
			<p class="text-lg font-bold text-white">Peg {pegName}</p>
		</div>
		{#if mode === 'match' && matchTimeDisplay}
			<div class="absolute top-3 right-3 rounded-lg bg-black/40 px-3 py-1.5">
				<p class="text-sm font-bold text-white/90">{matchTimeDisplay}</p>
			</div>
		{/if}
		{#if mode === 'match'}
			<div class="absolute inset-x-3 bottom-3">
				<BotCatchToast />
			</div>
		{/if}
	</div>

	<!-- Phase status -->
	<div class="flex w-full max-w-sm items-center justify-between">
		<div class="flex items-center gap-2">
			<span
				class="inline-block h-3 w-3 rounded-full {playerPhase === 'waiting'
					? 'animate-pulse bg-yellow-400'
					: playerPhase === 'bite'
						? 'animate-ping bg-red-500'
						: playerPhase === 'reeling'
							? 'bg-green-500'
							: playerPhase === 'landing'
								? 'animate-ping bg-yellow-400'
								: playerPhase === 'caught'
									? 'bg-blue-500'
									: 'bg-muted'}"
			></span>
			<span class="text-sm font-medium text-dark-teal">{statusMessage}</span>
		</div>
		<div class="flex items-center gap-2">
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
			<p class="text-sm text-muted">Click the peg or press Space to strike</p>
		{:else if playerPhase === 'reeling'}
			<p class="text-sm text-muted">
				Wait for the landing window — pressing Space early loses the fish
			</p>
		{:else if playerPhase === 'landing'}
			<p class="text-sm text-muted">Click the peg or press Space to land!</p>
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
			<h3 class="mb-1 text-sm font-semibold text-dark-teal">
				Catch ({catchList.length}) — {formatWeight(totalWeight)}
			</h3>
			<div class="space-y-1">
				{#each recentCatch as fish (fish.weightOz + fish.species)}
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
	.strike-glow {
		animation: strike-breathe 1.5s ease-in-out infinite;
	}

	@keyframes strike-breathe {
		0%,
		100% {
			box-shadow: 0 0 8px 4px rgba(220, 38, 38, 0.7);
		}
		50% {
			box-shadow: 0 0 30px 15px rgba(220, 38, 38, 0.3);
		}
	}

	.land-glow {
		animation: land-breathe 0.8s ease-in-out infinite;
	}

	@keyframes land-breathe {
		0%,
		100% {
			box-shadow: 0 0 8px 4px rgba(180, 130, 30, 0.9);
		}
		50% {
			box-shadow: 0 0 30px 20px rgba(180, 130, 30, 0.6);
		}
	}
</style>
