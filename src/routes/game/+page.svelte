<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { prepState } from '$lib/game/prep-state.svelte';
	import type { CaughtFish } from '$lib/data';
	import { gameState } from '$lib/game/state.svelte';
	import { multiplayer } from '$lib/game/party/connection.svelte';
	import { venues, species } from '$lib/data';
	import type { TackleSelection } from '$lib/data';
	import { defaultTackle } from '$lib/game/tackle-utils';
	import { speciesFilterAccepts, resolveWinCondition } from '$lib/game/match-rules';
	import { formatWeight, formatShortDuration } from '$lib/utils/format';
	import DebugPanel from '$lib/components/DebugPanel.svelte';
	import { isTutorialCompleted, completeTutorial } from '$lib/game/tutorial';
	import CatchCard from './CatchCard.svelte';
	import CatchToast from './CatchToast.svelte';
	import TackleModal from './TackleModal.svelte';
	import FishingCanvas from './FishingCanvas.svelte';
	import ComboGridHud from './ComboGridHud.svelte';
	import CaughtOverlay from './CaughtOverlay.svelte';
	import LostOverlay from './LostOverlay.svelte';
	import WaitingOverlay from './WaitingOverlay.svelte';
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
	let caughtDismissable = $state(false);
	let caughtTimer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		if (playerPhase === 'caught') {
			caughtDismissable = false;
			caughtTimer = setTimeout(() => {
				caughtDismissable = true;
			}, 1000);
			return () => {
				clearTimeout(caughtTimer);
			};
		}
	});
	let catchList = $derived(gameState.playerAngler?.catch ?? []);
	let totalWeight = $derived(catchList.reduce((sum: number, f) => sum + f.weightOz, 0));
	let lastEvent = $derived(gameState.lastEvent);
	let biggestFish = $derived(
		catchList.reduce<CaughtFish | null>(
			(best, f) => (!best || f.weightOz > best.weightOz ? f : best),
			null
		)
	);
	let matchScore = $derived.by(() => {
		const angler = gameState.playerAngler;
		const rules = gameState.matchRules;
		if (!angler) return '';
		switch (rules.winConditionKey) {
			case 'weight':
				return formatWeight(angler.score);
			case 'count':
				return ''; // count is already shown in the fish badge
			case 'biggest':
				return formatWeight(angler.score);
			case 'points':
				return String(angler.score);
			default:
				return '';
		}
	});
	let scoreLabel = $derived.by(() => {
		const rules = gameState.matchRules;
		switch (rules.winConditionKey) {
			case 'weight':
				return 'weight';
			case 'count':
				return 'fish';
			case 'biggest':
				return 'best';
			case 'points':
				return 'pts';
			default:
				return 'score';
		}
	});
	let debugMode = $state(false);
	let debugEnabled = $derived(
		typeof localStorage !== 'undefined' && !!localStorage.getItem('jcmf-debug')
	);
	let intervalId: ReturnType<typeof setInterval> | null = null;
	let now = $state(Date.now());
	let lastSaveTime = $state(Date.now());
	let waitingForPlayers = $derived(
		gameState.phase === 'results' && isMulti && multiplayer.phase !== 'results'
	);
	let isWeighingIn = $derived(gameState.weighInEarlyActive && !gameState.timeExpired);
	let overlayHeading = $derived(isWeighingIn ? 'Weighed In Early' : "Time's Up!");

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
			? { bite: true, reeling: true, intro: true }
			: { bite: false, reeling: true, intro: false }
	);
	let tutorialCompleted = $derived(hintsConsumed.bite && hintsConsumed.reeling);

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

	function handleReelingResult(result: 'caught' | 'lineBroke' | 'fishGotAway') {
		if (mode === 'session') {
			hintsConsumed.reeling = true;
		}
		gameState.handleReelingOutcome(result);
		if (result === 'caught' && mode === 'match') {
			gameState.saveToStorage(prepState.venueName, prepState.lakeName, prepState.matchStartTime);
		}
	}

	function handleChangeTackle() {
		gameState.beginChangeTackle();
	}

	function handleDismissCaught() {
		if (!caughtDismissable) return;
		gameState.dismissCaught();
	}

	function handlePegClick() {
		if (playerPhase === 'bite') handleStrike();
		if (!wakeLock.active) acquireWakeLock();
	}

	let isMidGameChange = $derived(playerPhase === 'changing' && gameState.initialTackleChosen);

	function handleQuickChange(cast: string, strata: string) {
		const current = gameState.playerAngler?.tackle;
		if (!current) return;
		gameState.updateTackle({ ...current, castStrength: cast, strata });
		gameState.resetCast();
		gameState.cast();
	}

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
			gameState.forceExpire();
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
					score: 0,
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
			angler.tackle = { ...defaultTackle };
			angler.catch = [];
			angler.totalWeightOz = 0;
			angler.score = 0;
			angler.biggestFish = null;
		}
		gameState.onCatch = (info) => {
			multiplayer.sendCatch(info);
		};
		const venue = venues[0];
		const lake = venue.lakes[0];
		gameState.beginFishing([angler], venue, lake, multiplayer.timeLimitMinutes, {
			timeLimitMinutes: multiplayer.timeLimitMinutes,
			winConditionKey: multiplayer.winConditionKey,
			speciesFilterKind: multiplayer.speciesFilterKind
		});
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.code !== 'Space' || e.repeat || debugMode) return;
		e.preventDefault();
		const p = gameState.playerSnapshot?.phase;
		if (p === 'bite') handleStrike();
		if (p === 'caught') handleDismissCaught();
	}

	onMount(() => {
		startWakeLock();
		if (typeof window !== 'undefined' && debugEnabled) {
			window.__gameState = gameState;
			window.__multiplayer = multiplayer;
		}
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
					prepState.mode === 'match' ? prepState.timeLimitMinutes : undefined,
					prepState.mode === 'match' ? prepState.matchRules : undefined
				);
			}
		}

		intervalId = setInterval(() => {
			if (hintBlocking || waitingForPlayers) return;
			now = Date.now();
			gameState.tick(100);

			if (
				mode === 'match' &&
				gameState.phase === 'fishing' &&
				gameState.playerSnapshot?.phase !== 'reeling'
			) {
				const SAVE_INTERVAL_MS = 10_000;
				if (now - lastSaveTime >= SAVE_INTERVAL_MS) {
					lastSaveTime = now;
					gameState.saveToStorage(
						prepState.venueName,
						prepState.lakeName,
						prepState.matchStartTime
					);
				}
			}
		}, 100);

		return () => {
			stopWakeLock();
			if (intervalId) clearInterval(intervalId);
		};
	});
</script>

<svelte:window onkeydown={onKeydown} />

<svelte:head>
	<style>
		html,
		body {
			-webkit-user-select: none !important;
			user-select: none !important;
			-webkit-touch-callout: none !important;
			touch-action: manipulation !important;
		}
	</style>
</svelte:head>

<div class="min-h-dvh lg:flex lg:flex-row">
	<div class="flex flex-1 flex-col items-center gap-4 p-4">
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
				{#if playerPhase === 'caught' && lastEvent?.type === 'fishCaught'}
					{@const caughtSpecies = species.find((s) => s.name === lastEvent.species) ?? null}
					{@const qualifies = caughtSpecies
						? speciesFilterAccepts(gameState.matchRules.speciesFilterKind, caughtSpecies.name)
						: false}
					{#if caughtSpecies}
						<CaughtOverlay
							species={caughtSpecies}
							weightOz={lastEvent.weightOz}
							classificationLabel={lastEvent.classificationLabel}
							released={!qualifies}
							ondismiss={handleDismissCaught}
						/>
					{/if}
				{/if}
				{#if playerPhase === 'lost'}
					<LostOverlay message={statusMessage} />
				{/if}
				{#if currentHint}
					<div class="pointer-events-none absolute inset-0 flex items-center justify-center p-3">
						<div class="animate-fadeIn rounded-lg bg-black/40 px-4 py-2 text-center">
							<p class="whitespace-pre-line text-sm font-bold text-white">{currentHint}</p>
						</div>
					</div>
				{/if}
				{#if waitingForPlayers || isWeighingIn}
					<WaitingOverlay
						heading={overlayHeading}
						subtext="Waiting for other anglers to finish..."
					/>
				{/if}
			</div>
			{#if tackle}
				<ComboGridHud {tackle} onselect={handleQuickChange} />
			{/if}
			<div class="absolute top-3 left-3 flex items-start gap-1 rounded-lg bg-black/40 px-2 py-1">
				<div class="flex-1">
					<p class="text-sm font-semibold tracking-wide text-white/80">{venueName}</p>
					<p class="text-xs text-white/60">{lakeName}</p>
					<p class="text-lg font-bold text-white">Peg {pegName}</p>
				</div>
				{#if wakeLock.active}
					<span
						class="mt-1 h-2 w-2 shrink-0 rounded-full bg-green-400 shadow-[0_0_4px_var(--color-green-400)]"
					></span>
				{/if}
			</div>
			{#if (mode === 'match' || mode === 'multiplayer') && matchTimeDisplay}
				<div class="absolute top-3 right-3 rounded-lg bg-black/40 px-3 py-1.5">
					<p class="text-sm font-bold tabular-nums text-white/90">{matchTimeDisplay}</p>
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
			<span class="text-sm font-medium tabular-nums text-dark-teal">{statusMessage}</span>
		</div>

		<!-- Tackle display (clickable) -->
		{#if tackle}
			<button
				onclick={handleChangeTackle}
				class="w-full cursor-pointer rounded-2xl bg-white/70 p-3 text-left shadow-md transition-shadow hover:shadow-lg sm:max-w-sm"
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

		<!-- Match rules badges -->
		{#if mode === 'match' || mode === 'multiplayer'}
			{@const wcLabel = resolveWinCondition(gameState.matchRules.winConditionKey).name}
			{@const speciesLabel =
				gameState.matchRules.speciesFilterKind === 'all'
					? 'All Species'
					: gameState.matchRules.speciesFilterKind === 'silverfish'
						? 'Silver Fish'
						: gameState.matchRules.speciesFilterKind === 'predators'
							? 'Predators'
							: gameState.matchRules.speciesFilterKind === 'carps'
								? 'Carps'
								: 'Bottom Dwellers'}
			<div class="flex w-full max-w-sm items-center justify-center gap-2 -mb-6 z-10">
				<span class="rounded-full bg-dark-teal/60 px-3 py-1 text-xs font-medium text-white">
					{wcLabel}
				</span>
				<span class="rounded-full bg-dark-teal/60 px-3 py-1 text-xs font-medium text-white">
					{speciesLabel}
				</span>
			</div>
		{/if}

		<!-- Catch panel -->
		<CatchCard {catchList} {totalWeight} {biggestFish} {matchScore} {scoreLabel} />

		<!-- Finish button -->
		<div class="mt-auto flex justify-center pb-2">
			<button
				type="button"
				onclick={() => {
					if (mode === 'match') {
						if (playerPhase === 'reeling') return;
						if (gameState.timeExpired) {
							gameState.finishGame();
						} else {
							gameState.weighInEarly();
						}
					} else if (mode === 'multiplayer') {
						const isHost = multiplayer.hostName === multiplayer.playerName;
						if (
							isHost &&
							!confirm('As the host, leaving will end the match for everyone. Quit anyway?')
						)
							return;
						if (!isHost && !confirm('Leaving will forfeit your catch. Quit anyway?')) return;
						multiplayer.leave();
						gameState.reset();
						goto('/menu');
					} else {
						gameState.finishGame();
						goto('/results');
					}
				}}
				class="inline-flex min-h-11 cursor-pointer items-center justify-center rounded bg-secondary px-6 py-3 text-center text-white transition-colors
					{mode === 'match' && playerPhase === 'reeling' ? 'opacity-50' : 'hover:bg-secondary/80'}"
				disabled={mode === 'match' && playerPhase === 'reeling'}
			>
				{mode === 'multiplayer'
					? 'Quit and Leave Match'
					: mode === 'match'
						? 'Weigh in Early'
						: 'Pack Up and Go Home'}
			</button>
		</div>
	</div>

	{#if debugMode}
		<div class="hidden lg:block">
			<DebugPanel />
		</div>
	{/if}
</div>

<!-- Fixed debug toggle, top-right on desktop -->
{#if debugEnabled}
	<button
		onclick={toggleDebug}
		class="fixed top-4 right-4 z-50 hidden cursor-pointer rounded-lg bg-black/30 px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:bg-black/50 hover:text-white/80 lg:block"
	>
		{debugMode ? 'resume' : 'debug'}
	</button>
{/if}

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
