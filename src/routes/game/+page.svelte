<script lang="ts">
	import { goto } from '$app/navigation';
	import { tackleFromGameUrl } from '$lib/game/prep-flow';
	import { gameState } from '$lib/game/state.svelte';

	const tackleImages = import.meta.glob<string>('$lib/assets/images/tackle/*.png', {
		eager: true,
		query: '?url',
		import: 'default'
	});
	const baitImages = import.meta.glob<string>('$lib/assets/images/baits/*.png', {
		eager: true,
		query: '?url',
		import: 'default'
	});
	const pegImages = import.meta.glob<string>('$lib/assets/images/pegs/*.jpeg', {
		eager: true,
		query: '?url',
		import: 'default'
	});

	let mode = $derived(gameState.mode);
	let venueName = $derived(gameState.venueName);
	let lakeName = $derived(gameState.lakeName);
	let pegName = $derived(gameState.playerPeg);
	let tackle = $derived(gameState.playerAngler?.tackle);
	let selectedPegData = $derived(gameState.lake?.pegs.find((p) => p.name === pegName) ?? null);

	function img(item: { image: string }): string {
		return tackleImages[`/src/lib/assets/images/tackle/${item.image}`] ?? '';
	}

	function baitImg(item: { image: string }): string {
		return baitImages[`/src/lib/assets/images/baits/${item.image}`] ?? '';
	}

	function pegImg(filename: string | undefined): string {
		return filename ? (pegImages[`/src/lib/assets/images/pegs/${filename}`] ?? '') : '';
	}

	const tackleUrl = tackleFromGameUrl();
</script>

<div class="flex min-h-dvh flex-col items-center gap-6 p-4">
	<div class="relative w-full overflow-hidden rounded-xl bg-surface/20 sm:max-w-sm">
		<div class="aspect-square">
			{#if selectedPegData?.image && pegImg(selectedPegData.image)}
				<img src={pegImg(selectedPegData.image)} alt="" class="h-full w-full object-contain" />
			{:else}
				<div class="flex h-full w-full items-center justify-center">
					{#if pegName}
						<span class="text-6xl font-bold text-muted">{pegName}</span>
					{/if}
				</div>
			{/if}
		</div>
		<div class="absolute top-3 left-3 rounded-lg bg-black/40 px-2 py-1">
			<p class="text-sm font-semibold tracking-wide text-white/80 uppercase">{venueName}</p>
			<p class="text-xs text-white/60">{lakeName}</p>
			<p class="text-lg font-bold text-white">Peg {pegName}</p>
		</div>
	</div>

	{#if tackle}
		<button
			onclick={() => goto(tackleUrl)}
			class="w-full cursor-pointer rounded-xl border border-olive bg-surface/30 p-4 text-left sm:max-w-sm"
		>
			<div class="flex items-center justify-center gap-4">
				<div class="flex flex-col items-center gap-1">
					<img src={img(tackle.rod)} alt={tackle.rod.name} class="h-8 w-8 rounded object-contain" />
					<span class="text-xs text-muted">Rod</span>
					<span class="text-xs font-semibold text-dark-teal">{tackle.rod.name}</span>
				</div>
				<div class="flex flex-col items-center gap-1">
					<img
						src={img(tackle.reel)}
						alt={tackle.reel.name}
						class="h-8 w-8 rounded object-contain"
					/>
					<span class="text-xs text-muted">Reel</span>
					<span class="text-xs font-semibold text-dark-teal">{tackle.reel.name}</span>
				</div>
				<div class="flex flex-col items-center gap-1">
					<img
						src={img(tackle.line)}
						alt={tackle.line.name}
						class="h-8 w-8 rounded object-contain"
					/>
					<span class="text-xs text-muted">Line</span>
					<span class="text-xs font-semibold text-dark-teal">{tackle.line.name}</span>
				</div>
				<div class="flex flex-col items-center gap-1">
					<img
						src={img(tackle.hook)}
						alt={tackle.hook.name}
						class="h-8 w-8 rounded object-contain"
					/>
					<span class="text-xs text-muted">Hook</span>
					<span class="text-xs font-semibold text-dark-teal">{tackle.hook.name}</span>
				</div>
				<div class="flex flex-col items-center gap-1">
					<img
						src={baitImg(tackle.bait)}
						alt={tackle.bait.name}
						class="h-8 w-8 rounded object-contain"
					/>
					<span class="text-xs text-muted">Bait</span>
					<span class="text-xs font-semibold text-dark-teal">{tackle.bait.name}</span>
				</div>
			</div>
		</button>
	{/if}

	<div class="mt-auto flex justify-center">
		<a
			href="/results"
			onclick={() => gameState.finishGame()}
			class="inline-flex min-h-[44px] items-center justify-center rounded bg-secondary px-6 py-3 text-center text-white no-underline hover:bg-secondary/80"
		>
			{mode === 'match' ? 'End Match' : 'Finish Session'}
		</a>
	</div>
</div>
