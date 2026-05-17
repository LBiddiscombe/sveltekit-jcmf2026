<script lang="ts">
	import { page } from '$app/state';

	let mode = $derived(page.url.searchParams.get('mode'));
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-6">
	<h1 class="text-4xl font-bold text-dark-teal">
		{mode === 'match' ? 'Match Results' : 'Session Results'}
	</h1>
	{#if mode === 'match'}
		<p class="text-lg text-muted">Leaderboard ranked by total catch weight</p>
		<div class="w-72 space-y-2">
			<div
				class="flex justify-between rounded border border-olive bg-surface/30 p-2 text-dark-teal"
			>
				<span>1. You</span><span>12 lb 8 oz</span>
			</div>
			<div
				class="flex justify-between rounded border border-olive bg-surface/30 p-2 text-dark-teal"
			>
				<span>2. Jack</span><span>9 lb 2 oz</span>
			</div>
			<div
				class="flex justify-between rounded border border-olive bg-surface/30 p-2 text-dark-teal"
			>
				<span>3. John</span><span>6 lb 14 oz</span>
			</div>
		</div>
	{:else}
		<p class="text-lg text-muted">Your catch — species, weight, count</p>
		<div class="w-72 space-y-2">
			<div
				class="flex justify-between rounded border border-olive bg-surface/30 p-2 text-dark-teal"
			>
				<span>Roach</span><span>3 @ 1 lb 8 oz</span>
			</div>
			<div
				class="flex justify-between rounded border border-olive bg-surface/30 p-2 text-dark-teal"
			>
				<span>Perch</span><span>1 @ 2 lb 4 oz</span>
			</div>
			<div
				class="flex justify-between rounded border border-olive bg-surface/30 p-2 text-dark-teal"
			>
				<span>Bream</span><span>1 @ 4 lb 12 oz</span>
			</div>
		</div>
	{/if}
	<a
		href="/menu"
		class="mt-4 inline-block rounded bg-primary px-6 py-2 text-center text-white no-underline hover:bg-primary/80"
	>
		Main Menu
	</a>
</div>
