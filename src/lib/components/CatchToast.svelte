<script lang="ts">
	export interface CatchToastEvent {
		name: string;
		pegName: string;
		classificationLabel: string;
		species: string;
	}

	let { events }: { events: CatchToastEvent[] } = $props();

	let current: CatchToastEvent | null = $state(null);
	let queue: CatchToastEvent[] = $state([]);
	let processedCount = 0;

	$effect(() => {
		while (processedCount < events.length) {
			queue = [...queue, events[processedCount]];
			processedCount++;
		}
	});

	$effect(() => {
		if (current !== null || queue.length === 0) return;

		current = queue[0];
		queue = queue.slice(1);
	});

	$effect(() => {
		if (current === null) return;

		const timer = setTimeout(() => {
			current = null;
		}, 3000);

		return () => clearTimeout(timer);
	});

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
