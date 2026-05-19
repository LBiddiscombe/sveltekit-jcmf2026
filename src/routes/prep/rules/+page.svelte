<script lang="ts">
	import { goto } from '$app/navigation';
	import { gameState } from '$lib/game/state.svelte';

	let mode = $derived(gameState.mode);
	let pegs = $derived(gameState.lake?.pegs ?? []);
	let selectedPeg = $state<string | null>(gameState.playerPeg ?? null);
	let selectedPegData = $derived(pegs.find((p) => p.name === selectedPeg) ?? null);
	let matchMinutes = $state(gameState.timeLimitMinutes ?? 60);

	const pegImages = import.meta.glob<string>('$lib/assets/images/pegs/*.jpeg', {
		eager: true,
		query: '?url',
		import: 'default'
	});

	function pegImg(filename: string | undefined) {
		return filename ? (pegImages[`/src/lib/assets/images/pegs/${filename}`] ?? '') : '';
	}

	function selectPeg(name: string) {
		selectedPeg = name;
		gameState.assignPeg(name);
	}

	function goToTackle() {
		goto('/prep/tackle');
	}

	function continueMatch() {
		gameState.setMatchTimeLimit(matchMinutes);
		goto('/prep/tackle');
	}
</script>

<div class="flex min-h-dvh flex-col items-center justify-center gap-6">
	<h1 class="text-2xl font-bold text-dark-teal sm:text-3xl md:text-4xl">Rules</h1>

	{#if mode === 'session'}
		<p class="text-lg text-muted">Pick your peg</p>

		<div class="grid w-full max-w-md grid-cols-3 gap-3 sm:grid-cols-4">
			{#each pegs as peg (peg.name)}
				<button
					onclick={() => selectPeg(peg.name)}
					class="relative aspect-square w-3/4 cursor-pointer justify-self-center overflow-hidden rounded border-2 transition-all sm:w-full {selectedPeg ===
					peg.name
						? 'scale-105 border-primary ring-2 ring-primary ring-offset-2'
						: 'border-olive hover:border-muted'}"
				>
					{#if pegImg(peg.image)}
						<img src={pegImg(peg.image)} alt="" class="h-full w-full object-cover" />
					{:else}
						<div
							class="flex h-full w-full items-center justify-center border border-dashed border-muted/30 bg-surface/20"
						>
							<span class="text-4xl font-bold text-muted">{peg.name}</span>
						</div>
					{/if}
					<div
						class="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/70 to-transparent px-2 pt-6 pb-1.5"
					>
						<span class="text-sm font-semibold text-white">Peg {peg.name}</span>
					</div>
				</button>
			{/each}
		</div>

		{#if selectedPegData}
			<div class="w-full max-w-md rounded border border-olive bg-surface/30 p-4">
				<p class="text-sm leading-relaxed text-dark-teal">{selectedPegData.description}</p>
			</div>
		{/if}

		<button
			onclick={goToTackle}
			disabled={selectedPeg === null}
			class="inline-flex min-h-[44px] items-center justify-center rounded bg-primary px-6 py-3 text-center text-white no-underline hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-50"
		>
			Next
		</button>
	{:else}
		<p class="text-lg text-muted">Set match time (minutes)</p>
		<input
			type="number"
			bind:value={matchMinutes}
			min={1}
			class="rounded border border-olive px-4 py-2 text-center text-dark-teal"
		/>

		<button
			onclick={continueMatch}
			class="inline-flex min-h-[44px] items-center justify-center rounded bg-primary px-6 py-3 text-center text-white no-underline hover:bg-primary/80"
		>
			Next
		</button>
	{/if}
</div>
