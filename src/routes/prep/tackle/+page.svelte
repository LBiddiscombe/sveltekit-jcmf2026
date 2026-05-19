<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { baits } from '$lib/data';
	import { TackleBox } from '$lib/data/tackle';
	import type { Rod, Reel, Line, Hook, Bait } from '$lib/data';
	import { gameReturnToPath } from '$lib/game/prep-flow';
	import { gameState } from '$lib/game/state.svelte';
	import PickerModal from '$lib/components/PickerModal.svelte';

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

	const box = new TackleBox();
	const reelOptions = box.reels.filter((r) => r.name !== 'n/a');
	const noReel = box.reels.find((r) => r.name === 'n/a')!;

	let tackle = $state({ ...gameState.currentTackle });

	let isPole = $derived(tackle.rod.name === 'Pole');

	function selectRod(rod: Rod) {
		tackle.rod = rod;
		tackle.reel = rod.name === 'Pole' ? noReel : reelOptions[0];
		closeModal();
	}

	function selectReel(reel: Reel) {
		tackle.reel = reel;
		closeModal();
	}

	function selectLine(line: Line) {
		tackle.line = line;
		closeModal();
	}

	function selectHook(hook: Hook) {
		tackle.hook = hook;
		closeModal();
	}

	function selectBait(bait: Bait) {
		tackle.bait = bait;
		closeModal();
	}

	let returnTo = $derived(page.url.searchParams.get('returnTo'));
	let isMidGame = $derived(returnTo !== null);
	let buttonLabel = $derived(isMidGame ? 'Back to Fishing' : 'Start Fishing');
	let target = $derived(isMidGame ? returnTo! : gameReturnToPath());

	function handleConfirm() {
		gameState.chooseTackle(tackle);
		if (!isMidGame) {
			gameState.beginFishing();
		}
		goto(target);
	}

	function handleCancel() {
		goto(returnTo!);
	}

	let activeModal = $state<'rod' | 'reel' | 'line' | 'hook' | 'bait' | null>(null);

	function openModal(type: typeof activeModal) {
		activeModal = type;
	}

	function closeModal() {
		activeModal = null;
	}

	function tackleImg(item: { image: string }): string {
		return tackleImages[`/src/lib/assets/images/tackle/${item.image}`] ?? '';
	}

	function baitImg(item: { image: string }): string {
		return baitImages[`/src/lib/assets/images/baits/${item.image}`] ?? '';
	}
</script>

<div class="flex min-h-dvh flex-col items-center justify-center gap-6 p-4">
	<h1 class="text-2xl font-bold text-dark-teal sm:text-3xl md:text-4xl">
		{isMidGame ? 'Change Tackle' : 'Choose Tackle & Bait'}
	</h1>
	<p class="text-lg text-muted">Select your rod, reel, line, hook, and bait</p>

	<div class="grid w-full max-w-sm grid-cols-2 gap-3">
		<!-- Rod -->
		<button
			onclick={() => openModal('rod')}
			class="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-olive bg-surface/30 p-4 transition-colors hover:bg-surface/60"
		>
			<img
				src={tackleImg(tackle.rod)}
				alt={tackle.rod.name}
				class="h-16 w-16 rounded object-contain"
			/>
			<p class="text-xs text-muted">Rod</p>
			<p class="font-semibold text-dark-teal">{tackle.rod.name}</p>
		</button>

		<!-- Reel -->
		{#if isPole}
			<div
				class="flex flex-col items-center gap-2 rounded-lg border-2 border-olive bg-surface/10 p-4 opacity-50"
			>
				<div class="flex h-16 w-16 items-center justify-center rounded text-3xl text-muted">
					&#x1F512;
				</div>
				<p class="text-xs text-muted">Reel</p>
				<p class="font-semibold text-dark-teal">No Reel</p>
			</div>
		{:else}
			<button
				onclick={() => openModal('reel')}
				class="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-olive bg-surface/30 p-4 transition-colors hover:bg-surface/60"
			>
				<img
					src={tackleImg(tackle.reel)}
					alt={tackle.reel.name}
					class="h-16 w-16 rounded object-contain"
				/>
				<p class="text-xs text-muted">Reel</p>
				<p class="font-semibold text-dark-teal">{tackle.reel.name}</p>
			</button>
		{/if}

		<!-- Line -->
		<button
			onclick={() => openModal('line')}
			class="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-olive bg-surface/30 p-4 transition-colors hover:bg-surface/60"
		>
			<img
				src={tackleImg(tackle.line)}
				alt={tackle.line.name}
				class="h-16 w-16 rounded object-contain"
			/>
			<p class="text-xs text-muted">Line</p>
			<p class="font-semibold text-dark-teal">{tackle.line.name}</p>
		</button>

		<!-- Hook -->
		<button
			onclick={() => openModal('hook')}
			class="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-olive bg-surface/30 p-4 transition-colors hover:bg-surface/60"
		>
			<img
				src={tackleImg(tackle.hook)}
				alt={tackle.hook.name}
				class="h-16 w-16 rounded object-contain"
			/>
			<p class="text-xs text-muted">Hook</p>
			<p class="font-semibold text-dark-teal">Size {tackle.hook.name}</p>
		</button>
	</div>

	<!-- Bait (full width) -->
	<button
		onclick={() => openModal('bait')}
		class="flex w-full max-w-sm cursor-pointer items-center gap-4 rounded-lg border-2 border-olive bg-surface/30 p-4 transition-colors hover:bg-surface/60"
	>
		<img
			src={baitImg(tackle.bait)}
			alt={tackle.bait.name}
			class="h-16 w-16 rounded object-contain"
		/>
		<div>
			<p class="text-xs text-muted">Bait</p>
			<p class="font-semibold text-dark-teal">{tackle.bait.name}</p>
		</div>
	</button>

	<div class="flex gap-3">
		{#if isMidGame}
			<button
				onclick={handleCancel}
				class="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded bg-muted px-6 py-3 text-center text-white no-underline hover:bg-muted/80"
			>
				Cancel
			</button>
		{/if}
		<button
			onclick={handleConfirm}
			class="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded bg-primary px-6 py-3 text-center text-white no-underline hover:bg-primary/80"
		>
			{buttonLabel}
		</button>
	</div>
</div>

<!-- Modals -->
{#if activeModal === 'rod'}
	<PickerModal
		title="Select Rod"
		items={box.rods}
		images={tackleImages}
		imageBasePath="/src/lib/assets/images/tackle"
		selectedName={tackle.rod.name}
		onselect={(item) => selectRod(item as Rod)}
		onclose={closeModal}
	/>
{/if}

{#if activeModal === 'reel'}
	<PickerModal
		title="Select Reel"
		items={reelOptions}
		images={tackleImages}
		imageBasePath="/src/lib/assets/images/tackle"
		selectedName={tackle.reel.name}
		onselect={(item) => selectReel(item as Reel)}
		onclose={closeModal}
	/>
{/if}

{#if activeModal === 'line'}
	<PickerModal
		title="Select Line"
		items={box.lines}
		images={tackleImages}
		imageBasePath="/src/lib/assets/images/tackle"
		selectedName={tackle.line.name}
		onselect={(item) => selectLine(item as Line)}
		onclose={closeModal}
	/>
{/if}

{#if activeModal === 'hook'}
	<PickerModal
		title="Select Hook"
		items={box.hooks}
		images={tackleImages}
		imageBasePath="/src/lib/assets/images/tackle"
		selectedName={tackle.hook.name}
		onselect={(item) => selectHook(item as Hook)}
		onclose={closeModal}
	/>
{/if}

{#if activeModal === 'bait'}
	<PickerModal
		title="Select Bait"
		items={baits}
		images={baitImages}
		imageBasePath="/src/lib/assets/images/baits"
		selectedName={tackle.bait.name}
		onselect={(item) => selectBait(item as Bait)}
		onclose={closeModal}
	/>
{/if}
