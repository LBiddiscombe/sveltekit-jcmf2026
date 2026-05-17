<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { getVenues } from './venues.remote';

	const venueList = getVenues();
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-6">
	<h1 class="text-4xl font-bold text-dark-teal">Pick Venue</h1>
	<p class="text-lg text-muted">Select a fishing venue</p>

	{#await venueList then venues}
		<div class="flex flex-col gap-3">
			{#each venues as venue (venue.name)}
				<button
					onclick={() => goto(`/prep/lake?venue=${venue.name}${page.url.search}`)}
					class="w-72 cursor-pointer rounded border border-olive bg-surface/30 p-4 text-left hover:bg-surface/60"
				>
					<p class="font-semibold text-dark-teal">{venue.name}</p>
					<p class="text-sm text-muted">{venue.lakeCount} lake{venue.lakeCount !== 1 ? 's' : ''}</p>
				</button>
			{/each}
		</div>
	{/await}
</div>
