<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-6">
	<h1 class="text-4xl font-bold text-dark-teal">Pick Lake</h1>
	<p class="text-lg text-muted">Select a lake at JCs</p>
	<div class="rounded border border-olive bg-surface/30 p-4">
		<p class="font-semibold text-dark-teal">Match Lake</p>
		<p class="text-sm text-muted">8 pegs, mixed coarse species</p>
	</div>
	<button onclick={() => goto(`/prep/rules${$page.url.search}`)} class="rounded bg-primary px-6 py-2 text-white hover:bg-primary/80">
		Next
	</button>
</div>
