<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { prepState } from '$lib/game/prep-state.svelte';
	import { gameState } from '$lib/game/state.svelte';
	import { multiplayer } from '$lib/game/party/connection.svelte';
	import { venues } from '$lib/data';
	import type { TackleSelection } from '$lib/data';
	import { defaultTackle } from '$lib/game/tackle-utils';
	import { formatWeight, formatShortDuration } from '$lib/utils/format';
	import CatchToast from '$lib/components/CatchToast.svelte';
	import DebugPanel from '$lib/components/DebugPanel.svelte';
	import TackleModal from '$lib/components/TackleModal.svelte';
	import FishingCanvas from '$lib/components/FishingCanvas.svelte';
	import { isTutorialCompleted, completeTutorial } from '$lib/game/tutorial';
	import {
		startWakeLock,
		stopWakeLock,
		acquireWakeLock,
		wakeLock
	} from '$lib/game/screen-wake-lock.svelte';

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
	const silhouetteImages = import.meta.glob<string>('$lib/assets/images/bots/*-silhouette.png', {
		eager: true,
		query: '?url',
		import: 'default'
	});

	let isMulti = $derived(page.url.searchParams.has('multi'));
	let mode = $derived(isMulti ? 'multiplayer' : prepState.mode);
	let venueName = $derived(isMulti ? venues[0].name : prepState.venueName);
	let lakeName = $derived(isMulti ? venues[0].lakes[0].name : prepState.lakeName);
	let pegName = $derived(isMulti ? (multiplayer.ownPeg ?? '') : prepState.playerPeg);
	let tackle = $derived(gameState.playerAngler?.tackle);
	let selectedPegData = $derived(
		isMulti
			? (venues[0].lakes[0].pegs.find((p) => p.name === multiplayer.ownPeg) ?? null)
			: (prepState.lake?.pegs.find((p) => p.name === pegName) ?? null)
	);
	let playerPhase = $derived(gameState.playerSnapshot?.phase ?? null);
	let catchList = $derived(gameState.playerAngler?.catch ?? []);
	let recentCatch = $derived([...catchList].reverse().slice(0, 3));
	let totalWeight = $derived(catchList.reduce((sum: number, f) => sum + f.weightOz, 0));
	let lastEvent = $derived(gameState.lastEvent);
	let debugMode = $state(false);
	let intervalId: ReturnType<typeof setInterval> | null = null;
	let now = $state(Date.now());
	let waitingForPlayers = $derived(
		gameState.phase === 'results' && isMulti && multiplayer.phase !== 'results'
	);

	let multiplayerCatches = $derived(
		multiplayer.catchEvents
			.filter((e) => e.anglerName !== multiplayer.playerName)
			.map((e) => ({
				name: e.anglerName,
				pegName: e.pegName,
				classificationLabel: e.classificationLabel,
				species: e.species
			}))
	);

	let hintsConsumed = $state(
		isTutorialCompleted()
			? { bite: true, reeling: true, landing: true, intro: true }
			: { bite: false, reeling: true, landing: true, intro: false }
	);
	let tutorialCompleted = $derived(
		hintsConsumed.bite && hintsConsumed.reeling && hintsConsumed.landing
	);

	let currentHint = $derived.by(() => {
		if (mode !== 'session' || tutorialCompleted) return '';
		if (!hintsConsumed.intro) return "You're fishing! Wait for a bite...";
		const p = playerPhase;
		if (p === 'bite' && !hintsConsumed.bite)
			return 'Tap the image or press Space to hook the fish!';
		return '';
	});

	let hintBlocking = $derived(
		mode === 'session' && !tutorialCompleted && !!(playerPhase === 'bite' && !hintsConsumed.bite)
	);

	$effect(() => {
		if (mode !== 'session' || hintsConsumed.intro) return;
		const timer = setTimeout(() => {
			hintsConsumed.intro = true;
		}, 5000);
		return () => clearTimeout(timer);
	});

	$effect(() => {
		if (mode === 'session' && tutorialCompleted) {
			completeTutorial();
		}
	});

	let waitSeconds = $derived(
		playerPhase === 'waiting' && gameState.playerSnapshot
			? Math.floor(gameState.playerSnapshot.waitElapsedMs / 1000)
			: 0
	);

	let fishWeightOz = $derived(gameState.playerSnapshot?.currentFishOz ?? 0);
	let fishPattern = $derived(gameState.playerSnapshot?.currentFishPattern ?? [1, 1, 0, 0]);
	let fishStepMs = $derived(gameState.playerSnapshot?.currentFishStepMs ?? 1000);
	let lineMaxOz = $derived(tackle?.line.maxOz ?? 100);
	let rodMultiplier = $derived(tackle?.rod.rodMultiplier ?? 1.0);
	let castStrength = $derived(tackle?.castStrength ?? 'Medium');
	let playerAngler = $derived(gameState.playerAngler);
	let anglerSilhouetteUrl = $derived.by(() => {
		if (!playerAngler?.image) return '';
		const silhouetteFile = playerAngler.image.replace('.jpeg', '-silhouette.png');
		const key = `/src/lib/assets/images/bots/${silhouetteFile}`;
		return silhouetteImages[key] ?? '';
	});

	let matchTimeDisplay = $derived.by(() => {
		if (isMulti && multiplayer.startTime) {
			const elapsed = now - multiplayer.startTime;
			const remaining = Math.max(0, multiplayer.timeLimitMinutes * 60 - elapsed / 1000);
			if (remaining <= 0) return '';
			return formatShortDuration(remaining);
		}
		const totalSec = Math.ceil(gameState.timeRemainingSeconds);
		if (totalSec <= 0) return '';
		return formatShortDuration(totalSec);
	});

	let statusMessage = $derived.by(() => {
		const e = lastEvent;
		if (e?.type === 'fishCaught') {
			const text = `You caught a ${formatWeight(e.weightOz)} ${e.classificationLabel || ''} ${e.species}!`;
			return text.replace(/\s+/g, ' ').trim();
		}
		if (e?.type === 'hookBroken') return 'Hook smashed by big fish!';
		if (e?.type === 'biteExpired') return 'Fish lost interest!';
		if (e?.type === 'fishLost') return 'Missed it!';
		if (e?.type === 'fishGotAway') return 'Fish got away!';
		if (e?.type === 'lineBroke') return 'Line broke!';
		if (e?.type === 'tooMuchSlackLine') return 'Too much slack line!';

		if (playerPhase === 'waiting')
			return `Line in the water (${formatShortDuration(waitSeconds)})...`;
		if (playerPhase === 'bite') return 'Fish biting!';
		if (playerPhase === 'reeling') return 'Reeling in...';
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

	function handleStrike() {
		if (mode === 'session') hintsConsumed.bite = true;
		gameState.strike();
	}

	function handleReelingResult(result: 'caught' | 'lost') {
		if (mode === 'session') {
			hintsConsumed.reeling = true;
			hintsConsumed.landing = true;
		}
		gameState.handleReelingOutcome(result);
	}

	function handleChangeTackle() {
		gameState.beginChangeTackle();
	}

	function handlePegClick() {
		if (playerPhase === 'bite') handleStrike();
		if (!wakeLock.active) acquireWakeLock();
	}

	let isMidGameChange = $derived(playerPhase === 'changing' && gameState.initialTackleChosen);

	let timerDisplayForModal = $derived.by(() => {
		if (isMulti && multiplayer.startTime) {
			const elapsed = now - multiplayer.startTime;
			const remaining = Math.max(0, multiplayer.timeLimitMinutes * 60 - elapsed / 1000);
			return formatShortDuration(remaining);
		}
		return formatShortDuration(gameState.timeRemainingSeconds);
	});

	function handleTackleConfirm(tackle: TackleSelection) {
		gameState.updateTackle(tackle);
		gameState.finishChangingTackle();
		acquireWakeLock();
	}

	function toggleDebug() {
		if (debugMode) {
			intervalId = setInterval(() => {
				if (hintBlocking) return;
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
		const gp = gameState.phase;
		const mp = isMulti ? multiplayer.phase : null;

		if (isMulti && mp === 'grace-period') {
			gameState.timeExpired = true;
		}

		if (gp === 'results') {
			if (!isMulti) {
				goto('/results');
			} else {
				multiplayer.sendDoneFishing();
			}
		}
	});

	$effect(() => {
		if (isMulti && gameState.phase === 'results' && multiplayer.phase === 'results') {
			goto('/results?multi=1');
		}
	});

	function setupMultiplayerGame() {
		let angler = prepState.playerAngler;
		if (!angler) {
			prepState.anglers = [
				{
					id: 'player',
					name: multiplayer.playerName || 'You',
					image: multiplayer.playerAvatar,
					isPlayer: true,
					skill: 0,
					pegName: multiplayer.ownPeg ?? '',
					phase: 'idle',
					tackle: { ...defaultTackle },
					totalWeightOz: 0,
					biggestFish: null,
					catch: []
				}
			];
			angler = prepState.playerAngler;
			if (!angler) return;
		} else {
			angler.name = multiplayer.playerName || 'You';
			angler.image = multiplayer.playerAvatar;
			angler.pegName = multiplayer.ownPeg ?? '';
			angler.catch = [];
			angler.totalWeightOz = 0;
			angler.biggestFish = null;
		}
		const venue = venues[0];
		const lake = venue.lakes[0];
		gameState.beginFishing([angler], venue, lake, multiplayer.timeLimitMinutes);
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.code !== 'Space' || e.repeat || debugMode) return;
		e.preventDefault();
		const p = gameState.playerSnapshot?.phase;
		if (p === 'bite') handleStrike();
	}

	onMount(() => {
		startWakeLock();
		if (isMulti) {
			setupMultiplayerGame();
		} else if (gameState.phase !== 'fishing') {
			const venue = prepState.venue;
			const lake = prepState.lake;
			if (venue && lake && prepState.playerPeg) {
				gameState.beginFishing(
					prepState.anglers,
					venue,
					lake,
					prepState.mode === 'match' ? prepState.timeLimitMinutes : undefined
				);
			}
		}

		intervalId = setInterval(() => {
			if (hintBlocking || waitingForPlayers) return;
			now = Date.now();
			gameState.tick(100);
		}, 100);

		return () => {
			stopWakeLock();
			if (intervalId) clearInterval(intervalId);
		};
	});
</script>

<svelte:window onkeydown={onKeydown} />

<div class="min-h-dvh lg:flex lg:flex-row">
	<div class="flex min-h-dvh flex-1 flex-col items-center gap-4 p-4">
		<div
			class="relative w-full overflow-hidden rounded-xl bg-surface/20 sm:max-w-sm
				{playerPhase === 'bite' ? 'strike-glow' : ''}"
		>
			<div class="relative aspect-square">
				<FishingCanvas
					phase={playerPhase ?? 'idle'}
					pegImageUrl={pegImg(selectedPegData?.image ?? '')}
					{fishWeightOz}
					pattern={fishPattern}
					stepMs={fishStepMs}
					{lineMaxOz}
					{rodMultiplier}
					{castStrength}
					{anglerSilhouetteUrl}
					onResult={handleReelingResult}
				/>
				{#if playerPhase === 'bite'}
					<button
						class="absolute inset-0 cursor-pointer bg-transparent"
						onclick={handlePegClick}
						aria-label="Strike"
					></button>
				{/if}
				{#if playerPhase === 'caught' || playerPhase === 'lost'}
					<div class="pointer-events-none absolute inset-0 flex items-center justify-center">
						<div class="rounded-lg bg-black/40 px-4 py-2 text-center">
							<p class="text-sm font-bold text-white">{statusMessage}</p>
						</div>
					</div>
				{/if}
				{#if currentHint}
					<div class="pointer-events-none absolute inset-0 flex items-center justify-center p-3">
						<div class="animate-fadeIn rounded-lg bg-black/40 px-4 py-2 text-center">
							<p class="whitespace-pre-line text-sm font-bold text-white">{currentHint}</p>
						</div>
					</div>
				{/if}
				{#if waitingForPlayers}
					<div
						class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl bg-black/60"
					>
						<p class="text-xl font-bold text-white">Time's Up!</p>
						<p class="text-sm text-white/80">Waiting for other anglers to finish...</p>
						<div class="flex gap-1">
							<span
								class="h-2 w-2 animate-bounce rounded-full bg-white/60"
								style="animation-delay: 0s"
							></span>
							<span
								class="h-2 w-2 animate-bounce rounded-full bg-white/60"
								style="animation-delay: 0.15s"
							></span>
							<span
								class="h-2 w-2 animate-bounce rounded-full bg-white/60"
								style="animation-delay: 0.3s"
							></span>
						</div>
					</div>
				{/if}
			</div>
			<div class="absolute top-3 left-3 flex items-start gap-1 rounded-lg bg-black/40 px-2 py-1">
				<div class="flex-1">
					<p class="text-sm font-semibold tracking-wide text-white/80 uppercase">{venueName}</p>
					<p class="text-xs text-white/60">{lakeName}</p>
					<p class="text-lg font-bold text-white">Peg {pegName}</p>
				</div>
				{#if wakeLock.active}
					<span
						class="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-green-400 shadow-[0_0_4px_theme(colors.green.400)]"
					></span>
				{/if}
			</div>
			{#if (mode === 'match' || mode === 'multiplayer') && matchTimeDisplay}
				<div class="absolute top-3 right-3 rounded-lg bg-black/40 px-3 py-1.5">
					<p class="text-sm font-bold text-white/90">{matchTimeDisplay}</p>
				</div>
			{/if}
			{#if mode === 'match' || mode === 'multiplayer'}
				<div class="absolute inset-x-3 bottom-3">
					<CatchToast events={mode === 'match' ? gameState.botCatchFeed : multiplayerCatches} />
				</div>
			{/if}
		</div>

		<!-- Phase status -->
		<div class="flex w-full max-w-sm items-center gap-2">
			<span
				class="inline-block h-3 w-3 rounded-full {playerPhase === 'waiting'
					? 'animate-pulse bg-yellow-400'
					: playerPhase === 'bite'
						? 'animate-ping bg-red-500'
						: playerPhase === 'reeling'
							? 'bg-green-500'
							: playerPhase === 'caught'
								? 'bg-blue-500'
								: 'bg-muted'}"
			></span>
			<span class="text-sm font-medium text-dark-teal">{statusMessage}</span>
		</div>

		<!-- Tackle display (clickable) -->
		{#if tackle}
			<button
				onclick={handleChangeTackle}
				class="w-full cursor-pointer rounded-xl border border-olive bg-surface/30 p-3 text-left sm:max-w-sm"
			>
				<div class="flex items-center justify-center gap-3">
					<div class="flex flex-col items-center gap-0.5">
						<img
							src={img(tackle.rod)}
							alt={tackle.rod.name}
							class="h-6 w-6 rounded object-contain"
						/>
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

		{#if debugMode}
			<div
				class="w-full max-w-sm rounded-xl border border-yellow-400/40 bg-yellow-50/50 p-3 text-center"
			>
				<p class="text-xs font-medium text-yellow-700">Game paused — debug mode</p>
			</div>
		{/if}

		<!-- Catch panel -->
		<div class="w-full max-w-sm rounded-xl border border-olive bg-surface/30 p-3">
			<h3 class="mb-1 text-sm font-semibold text-dark-teal">
				{catchList.length > 0
					? `Catch (${catchList.length}) — ${formatWeight(totalWeight)}`
					: 'No fish caught'}
			</h3>
			{#if catchList.length > 0}
				<div class="space-y-1">
					{#each recentCatch as fish (fish.species + fish.weightOz + fish.caughtAtMs)}
						<div
							class="flex justify-between rounded bg-surface/20 px-3 py-1.5 text-sm text-dark-teal"
						>
							<span>{fish.classificationLabel || ''} {fish.species}</span>
							<span class="text-muted">{formatWeight(fish.weightOz)}</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Finish button -->
		<div class="mt-auto flex justify-center pb-2">
			<a
				href={isMulti ? '/results?multi=1' : '/results'}
				onclick={() => gameState.finishGame()}
				class="inline-flex min-h-[44px] items-center justify-center rounded bg-secondary px-6 py-3 text-center text-white no-underline hover:bg-secondary/80"
			>
				{mode === 'multiplayer' ? 'Leave Match' : mode === 'match' ? 'End Match' : 'Finish Session'}
			</a>
		</div>
	</div>

	{#if debugMode}
		<div class="hidden lg:block">
			<DebugPanel />
		</div>
	{/if}
</div>

<!-- Fixed debug toggle, top-right on desktop -->
<button
	onclick={toggleDebug}
	class="fixed top-4 right-4 z-50 hidden cursor-pointer rounded-lg bg-black/30 px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:bg-black/50 hover:text-white/80 lg:block"
>
	{debugMode ? 'resume' : 'debug'}
</button>

{#if playerPhase === 'changing'}
	<TackleModal
		isTimed={mode === 'match' || mode === 'multiplayer'}
		isMidGame={isMidGameChange}
		initialTackle={tackle ?? defaultTackle}
		{pegName}
		{selectedPegData}
		{venueName}
		{lakeName}
		onconfirm={handleTackleConfirm}
		timerDisplay={timerDisplayForModal}
	/>
{/if}

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

	.animate-fadeIn {
		animation: fadeIn 0.3s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
