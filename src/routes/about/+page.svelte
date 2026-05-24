<script lang="ts">
	import spectrumOriginal from '$lib/assets/images/lakes/spectrum-original.jpeg';
</script>

<div class="mx-auto max-w-2xl px-6 py-16">
	<div class="overflow-hidden rounded-2xl shadow-lg">
		<img
			src={spectrumOriginal}
			alt="Jack Charlton's Match Fishing — original ZX Spectrum loading screen"
			class="h-auto w-full"
		/>
	</div>

	<h1 class="mt-8 text-3xl font-bold text-dark-teal sm:text-4xl">About</h1>

	<div class="mt-6 space-y-4 text-base leading-relaxed text-dark-teal/85 sm:text-lg">
		<p>
			<strong class="text-accent">Jack Charlton's Match Fishing</strong> was published by Alligata
			Software Ltd, created by <strong class="text-accent">Elliot Gay</strong> and
			<strong class="text-accent">F. David Thorpe</strong> (graphics). It was a game on 8-bit computers
			back in the 1980s.
		</p>
		<p>
			I remember playing this for hours with my brother, sat hovering over the ZX Spectrum keyboard
			waiting for our peg to flash and fighting to get to our number key!
		</p>
		<p>This remake is an ode to those times.</p>
		<p class="text-muted">
			A simple, but authentic match fishing experience combining patience, skill and the joy of
			landing a fish. It can be played alone, or as multiplayer.
		</p>
	</div>

	<div class="mt-10 border-t border-olive/30 pt-6 text-sm text-muted">
		<p>Original game &copy; 1986 Alligata Software Ltd.</p>
		<p>Remake &copy; {new Date().getFullYear()} Lee Biddiscombe.</p>
	</div>

	<a
		href="/menu"
		class="mt-8 inline-flex rounded bg-primary px-6 py-3 text-white no-underline hover:bg-primary/80"
	>
		Back to Menu
	</a>
</div>
