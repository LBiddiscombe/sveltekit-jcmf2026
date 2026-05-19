<script lang="ts">
	import { page } from '$app/state';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { getLakes } from './lakes.remote';
	import { gameState } from '$lib/game/state.svelte';

	let data = $state<Awaited<ReturnType<typeof getLakes>>>();
	const pending = getLakes({ venue: String(page.url.searchParams.get('venue') ?? '') }).then(
		(result) => (data = result)
	);

	const venueImages = import.meta.glob<string>('$lib/assets/images/venues/*.jpeg', {
		eager: true,
		query: '?url',
		import: 'default'
	});

	const lakeImages = import.meta.glob<string>('$lib/assets/images/lakes/*.jpeg', {
		eager: true,
		query: '?url',
		import: 'default'
	});

	function venueImg(filename: string) {
		return venueImages[`/src/lib/assets/images/venues/${filename}`] ?? '';
	}

	function lakeImg(filename: string | null) {
		return filename ? (lakeImages[`/src/lib/assets/images/lakes/${filename}`] ?? '') : '';
	}

	function rulesUrl(lakeName: string) {
		const params = new SvelteURLSearchParams(page.url.searchParams);
		params.set('venue', data!.venue.name);
		params.set('lake', lakeName);
		return `/prep/rules?${params}`;
	}
</script>

{#await pending then _}
	{#if data}
		<div class="flex min-h-dvh flex-col items-center justify-center gap-6">
			<div class="flex items-center gap-4">
				<img src={venueImg(data.venue.image)} alt="" class="h-12 w-12 rounded object-cover" />
				<h1 class="text-2xl font-bold text-dark-teal sm:text-3xl md:text-4xl">{data.venue.name}</h1>
			</div>
			<p class="text-lg text-muted">Select a lake</p>

			<div class="flex flex-col gap-3">
				{#each data.lakes as lake (lake.name)}
					<a
						href={rulesUrl(lake.name)}
						onclick={() => gameState.setLake(lake.name)}
						class="flex w-full max-w-sm items-center gap-4 rounded border border-olive bg-surface/30 p-3 no-underline hover:bg-surface/60"
					>
						<img src={lakeImg(lake.image)} alt="" class="h-16 w-16 rounded object-cover" />
						<div>
							<p class="font-semibold text-dark-teal">{lake.name}</p>
							<p class="text-sm text-muted">
								{lake.pegCount} peg{lake.pegCount !== 1 ? 's' : ''}, {lake.speciesCount} species
							</p>
						</div>
					</a>
				{/each}
			</div>
		</div>
	{/if}
{/await}
