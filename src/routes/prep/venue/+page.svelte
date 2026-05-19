<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { getVenues } from './venues.remote';
	import { gameState } from '$lib/game/state.svelte';
	import { modeFromSearchParams } from '$lib/game/prep-flow';

	type VenueSummary = { name: string; image: string; lakeCount: number };
	let venues = $state<VenueSummary[]>();
	const pending = getVenues().then((v) => (venues = v));

	async function selectVenue(name: string) {
		try {
			const mode = modeFromSearchParams(page.url.searchParams);
			if (mode === 'match') {
				gameState.startMatch();
			} else {
				gameState.startSession();
			}
			gameState.selectVenue(name);
			await goto('/prep/lake');
		} catch (error) {
			console.error('Failed to select venue', error);
		}
	}

	const venueImages = import.meta.glob<string>('$lib/assets/images/venues/*.jpeg', {
		eager: true,
		query: '?url',
		import: 'default'
	});
</script>

{#await pending then _}
	{#if venues && venues.length > 0}
		<div class="flex min-h-dvh flex-col items-center justify-center gap-6">
			<h1 class="text-2xl font-bold text-dark-teal sm:text-3xl md:text-4xl">
				{venues.length === 1 ? 'Venue' : 'Pick Venue'}
			</h1>
			<p class="text-lg text-muted">
				{venues.length === 1 ? 'Continue to this venue' : 'Select a fishing venue'}
			</p>

			<div class="flex flex-col gap-3">
				{#each venues as venue (venue.name)}
					<button
						onclick={() => selectVenue(venue.name)}
						class="flex w-full max-w-sm cursor-pointer items-center gap-4 rounded border border-olive bg-surface/30 p-3 text-left hover:bg-surface/60"
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

		</div>
	{/if}
{/await}
