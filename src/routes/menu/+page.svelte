<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { prepState } from '$lib/game/prep-state.svelte';
	import { gameState } from '$lib/game/state.svelte';
	import { prepRulesUrl } from '$lib/game/prep-flow';
	import type { GameMode } from '$lib/game/prep-flow';
	import { multiplayer } from '$lib/game/party/connection.svelte';
	import { venues } from '$lib/data';
	import { loadMatch, clearSavedMatch } from '$lib/game/save.svelte';
	import type { SavedMatchData } from '$lib/game/save.svelte';
	import lakeHero from '$lib/assets/images/lakes/jcs-match.jpeg';
	import matchThumb from '$lib/assets/images/pegs/jcs-match-2.jpeg';
	import venueThumb from '$lib/assets/images/venues/jcs.jpeg';

	const venue = venues[0];
	const lake = venue.lakes[0];

	let showResumeModal = $state(false);
	let pendingSave: SavedMatchData | null = $state(null);

	onMount(() => {
		multiplayer.leave();
		const saved = loadMatch();
		if (saved) {
			pendingSave = saved;
			showResumeModal = true;
		}
	});

	function handleResume() {
		if (!pendingSave) return;
		const data = pendingSave;
		pendingSave = null;
		showResumeModal = false;

		gameState.restoreFromSave(data, lake);

		prepState.mode = 'match';
		prepState.venueName = data.venueName;
		prepState.lakeName = data.lakeName;
		prepState.playerPeg = data.playerPeg;
		prepState.timeLimitMinutes = data.timeLimitMinutes;
		prepState.matchRules = data.matchRules;
		prepState.matchStartTime = data.matchStartTime;
		prepState.anglers = data.anglers;

		const player = data.anglers.find((a) => a.isPlayer);
		if (player) {
			prepState.playerName = player.name;
			prepState.playerAvatar = player.image;
		}

		goto('/game');
	}

	function handleDeclineResume() {
		pendingSave = null;
		showResumeModal = false;
		clearSavedMatch();
	}

	function pick(mode: GameMode) {
		if (mode === 'match') {
			prepState.startMatch();
		} else {
			prepState.startSession();
		}
		prepState.selectVenue(venue.name);
		prepState.selectLake(lake.name);
		goto(prepRulesUrl());
	}
</script>

<div class="flex min-h-dvh flex-col items-center justify-center bg-surface px-4 py-8">
	<div class="relative w-full max-w-sm">
		<div class="flex flex-col items-center gap-6">
			<div class="relative w-full overflow-hidden rounded-2xl shadow-lg">
				<img src={lakeHero} alt="{lake.name} at {venue.name}" class="h-auto w-full" />
				<div
					class="absolute top-3 left-1/2 -translate-x-1/2 rounded-lg bg-black/40 px-3 py-1.5 text-center"
				>
					<p class="text-sm font-semibold tracking-wide text-white/80 uppercase">Welcome to</p>
					<p class="text-base font-bold text-white">
						{venue.name} &mdash; {lake.name}
					</p>
				</div>
			</div>

			<div class="flex w-full flex-col gap-4">
				<button
					onclick={() => pick('session')}
					class="flex w-full cursor-pointer items-center gap-4 rounded-2xl bg-white/70 px-5 py-5 text-left shadow-md transition-shadow hover:shadow-lg"
				>
					<img src={lakeHero} alt="" class="h-14 w-14 shrink-0 rounded-xl object-cover" />
					<div class="min-w-0">
						<h2 class="text-lg font-bold text-dark-teal">Session</h2>
						<p class="text-sm text-dark-teal/60">Fish at your own pace</p>
					</div>
				</button>
				<button
					onclick={() => pick('match')}
					class="flex w-full cursor-pointer items-center gap-4 rounded-2xl bg-white/70 px-5 py-5 text-left shadow-md transition-shadow hover:shadow-lg"
				>
					<img src={matchThumb} alt="" class="h-14 w-14 shrink-0 rounded-xl object-cover" />
					<div class="min-w-0">
						<h2 class="text-lg font-bold text-dark-teal">Solo Match</h2>
						<p class="text-sm text-dark-teal/60">Timed competition against CPU anglers</p>
					</div>
				</button>
				<a
					href="/multiplayer"
					class="flex w-full cursor-pointer items-center gap-4 rounded-2xl bg-white/70 px-5 py-5 text-left shadow-md transition-shadow hover:shadow-lg no-underline"
				>
					<img src={venueThumb} alt="" class="h-14 w-14 shrink-0 rounded-xl object-cover" />
					<div class="min-w-0">
						<h2 class="text-lg font-bold text-dark-teal">Multiplayer Match</h2>
						<p class="text-sm text-dark-teal/60">Compete against friends online</p>
					</div>
				</a>
				<div class="flex w-full gap-4">
					<a
						href="/fish-log"
						class="flex w-1/2 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white/70 px-5 py-5 text-sm font-semibold text-dark-teal shadow-md no-underline transition-shadow hover:shadow-lg"
					>
						<svg
							viewBox="0 0 24 24"
							class="h-5 w-5"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
							<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
						</svg>
						Fish Log
					</a>
					<a
						href="/about"
						class="flex w-1/2 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white/70 px-5 py-5 text-sm font-semibold text-dark-teal shadow-md no-underline transition-shadow hover:shadow-lg"
					>
						<svg
							viewBox="0 0 24 24"
							class="h-5 w-5"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<circle cx="12" cy="12" r="10" />
							<line x1="12" y1="16" x2="12" y2="12" />
							<line x1="12" y1="8" x2="12.01" y2="8" />
						</svg>
						About
					</a>
				</div>
			</div>
		</div>
	</div>
</div>

{#if showResumeModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
		role="dialog"
		aria-modal="true"
	>
		<div class="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
			<h2 class="text-xl font-bold text-dark-teal">Unfinished Match</h2>
			<p class="mt-2 text-sm text-dark-teal/70">
				You have an unfinished solo match. Would you like to resume?
			</p>
			<div class="mt-6 flex gap-4">
				<button
					onclick={handleDeclineResume}
					class="flex-1 cursor-pointer rounded-lg bg-surface py-3 text-sm font-semibold text-dark-teal transition-colors hover:bg-surface/80"
				>
					Start Fresh
				</button>
				<button
					onclick={handleResume}
					class="flex-1 cursor-pointer rounded-lg bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/80"
				>
					Resume Match
				</button>
			</div>
		</div>
	</div>
{/if}
