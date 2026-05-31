<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { multiplayer } from '$lib/game/party/connection.svelte';
	import { prepState } from '$lib/game/prep-state.svelte';
	import { bots } from '$lib/data';
	import Filmstrip from '$lib/components/Filmstrip.svelte';
	import type { FilmstripItem } from '$lib/components/Filmstrip.svelte';
	import reelThumb from '$lib/assets/images/tackle/reel-fixed-spool.png';

	const NAME_KEY = 'jcmf-player-name';
	const AVATAR_KEY = 'jcmf-player-avatar';

	let name = $state(browser ? (localStorage.getItem(NAME_KEY) ?? '') : '');
	let avatar = $state(browser ? (localStorage.getItem(AVATAR_KEY) ?? '') : '');
	let code = $state('');
	let joining = $state(false);

	const botImages = import.meta.glob<string>('$lib/assets/images/bots/*.jpeg', {
		eager: true,
		query: '?url',
		import: 'default'
	});

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

	$effect(() => {
		localStorage.setItem(NAME_KEY, name);
	});

	$effect(() => {
		localStorage.setItem(AVATAR_KEY, avatar);
	});

	function joinMatch() {
		if (!name.trim() || !code.trim()) return;
		joining = true;
		prepState.playerName = name.trim();
		prepState.playerAvatar = avatar;
		multiplayer.joinRoom(name.trim(), code.trim(), avatar);
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
	<div class="flex w-full max-w-sm flex-col items-center gap-4">
		<div class="flex w-full items-center gap-4 rounded-2xl bg-white/70 px-5 py-5 shadow-md">
			<img src={reelThumb} alt="" class="h-14 w-14 shrink-0 rounded-xl object-cover" />
			<div class="min-w-0">
				<h1 class="text-lg font-bold text-dark-teal">Join a Match</h1>
				<p class="text-sm text-dark-teal/60">Enter a code to join a friend's match</p>
			</div>
		</div>

		<div class="flex w-full flex-col gap-4 rounded-2xl bg-white/70 px-5 py-5 shadow-md">
			{#if multiplayer.error}
				<div class="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
					{multiplayer.error}
				</div>
			{/if}

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
				<label for="code" class="text-sm font-medium text-dark-teal">Match Code</label>
				<input
					id="code"
					type="text"
					maxlength="4"
					bind:value={code}
					placeholder="e.g. XK7B"
					class="rounded-xl border border-dark-teal/20 bg-white px-4 py-3 text-center text-2xl font-bold tracking-[0.3em] uppercase text-dark-teal outline-none focus:border-accent"
				/>
			</div>

			<button
				onclick={joinMatch}
				disabled={!name.trim() || !code.trim() || joining}
				class="w-full cursor-pointer rounded-xl bg-accent px-5 py-3 text-center font-bold text-white shadow-md transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{joining ? 'Joining...' : 'Join Match'}
			</button>
		</div>

		<a
			href="/multiplayer"
			class="text-center text-sm text-muted underline underline-offset-2 hover:text-dark-teal"
		>
			Back
		</a>
	</div>
</div>
