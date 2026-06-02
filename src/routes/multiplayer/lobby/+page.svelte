<script lang="ts">
	import { goto } from '$app/navigation';
	import { multiplayer } from '$lib/game/party/connection.svelte';
	import { gameState } from '$lib/game/state.svelte';
	import { venues } from '$lib/data';
	import Filmstrip from '$lib/components/Filmstrip.svelte';
	import type { FilmstripItem } from '$lib/components/Filmstrip.svelte';

	const venue = venues[0];
	const lake = venue.lakes[0];
	const pegLookup = new Map(lake.pegs.map((p) => [p.name, p]));
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

	function startGame() {
		multiplayer.startGame();
	}

	$effect(() => {
		if (multiplayer.phase === 'fishing') {
			gameState.reset();
			goto('/game?multi=1');
		}
		if (multiplayer.phase === 'idle') {
			goto('/menu');
		}
	});

	function leaveLobby() {
		multiplayer.leave();
	}

	function pegImage(pegName: string): string {
		const key = Object.keys(pegImages).find((k) => k.includes(`jcs-match-${pegName}`));
		return key ? pegImages[key] : '';
	}

	function playerImg(image: string): string {
		return image ? (botImages[`/src/lib/assets/images/bots/${image}`] ?? '') : '';
	}

	let filmstripPlayers = $derived<FilmstripItem[]>(
		[...multiplayer.players]
			.sort((a, b) => {
				if (a.name === multiplayer.hostName) return -1;
				if (b.name === multiplayer.hostName) return 1;
				return 0;
			})
			.map((p) => ({
				id: p.name + p.pegName,
				label: p.name,
				imageUrl: playerImg(p.image) || undefined,
				description: `Peg ${p.pegName}`
			}))
	);
</script>

<div class="flex min-h-dvh flex-col items-center bg-surface px-4 py-8">
	<div class="flex w-full max-w-sm flex-col gap-6">
		{#if multiplayer.ownPeg}
			{@const peg = pegLookup.get(multiplayer.ownPeg)}
			<div class="relative overflow-hidden rounded-2xl shadow-md">
				<img
					src={pegImage(multiplayer.ownPeg)}
					alt="Peg {multiplayer.ownPeg}"
					class="aspect-square w-full object-cover"
				/>
				<div class="absolute top-3 left-3 rounded-lg bg-black/40 px-3 py-2">
					<p class="text-center text-sm text-white/60">Match Code</p>
					<p class="text-center text-2xl font-bold tracking-[0.3em] text-white">
						{multiplayer.joinCode}
					</p>
				</div>
				<div class="absolute top-3 right-3 rounded-lg bg-black/40 px-3 py-1.5">
					<p class="text-sm font-bold tabular-nums text-white/90">
						{multiplayer.timeLimitMinutes}m
					</p>
				</div>
				<div class="absolute inset-x-0 bottom-0 rounded-lg bg-black/40 px-4 py-3">
					<p class="text-base font-bold text-white">Your Peg — {multiplayer.ownPeg}</p>
					<p class="mt-0.5 text-base text-white/80">{peg?.description}</p>
				</div>
			</div>
		{/if}

		<div class="flex flex-col gap-2">
			<p class="text-center text-xs text-dark-teal/40">
				{multiplayer.players.length < 8
					? `Waiting for players — ${8 - multiplayer.players.length} pegs available`
					: 'All pegs filled'}
			</p>
			<Filmstrip
				items={filmstripPlayers}
				selected={multiplayer.playerName + multiplayer.ownPeg}
				variant="display"
			/>
		</div>

		<div class="flex flex-col gap-3">
			{#if multiplayer.isHost}
				<button
					onclick={startGame}
					class="w-full cursor-pointer rounded-xl bg-accent px-5 py-4 text-center font-bold text-white shadow-md transition-opacity hover:opacity-90"
				>
					Start Match
				</button>
			{:else}
				<div class="rounded-xl bg-white/70 px-5 py-4 text-center shadow-md">
					<p class="text-sm text-dark-teal/50">Waiting for host to start the match...</p>
				</div>
			{/if}
			<button
				onclick={leaveLobby}
				class="w-full cursor-pointer rounded-xl border border-danger/30 bg-white/70 px-5 py-3 text-center text-sm font-medium text-danger transition-colors hover:bg-danger/10"
			>
				Leave
			</button>
		</div>
	</div>
</div>
