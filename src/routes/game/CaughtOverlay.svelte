<script lang="ts">
	import confetti from 'canvas-confetti';
	import type { Species } from '$lib/data';
	import { checkIsPB, recordPB, getPBs } from '$lib/game/pbs';

	const fishImages = import.meta.glob<string>('$lib/assets/images/fish/*.PNG', {
		eager: true,
		query: '?url',
		import: 'default'
	});

	let {
		species,
		weightOz,
		classificationLabel,
		released = false,
		ondismiss
	}: {
		species: Species;
		weightOz: number;
		classificationLabel: string;
		released?: boolean;
		ondismiss: () => void;
	} = $props();

	const TIER_WIDTHS = [80, 160, 240, 240] as const;
	const MONSTER_HEIGHT = 1.5;

	let fishImageUrl = $derived.by(() => {
		const key = `/src/lib/assets/images/fish/${species.name.toLowerCase()}.PNG`;
		return fishImages[key] ?? '';
	});

	let fishDisplay = $derived.by((): { width: number; heightScale: number } => {
		const tiers = species.classifications;
		if (weightOz <= tiers[0].maxOz) return { width: TIER_WIDTHS[0], heightScale: 1 };
		if (weightOz <= tiers[1].maxOz) return { width: TIER_WIDTHS[1], heightScale: 1 };
		if (weightOz <= tiers[2].maxOz) return { width: TIER_WIDTHS[2], heightScale: 1 };
		return { width: TIER_WIDTHS[3], heightScale: MONSTER_HEIGHT };
	});

	let pbStatus = $derived.by(() => {
		return checkIsPB(species.name, weightOz, species.record);
	});

	let isNewSpecies = $derived.by(() => {
		const pbs = getPBs();
		return !pbs[species.name];
	});

	$effect(() => {
		if (pbStatus) {
			recordPB(species.name, weightOz);
		}
	});

	$effect(() => {
		if (pbStatus && !released) {
			if (pbStatus === 'record') {
				confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
				setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { y: 0.5 } }), 300);
				setTimeout(() => confetti({ particleCount: 60, spread: 120, origin: { y: 0.5 } }), 600);
			} else {
				confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
			}
		}
	});

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') ondismiss();
	}
</script>

<div
	class="absolute inset-0 flex cursor-pointer items-center justify-center"
	role="button"
	tabindex="0"
	onclick={ondismiss}
	onkeydown={handleKeydown}
>
	<div class="relative rounded-lg bg-black/40 px-6 py-4 text-center">
		{#if isNewSpecies}
			<span
				class="absolute -top-2 -right-2 flex items-center gap-1 rounded-full bg-emerald-500/80 px-2.5 py-1 text-[10px] font-bold leading-none text-white shadow-lg backdrop-blur-sm"
			>
				new species
			</span>
		{:else if pbStatus}
			<span
				class="absolute -top-2 -right-2 flex items-center gap-1 rounded-full bg-amber-400/80 px-2.5 py-1 text-[10px] font-bold leading-none text-white shadow-lg backdrop-blur-sm"
			>
				{pbStatus === 'record' ? 'new world record' : 'personal best'}
			</span>
		{/if}
		{#if fishImageUrl}
			<div class="mb-2 flex justify-center">
				<div style="transform: scaleY({fishDisplay.heightScale}); transform-origin: bottom;">
					<img
						src={fishImageUrl}
						alt={species.name}
						class="fish-bounce-in"
						style="max-width: {fishDisplay.width}px"
						loading="eager"
					/>
				</div>
			</div>
		{/if}
		<p class="text-sm font-bold text-white">
			{released
				? `You caught a ${classificationLabel || ''} ${species.name}! — Released, not a qualifying species`
				: `You caught a ${classificationLabel || ''} ${species.name}!`}
		</p>
	</div>
</div>

<style>
	.fish-bounce-in {
		animation: fishBounceIn 0.6s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards;
	}

	@keyframes fishBounceIn {
		0% {
			transform: scale(0);
			opacity: 0;
		}
		60% {
			transform: scale(1.1);
			opacity: 1;
		}
		80% {
			transform: scale(0.95);
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}
</style>
