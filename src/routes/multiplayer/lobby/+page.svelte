<script lang="ts">
	import { goto } from '$app/navigation';
	import { multiplayer } from '$lib/game/party/connection.svelte';
	import { venues } from '$lib/data';

	const venue = venues[0];
	const lake = venue.lakes[0];
	const pegLookup = new Map(lake.pegs.map((p) => [p.name, p]));
	const pegImages = import.meta.glob<string>('$lib/assets/images/pegs/*.jpeg', {
		eager: true,
		query: '?url',
		import: 'default'
	});

	function startGame() {
		multiplayer.startGame();
	}

	$effect(() => {
		if (multiplayer.phase === 'fishing') {
			goto('/prep/tackle?timed=1&multi=1');
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
</script>

<div class="flex min-h-dvh flex-col items-center bg-surface px-4 py-8">
	<div class="flex w-full max-w-sm flex-col gap-6">
		<h1 class="text-center text-2xl font-bold text-dark-teal">Lobby</h1>

		<div class="rounded-2xl bg-white/70 px-5 py-4 text-center shadow-md">
			<p class="text-xs text-dark-teal/60">Room Code</p>
			<p class="text-3xl font-bold tracking-[0.3em] text-accent">{multiplayer.joinCode}</p>
		</div>

		{#if multiplayer.ownPeg}
			{@const peg = pegLookup.get(multiplayer.ownPeg)}
			<div class="overflow-hidden rounded-2xl shadow-md">
				<img
					src={pegImage(multiplayer.ownPeg)}
					alt="Peg {multiplayer.ownPeg}"
					class="h-40 w-full object-cover"
				/>
				<div class="bg-white/70 px-5 py-4">
					<h2 class="text-lg font-bold text-dark-teal">Your Peg — {multiplayer.ownPeg}</h2>
					<p class="mt-1 text-sm text-dark-teal/70">{peg?.description}</p>
				</div>
			</div>
		{/if}

		<div class="flex flex-col gap-2">
			<h3 class="text-sm font-medium text-dark-teal/60">Players</h3>
			{#each multiplayer.players as player (player.name)}
				<div
					class="flex items-center gap-3 rounded-xl bg-white/70 px-4 py-3 shadow-sm {player.name ===
					multiplayer.playerName
						? 'ring-2 ring-accent'
						: ''}"
				>
					<div
						class="flex h-8 w-8 items-center justify-center rounded-full bg-dark-teal/10 text-sm font-bold text-dark-teal"
					>
						{player.name[0].toUpperCase()}
					</div>
					<div class="flex-1">
						<p class="font-medium text-dark-teal">
							{player.name}
							{#if player.name === multiplayer.hostName}
								<span class="text-xs text-accent">(Host)</span>
							{/if}
						</p>
						<p class="text-xs text-dark-teal/50">Peg {player.pegName}</p>
					</div>
				</div>
			{/each}
		</div>

		<div class="flex flex-col gap-3">
			{#if multiplayer.isHost}
				<button
					onclick={startGame}
					class="w-full cursor-pointer rounded-xl bg-accent px-5 py-4 text-center font-bold text-white shadow-md transition-opacity hover:opacity-90"
				>
					Start Match
				</button>
				<p class="text-center text-xs text-dark-teal/40">
					{multiplayer.players.length < 8
						? 'Waiting for players — {8 - multiplayer.players.length} pegs open'
						: 'All pegs filled'}
				</p>
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
