<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-6">
	<h1 class="text-4xl font-bold">Pick Lake</h1>
	<p class="text-lg text-gray-500">Select a lake at JCs</p>
	<div class="rounded border p-4">
		<p class="font-semibold">Match Lake</p>
		<p class="text-sm text-gray-500">8 pegs, mixed coarse species</p>
	</div>
	<button onclick={() => goto(`/prep/rules${$page.url.search}`)} class="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">
		Next
	</button>
</div>
