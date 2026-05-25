<script lang="ts">
	import { goto } from '$app/navigation';
	import { prepState } from '$lib/game/prep-state.svelte';
	import { prepRulesUrl } from '$lib/game/prep-flow';
	import type { GameMode } from '$lib/game/prep-flow';
	import { venues } from '$lib/data';
	import lakeHero from '$lib/assets/images/lakes/jcs-match.jpeg';
	import sessionThumb from '$lib/assets/images/pegs/jcs-match-2.jpeg';
	import venueThumb from '$lib/assets/images/venues/jcs.jpeg';

	const venue = venues[0];
	const lake = venue.lakes[0];

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
	<div class="flex w-full max-w-sm flex-col items-center gap-6">
		<p class="text-lg text-dark-teal/70">
			Welcome to <span class="font-bold text-dark-teal">{venue.name} &mdash; {lake.name}</span>
		</p>

		<div class="w-full overflow-hidden rounded-2xl shadow-lg">
			<img src={lakeHero} alt="{lake.name} at {venue.name}" class="h-auto w-full" />
		</div>

		<div class="flex w-full flex-col gap-4">
			<button
				onclick={() => pick('session')}
				class="flex w-full cursor-pointer items-center gap-4 rounded-2xl bg-white/70 px-5 py-5 text-left shadow-md transition-shadow hover:shadow-lg"
			>
				<img src={sessionThumb} alt="" class="h-14 w-14 shrink-0 rounded-xl object-cover" />
				<div class="min-w-0">
					<h2 class="text-lg font-bold text-dark-teal">Session</h2>
					<p class="text-sm text-dark-teal/60">Fish at your own pace</p>
				</div>
			</button>
			<button
				onclick={() => pick('match')}
				class="flex w-full cursor-pointer items-center gap-4 rounded-2xl bg-white/70 px-5 py-5 text-left shadow-md transition-shadow hover:shadow-lg"
			>
				<img src={venueThumb} alt="" class="h-14 w-14 shrink-0 rounded-xl object-cover" />
				<div class="min-w-0">
					<h2 class="text-lg font-bold text-dark-teal">Match</h2>
					<p class="text-sm text-dark-teal/60">Timed competition against CPU anglers</p>
				</div>
			</button>
		</div>

		<a href="/about" class="text-sm text-muted underline underline-offset-2 hover:text-dark-teal">
			About
		</a>
	</div>
</div>
