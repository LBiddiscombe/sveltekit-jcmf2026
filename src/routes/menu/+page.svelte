<script lang="ts">
	import { prepLakeUrl } from '$lib/game/prep-flow';
</script>

<div class="flex min-h-dvh flex-col items-center justify-center gap-6">
	<h1 class="text-2xl font-bold text-dark-teal sm:text-3xl md:text-4xl">Main Menu</h1>
	<p class="text-lg text-muted">Choose your mode</p>
	<div class="flex flex-col gap-3">
		<a
			href={prepLakeUrl('session')}
			class="inline-flex min-h-[44px] items-center justify-center rounded bg-primary px-6 py-3 text-center text-white no-underline hover:bg-primary/80"
		>
			Go Fishing
		</a>
		<a
			href={prepLakeUrl('match')}
			class="inline-flex min-h-[44px] items-center justify-center rounded bg-secondary px-6 py-3 text-center text-white no-underline hover:bg-secondary/80"
		>
			Host Match
		</a>
	</div>
	<a
		href="/about"
		class="mt-8 text-sm text-muted underline underline-offset-2 hover:text-dark-teal"
	>
		About
	</a>
</div>
