<script lang="ts">
	import { goto } from '$app/navigation';
	import jcsMatch from '$lib/assets/images/lakes/jcs-match.jpeg';
	import spectrumOriginal from '$lib/assets/images/lakes/spectrum-original.jpeg';
</script>

<div
	role="button"
	tabindex="0"
	class="relative h-lvh cursor-pointer overflow-hidden bg-black"
	onclick={() => goto('/menu')}
	onkeydown={(e) => e.key === 'Enter' && goto('/menu')}
>
	<img
		src={jcsMatch}
		alt=""
		class="ken-burns absolute inset-0 h-full w-full object-cover"
	/>

	<div
		class="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/70"
	></div>

	<div
		class="relative z-10 flex h-lvh flex-col items-center justify-center px-8"
	>
		<div class="tv-frame relative w-full max-w-lg">
			<div
				class="rounded-2xl border-4 border-gray-800 bg-black p-3 shadow-[0_0_60px_rgba(196,152,83,0.2)]"
			>
				<div class="relative overflow-hidden rounded-lg">
					<img
						src={spectrumOriginal}
						alt=""
						class="h-auto w-full"
					/>
					<div
						class="scanlines pointer-events-none absolute inset-0"
					></div>
				</div>
			</div>
		</div>

		<p class="mt-8 animate-pulse text-lg text-white/60 sm:text-2xl">
			tap anywhere to begin
		</p>
	</div>
</div>

<style>
	@keyframes ken-burns {
		0% {
			transform: scale(1) translate(0%, 0%);
		}
		25% {
			transform: scale(1.1) translate(-3%, -3%);
		}
		50% {
			transform: scale(1.15) translate(-4%, 5%);
		}
		75% {
			transform: scale(1.15) translate(5%, 4%);
		}
		100% {
			transform: scale(1) translate(0%, 0%);
		}
	}

	.ken-burns {
		animation: ken-burns 40s ease-in-out infinite;
		will-change: transform;
	}

	.scanlines {
		background: repeating-linear-gradient(
			0deg,
			transparent 0px,
			transparent 2px,
			rgba(0, 0, 0, 0.12) 2px,
			rgba(0, 0, 0, 0.12) 4px
		);
	}
</style>
