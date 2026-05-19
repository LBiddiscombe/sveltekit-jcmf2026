<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { getVenues } from './venues.remote';
	import { gameState } from '$lib/game/state.svelte';

	type VenueSummary = { name: string; image: string; lakeCount: number };
	let venues = $state<VenueSummary[]>();
	let redirected = $state(false);
	const pending = getVenues().then((v) => (venues = v));

	function selectVenue(name: string) {
		const mode = (page.url.searchParams.get('mode') ?? 'session') as 'session' | 'match';
		gameState.init(mode);
		gameState.setVenue(name);
		const params = new SvelteURLSearchParams(page.url.searchParams);
		params.set('venue', name);
		goto(`/prep/lake?${params}`);
	}

	$effect(() => {
		if (browser && venues && venues.length === 1 && !redirected) {
			redirected = true;
			selectVenue(venues[0].name);
		}
	});

	const venueImages = import.meta.glob<string>('$lib/assets/images/venues/*.jpeg', {
		eager: true,
		query: '?url',
		import: 'default'
	});
</script>

{#await pending then _}
	{#if venues && venues.length > 1}
		<div class="flex min-h-screen flex-col items-center justify-center gap-6">
			<h1 class="text-4xl font-bold text-dark-teal">Pick Venue</h1>
			<p class="text-lg text-muted">Select a fishing venue</p>

			<div class="flex flex-col gap-3">
				{#each venues as venue (venue.name)}
					<button
						onclick={() => selectVenue(venue.name)}
						class="flex w-80 cursor-pointer items-center gap-4 rounded border border-olive bg-surface/30 p-3 text-left hover:bg-surface/60"
					>
						<img
							src={venueImages[`/src/lib/assets/images/venues/${venue.image}`] ?? ''}
							alt=""
							class="h-16 w-16 rounded object-cover"
						/>
						<div>
							<p class="font-semibold text-dark-teal">{venue.name}</p>
							<p class="text-sm text-muted">
								{venue.lakeCount} lake{venue.lakeCount !== 1 ? 's' : ''}
							</p>
						</div>
					</button>
				{/each}
			</div>

			<a
				href={`/prep/lake?${page.url.searchParams.toString()}`}
				class="inline-block rounded bg-primary px-6 py-2 text-center text-white no-underline hover:bg-primary/80"
			>
				Next
			</a>
		</div>
	{/if}
{/await}
