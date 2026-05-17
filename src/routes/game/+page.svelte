<script lang="ts">
	import { page } from '$app/state';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	let mode = $derived(page.url.searchParams.get('mode'));

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
