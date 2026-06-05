<script lang="ts">
	import { onMount } from 'svelte';
	import confetti from 'canvas-confetti';
	import type { AnglerState } from '$lib/game/prep-state.svelte';
	import type { CatchInfo } from '$lib/game/party/connection.svelte';
	import { rankAnglers, rankFromCatchEvents } from '$lib/game/ranker';
	import type { RankEntry } from '$lib/game/ranker';

	let {
		anglers,
		catchEvents,
		isMulti,
		multiPlayerName,
		multiPlayerAvatar,
		pegImg,
		botImg,
		formatWeight,
		winConditionKey = 'weight'
	}: {
		anglers: AnglerState[];
		catchEvents: CatchInfo[];
		isMulti: boolean;
		multiPlayerName: string;
		multiPlayerAvatar: string;
		pegImg: (f: string | undefined) => string;
		botImg: (f: string) => string;
		formatWeight: (oz: number) => string;
		winConditionKey?: string;
	} = $props();

	let sorted = $derived<RankEntry[]>(
		isMulti
			? rankFromCatchEvents(catchEvents, winConditionKey, multiPlayerName, multiPlayerAvatar)
			: rankAnglers(anglers, winConditionKey)
	);

	let first = $derived(sorted[0]);
	let second = $derived(sorted[1]);
	let third = $derived(sorted[2]);

	/** 4th place at index 0 (top of list), last place at end (bottom of list) */
	let rest = $derived(sorted.slice(3));

	let restRevealedFromEnd = $state(0);
	let thirdRevealed = $state(false);
	let secondRevealed = $state(false);
	let firstRevealed = $state(false);
	let winnerConfetti = $state(false);

	onMount(() => {
		let delay = 600;
		for (let i = 0; i < rest.length; i++) {
			setTimeout(() => (restRevealedFromEnd = i + 1), delay);
			delay += 800;
		}
		if (third) {
			setTimeout(() => (thirdRevealed = true), delay);
			delay += 1200;
		}
		if (second) {
			setTimeout(() => (secondRevealed = true), delay);
			delay += 1200;
		}
		if (first) {
			setTimeout(() => {
				firstRevealed = true;
				setTimeout(() => {
					winnerConfetti = true;
					confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
					setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { y: 0.5 } }), 400);
				}, 400);
			}, delay);
		}
	});

	function imgSrc(e: (typeof sorted)[number]): string {
		return e?.image ? botImg(e.image) : '';
	}

	function playerPeg(e: (typeof sorted)[number]): string {
		if (!isMulti && e.isPlayer && 'pegName' in e && e.pegName) {
			return pegImg(`jcs-match-${e.pegName}.jpeg`);
		}
		return '';
	}
</script>

<div class="w-full max-w-md">
	<!-- Podium: 2nd | 1st | 3rd -->
	{#if sorted.length > 0}
		<div class="flex items-end justify-center gap-2 sm:gap-3 mb-6">
			<!-- 2nd place -->
			{#if second}
				<div
					class="flex flex-1 flex-col items-center transition-all duration-700 ease-out {secondRevealed
						? 'translate-y-0 opacity-100'
						: 'translate-y-12 opacity-0'}"
				>
					<div class="mb-2 text-center">
						<div
							class="mx-auto h-14 w-14 overflow-hidden rounded-full border-2 border-white/50 shadow-md"
						>
							{#if !isMulti && second.image && imgSrc(second)}
								<img src={imgSrc(second)} alt="" class="h-full w-full object-cover" />
							{:else if playerPeg(second)}
								<img src={playerPeg(second)} alt="" class="h-full w-full object-cover" />
							{:else}
								<div
									class="flex h-full w-full items-center justify-center bg-primary/30 text-base font-bold text-dark-teal"
								>
									{second.name[0]}
								</div>
							{/if}
						</div>
						<p
							class="mt-1 max-w-24 truncate text-sm font-bold text-dark-teal {second.isPlayer
								? 'text-accent'
								: ''}"
						>
							{second.name}
							{#if second.isPlayer}
								<span class="text-xs text-accent/60">(You)</span>
							{/if}
						</p>
					</div>
					<div
						class="flex w-full flex-col items-center justify-end rounded-t-lg bg-primary/60 px-2 pb-2 pt-3"
						style="height: 120px"
					>
						<span class="text-2xl font-black text-white drop-shadow-md">🥈</span>
						<span
							class={winConditionKey === 'weight'
								? 'text-lg font-black text-white drop-shadow-md'
								: 'text-xs text-white/70'}>{formatWeight(second.weight)}</span
						>
						<span
							class={winConditionKey === 'count'
								? 'text-lg font-black text-white drop-shadow-md'
								: 'text-xs text-white/70'}>{second.fishCount} fish</span
						>
						{#if second.biggestFish}
							<span class="text-xs text-white/50">Best: {second.biggestFish.species}</span>
							<span
								class={winConditionKey === 'biggest'
									? 'text-lg font-black text-white drop-shadow-md'
									: 'text-xs text-white/50'}>{formatWeight(second.biggestFish.weightOz)}</span
							>
						{/if}
					</div>
				</div>
			{/if}

			<!-- 1st place -->
			{#if first}
				<div
					class="flex flex-1 flex-col items-center transition-all duration-700 ease-out {firstRevealed
						? 'translate-y-0 opacity-100'
						: 'translate-y-12 opacity-0'}"
				>
					<div class="mb-2 text-center">
						<div
							class="mx-auto h-14 w-14 overflow-hidden rounded-full border-2 border-accent shadow-md"
						>
							{#if !isMulti && first.image && imgSrc(first)}
								<img src={imgSrc(first)} alt="" class="h-full w-full object-cover" />
							{:else if playerPeg(first)}
								<img src={playerPeg(first)} alt="" class="h-full w-full object-cover" />
							{:else}
								<div
									class="flex h-full w-full items-center justify-center bg-accent/30 text-base font-bold text-accent"
								>
									{first.name[0]}
								</div>
							{/if}
						</div>
						<p
							class="mt-1 max-w-24 truncate text-sm font-bold text-dark-teal {first.isPlayer
								? 'text-accent'
								: ''}"
						>
							{first.name}
							{#if first.isPlayer}
								<span class="text-xs text-accent/60">(You)</span>
							{/if}
						</p>
					</div>
					<div
						class="flex w-full flex-col items-center justify-end rounded-t-lg bg-accent px-2 pb-2 pt-4"
						style="height: 160px"
					>
						<span class="text-2xl font-black text-white drop-shadow-md">🥇</span>
						<span
							class={winConditionKey === 'weight'
								? 'text-lg font-black text-white drop-shadow-md'
								: 'text-xs text-white/70'}>{formatWeight(first.weight)}</span
						>
						<span
							class={winConditionKey === 'count'
								? 'text-lg font-black text-white drop-shadow-md'
								: 'text-xs text-white/70'}>{first.fishCount} fish</span
						>
						{#if first.biggestFish}
							<span class="text-xs text-white/50">Best: {first.biggestFish.species}</span>
							<span
								class={winConditionKey === 'biggest'
									? 'text-lg font-black text-white drop-shadow-md'
									: 'text-xs text-white/50'}>{formatWeight(first.biggestFish.weightOz)}</span
							>
						{/if}
					</div>
				</div>
			{/if}

			<!-- 3rd place -->
			{#if third}
				<div
					class="flex flex-1 flex-col items-center transition-all duration-700 ease-out {thirdRevealed
						? 'translate-y-0 opacity-100'
						: 'translate-y-12 opacity-0'}"
				>
					<div class="mb-2 text-center">
						<div
							class="mx-auto h-14 w-14 overflow-hidden rounded-full border-2 border-white/50 shadow-md"
						>
							{#if !isMulti && third.image && imgSrc(third)}
								<img src={imgSrc(third)} alt="" class="h-full w-full object-cover" />
							{:else if playerPeg(third)}
								<img src={playerPeg(third)} alt="" class="h-full w-full object-cover" />
							{:else}
								<div
									class="flex h-full w-full items-center justify-center bg-primary/30 text-base font-bold text-dark-teal"
								>
									{third.name[0]}
								</div>
							{/if}
						</div>
						<p
							class="mt-1 max-w-24 truncate text-sm font-bold text-dark-teal {third.isPlayer
								? 'text-accent'
								: ''}"
						>
							{third.name}
							{#if third.isPlayer}
								<span class="text-xs text-accent/60">(You)</span>
							{/if}
						</p>
					</div>
					<div
						class="flex w-full flex-col items-center justify-end rounded-t-lg bg-muted/60 px-2 pb-2 pt-3"
						style="height: 100px"
					>
						<span class="text-2xl font-black text-white drop-shadow-md">🥉</span>
						<span
							class={winConditionKey === 'weight'
								? 'text-lg font-black text-white drop-shadow-md'
								: 'text-xs text-white/70'}>{formatWeight(third.weight)}</span
						>
						<span
							class={winConditionKey === 'count'
								? 'text-lg font-black text-white drop-shadow-md'
								: 'text-xs text-white/70'}>{third.fishCount} fish</span
						>
						{#if third.biggestFish}
							<span class="text-xs text-white/50">Best: {third.biggestFish.species}</span>
							<span
								class={winConditionKey === 'biggest'
									? 'text-lg font-black text-white drop-shadow-md'
									: 'text-xs text-white/50'}>{formatWeight(third.biggestFish.weightOz)}</span
							>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Rest list: last place up to 4th -->
	{#if rest.length > 0}
		<div class="space-y-1.5">
			{#each rest as entry, i (entry.name)}
				{@const isRevealed = rest.length - 1 - i < restRevealedFromEnd}
				<div
					class="flex items-center gap-3 rounded-lg transition-all duration-500 ease-out {isRevealed
						? 'translate-x-0 opacity-100'
						: '-translate-x-full opacity-0'}"
				>
					<div class="flex w-full items-center gap-3 rounded-lg bg-black/30 px-3 py-2.5">
						<span class="w-6 shrink-0 text-center text-base font-bold text-white/50">{i + 4}</span>
						<div class="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-white/20">
							{#if !isMulti && entry.image && imgSrc(entry)}
								<img src={imgSrc(entry)} alt="" class="h-full w-full object-cover" />
							{:else if playerPeg(entry)}
								<img src={playerPeg(entry)} alt="" class="h-full w-full object-cover" />
							{:else}
								<div
									class="flex h-full w-full items-center justify-center bg-primary/30 text-sm font-bold text-dark-teal"
								>
									{entry.name[0]}
								</div>
							{/if}
						</div>
						<span
							class="min-w-0 flex-1 truncate text-base {entry.isPlayer
								? 'font-bold text-white'
								: 'text-white/80'}"
						>
							{entry.name}
							{#if entry.isPlayer}
								<span class="text-xs text-white/50">(You)</span>
							{/if}
						</span>
						<div class="text-right shrink-0">
							<span
								class={winConditionKey === 'weight'
									? 'text-base font-bold text-white'
									: 'text-sm text-white/60'}>{formatWeight(entry.weight)}</span
							>
							<p
								class={winConditionKey === 'count'
									? 'text-base font-bold text-white'
									: 'text-sm text-white/60'}
							>
								{entry.fishCount} fish
							</p>
							{#if entry.biggestFish}
								<p
									class={winConditionKey === 'biggest'
										? 'text-base font-bold text-white'
										: 'text-sm text-white/60'}
								>
									Best: {formatWeight(entry.biggestFish.weightOz)}
									{entry.biggestFish.species}
								</p>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if winnerConfetti}
		<div class="fixed left-0 top-0 h-dvh w-dvw pointer-events-none z-50"></div>
	{/if}
</div>
