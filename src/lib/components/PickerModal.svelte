<script lang="ts">
	let {
		title,
		items,
		images,
		imageBasePath,
		selectedName,
		onselect,
		onclose,
		itemIcons,
		itemScales
	}: {
		title: string;
		items: { name: string; image: string }[];
		images: Record<string, string>;
		imageBasePath: string;
		selectedName: string;
		onselect: (item: { name: string; image: string }) => void;
		onclose: () => void;
		itemIcons?: Record<string, string>;
		itemScales?: Record<string, number>;
	} = $props();

	function handleBackdrop(e: MouseEvent) {
		if (e.target === e.currentTarget) onclose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}

	$effect(() => {
		const handler = (e: KeyboardEvent) => handleKeydown(e);
		document.addEventListener('keydown', handler);
		return () => document.removeEventListener('keydown', handler);
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
	onclick={handleBackdrop}
>
	<div
		class="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
		role="dialog"
		aria-label={title}
	>
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-xl font-bold text-dark-teal">{title}</h2>
			<button
				onclick={onclose}
				class="flex h-8 w-8 items-center justify-center rounded-full text-xl text-muted hover:bg-surface/50"
				aria-label="Close"
			>
				&times;
			</button>
		</div>

		<div class="grid grid-cols-3 gap-3">
			{#each items as item (item.name)}
				<button
					onclick={() => onselect(item)}
					class="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 p-3 text-center transition-all
						{item.name === selectedName
						? 'scale-105 border-primary ring-2 ring-primary ring-offset-2'
						: 'border-olive bg-surface/30 hover:bg-surface/60'}"
				>
					{#if item.image}
						{#if itemScales?.[item.name]}
							{@const scale = itemScales[item.name]}
							<div class="flex h-16 w-16 items-center justify-center">
								<img
									src={images[`${imageBasePath}/${item.image}`] ?? ''}
									alt={item.name}
									style="width: calc(4rem * {scale}); height: calc(4rem * {scale})"
									class="rounded object-contain"
								/>
							</div>
						{:else}
							<img
								src={images[`${imageBasePath}/${item.image}`] ?? ''}
								alt={item.name}
								class="h-16 w-16 rounded object-contain"
							/>
						{/if}
					{:else if itemIcons?.[item.name]}
						<div class="flex h-16 w-16 items-center justify-center text-muted">
							{@html itemIcons[item.name]}
						</div>
					{/if}
					<span class="text-sm font-medium text-dark-teal">{item.name}</span>
				</button>
			{/each}
		</div>
	</div>
</div>
