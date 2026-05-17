<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let mode = $derived($page.url.searchParams.get('mode'));
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-6">
	<h1 class="text-4xl font-bold">Rules</h1>

	{#if mode === 'session'}
		<p class="text-lg text-gray-500">Pick your peg</p>
		<div class="grid grid-cols-4 gap-2">
			{#each ['1', '2', '3', '4', '5', '6', '7', '8'] as peg}
				<button class="rounded border px-4 py-2 hover:bg-blue-100">Peg {peg}</button>
			{/each}
		</div>
	{:else}
		<p class="text-lg text-gray-500">Set match time (minutes)</p>
		<input type="number" value={60} class="rounded border px-4 py-2 text-center" />
	{/if}

	<button onclick={() => goto(`/prep/tackle${$page.url.search}`)} class="mt-4 rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">
		Next
	</button>
</div>
