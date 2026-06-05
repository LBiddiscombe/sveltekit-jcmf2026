<script lang="ts">
	import { slide } from 'svelte/transition';

	export interface SelectMenuItem {
		value: string;
		label: string;
	}

	let {
		items,
		selected,
		onselect
	}: {
		items: SelectMenuItem[];
		selected: string;
		onselect: (value: string) => void;
	} = $props();

	let isOpen = $state(false);
	let container: HTMLDivElement | undefined = $state();

	let selectedItem = $derived(items.find((i) => i.value === selected) ?? items[0]);

	function toggle() {
		isOpen = !isOpen;
	}

	function select(value: string) {
		onselect(value);
		isOpen = false;
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape' && isOpen) {
			isOpen = false;
		}
	}

	function handleClickOutside(e: MouseEvent) {
		if (isOpen && container && !container.contains(e.target as Node)) {
			isOpen = false;
		}
	}

	$effect(() => {
		if (isOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});
</script>

<div bind:this={container} class="relative" role="presentation" onkeydown={handleKeyDown}>
	<button
		onclick={toggle}
		aria-haspopup="listbox"
		aria-expanded={isOpen}
		class="flex w-full items-center justify-between rounded-xl border px-3 py-2 text-center text-sm font-medium transition-colors {isOpen
			? 'border-dark-teal/40 bg-white text-dark-teal'
			: 'border-accent bg-accent/10 text-accent'}"
	>
		{selectedItem.label}
		<span class="ml-2 text-xs transition-transform duration-150 {isOpen ? 'rotate-180' : ''}">
			&#9660;
		</span>
	</button>

	{#if isOpen}
		<div
			class="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-dark-teal/20 bg-white shadow-lg"
			role="listbox"
			transition:slide={{ duration: 150 }}
		>
			{#each items as item (item.value)}
				<button
					role="option"
					aria-selected={item.value === selected}
					onclick={() => select(item.value)}
					class="w-full px-3 py-2 text-left text-sm font-medium transition-colors {item.value ===
					selected
						? 'bg-accent/10 text-accent'
						: 'text-dark-teal hover:bg-dark-teal/5'}"
				>
					{item.label}
				</button>
			{/each}
		</div>
	{/if}
</div>
