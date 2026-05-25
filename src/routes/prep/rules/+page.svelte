<script lang="ts">
	import { goto } from '$app/navigation';
	import { prepState } from '$lib/game/prep-state.svelte';
	import { prepTackleUrl, prepDrawUrl } from '$lib/game/prep-flow';

	let mode = $derived(prepState.mode);
	let pegs = $derived(prepState.lake?.pegs ?? []);
	let selectedPeg = $state<string | null>(prepState.playerPeg ?? null);
	let selectedPegData = $derived(pegs.find((p) => p.name === selectedPeg) ?? null);

	const timePresets = [1, 5, 10, 20, 30, 60];
	let selectedMinutes = $state<number | null>(null);

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
		prepState.assignPeg(name);
	}

	function goToTackle() {
		goto(prepTackleUrl());
	}

	function selectTime(minutes: number) {
		selectedMinutes = minutes;
		prepState.setMatchTimeLimit(minutes);
		goto(prepDrawUrl());
	}

	$effect(() => {
		if (mode === 'session' && pegs.length > 0 && selectedPeg === null) {
			selectPeg(pegs[0].name);
		}
	});
</script>

{#if mode === 'session'}
	<div class="flex min-h-dvh flex-col items-center gap-3 p-4">
		<h1 class="text-xl font-bold text-dark-teal sm:text-2xl">Pick Your Peg</h1>
		<p class="text-sm text-muted">{prepState.lakeName}</p>

		{#if selectedPegData}
			<div
				class="flex w-full max-w-sm items-start gap-3 rounded-xl border-2 border-primary bg-white p-3"
			>
				<div class="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface/40 sm:h-24 sm:w-24">
					{#if pegImg(selectedPegData.image)}
						<img src={pegImg(selectedPegData.image)} alt="" class="h-full w-full object-cover" />
					{:else}
						<div class="flex h-full w-full items-center justify-center">
							<span class="text-2xl font-bold text-muted">{selectedPegData.name}</span>
						</div>
					{/if}
				</div>
				<div class="min-w-0">
					<div class="mb-1 flex items-center gap-2">
						<span class="rounded bg-primary/20 px-1.5 py-0.5 text-xs font-semibold text-primary"
							>Your Peg</span
						>
						<span class="text-sm font-bold text-dark-teal">Peg {selectedPegData.name}</span>
					</div>
					<p class="text-xs leading-relaxed text-dark-teal">
						{selectedPegData.description}
					</p>
				</div>
			</div>
		{/if}

		<div class="grid w-full max-w-sm grid-cols-2 gap-2 sm:grid-cols-3">
			{#each pegs as peg (peg.name)}
				<button
					onclick={() => selectPeg(peg.name)}
					class="flex cursor-pointer items-center gap-2 rounded-lg border p-2 transition-all {selectedPeg ===
					peg.name
						? 'scale-105 border-primary ring-2 ring-primary ring-offset-2'
						: 'border-olive bg-surface/20 hover:bg-surface/40'}"
				>
					<div class="h-8 w-8 shrink-0 overflow-hidden rounded bg-surface/40">
						{#if pegImg(peg.image)}
							<img src={pegImg(peg.image)} alt="" class="h-full w-full object-cover" />
						{:else}
							<div class="flex h-full w-full items-center justify-center">
								<span class="text-xs font-bold text-muted">{peg.name}</span>
							</div>
						{/if}
					</div>
					<div class="min-w-0">
						<p class="text-xs font-semibold text-dark-teal">Peg {peg.name}</p>
					</div>
				</button>
			{/each}
		</div>

		<div class="mt-auto flex justify-center pb-2">
			<button
				onclick={goToTackle}
				class="inline-flex min-h-11 items-center justify-center rounded bg-primary px-6 py-3 text-center text-white no-underline hover:bg-primary/80"
			>
				Next
			</button>
		</div>
	</div>
{:else}
	<div class="flex min-h-dvh flex-col items-center justify-center gap-6 p-4">
		<h1 class="text-2xl font-bold text-dark-teal sm:text-3xl md:text-4xl">Rules</h1>
		<p class="text-lg text-muted">Match duration</p>

		<div class="flex w-full max-w-sm flex-col gap-3">
			{#each timePresets as minutes (minutes)}
				<button
					onclick={() => selectTime(minutes)}
					class="w-full cursor-pointer rounded-xl border border-olive bg-surface/30 p-4 text-left transition-all hover:bg-surface/60 {selectedMinutes ===
					minutes
						? 'scale-105 border-primary ring-2 ring-primary ring-offset-2'
						: ''}"
				>
					<p class="text-center text-lg font-semibold text-dark-teal">{minutes} minute{minutes === 1 ? '' : 's'}</p>
				</button>
			{/each}
		</div>
	</div>
{/if}
