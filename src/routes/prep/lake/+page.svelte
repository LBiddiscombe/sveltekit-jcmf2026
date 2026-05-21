<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { gameState } from '$lib/game/state.svelte';
	import { modeFromSearchParams } from '$lib/game/prep-flow';
	import { venues } from '$lib/data';

	const venue = venues[0];
	const lake = venue.lakes[0];

	const lakeImages = import.meta.glob<string>('$lib/assets/images/lakes/*.jpeg', {
		eager: true,
		query: '?url',
		import: 'default'
	});

	const bgImage = lakeImages[`/src/lib/assets/images/lakes/${lake.image}`] ?? '';

	const mode = modeFromSearchParams(page.url.searchParams);
	if (mode === 'match') {
		gameState.startMatch();
	} else {
		gameState.startSession();
	}
	gameState.selectVenue(venue.name);
	gameState.selectLake(lake.name);

	function goToRules() {
		goto('/prep/rules');
	}
</script>

<div
	class="relative flex min-h-dvh flex-col bg-cover bg-center"
	style="background-image: url({bgImage})"
>
	<div class="absolute inset-0 bg-black/40"></div>
	<div class="relative z-10 flex flex-1 flex-col items-center justify-center gap-4 p-6">
		<p class="text-lg text-white/80">Welcome to</p>
		<h1 class="text-3xl font-bold text-white sm:text-4xl md:text-5xl">{venue.name}</h1>
		<p class="text-xl font-semibold text-white/90 sm:text-2xl">{lake.name}</p>
	</div>
	<div class="relative z-10 flex justify-center pb-12">
		<button
			onclick={goToRules}
			class="inline-flex min-h-[44px] items-center justify-center rounded bg-primary px-8 py-3 text-center text-white no-underline hover:bg-primary/80"
		>
			Next
		</button>
	</div>
</div>
