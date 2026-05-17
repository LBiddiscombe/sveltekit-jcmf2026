<script lang="ts">
	import { page } from '$app/state';

	let returnTo = $derived(page.url.searchParams.get('returnTo'));
	let isMidGame = $derived(returnTo !== null);
	let buttonLabel = $derived(isMidGame ? 'Back to Fishing' : 'Start Fishing');
	let target = $derived(isMidGame ? returnTo! : `/game${page.url.search}`);
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-6">
	<h1 class="text-4xl font-bold text-dark-teal">
		{isMidGame ? 'Change Tackle' : 'Choose Tackle & Bait'}
	</h1>
	<p class="text-lg text-muted">Select your rod, reel, line, hook, and bait</p>
	<div class="grid grid-cols-2 gap-4 text-sm">
		<div class="rounded border border-olive bg-surface/30 p-3">
			<p class="font-semibold text-dark-teal">Rod</p>
			<p class="text-muted">Float</p>
		</div>
		<div class="rounded border border-olive bg-surface/30 p-3">
			<p class="font-semibold text-dark-teal">Reel</p>
			<p class="text-muted">Fixed Spool</p>
		</div>
		<div class="rounded border border-olive bg-surface/30 p-3">
			<p class="font-semibold text-dark-teal">Line</p>
			<p class="text-muted">4 lb</p>
		</div>
		<div class="rounded border border-olive bg-surface/30 p-3">
			<p class="font-semibold text-dark-teal">Hook</p>
			<p class="text-muted">16</p>
		</div>
		<div class="col-span-2 rounded border border-olive bg-surface/30 p-3">
			<p class="font-semibold text-dark-teal">Bait</p>
			<p class="text-muted">Maggot</p>
		</div>
	</div>
	<div class="flex gap-3">
		{#if isMidGame}
			<a
				href={returnTo!}
				class="inline-block rounded bg-muted px-6 py-2 text-center text-white no-underline hover:bg-muted/80"
			>
				Cancel
			</a>
		{/if}
		<a
			href={target}
			class="inline-block rounded bg-primary px-6 py-2 text-center text-white no-underline hover:bg-primary/80"
		>
			{buttonLabel}
		</a>
	</div>
</div>
