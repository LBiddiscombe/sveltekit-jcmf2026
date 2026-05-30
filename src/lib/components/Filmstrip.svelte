<script lang="ts">
	export interface FilmstripItem {
		id: string;
		label: string;
		imageUrl?: string;
	}

	let {
		items,
		selected,
		onselect,
		size = 'default'
	}: {
		items: FilmstripItem[];
		selected: string | null;
		onselect: (id: string) => void;
		size?: 'default' | 'small';
	} = $props();

	let tileClass = $derived(
		size === 'small' ? 'h-16 w-16 sm:h-20 sm:w-20' : 'h-28 w-28 sm:h-36 sm:w-36'
	);
</script>

<div
	class="flex shrink-0 gap-3 overflow-x-auto px-4 pb-3 sm:overflow-visible sm:justify-center sm:-mx-4 sm:px-0"
	style="scrollbar-width:none"
>
	{#each items as item (item.id)}
		<button
			onclick={() => onselect(item.id)}
			class="relative cursor-pointer shrink-0 transition-all duration-200 hover:scale-105 {selected ===
			item.id
				? 'scale-105'
				: 'opacity-60 hover:opacity-90'}"
		>
			<div
				class="{tileClass} overflow-hidden rounded-xl border-2 transition-all {selected === item.id
					? 'border-accent shadow-lg'
					: 'border-white/30 shadow-md'}"
			>
				{#if item.imageUrl}
					<img src={item.imageUrl} alt={item.label} class="h-full w-full object-cover" />
				{:else}
					<div class="flex h-full w-full items-center justify-center bg-surface/60">
						<span class="text-lg font-bold text-dark-teal">{item.label}</span>
					</div>
				{/if}
			</div>
			<div
				class="absolute -bottom-1 left-1/2 -translate-x-1/2 max-w-[90%] truncate rounded-full bg-dark-teal/80 px-2 py-0.5 text-xs font-bold text-white"
			>
				{item.label}
			</div>
		</button>
	{/each}
</div>
