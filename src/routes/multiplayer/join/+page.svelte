<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { multiplayer } from '$lib/game/party/connection.svelte';

	const STORAGE_KEY = 'jcmf-player-name';

	let name = $state(browser ? (localStorage.getItem(STORAGE_KEY) ?? '') : '');
	let code = $state('');
	let joining = $state(false);

	$effect(() => {
		if (browser) {
			localStorage.setItem(STORAGE_KEY, name);
		}
	});

	function joinRoom() {
		if (!name.trim() || !code.trim()) return;
		joining = true;
		multiplayer.joinRoom(name.trim(), code.trim());
	}

	$effect(() => {
		if (joining && multiplayer.phase === 'lobby') {
			goto('/multiplayer/lobby');
		}
		if (multiplayer.error) {
			joining = false;
		}
	});
</script>

<div class="flex min-h-dvh flex-col items-center justify-center bg-surface px-4 py-8">
	<div class="flex w-full max-w-sm flex-col gap-6">
		<h1 class="text-center text-2xl font-bold text-dark-teal">Join a Game</h1>

		{#if multiplayer.error}
			<div class="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
				{multiplayer.error}
			</div>
		{/if}

		<div class="flex flex-col gap-4">
			<div class="flex flex-col gap-1">
				<label for="name" class="text-sm font-medium text-dark-teal">Your Name</label>
				<input
					id="name"
					type="text"
					maxlength="15"
					bind:value={name}
					placeholder="Enter your name"
					class="rounded-xl border border-dark-teal/20 bg-white/70 px-4 py-3 text-dark-teal outline-none focus:border-accent"
				/>
			</div>

			<div class="flex flex-col gap-1">
				<label for="code" class="text-sm font-medium text-dark-teal">Room Code</label>
				<input
					id="code"
					type="text"
					maxlength="4"
					bind:value={code}
					placeholder="e.g. XK7B"
					class="text-center text-2xl font-bold tracking-[0.3em] uppercase rounded-xl border border-dark-teal/20 bg-white/70 px-4 py-3 text-dark-teal outline-none focus:border-accent"
				/>
			</div>

			<button
				onclick={joinRoom}
				disabled={!name.trim() || !code.trim() || joining}
				class="mt-2 w-full cursor-pointer rounded-xl bg-accent px-5 py-3 text-center font-bold text-white shadow-md transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{joining ? 'Joining...' : 'Join Room'}
			</button>
		</div>

		<a
			href="/menu"
			class="text-center text-sm text-muted underline underline-offset-2 hover:text-dark-teal"
		>
			Back
		</a>
	</div>
</div>
