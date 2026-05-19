<script lang="ts">
	import { prepVenueUrl } from '$lib/game/prep-flow';
</script>

<div class="flex min-h-dvh flex-col items-center justify-center gap-6">
	<h1 class="text-2xl font-bold text-dark-teal sm:text-3xl md:text-4xl">Main Menu</h1>
	<p class="text-lg text-muted">Choose your mode</p>
	<div class="flex flex-col gap-3">
		<a
			href={prepVenueUrl('session')}
			class="inline-flex min-h-[44px] items-center justify-center rounded bg-primary px-6 py-3 text-center text-white no-underline hover:bg-primary/80"
		>
			Go Fishing
		</a>
		<a
			href={prepVenueUrl('match')}
			class="inline-flex min-h-[44px] items-center justify-center rounded bg-secondary px-6 py-3 text-center text-white no-underline hover:bg-secondary/80"
		>
			Host Match
		</a>
	</div>
</div>
