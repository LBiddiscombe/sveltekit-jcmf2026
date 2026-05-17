<script lang="ts">
	import { goto } from '$app/navigation';
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-6">
	<h1 class="text-4xl font-bold">Main Menu</h1>
	<p class="text-lg text-gray-500">Choose your mode</p>
	<div class="flex flex-col gap-3">
		<button onclick={() => goto('/prep/venue?mode=session')} class="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">
			Go Fishing
		</button>
		<button onclick={() => goto('/prep/venue?mode=match')} class="rounded bg-green-600 px-6 py-2 text-white hover:bg-green-700">
			Host Match
		</button>
	</div>
</div>
