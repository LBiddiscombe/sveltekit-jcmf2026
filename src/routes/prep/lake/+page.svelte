<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { prepState } from '$lib/game/prep-state.svelte';
	import { modeFromSearchParams, prepRulesUrl } from '$lib/game/prep-flow';
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
		prepState.startMatch();
	} else {
		prepState.startSession();
	}
	prepState.selectVenue(venue.name);
	prepState.selectLake(lake.name);

	function goToRules() {
		goto(prepRulesUrl());
	}
</script>

<div class="flex min-h-dvh flex-col items-center justify-center p-6">
	<div class="flex w-full max-w-sm flex-col items-center gap-6">
		<div class="flex flex-col items-center gap-2">
			<p class="text-lg text-dark-teal/70">Welcome to</p>
			<h1 class="text-3xl font-bold text-dark-teal sm:text-4xl md:text-5xl">{venue.name}</h1>
			<p class="text-xl font-semibold text-dark-teal/90 sm:text-2xl">{lake.name}</p>
		</div>

		<div class="w-full overflow-hidden rounded-2xl shadow-lg">
			<img src={bgImage} alt="{lake.name} at {venue.name}" class="h-auto w-full" />
		</div>

		<button
			onclick={goToRules}
			class="inline-flex min-h-11 items-center justify-center rounded bg-primary px-8 py-3 text-center text-white no-underline hover:bg-primary/80"
		>
			Next
		</button>
	</div>
</div>
