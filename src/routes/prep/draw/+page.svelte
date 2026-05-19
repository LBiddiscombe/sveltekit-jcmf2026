<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Peg } from '$lib/data';
	import { gameState } from '$lib/game/state.svelte';
	import { onMount } from 'svelte';

	let mode = $derived(gameState.mode);
	let minutes = $derived(gameState.timeLimitMinutes);

	let playerPeg = $state<Peg | undefined>(undefined);
	let botAnglers = $state<{ name: string; pegName: string; pegImage: string | undefined }[]>([]);
	let playerRevealed = $state(false);
	let visibleBotCount = $state(0);
	let allRevealed = $derived(
		botAnglers.length > 0 ? visibleBotCount >= botAnglers.length : playerRevealed
	);

	let hasError = $state(false);

	const pegImages = import.meta.glob<string>('$lib/assets/images/pegs/*.jpeg', {
		eager: true,
		query: '?url',
		import: 'default'
	});

	function pegImg(filename: string | undefined): string {
		return filename ? (pegImages[`/src/lib/assets/images/pegs/${filename}`] ?? '') : '';
	}

	onMount(() => {
		if (mode !== 'match' || !gameState.lake) {
			hasError = true;
			return;
		}

		const timeout = setTimeout(() => {
			gameState.drawMatch();

			const peg = gameState.lake?.pegs.find((p) => p.name === gameState.playerPeg);
			playerPeg = peg;

			botAnglers = gameState.anglers
				.filter((a) => !a.isPlayer)
				.map((a) => ({
					name: a.name,
					pegName: a.pegName,
					pegImage: gameState.lake?.pegs.find((p) => p.name === a.pegName)?.image
				}))
				.sort((a, b) => Number(a.pegName) - Number(b.pegName));

			playerRevealed = true;

			if (botAnglers.length > 0) {
				let count = 0;
				const interval = setInterval(() => {
					count++;
					visibleBotCount = count;
					if (count >= botAnglers.length) {
						clearInterval(interval);
					}
				}, 300);
			}
		}, 500);

		return () => clearTimeout(timeout);
	});

	function goToTackle() {
		goto('/prep/tackle');
	}
</script>

{#if hasError}
	<div class="flex min-h-dvh flex-col items-center justify-center gap-4 p-4 text-center">
		<h1 class="text-2xl font-bold text-dark-teal sm:text-3xl">No Match in Progress</h1>
		<p class="text-muted">Start a match from the menu to see the draw.</p>
		<a
			href="/menu"
			class="inline-flex min-h-[44px] items-center justify-center rounded bg-primary px-6 py-3 text-white no-underline hover:bg-primary/80"
		>
			Back to Menu
		</a>
	</div>
{:else}
	<div class="flex min-h-dvh flex-col items-center gap-3 p-4">
		<h1 class="text-xl font-bold text-dark-teal sm:text-2xl">Peg Draw</h1>
		<p class="text-sm text-muted">{gameState.lakeName} &middot; {minutes} min</p>

		{#if playerPeg && playerRevealed}
			<div
				class="animate-fade-in-up flex w-full max-w-sm items-start gap-3 rounded-xl border-2 border-primary bg-surface/30 p-3"
			>
				<div class="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface/40 sm:h-24 sm:w-24">
					{#if pegImg(playerPeg.image)}
						<img src={pegImg(playerPeg.image)} alt="" class="h-full w-full object-cover" />
					{:else}
						<div class="flex h-full w-full items-center justify-center">
							<span class="text-2xl font-bold text-muted">{playerPeg.name}</span>
						</div>
					{/if}
				</div>
				<div class="min-w-0">
					<div class="mb-1 flex items-center gap-2">
						<span class="rounded bg-primary/20 px-1.5 py-0.5 text-xs font-semibold text-primary"
							>Your Peg</span
						>
						<span class="text-sm font-bold text-dark-teal">Peg {playerPeg.name}</span>
					</div>
					<p class="line-clamp-3 text-xs leading-relaxed text-dark-teal sm:line-clamp-4">
						{playerPeg.description}
					</p>
				</div>
			</div>
		{/if}

		{#if botAnglers.length > 0}
			<div class="grid w-full max-w-sm grid-cols-2 gap-2 sm:grid-cols-3">
				{#each botAnglers as bot, i (bot.name)}
					{#if visibleBotCount > i}
						<div
							class="animate-fade-in-up flex items-center gap-2 rounded-lg border border-olive bg-surface/20 p-2"
						>
							<div class="h-8 w-8 shrink-0 overflow-hidden rounded bg-surface/40">
								{#if pegImg(bot.pegImage)}
									<img src={pegImg(bot.pegImage)} alt="" class="h-full w-full object-cover" />
								{:else}
									<div class="flex h-full w-full items-center justify-center">
										<span class="text-xs font-bold text-muted">{bot.pegName}</span>
									</div>
								{/if}
							</div>
							<div class="min-w-0">
								<p class="truncate text-xs font-semibold text-dark-teal">{bot.name}</p>
								<p class="text-xs text-muted">Peg {bot.pegName}</p>
							</div>
						</div>
					{/if}
				{/each}
			</div>
		{/if}

		<div class="mt-auto flex justify-center pb-2">
			{#if allRevealed}
				<button
					onclick={goToTackle}
					class="animate-fade-in-up inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded bg-primary px-6 py-3 text-center text-white no-underline hover:bg-primary/80"
				>
					Next
				</button>
			{/if}
		</div>
	</div>
{/if}

<style>
	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	:global(.animate-fade-in-up) {
		animation: fadeInUp 0.4s ease-out both;
	}
</style>
