<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let mode = $derived($page.url.searchParams.get('mode'));
	let returnTo = $derived($page.url.searchParams.get('returnTo'));
	let isMidGame = $derived(returnTo !== null);
	let buttonLabel = $derived(isMidGame ? 'Back to Fishing' : 'Start Fishing');
	let target = $derived(isMidGame ? returnTo! : `/game${$page.url.search}`);
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-6">
	<h1 class="text-4xl font-bold">{isMidGame ? 'Change Tackle' : 'Choose Tackle & Bait'}</h1>
	<p class="text-lg text-gray-500">Select your rod, reel, line, hook, and bait</p>
	<div class="grid grid-cols-2 gap-4 text-sm">
		<div class="rounded border p-3"><p class="font-semibold">Rod</p><p class="text-gray-500">Float</p></div>
		<div class="rounded border p-3"><p class="font-semibold">Reel</p><p class="text-gray-500">Fixed Spool</p></div>
		<div class="rounded border p-3"><p class="font-semibold">Line</p><p class="text-gray-500">4 lb</p></div>
		<div class="rounded border p-3"><p class="font-semibold">Hook</p><p class="text-gray-500">16</p></div>
		<div class="col-span-2 rounded border p-3"><p class="font-semibold">Bait</p><p class="text-gray-500">Maggot</p></div>
	</div>
	<div class="flex gap-3">
		{#if isMidGame}
			<button onclick={() => goto(returnTo!)} class="rounded bg-gray-500 px-6 py-2 text-white hover:bg-gray-600">
				Cancel
			</button>
		{/if}
		<button onclick={() => goto(target)} class="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">
			{buttonLabel}
		</button>
	</div>
</div>
