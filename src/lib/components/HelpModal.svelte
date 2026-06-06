<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		content,
		children
	}: {
		title: string;
		content: string;
		children?: Snippet;
	} = $props();

	let isOpen = $state(false);

	function handleBackdrop(e: MouseEvent) {
		if (e.target === e.currentTarget) isOpen = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') isOpen = false;
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<button
	onclick={() => (isOpen = true)}
	class="inline-flex cursor-pointer items-center gap-0.5 align-middle text-sm font-medium text-dark-teal hover:text-accent"
>
	{#if children}
		{@render children()}
	{:else}
		&#9432;
	{/if}
</button>

{#if isOpen}
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
					onclick={() => (isOpen = false)}
					class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-xl text-muted hover:bg-surface/50"
					aria-label="Close"
				>
					&times;
				</button>
			</div>
			<div class="space-y-2 text-sm leading-relaxed text-dark-teal">
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html content}
			</div>
		</div>
	</div>
{/if}
