<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { prepState } from '$lib/game/prep-state.svelte';
	import { gameState } from '$lib/game/state.svelte';
	import { prepDrawUrl } from '$lib/game/prep-flow';
	import { isTutorialCompleted, resetTutorial, completeTutorial } from '$lib/game/tutorial';
	import { bots } from '$lib/data';
	import Filmstrip from '$lib/components/Filmstrip.svelte';
	import type { FilmstripItem } from '$lib/components/Filmstrip.svelte';
	import SelectMenu from '$lib/components/SelectMenu.svelte';
	import type { SelectMenuItem } from '$lib/components/SelectMenu.svelte';
	import type { SpeciesFilterKind } from '$lib/game/match-rules';

	const NAME_KEY = 'jcmf-player-name';
	const AVATAR_KEY = 'jcmf-player-avatar';

	let showHints = $state(!isTutorialCompleted());

	function handleShowHintsChange() {
		if (showHints) {
			resetTutorial();
		} else {
			completeTutorial();
		}
	}

	let mode = $derived(prepState.mode);
	let venueName = $derived(prepState.venueName);
	let lakeName = $derived(prepState.lakeName);
	let pegs = $derived(prepState.lake?.pegs ?? []);
	let manualPeg = $state<string | null>(prepState.playerPeg ?? null);
	let selectedPeg = $derived(
		mode === 'session' && pegs.length > 0 ? (manualPeg ?? pegs[0].name) : manualPeg
	);
	let selectedPegData = $derived(
		pegs.length > 0 ? (pegs.find((p) => p.name === selectedPeg) ?? pegs[0]) : null
	);

	const timePresets = [1, 5, 10, 20, 30, 60];
	const WIN_CONDITION_ITEMS: SelectMenuItem[] = [
		{ value: 'weight', label: 'Total Weight' },
		{ value: 'count', label: 'Fish Count' },
		{ value: 'biggest', label: 'Biggest Fish' }
	];
	const SPECIES_FILTER_ITEMS: SelectMenuItem[] = [
		{ value: 'all', label: 'All' },
		{ value: 'silverfish', label: 'Silver Fish' },
		{ value: 'predators', label: 'Predators' },
		{ value: 'carps', label: 'Carps' },
		{ value: 'bottom-dwellers', label: 'Bottom Dwellers' }
	];
	let selectedMinutes = $state<number>(5);
	if (prepState.mode === 'match') prepState.setMatchTimeLimit(5);

	let name = $state(browser ? (localStorage.getItem(NAME_KEY) ?? '') : '');
	let avatar = $state(browser ? (localStorage.getItem(AVATAR_KEY) ?? '') : '');

	const pegImages = import.meta.glob<string>('$lib/assets/images/pegs/*.jpeg', {
		eager: true,
		query: '?url',
		import: 'default'
	});

	const botImages = import.meta.glob<string>('$lib/assets/images/bots/*.jpeg', {
		eager: true,
		query: '?url',
		import: 'default'
	});

	function pegImg(filename: string | undefined) {
		return filename ? (pegImages[`/src/lib/assets/images/pegs/${filename}`] ?? '') : '';
	}

	function botImg(filename: string): string {
		return botImages[`/src/lib/assets/images/bots/${filename}`] ?? '';
	}

	let filmstripItems = $derived<FilmstripItem[]>(
		bots.map((b) => ({
			id: b.image,
			label: b.name,
			imageUrl: botImg(b.image)
		}))
	);

	let pegFilmstripItems = $derived<FilmstripItem[]>(
		pegs.map((p) => ({
			id: p.name,
			label: `Peg ${p.name}`,
			imageUrl: pegImg(p.image)
		}))
	);

	$effect(() => {
		localStorage.setItem(NAME_KEY, name);
	});

	$effect(() => {
		localStorage.setItem(AVATAR_KEY, avatar);
	});

	function selectPeg(name: string) {
		manualPeg = name;
		prepState.assignPeg(name);
	}

	function goToTackle() {
		if (selectedPeg) prepState.assignPeg(selectedPeg);
		gameState.reset();
		goto('/game');
	}

	function selectTime(minutes: number) {
		selectedMinutes = minutes;
		prepState.setMatchTimeLimit(minutes);
	}

	function drawPegs() {
		if (!name.trim()) return;
		prepState.playerName = name.trim();
		prepState.playerAvatar = avatar;
		goto(prepDrawUrl());
	}
</script>

{#if mode === 'session'}
	{#if selectedPegData}
		<div class="flex min-h-dvh flex-col items-center gap-6 pb-6 pt-6">
			<div class="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-white/70 px-5 py-5 shadow-md">
				<div class="flex flex-col items-center gap-3">
					<div class="relative w-full overflow-hidden rounded-xl">
						{#if pegImg(selectedPegData.image)}
							<img src={pegImg(selectedPegData.image)} alt="" class="w-full object-contain" />
						{:else}
							<div class="flex h-48 w-full items-center justify-center bg-surface/20">
								<span class="text-6xl font-bold text-muted">{selectedPegData.name}</span>
							</div>
						{/if}
						<div class="absolute top-3 left-3 rounded-lg bg-black/40 px-2 py-1">
							<p class="text-sm font-semibold tracking-wide text-white/80">{venueName}</p>
							<p class="text-xs text-white/60">{lakeName}</p>
							<p class="text-lg font-bold text-white">Peg {selectedPegData.name}</p>
						</div>
						<div class="absolute inset-x-0 bottom-0 rounded-lg bg-black/40 px-4 py-3">
							<p class="text-base text-white/80">{selectedPegData.description}</p>
						</div>
					</div>
				</div>

				<Filmstrip
					items={pegFilmstripItems}
					selected={selectedPeg}
					onselect={(id) => selectPeg(id)}
				/>

				<label
					class="flex cursor-pointer items-center justify-center gap-2 text-base text-muted hover:text-dark-teal"
				>
					<input
						type="checkbox"
						bind:checked={showHints}
						onchange={handleShowHintsChange}
						class="h-3.5 w-3.5 cursor-pointer accent-primary"
					/>
					Show hints
				</label>
				<button
					onclick={goToTackle}
					class="w-full cursor-pointer rounded-xl bg-accent px-5 py-3 text-center font-bold text-white shadow-md transition-opacity hover:opacity-90"
				>
					Fish Peg {selectedPegData.name} &rarr;
				</button>
			</div>

			<div class="text-center">
				<button
					onclick={() => goto('/menu')}
					class="cursor-pointer rounded bg-primary px-6 py-3 text-white hover:bg-primary/80"
				>
					Back to Menu
				</button>
			</div>
		</div>
	{/if}
{:else}
	<div class="flex min-h-dvh flex-col items-center justify-center gap-6 p-4">
		<!-- <h1 class="text-2xl font-bold text-dark-teal sm:text-3xl md:text-4xl">Rules</h1> -->

		<div class="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-white/70 px-5 py-5 shadow-md">
			<div class="flex flex-col gap-1">
				<label for="name" class="text-sm font-medium text-dark-teal">Your Name</label>
				<input
					id="name"
					type="text"
					maxlength="15"
					bind:value={name}
					placeholder="Enter your name"
					class="rounded-xl border border-dark-teal/20 bg-white px-4 py-3 text-dark-teal outline-none focus:border-accent"
				/>
			</div>

			<div class="flex flex-col gap-1">
				<span class="text-sm font-medium text-dark-teal">Your Avatar</span>
				<Filmstrip items={filmstripItems} selected={avatar} onselect={(id) => (avatar = id)} />
			</div>

			<div class="flex flex-col gap-1">
				<span class="text-sm font-medium text-dark-teal">Match Duration</span>
				<div class="grid grid-cols-3 gap-2" role="radiogroup">
					{#each timePresets as minutes (minutes)}
						<button
							onclick={() => selectTime(minutes)}
							class="rounded-xl border px-3 py-2 text-center text-sm font-medium transition-colors {selectedMinutes ===
							minutes
								? 'border-accent bg-accent/10 text-accent'
								: 'border-dark-teal/20 bg-white text-dark-teal hover:border-dark-teal/40'}"
						>
							{minutes}m
						</button>
					{/each}
				</div>
			</div>

			<div class="flex flex-col gap-1">
				<span class="text-sm font-medium text-dark-teal">Win Condition</span>
				<SelectMenu
					items={WIN_CONDITION_ITEMS}
					selected={prepState.matchRules.winConditionKey}
					onselect={(key) =>
						(prepState.matchRules = { ...prepState.matchRules, winConditionKey: key })}
				/>
			</div>

			<div class="flex flex-col gap-1">
				<span class="text-sm font-medium text-dark-teal">Qualifying Species</span>
				<SelectMenu
					items={SPECIES_FILTER_ITEMS}
					selected={prepState.matchRules.speciesFilterKind}
					onselect={(value: string) =>
						(prepState.matchRules = {
							...prepState.matchRules,
							speciesFilterKind: value as SpeciesFilterKind
						})}
				/>
			</div>

			<button
				onclick={drawPegs}
				disabled={!name.trim()}
				class="w-full cursor-pointer rounded-xl bg-accent px-5 py-3 text-center font-bold text-white shadow-md transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
			>
				Draw Pegs
			</button>
		</div>

		<button
			onclick={() => goto('/menu')}
			class="cursor-pointer rounded bg-primary px-6 py-3 text-white hover:bg-primary/80"
		>
			Back to Menu
		</button>
	</div>
{/if}
