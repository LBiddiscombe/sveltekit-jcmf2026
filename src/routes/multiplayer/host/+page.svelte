<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { multiplayer } from '$lib/game/party/connection.svelte';

	const STORAGE_KEY = 'jcmf-player-name';
	const TIME_PRESETS = [1, 5, 10, 20, 30, 60];

	let name = $state(browser ? (localStorage.getItem(STORAGE_KEY) ?? '') : '');
	let timeLimit = $state(10);
	let creating = $state(false);

	$effect(() => {
		if (browser) {
			localStorage.setItem(STORAGE_KEY, name);
		}
	});

	function createRoom() {
		if (!name.trim()) return;
		creating = true;
		multiplayer.createRoom(name.trim(), timeLimit);
	}

	$effect(() => {
		if (creating && multiplayer.phase === 'lobby') {
			goto('/multiplayer/lobby');
		}
		if (multiplayer.error) {
			creating = false;
			multiplayer.error = null;
		}
	});
</script>

<div class="flex min-h-dvh flex-col items-center justify-center bg-surface px-4 py-8">
	<div class="flex w-full max-w-sm flex-col gap-6">
		<h1 class="text-center text-2xl font-bold text-dark-teal">Host a Game</h1>

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
				<span class="text-sm font-medium text-dark-teal">Time Limit</span>
				<div class="grid grid-cols-3 gap-2" role="radiogroup">
					{#each TIME_PRESETS as preset}
						<button
							onclick={() => (timeLimit = preset)}
							class="rounded-xl border px-3 py-2 text-center text-sm font-medium transition-colors {timeLimit ===
							preset
								? 'border-accent bg-accent/10 text-accent'
								: 'border-dark-teal/20 bg-white/70 text-dark-teal hover:border-dark-teal/40'}"
						>
							{preset}m
						</button>
					{/each}
				</div>
			</div>

			<button
				onclick={createRoom}
				disabled={!name.trim() || creating}
				class="mt-2 w-full cursor-pointer rounded-xl bg-accent px-5 py-3 text-center font-bold text-white shadow-md transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{creating ? 'Creating...' : 'Create Room'}
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
