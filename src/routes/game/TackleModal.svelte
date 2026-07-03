<script lang="ts">
	import { baits } from '$lib/data';
	import { TackleBox } from '$lib/data/tackle';
	import type { TackleSelection, Peg } from '$lib/data';
	import type { Rod, Reel, Line, Hook, Bait } from '$lib/data';
	import { presets, resolvePreset } from '$lib/data/presets';
	import type { TacklePreset } from '$lib/data';
	import PickerModal from './PickerModal.svelte';

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

	let {
		isTimed,
		isMidGame,
		initialTackle,
		pegName,
		selectedPegData,
		venueName,
		lakeName,
		onconfirm,
		timerDisplay
	}: {
		isTimed: boolean;
		isMidGame: boolean;
		initialTackle: TackleSelection;
		pegName: string | undefined;
		selectedPegData: Peg | null;
		venueName: string;
		lakeName: string;
		onconfirm: (tackle: TackleSelection) => void;
		timerDisplay: string;
	} = $props();

	const box = new TackleBox();
	const reelOptions = box.reels.filter((r) => r.name !== 'n/a');
	const noReel = box.reels.find((r) => r.name === 'n/a') ?? reelOptions[0];

	let tackle = $state({ ...initialTackle });
	let activePresetName = $state<string | null>(null);
	let filmstripEl: HTMLDivElement | undefined = $state();
	let initialScrollDone = $state(false);

	$effect(() => {
		if (activePresetName && filmstripEl) {
			const tile = filmstripEl.querySelector(`[data-preset-id="${activePresetName}"]`);
			if (tile) {
				tile.scrollIntoView({
					block: 'nearest',
					inline: 'center',
					behavior: initialScrollDone ? 'smooth' : 'auto'
				});
				initialScrollDone = true;
			}
		}
	});

	const layers = ['Top', 'Middle', 'Bottom'];
	const castOptions = [
		{ name: 'Short', image: '' },
		{ name: 'Medium', image: '' },
		{ name: 'Long', image: '' }
	];

	let disabledCastNames = $derived(
		castOptions.filter((o) => !tackle.rod.allowedCastStrengths.includes(o.name)).map((o) => o.name)
	);

	let disabledLineNames = $derived(
		box.lines
			.filter((l) => {
				const lb = parseInt(l.name);
				return !isNaN(lb) && lb > tackle.rod.maxLineLb;
			})
			.map((l) => l.name)
	);

	let disabledStrataNames = $derived(layers.filter((l) => !tackle.rod.allowedStrata.includes(l)));

	let canChangeStrata = $derived(tackle.rod.allowedStrata.length > 1);

	const hookSizes = box.hooks.map((h) => h.size);
	const hookMinSize = Math.min(...hookSizes);
	const hookMaxSize = Math.max(...hookSizes);
	const hookScales: Record<string, number> = Object.fromEntries(
		box.hooks.map((h) => [
			h.name,
			0.2 + 0.8 * ((hookMaxSize - h.size) / (hookMaxSize - hookMinSize))
		])
	);

	const castLengths: Record<string, number> = { Short: 28, Medium: 36, Long: 44 };

	function strataIcon(name: string): string {
		return `<svg viewBox="0 0 48 48" class="h-16 w-16">${layers
			.map(
				(layer, i) =>
					`<rect x="14" y="${8 + i * 12}" width="20" height="8" rx="2" fill="currentColor" opacity="${layer === name ? 1 : 0.25}" />`
			)
			.join('')}</svg>`;
	}

	function castIcon(name: string): string {
		const len = castLengths[name];
		return `<svg viewBox="0 0 48 48" class="h-16 w-16"><circle cx="8" cy="24" r="4" fill="currentColor" /><line x1="12" y1="24" x2="${len}" y2="24" stroke="currentColor" stroke-width="4" stroke-linecap="round" /></svg>`;
	}

	function pegImg(filename: string | undefined): string {
		return filename ? (pegImages[`/src/lib/assets/images/pegs/${filename}`] ?? '') : '';
	}

	function tackleImg(item: { image: string }): string {
		return tackleImages[`/src/lib/assets/images/tackle/${item.image}`] ?? '';
	}

	function baitImg(item: { image: string }): string {
		return baitImages[`/src/lib/assets/images/baits/${item.image}`] ?? '';
	}

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

	function selectStrata(item: { name: string }) {
		tackle.strata = item.name;
		closeModal();
	}

	function selectCastStrength(item: { name: string }) {
		tackle.castStrength = item.name;
		closeModal();
	}

	let activeModal = $state<'rod' | 'reel' | 'line' | 'hook' | 'bait' | 'strata' | 'cast' | null>(
		null
	);

	function openModal(type: typeof activeModal) {
		activeModal = type;
	}

	function closeModal() {
		activeModal = null;
	}

	function applyPreset(preset: TacklePreset) {
		const sel = resolvePreset(preset);
		tackle.rod = sel.rod;
		tackle.reel = sel.reel;
		tackle.line = sel.line;
		tackle.hook = sel.hook;
		tackle.bait = sel.bait;
		tackle.strata = sel.strata;
		tackle.castStrength = sel.castStrength;
		activePresetName = preset.name;
	}

	function presetSpecs(preset: TacklePreset): string {
		const parts = [preset.rod, preset.line, `#${preset.hook}`];
		if (preset.targetSpecies) parts.unshift(preset.targetSpecies);
		return parts.join(' · ');
	}

	function handleConfirm() {
		onconfirm(tackle);
	}

	let buttonLabel = $derived(isMidGame ? 'Return & Recast' : 'Start Fishing');
</script>

<div
	class="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/80 p-4 pt-8"
>
	<div class="flex w-full max-w-2xl flex-col gap-6 rounded-xl bg-white p-6 shadow-2xl">
		{#if isTimed && timerDisplay}
			<div class="mx-auto flex items-center gap-2 rounded-xl bg-danger/10 px-4 py-2 text-danger">
				<span class="text-sm font-semibold">Match time remaining:</span>
				<span class="text-lg font-bold tabular-nums">{timerDisplay}</span>
			</div>
		{/if}

		<div class="grid gap-6 md:grid-cols-2">
			<!-- Peg panel -->
			<div class="flex flex-col gap-3">
				<div
					class="relative aspect-square overflow-hidden rounded-xl bg-surface/20 hidden md:block"
				>
					{#if selectedPegData?.image && pegImg(selectedPegData.image)}
						<img src={pegImg(selectedPegData.image)} alt="" class="h-full w-full object-contain" />
					{:else}
						<div class="flex h-full w-full items-center justify-center">
							{#if pegName}
								<span class="text-6xl font-bold text-muted">{pegName}</span>
							{/if}
						</div>
					{/if}
					<div class="absolute top-3 left-3 rounded-lg bg-black/40 px-2 py-1">
						<p class="text-sm font-semibold tracking-wide text-white/80">{venueName}</p>
						<p class="text-xs text-white/60">{lakeName}</p>
						<p class="text-lg font-bold text-white">Peg {pegName}</p>
					</div>
				</div>
				{#if selectedPegData?.description}
					<p class="text-base leading-relaxed text-dark-teal/90">{selectedPegData.description}</p>
				{/if}
			</div>

			<!-- Tackle + buttons -->
			<div class="flex flex-col gap-3 min-w-0">
				<div>
					<div
						bind:this={filmstripEl}
						class="flex max-w-full gap-2 overflow-x-auto pb-1"
						style="scrollbar-width:none"
					>
						{#each presets as preset (preset.name)}
							<button
								data-preset-id={preset.name}
								onclick={() => applyPreset(preset)}
								class="shrink-0 cursor-pointer rounded-xl border-2 p-2.5 text-left transition-all duration-200 hover:bg-surface/40
									{activePresetName === preset.name
									? 'border-primary bg-primary/10'
									: 'border-olive bg-surface/30 hover:border-primary/50'}"
								style="width: 130px"
							>
								<p class="text-sm font-bold text-dark-teal leading-tight">{preset.name}</p>
								<p class="mt-0.5 text-[11px] text-muted leading-tight">{presetSpecs(preset)}</p>
								<div class="mt-1 flex flex-wrap gap-0.5">
									<span
										class="inline-block rounded bg-surface/40 px-1.5 py-0.5 text-[10px] font-medium text-dark-teal"
										>{preset.rod}</span
									>
									<span
										class="inline-block rounded bg-surface/40 px-1.5 py-0.5 text-[10px] font-medium text-dark-teal"
										>{preset.line}</span
									>
									<span
										class="inline-block rounded bg-surface/40 px-1.5 py-0.5 text-[10px] font-medium text-dark-teal"
										>#{preset.hook}</span
									>
								</div>
							</button>
						{/each}
					</div>
				</div>
				<div class="grid grid-cols-3 gap-2 sm:gap-3">
					<!-- Rod -->
					<button
						onclick={() => openModal('rod')}
						class="flex cursor-pointer flex-col items-center gap-1 md:gap-2 rounded-lg border-2 border-olive bg-surface/30 p-2 md:p-4 transition-colors hover:bg-surface/60"
					>
						<img
							src={tackleImg(tackle.rod)}
							alt={tackle.rod.name}
							class="h-12 w-12 md:h-16 md:w-16 rounded object-contain"
						/>
						<p class="text-xs md:text-sm font-semibold text-dark-teal">{tackle.rod.name}</p>
					</button>

					<!-- Reel -->
					{#if !tackle.rod.requiresReel}
						<div
							class="flex flex-col items-center gap-1 md:gap-2 rounded-lg border-2 border-olive bg-surface/10 p-2 md:p-4 opacity-50"
						>
							<div
								class="flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded text-3xl text-muted"
							>
								&#x1F512;
							</div>
							<p class="text-xs md:text-sm font-semibold text-dark-teal">No Reel</p>
						</div>
					{:else}
						<button
							onclick={() => openModal('reel')}
							class="flex cursor-pointer flex-col items-center gap-1 md:gap-2 rounded-lg border-2 border-olive bg-surface/30 p-2 md:p-4 transition-colors hover:bg-surface/60"
						>
							<img
								src={tackleImg(tackle.reel)}
								alt={tackle.reel.name}
								class="h-12 w-12 md:h-16 md:w-16 rounded object-contain"
							/>
							<p class="text-xs md:text-sm font-semibold text-dark-teal">{tackle.reel.name}</p>
						</button>
					{/if}

					<!-- Line -->
					<button
						onclick={() => openModal('line')}
						class="flex cursor-pointer flex-col items-center gap-1 md:gap-2 rounded-lg border-2 border-olive bg-surface/30 p-2 md:p-4 transition-colors hover:bg-surface/60"
					>
						<img
							src={tackleImg(tackle.line)}
							alt={tackle.line.name}
							class="h-12 w-12 md:h-16 md:w-16 rounded object-contain"
						/>
						<p class="text-xs md:text-sm font-semibold text-dark-teal">{tackle.line.name}</p>
					</button>

					<!-- Hook -->
					<button
						onclick={() => openModal('hook')}
						class="flex cursor-pointer flex-col items-center gap-1 md:gap-2 rounded-lg border-2 border-olive bg-surface/30 p-2 md:p-4 transition-colors hover:bg-surface/60"
					>
						<img
							src={tackleImg(tackle.hook)}
							alt={tackle.hook.name}
							class="h-12 w-12 md:h-16 md:w-16 rounded object-contain"
						/>
						<p class="text-xs md:text-sm font-semibold text-dark-teal">Size {tackle.hook.name}</p>
					</button>

					<!-- Cast Strength -->
					<button
						onclick={() => openModal('cast')}
						class="flex cursor-pointer flex-col items-center gap-1 md:gap-2 rounded-lg border-2 border-olive bg-surface/30 p-2 md:p-4 transition-colors hover:bg-surface/60"
					>
						<svg viewBox="0 0 48 48" class="h-12 w-12 md:h-16 md:w-16 text-muted">
							<circle cx="8" cy="24" r="4" fill="currentColor" />
							<line
								x1="12"
								y1="24"
								x2={tackle.castStrength === 'Short'
									? '28'
									: tackle.castStrength === 'Medium'
										? '36'
										: '44'}
								y2="24"
								stroke="currentColor"
								stroke-width="4"
								stroke-linecap="round"
							/>
						</svg>
						<p class="text-xs md:text-sm font-semibold text-dark-teal">{tackle.castStrength}</p>
					</button>

					<!-- Strata -->
					<button
						onclick={() => canChangeStrata && openModal('strata')}
						disabled={!canChangeStrata}
						class="flex cursor-pointer flex-col items-center gap-1 md:gap-2 rounded-lg border-2 p-2 md:p-4 transition-colors {!canChangeStrata
							? 'border-olive bg-surface/10 opacity-50'
							: 'border-olive bg-surface/30 hover:bg-surface/60'}"
					>
						<svg viewBox="0 0 48 48" class="h-12 w-12 md:h-16 md:w-16 text-muted">
							{#each ['Top', 'Middle', 'Bottom'] as layer, i (layer)}
								<rect
									x="14"
									y={8 + i * 12}
									width="20"
									height="8"
									rx="2"
									fill="currentColor"
									opacity={tackle.strata === layer ? 1 : 0.25}
								/>
							{/each}
						</svg>
						<p class="text-xs md:text-sm font-semibold text-dark-teal">{tackle.strata}</p>
					</button>

					<!-- Bait (full width) -->
					<button
						onclick={() => openModal('bait')}
						class="col-span-3 flex cursor-pointer flex-col items-center gap-1 md:gap-2 rounded-lg border-2 border-olive bg-surface/30 p-2 md:p-4 transition-colors hover:bg-surface/60"
					>
						<img
							src={baitImg(tackle.bait)}
							alt={tackle.bait.name}
							class="h-12 w-12 md:h-16 md:w-16 rounded object-contain"
						/>
						<p class="text-xs md:text-sm font-semibold text-dark-teal">{tackle.bait.name}</p>
					</button>
				</div>

				<!-- Buttons -->
				<div class="flex justify-center">
					<button
						onclick={handleConfirm}
						class="inline-flex min-h-11 cursor-pointer items-center justify-center rounded bg-primary px-6 py-3 text-center text-white no-underline hover:bg-primary/80"
					>
						{buttonLabel}
					</button>
				</div>
			</div>
		</div>
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
		disabledNames={disabledLineNames}
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
		itemScales={hookScales}
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

{#if activeModal === 'strata'}
	<PickerModal
		title="Select Strata"
		items={layers.map((l) => ({ name: l, image: '' }))}
		images={{}}
		imageBasePath=""
		selectedName={tackle.strata}
		disabledNames={disabledStrataNames}
		itemIcons={Object.fromEntries(layers.map((l) => [l, strataIcon(l)]))}
		onselect={(item) => selectStrata(item)}
		onclose={closeModal}
	/>
{/if}

{#if activeModal === 'cast'}
	<PickerModal
		title="Select Cast Strength"
		items={castOptions}
		images={{}}
		imageBasePath=""
		selectedName={tackle.castStrength}
		disabledNames={disabledCastNames}
		itemIcons={Object.fromEntries(castOptions.map((o) => [o.name, castIcon(o.name)]))}
		onselect={(item) => selectCastStrength(item)}
		onclose={closeModal}
	/>
{/if}
