<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-6">
	<h1 class="text-4xl font-bold">Pick Venue</h1>
	<p class="text-lg text-gray-500">Select a fishing venue</p>
	<div class="rounded border p-4">
		<p class="font-semibold">JCs</p>
		<p class="text-sm text-gray-500">The original match fishing lake</p>
	</div>
	<button onclick={() => goto(`/prep/lake${$page.url.search}`)} class="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">
		Next
	</button>
</div>
