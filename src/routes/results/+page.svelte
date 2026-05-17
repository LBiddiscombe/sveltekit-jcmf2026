<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let mode = $derived($page.url.searchParams.get('mode'));
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-6">
	<h1 class="text-4xl font-bold">{mode === 'match' ? 'Match Results' : 'Session Results'}</h1>
	{#if mode === 'match'}
		<p class="text-lg text-gray-500">Leaderboard ranked by total catch weight</p>
		<div class="w-72 space-y-2">
			<div class="flex justify-between rounded border p-2"><span>1. You</span><span>12 lb 8 oz</span></div>
			<div class="flex justify-between rounded border p-2"><span>2. Jack</span><span>9 lb 2 oz</span></div>
			<div class="flex justify-between rounded border p-2"><span>3. John</span><span>6 lb 14 oz</span></div>
		</div>
	{:else}
		<p class="text-lg text-gray-500">Your catch — species, weight, count</p>
		<div class="w-72 space-y-2">
			<div class="flex justify-between rounded border p-2"><span>Roach</span><span>3 @ 1 lb 8 oz</span></div>
			<div class="flex justify-between rounded border p-2"><span>Perch</span><span>1 @ 2 lb 4 oz</span></div>
			<div class="flex justify-between rounded border p-2"><span>Bream</span><span>1 @ 4 lb 12 oz</span></div>
		</div>
	{/if}
	<button onclick={() => goto('/menu')} class="mt-4 rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">
		Main Menu
	</button>
</div>
