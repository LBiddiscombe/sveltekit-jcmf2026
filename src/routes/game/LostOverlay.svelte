<script lang="ts">
	let { message }: { message: string } = $props();
</script>

<div class="pointer-events-none absolute inset-0 flex items-center justify-center">
	<div class="rounded-lg bg-black/40 px-6 py-4 text-center">
		<p class="text-sm font-bold text-white">{message}</p>
	</div>
</div>
