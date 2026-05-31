<script lang="ts">
	import type { TackleSelection } from '$lib/data';

	let {
		tackle,
		onselect
	}: {
		tackle: TackleSelection;
		onselect: (cast: string, strata: string) => void;
	} = $props();

	const castOptions = ['Long', 'Medium', 'Short'] as const;
	const strataOptions = ['Top', 'Middle', 'Bottom'] as const;

	let isLeger = $derived(tackle.rod.name === 'Leger');
	let isPole = $derived(tackle.rod.name === 'Pole');

	let open = $state(false);

	let combos = $derived.by(() => {
		const result: { cast: string; strata: string; id: string }[] = [];
		for (const c of castOptions) {
			for (const s of strataOptions) {
				result.push({ cast: c, strata: s, id: c + s });
			}
		}
		return result;
	});

	function isDisabled(cast: string, strata: string) {
		return (isPole && cast !== 'Short') || (isLeger && strata !== 'Bottom');
	}

	function isActive(cast: string, strata: string) {
		return tackle.castStrength === cast && tackle.strata === strata;
	}

	function select(cast: string, strata: string) {
		if (isDisabled(cast, strata)) return;
		onselect(cast, strata);
		open = false;
	}
</script>

<div class="pointer-events-none absolute bottom-16 right-3 z-20">
	<div class="pointer-events-auto relative flex flex-col items-end">
		<button
			onclick={() => {
				open = !open;
			}}
			class="flex cursor-pointer items-center gap-2 rounded-full bg-black/60 px-3 py-2 text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-black/80
        {open ? 'ring-2 ring-primary' : ''}"
			aria-label="Quick tackle change"
		>
			<svg viewBox="0 0 24 24" class="h-5 w-5 shrink-0">
				<circle cx="4" cy="12" r="2" fill="currentColor" />
				<line
					x1="6"
					y1="12"
					x2={tackle.castStrength === 'Short'
						? '14'
						: tackle.castStrength === 'Medium'
							? '18'
							: '22'}
					y2="12"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
				/>
			</svg>
			<div class="h-5 w-px bg-white/20"></div>
			<svg viewBox="0 0 24 24" class="h-5 w-5 shrink-0">
				{#each ['Top', 'Middle', 'Bottom'] as layer, i (layer)}
					<rect
						x="6"
						y={4 + i * 6}
						width="12"
						height="4"
						rx="1"
						fill="currentColor"
						opacity={tackle.strata === layer ? 1 : 0.25}
					/>
				{/each}
			</svg>
		</button>
		{#if open}
			<div
				class="absolute bottom-full right-0 mb-2 w-max rounded-xl bg-black/80 p-2 shadow-lg backdrop-blur-sm"
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => e.key === 'Escape' && (open = false)}
				role="dialog"
				aria-label="Select cast strength and strata"
				tabindex="-1"
			>
				<div class="grid grid-cols-3 gap-1">
					{#each combos as combo (combo.id)}
						<button
							onclick={() => select(combo.cast, combo.strata)}
							disabled={isDisabled(combo.cast, combo.strata)}
							class="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg p-2.5 transition-colors
                {isActive(combo.cast, combo.strata)
								? 'bg-primary/30 text-primary ring-1 ring-primary/50'
								: isDisabled(combo.cast, combo.strata)
									? 'opacity-20 cursor-default text-white/40'
									: 'text-white/80 hover:bg-white/10'}"
						>
							<svg viewBox="0 0 24 24" class="h-7 w-7">
								<circle cx="5" cy="5" r="2" fill="currentColor" />
								<line
									x1="7"
									y1="5"
									x2={combo.cast === 'Long' ? '22' : combo.cast === 'Medium' ? '16' : '12'}
									y2="5"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
								/>
								{#each ['Top', 'Middle', 'Bottom'] as layer, i (layer)}
									<rect
										x="5"
										y={12 + i * 4}
										width="14"
										height="3"
										rx="1"
										fill="currentColor"
										opacity={combo.strata === layer ? 1 : 0.2}
									/>
								{/each}
							</svg>
						</button>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>
