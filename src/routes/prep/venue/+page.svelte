<script lang="ts">
	import { page } from '$app/state';
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-6">
	<h1 class="text-4xl font-bold text-dark-teal">Pick Venue</h1>
	<p class="text-lg text-muted">Select a fishing venue</p>
	<div class="rounded border border-olive bg-surface/30 p-4">
		<p class="font-semibold text-dark-teal">JCs</p>
		<p class="text-sm text-muted">The original match fishing lake</p>
	</div>
	<a
		href={`/prep/lake${page.url.search}`}
		class="inline-block rounded bg-primary px-6 py-2 text-center text-white no-underline hover:bg-primary/80"
	>
		Next
	</a>
</div>
