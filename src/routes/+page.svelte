<script lang="ts">
	import { goto } from '$app/navigation';
	import splashImage from '$lib/assets/images/splash/splash.jpeg';
</script>

<div
	class="relative min-h-screen cursor-pointer overflow-hidden"
	role="button"
	tabindex="0"
	onclick={() => goto('/menu')}
	onkeydown={(e) => e.key === 'Enter' && goto('/menu')}
>
	<img src={splashImage} alt="" class="ken-burns absolute inset-0 h-full w-full object-cover" />
	<div class="relative z-10 flex min-h-screen flex-col items-center justify-center gap-6">
		<p class="mt-16 animate-pulse text-3xl text-black/40">tap anywhere to begin</p>
	</div>
</div>

<style>
	@keyframes ken-burns {
		0% {
			transform: scale(1) translate(0%, 0%);
		}
		20% {
			transform: scale(1.1) translate(-3%, -3%);
		}
		40% {
			transform: scale(1.15) translate(-4%, 5%);
		}
		65% {
			transform: scale(1.15) translate(5%, 4%);
		}
		85% {
			transform: scale(1.1) translate(3%, -4%);
		}
		100% {
			transform: scale(1) translate(0%, 0%);
		}
	}

	.ken-burns {
		animation: ken-burns 50s ease-in-out infinite;
		will-change: transform;
	}
</style>
