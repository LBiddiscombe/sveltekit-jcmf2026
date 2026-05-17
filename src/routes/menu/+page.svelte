<script lang="ts">
	import { goto } from '$app/navigation';
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-6">
	<h1 class="text-4xl font-bold text-dark-teal">Main Menu</h1>
	<p class="text-lg text-muted">Choose your mode</p>
	<div class="flex flex-col gap-3">
		<button onclick={() => goto('/prep/venue?mode=session')} class="rounded bg-primary px-6 py-2 text-white hover:bg-primary/80">
			Go Fishing
		</button>
		<button onclick={() => goto('/prep/venue?mode=match')} class="rounded bg-secondary px-6 py-2 text-white hover:bg-secondary/80">
			Host Match
		</button>
	</div>
</div>
