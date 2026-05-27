<script lang="ts">
	import { onMount } from 'svelte';
	import { multiplayer } from '$lib/game/party/connection.svelte';
	import venueThumb from '$lib/assets/images/venues/jcs.jpeg';
	import reelThumb from '$lib/assets/images/tackle/reel-fixed-spool.png';

	onMount(() => {
		multiplayer.leave();
	});
</script>

<div class="flex min-h-dvh flex-col items-center justify-center bg-surface px-4 py-8">
	<div class="flex w-full max-w-sm flex-col items-center gap-6">
		<div class="flex w-full flex-col gap-4">
			<a
				href="/multiplayer/host"
				class="flex w-full cursor-pointer items-center gap-4 rounded-2xl bg-white/70 px-5 py-5 text-left shadow-md transition-shadow hover:shadow-lg no-underline"
			>
				<img src={venueThumb} alt="" class="h-14 w-14 shrink-0 rounded-xl object-cover" />
				<div class="min-w-0">
					<h2 class="text-lg font-bold text-dark-teal">Host a Match</h2>
					<p class="text-sm text-dark-teal/60">Create a match and share the code with friends</p>
				</div>
			</a>
			<a
				href="/multiplayer/join"
				class="flex w-full cursor-pointer items-center gap-4 rounded-2xl bg-white/70 px-5 py-5 text-left shadow-md transition-shadow hover:shadow-lg no-underline"
			>
				<img src={reelThumb} alt="" class="h-14 w-14 shrink-0 rounded-xl object-cover" />
				<div class="min-w-0">
					<h2 class="text-lg font-bold text-dark-teal">Join a Match</h2>
					<p class="text-sm text-dark-teal/60">Enter a code to join a friend's match</p>
				</div>
			</a>
		</div>

		<a
			href="/menu"
			class="mt-4 text-center text-base text-muted underline underline-offset-2 hover:text-dark-teal"
		>
			Back to Menu
		</a>
	</div>
</div>
