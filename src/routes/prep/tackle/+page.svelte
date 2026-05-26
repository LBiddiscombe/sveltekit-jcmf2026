<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { venues, baits } from '$lib/data';
	import { TackleBox } from '$lib/data/tackle';
	import type { Rod, Reel, Line, Hook, Bait } from '$lib/data';
	import { gameReturnToPath } from '$lib/game/prep-flow';
	import { prepState } from '$lib/game/prep-state.svelte';
	import { gameState } from '$lib/game/state.svelte';
	import { multiplayer } from '$lib/game/party/connection.svelte';
	import { defaultTackle } from '$lib/game/tackle-utils';
	import { presets, resolvePreset } from '$lib/data/presets';
	import type { TacklePreset } from '$lib/data';
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

	const pegImages = import.meta.glob<string>('$lib/assets/images/pegs/*.jpeg', {
		eager: true,
		query: '?url',
		import: 'default'
	});

	const box = new TackleBox();
	const reelOptions = box.reels.filter((r) => r.name !== 'n/a');
	const noReel = box.reels.find((r) => r.name === 'n/a')!;

	let returnTo = $derived(page.url.searchParams.get('returnTo'));
	let isMidGame = $derived(returnTo !== null);
	let isTimed = $derived(page.url.searchParams.has('timed'));
	let isMulti = $derived(page.url.searchParams.has('multi'));
	let target = $derived(isMidGame ? returnTo! : isMulti ? '/game?multi=1' : '/game');

	let tackle = $state({
		...(page.url.searchParams.get('returnTo')
			? (gameState.playerAngler?.tackle ?? defaultTackle)
			: prepState.currentTackle)
	});

	let now = $state(Date.now());
	$effect(() => {
		if (!isTimed) return;
		const interval = setInterval(() => {
			now = Date.now();
		}, 1000);
		return () => clearInterval(interval);
	});

	let remainingMs = $derived.by(() => {
		if (!isTimed) return 0;
		if (isMulti && multiplayer.startTime) {
			const elapsed = now - multiplayer.startTime;
			return Math.max(0, multiplayer.timeLimitMinutes * 60 * 1000 - elapsed);
		}
		if (!isMulti && prepState.matchStartTime && prepState.timeLimitMinutes) {
			const elapsed = now - prepState.matchStartTime;
			return Math.max(0, prepState.timeLimitMinutes * 60 * 1000 - elapsed);
		}
		return 0;
	});

	let timerDisplay = $derived.by(() => {
		if (!isTimed) return '';
		const totalSec = Math.ceil(remainingMs / 1000);
		const m = Math.floor(totalSec / 60);
		const s = totalSec % 60;
		return `${m}:${String(s).padStart(2, '0')}`;
	});

	let isPole = $derived(tackle.rod.name === 'Pole');
	let isLeger = $derived(tackle.rod.name === 'Leger');

	const layers = ['Top', 'Middle', 'Bottom'];

	const strataOptions = layers.map((name) => ({ name, image: '' }));

	function strataIcon(name: string): string {
		return `<svg viewBox="0 0 48 48" class="h-16 w-16">${layers
			.map(
				(layer, i) =>
					`<rect x="14" y="${8 + i * 12}" width="20" height="8" rx="2" fill="currentColor" opacity="${layer === name ? 1 : 0.25}" />`
			)
			.join('')}</svg>`;
	}

	const castOptions = [
		{ name: 'Short', image: '' },
		{ name: 'Medium', image: '' },
		{ name: 'Long', image: '' }
	];

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

	function castIcon(name: string): string {
		const len = castLengths[name];
		return `<svg viewBox="0 0 48 48" class="h-16 w-16"><circle cx="8" cy="24" r="4" fill="currentColor" /><line x1="12" y1="24" x2="${len}" y2="24" stroke="currentColor" stroke-width="4" stroke-linecap="round" /></svg>`;
	}

	let pegName = $derived(isMulti ? (multiplayer.ownPeg ?? '') : (prepState.playerPeg ?? ''));
	let selectedPegData = $derived(
		isMulti
			? (venues[0].lakes[0].pegs.find((p) => p.name === multiplayer.ownPeg) ?? null)
			: (prepState.lake?.pegs.find((p) => p.name === pegName) ?? null)
	);
	let venueName = $derived(isMulti ? venues[0].name : prepState.venueName);
	let lakeName = $derived(isMulti ? venues[0].lakes[0].name : prepState.lakeName);

	function pegImg(filename: string | undefined): string {
		return filename ? (pegImages[`/src/lib/assets/images/pegs/${filename}`] ?? '') : '';
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

	let buttonLabel = $derived(isMidGame ? 'Return & Recast' : 'Start Fishing');

	function handleConfirm() {
		if (isMidGame) {
			gameState.resetCast();
			gameState.updateTackle(tackle);
		} else {
			prepState.chooseTackle(tackle);
			if (!isMulti) {
				if (prepState.timeLimitMinutes !== undefined) {
					const elapsed = Date.now() - (prepState.matchStartTime ?? Date.now());
					const remainingMinutes = Math.max(0, prepState.timeLimitMinutes - elapsed / 60000);
					gameState.beginFishing(
						prepState.anglers,
						prepState.venue!,
						prepState.lake!,
						remainingMinutes
					);
				} else {
					gameState.beginFishing(prepState.anglers, prepState.venue!, prepState.lake!);
				}
			}
		}
		goto(target);
	}

	function handleCancel() {
		goto(returnTo!);
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

	function tackleImg(item: { image: string }): string {
		return tackleImages[`/src/lib/assets/images/tackle/${item.image}`] ?? '';
	}

	function baitImg(item: { image: string }): string {
		return baitImages[`/src/lib/assets/images/baits/${item.image}`] ?? '';
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
	}
</script>

<div class="flex min-h-dvh flex-col items-center p-4">
	<div class="flex w-full max-w-2xl flex-col gap-6">
		{#if isTimed}
			<div class="mx-auto flex items-center gap-2 rounded-xl bg-danger/10 px-4 py-2 text-danger">
				<span class="text-sm font-semibold">Match time remaining:</span>
				<span class="text-lg font-bold">{timerDisplay}</span>
			</div>
		{/if}

		<div class="grid gap-6 md:grid-cols-2">
			<!-- Peg panel -->
			<div class="flex flex-col gap-3">
				{#if selectedPegData?.description}
					<p class="text-base leading-relaxed text-dark-teal/90">{selectedPegData.description}</p>
				{/if}
				<div class="flex flex-col gap-1">
					<label
						for="tackle-preset"
						class="text-xs font-semibold text-dark-teal uppercase tracking-wide"
						>Tackle Presets</label
					>
					<select
						id="tackle-preset"
						onchange={(e) => {
							const name = (e.target as HTMLSelectElement).value;
							const preset = presets.find((p) => p.name === name);
							if (preset) applyPreset(preset);
							(e.target as HTMLSelectElement).value = '';
						}}
						class="w-full cursor-pointer rounded-lg border-2 border-olive bg-surface/30 px-3 py-2 text-sm text-dark-teal outline-none transition-colors focus:border-primary"
					>
						<option value="">Select preset...</option>
						{#each presets as preset (preset.name)}
							<option value={preset.name}>{preset.name}</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- Tackle + buttons -->
			<div class="flex flex-col gap-3">
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
					{#if isPole}
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
						onclick={() => !isLeger && openModal('strata')}
						disabled={isLeger}
						class="flex cursor-pointer flex-col items-center gap-1 md:gap-2 rounded-lg border-2 p-2 md:p-4 transition-colors {isLeger
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
				<div class="flex justify-center gap-3">
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
		items={strataOptions}
		images={{}}
		imageBasePath=""
		selectedName={tackle.strata}
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
		itemIcons={Object.fromEntries(castOptions.map((o) => [o.name, castIcon(o.name)]))}
		onselect={(item) => selectCastStrength(item)}
		onclose={closeModal}
	/>
{/if}
