<script lang="ts">
	import { browser } from '$app/environment';
	import { venues, species } from '$lib/data';
	import { populatePeg } from '$lib/game/population';
	import type { FishData } from '$lib/game/population';
	import PopulationView from './PopulationView.svelte';

	const lake = venues[0].lakes[0];

	let fishPerPeg = $state(lake.fishPerPeg);
	let populations = $state<{ peg: (typeof lake.pegs)[0]; fish: FishData[] }[]>([]);
	let selectedPeg = $state<string | null>(null);

	function generate() {
		populations = lake.pegs.map((peg) => ({
			peg,
			fish: populatePeg(lake, peg, species, fishPerPeg)
		}));
		selectedPeg = null;
	}

	$effect(() => {
		if (browser) generate();
	});

	function selectPeg(name: string | null) {
		selectedPeg = name;
	}
</script>

<div class="mx-auto max-w-4xl px-4 py-6">
	<div class="mb-4">
		<h1 class="text-2xl font-bold text-dark-teal">Population Visualiser</h1>
		<p class="text-xs text-muted">
			{lake.name} — {lake.pegs.length} pegs — {species.length} species
		</p>
	</div>

	<div
		class="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-olive bg-white/70 px-4 py-3"
	>
		<div class="flex flex-col gap-1">
			<label for="fishPerPeg" class="text-xs font-medium text-dark-teal">Fish per peg</label>
			<input
				id="fishPerPeg"
				type="range"
				min="100"
				max="5000"
				step="100"
				bind:value={fishPerPeg}
				class="w-40 accent-accent"
			/>
			<span class="text-xs text-muted">{fishPerPeg} per peg</span>
		</div>
		<button
			onclick={generate}
			class="cursor-pointer rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
		>
			Repopulate
		</button>
	</div>

	{#if populations.length === 0}
		<p class="py-8 text-center text-sm text-muted">Generating population data...</p>
	{:else}
		<PopulationView {populations} speciesList={species} {selectedPeg} onselectPeg={selectPeg} />
	{/if}
</div>
