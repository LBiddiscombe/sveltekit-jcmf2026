<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let mode = $derived($page.url.searchParams.get('mode'));
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-6">
	<h1 class="text-4xl font-bold text-dark-teal">Rules</h1>

	{#if mode === 'session'}
		<p class="text-lg text-muted">Pick your peg</p>
		<div class="grid grid-cols-4 gap-2">
			{#each ['1', '2', '3', '4', '5', '6', '7', '8'] as peg}
				<button class="rounded border border-olive px-4 py-2 text-dark-teal hover:bg-surface/50">{peg}</button>
			{/each}
		</div>
	{:else}
		<p class="text-lg text-muted">Set match time (minutes)</p>
		<input type="number" value={60} class="rounded border border-olive px-4 py-2 text-center text-dark-teal" />
	{/if}

	<button onclick={() => goto(`/prep/tackle${$page.url.search}`)} class="mt-4 rounded bg-primary px-6 py-2 text-white hover:bg-primary/80">
		Next
	</button>
</div>
