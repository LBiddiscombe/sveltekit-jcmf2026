<script lang="ts">
	import { page } from '$app/state';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { gameState } from '$lib/game/state.svelte';

	let mode = $derived(page.url.searchParams.get('mode'));
	let venueName = $derived(gameState.venueName);
	let lakeName = $derived(gameState.lakeName);
	let pegName = $derived(gameState.playerPeg);

	function tackleUrl() {
		const p = new SvelteURLSearchParams(page.url.searchParams);
		p.set('returnTo', `/game${page.url.search}`);
		return `/prep/tackle?${p.toString()}`;
	}
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-6">
	<h1 class="text-4xl font-bold text-dark-teal">
		{mode === 'match' ? 'Match in Progress' : 'Fishing'}
	</h1>
	<p class="text-lg text-muted">The fishing loop — cast, wait, strike, reel, net</p>

	<div class="flex items-center gap-3 rounded border border-olive bg-surface/30 px-5 py-3">
		<div
			class="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary"
		>
			{pegName}
		</div>
		<div>
			<p class="text-sm text-muted">{venueName} &middot; {lakeName}</p>
			<p class="font-semibold text-dark-teal">Peg {pegName}</p>
		</div>
	</div>

	<div class="flex flex-col gap-3">
		<a
			href={tackleUrl()}
			class="inline-block rounded bg-accent px-6 py-2 text-center text-white no-underline hover:bg-accent/80"
		>
			Change Tackle
		</a>
		<a
			href={`/results${page.url.search}`}
			class="inline-block rounded bg-secondary px-6 py-2 text-center text-white no-underline hover:bg-secondary/80"
		>
			{mode === 'match' ? 'End Match' : 'Finish Session'}
		</a>
	</div>
</div>
