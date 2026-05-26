<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Peg } from '$lib/data';
	import { prepState } from '$lib/game/prep-state.svelte';
	import { onMount } from 'svelte';

	let mode = $derived(prepState.mode);
	let minutes = $derived(prepState.timeLimitMinutes);
	let venueName = $derived(prepState.venueName);
	let lakeName = $derived(prepState.lakeName);

	let playerPeg = $state<Peg | undefined>(undefined);
	let botAnglers = $state<{ name: string; pegName: string; pegImage: string | undefined }[]>([]);
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
		if (mode !== 'match' || !prepState.lake) {
			hasError = true;
			return;
		}

		prepState.drawMatch();

		playerPeg = prepState.lake?.pegs.find((p) => p.name === prepState.playerPeg);

		botAnglers = prepState.anglers
			.filter((a) => !a.isPlayer)
			.map((a) => ({
				name: a.name,
				pegName: a.pegName,
				pegImage: prepState.lake?.pegs.find((p) => p.name === a.pegName)?.image
			}))
			.sort((a, b) => Number(a.pegName) - Number(b.pegName));
	});
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
{:else if playerPeg}
	<div class="flex min-h-dvh flex-col overflow-hidden pb-4 pt-6">
		<div class="mx-auto flex w-full max-w-sm shrink-0 flex-col items-center gap-3 px-4 pb-3">
			<div class="relative overflow-hidden rounded-xl">
				{#if pegImg(playerPeg.image)}
					<img src={pegImg(playerPeg.image)} alt="" class="h-full w-full object-contain" />
				{:else}
					<div class="flex h-full w-full items-center justify-center bg-surface/20">
						<span class="text-6xl font-bold text-muted">{playerPeg.name}</span>
					</div>
				{/if}
				<div class="absolute top-3 left-3 rounded-lg bg-black/40 px-2 py-1">
					<p class="text-sm font-semibold tracking-wide text-white/80 uppercase">{venueName}</p>
					<p class="text-xs text-white/60">{lakeName}</p>
					<p class="text-lg font-bold text-white">Peg {playerPeg.name}</p>
				</div>
			</div>
			<p class="min-h-26 text-center text-xs leading-relaxed text-dark-teal/80">
				{playerPeg.description}
			</p>
		</div>

		<div
			class="flex shrink-0 gap-2 overflow-x-auto px-4 pb-3 sm:overflow-visible sm:justify-center sm:-mx-4 sm:px-0"
			style="scrollbar-width:none"
		>
			{#each botAnglers as bot (bot.pegName)}
				<div class="shrink-0">
					<div class="h-20 w-20 overflow-hidden rounded-xl border-2 border-white/30 shadow-md">
						{#if pegImg(bot.pegImage)}
							<img src={pegImg(bot.pegImage)} alt="" class="h-full w-full object-cover" />
						{:else}
							<div class="flex h-full w-full items-center justify-center bg-surface/60">
								<span class="text-lg font-bold text-dark-teal">{bot.pegName}</span>
							</div>
						{/if}
					</div>
					<p class="mt-1 truncate text-center text-xs font-semibold text-dark-teal">{bot.name}</p>
					<p class="text-center text-xs text-muted">Peg {bot.pegName}</p>
				</div>
			{/each}
		</div>

		<div class="mx-auto mt-auto w-full max-w-sm px-4">
			<button
				onclick={() => {
					prepState.startMatchTimer();
					goto('/prep/tackle?timed=1');
				}}
				class="inline-flex w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent py-3 text-base font-semibold text-white shadow-lg transition-all hover:opacity-90 active:scale-[0.98]"
			>
				Start Match
				<span class="text-lg">&rarr;</span>
			</button>
		</div>
	</div>
{/if}
