<script lang="ts">
	let { heading, subtext }: { heading: string; subtext: string } = $props();
</script>

<div
	class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl bg-black/60"
>
	<p class="text-xl font-bold text-white">{heading}</p>
	<p class="text-sm text-white/80">{subtext}</p>
	<div class="flex gap-1">
		<span class="h-2 w-2 animate-bounce rounded-full bg-white/60" style="animation-delay: 0s"
		></span>
		<span class="h-2 w-2 animate-bounce rounded-full bg-white/60" style="animation-delay: 0.15s"
		></span>
		<span class="h-2 w-2 animate-bounce rounded-full bg-white/60" style="animation-delay: 0.3s"
		></span>
	</div>
</div>
