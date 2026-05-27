<script lang="ts">
	export interface CatchToastEvent {
		name: string;
		pegName: string;
		classificationLabel: string;
		species: string;
	}

	let { events }: { events: CatchToastEvent[] } = $props();

	let processedCount = 0;
	let currentIndex = $state(-1);

	$effect(() => {
		if (currentIndex !== -1) return;
		if (processedCount >= events.length) return;
		currentIndex = processedCount;
		processedCount++;
	});

	$effect(() => {
		if (currentIndex === -1) return;
		const timer = setTimeout(() => {
			currentIndex = -1;
		}, 3000);
		return () => clearTimeout(timer);
	});

	let current = $derived(
		currentIndex >= 0 && currentIndex < events.length ? events[currentIndex] : null
	);

	let message = $derived.by(() => {
		if (!current) return '';
		const cls = current.classificationLabel;
		if (cls) {
			return `${current.name} caught a ${cls} ${current.species}`;
		}
		return `${current.name} caught a ${current.species}`;
	});
</script>

{#if current}
	<div
		class="animate-slide-up w-full rounded-lg bg-black/40 px-3 py-1.5 text-center text-sm font-medium text-white shadow-lg"
	>
		{message}
	</div>
{/if}

<style>
	@keyframes slide-up {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-slide-up {
		animation: slide-up 0.25s ease-out;
	}
</style>
