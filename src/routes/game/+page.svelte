<script lang="ts">
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

	let mode = $derived(gameState.mode);
	let venueName = $derived(gameState.venueName);
	let lakeName = $derived(gameState.lakeName);
	let pegName = $derived(gameState.playerPeg);
	let tackle = $derived(gameState.playerAngler?.tackle);

	function img(item: { image: string }): string {
		return tackleImages[`/src/lib/assets/images/tackle/${item.image}`] ?? '';
	}

	function baitImg(item: { image: string }): string {
		return baitImages[`/src/lib/assets/images/baits/${item.image}`] ?? '';
	}

	const tackleUrl = tackleFromGameUrl();
</script>

<div class="flex min-h-dvh flex-col items-center justify-center gap-6">
	<h1 class="text-2xl font-bold text-dark-teal sm:text-3xl md:text-4xl">
		{mode === 'match' ? 'Match in Progress' : 'Fishing'}
	</h1>
	<p class="text-lg text-muted">The fishing loop — cast, wait, strike, reel, net</p>

	<div class="flex items-center gap-3 rounded border border-olive bg-surface/30 px-5 py-3">
		<div
			class="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary"
		>
			{pegName}
		</div>
		<div>
			<p class="text-sm text-muted">{venueName} &middot; {lakeName}</p>
			<p class="font-semibold text-dark-teal">Peg {pegName}</p>
		</div>
	</div>

	{#if tackle}
		<div class="rounded border border-olive bg-surface/30 px-5 py-3">
			<div class="flex items-center gap-4">
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
		</div>
	{/if}

	<div class="flex flex-col gap-3">
		<a
			href={tackleUrl}
			class="inline-flex min-h-[44px] items-center justify-center rounded bg-accent px-6 py-3 text-center text-white no-underline hover:bg-accent/80"
		>
			Change Tackle
		</a>
		<a
			href="/results"
			onclick={() => gameState.finishGame()}
			class="inline-flex min-h-[44px] items-center justify-center rounded bg-secondary px-6 py-3 text-center text-white no-underline hover:bg-secondary/80"
		>
			{mode === 'match' ? 'End Match' : 'Finish Session'}
		</a>
	</div>
</div>
