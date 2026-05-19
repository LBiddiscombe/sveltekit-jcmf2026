<script lang="ts">
	import { goto } from '$app/navigation';
	import { gameState } from '$lib/game/state.svelte';

	let venue = $derived(gameState.venue);

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

	function lakeImg(filename: string | undefined) {
		return filename ? (lakeImages[`/src/lib/assets/images/lakes/${filename}`] ?? '') : '';
	}

	async function selectLake(name: string) {
		try {
			gameState.selectLake(name);
			await goto('/prep/rules');
		} catch (error) {
			console.error('Failed to select lake', error);
		}
	}
</script>

{#if venue}
	<div class="flex min-h-dvh flex-col items-center justify-center gap-6">
		<div class="flex items-center gap-4">
			<img src={venueImg(venue.image)} alt="" class="h-12 w-12 rounded object-cover" />
			<h1 class="text-2xl font-bold text-dark-teal sm:text-3xl md:text-4xl">{venue.name}</h1>
		</div>
		<p class="text-lg text-muted">Select a lake</p>

		<div class="flex flex-col gap-3">
			{#each venue.lakes as lake (lake.name)}
				<button
					onclick={() => selectLake(lake.name)}
					class="flex w-full max-w-sm cursor-pointer items-center gap-4 rounded border border-olive bg-surface/30 p-3 text-left hover:bg-surface/60"
				>
					<img src={lakeImg(lake.image)} alt="" class="h-16 w-16 rounded object-cover" />
					<div>
						<p class="font-semibold text-dark-teal">{lake.name}</p>
						<p class="text-sm text-muted">
							{lake.pegs.length} peg{lake.pegs.length !== 1 ? 's' : ''}, {lake.species.length} species
						</p>
					</div>
				</button>
			{/each}
		</div>
	</div>
{:else}
	<div class="flex min-h-dvh flex-col items-center justify-center gap-4 p-4 text-center">
		<h1 class="text-2xl font-bold text-dark-teal sm:text-3xl">Choose a Venue First</h1>
		<p class="text-muted">Start from the menu so we can set up your Session or Match.</p>
		<a
			href="/menu"
			class="inline-flex min-h-[44px] items-center justify-center rounded bg-primary px-6 py-3 text-white no-underline hover:bg-primary/80"
		>
			Back to Menu
		</a>
	</div>
{/if}
