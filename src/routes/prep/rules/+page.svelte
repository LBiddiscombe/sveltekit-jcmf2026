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
	let selectedMinutes = $state<number | null>(null);

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
		prepState.playerName = name.trim();
		prepState.playerAvatar = avatar;
		prepState.setMatchTimeLimit(minutes);
		goto(prepDrawUrl());
	}
</script>

{#if mode === 'session'}
	{#if selectedPegData}
		<div class="flex min-h-dvh flex-col pb-6 pt-6">
			<div class="mx-auto flex w-full max-w-sm shrink-0 flex-col items-center gap-3 px-4 pb-3">
				<div class="relative overflow-hidden rounded-xl">
					{#if pegImg(selectedPegData.image)}
						<img src={pegImg(selectedPegData.image)} alt="" class="h-full w-full object-contain" />
					{:else}
						<div class="flex h-full w-full items-center justify-center bg-surface/20">
							<span class="text-6xl font-bold text-muted">{selectedPegData.name}</span>
						</div>
					{/if}
					<div class="absolute top-3 left-3 rounded-lg bg-black/40 px-2 py-1">
						<p class="text-sm font-semibold tracking-wide text-white/80 uppercase">{venueName}</p>
						<p class="text-xs text-white/60">{lakeName}</p>
						<p class="text-lg font-bold text-white">Peg {selectedPegData.name}</p>
					</div>
				</div>
				<p class="min-h-26 text-center text-xs leading-relaxed text-dark-teal/80">
					{selectedPegData.description}
				</p>
			</div>

			<Filmstrip
				items={pegFilmstripItems}
				selected={selectedPeg}
				onselect={(id) => selectPeg(id)}
			/>

			<div class="mx-auto mt-auto w-full max-w-sm px-4">
				<label class="mb-3 flex cursor-pointer items-center justify-center gap-2 text-base text-muted hover:text-dark-teal">
					<input type="checkbox" bind:checked={showHints} onchange={handleShowHintsChange} class="h-3.5 w-3.5 cursor-pointer accent-primary" />
					Show hints
				</label>
				<button
					onclick={goToTackle}
					class="inline-flex w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary py-3 text-base font-semibold text-white shadow-lg transition-all hover:bg-primary/90 active:scale-[0.98]"
				>
					Fish Peg {selectedPegData.name}
					<span class="text-lg">&rarr;</span>
				</button>
			</div>
		</div>
	{/if}
{:else}
	<div class="flex min-h-dvh flex-col items-center justify-center gap-6 p-4">
		<!-- <h1 class="text-2xl font-bold text-dark-teal sm:text-3xl md:text-4xl">Rules</h1> -->

		<div class="flex w-full max-w-sm flex-col gap-4">
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
				<div class="grid grid-cols-3 gap-2">
					{#each timePresets as minutes (minutes)}
						<button
							onclick={() => selectTime(minutes)}
							class="rounded-xl border border-olive bg-surface/30 px-3 py-3 text-center text-sm font-medium transition-all hover:bg-surface/60 {selectedMinutes ===
							minutes
								? 'border-accent bg-accent/10 text-accent'
								: 'border-dark-teal/20 text-dark-teal hover:border-dark-teal/40'}"
						>
							{minutes}m
						</button>
					{/each}
				</div>
			</div>
		</div>
	</div>
{/if}
