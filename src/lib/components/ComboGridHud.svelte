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

	let open = $state(false);

	function isDisabled(cast: string, strata: string) {
		return (
			!tackle.rod.allowedCastStrengths.includes(cast) || !tackle.rod.allowedStrata.includes(strata)
		);
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
			class="flex cursor-pointer flex-col items-center gap-1 rounded-full bg-black/60 px-3 py-2 text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-black/80
        {open ? 'ring-2 ring-primary' : ''}"
			aria-label="Quick tackle change"
		>
			<div class="flex flex-col items-center gap-0.5">
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
				<span class="text-[10px] leading-tight text-white/80">{tackle.castStrength}</span>
			</div>
			<div class="flex flex-col items-center gap-0.5">
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
				<span class="text-[10px] leading-tight text-white/80">{tackle.strata}</span>
			</div>
		</button>
		{#if open}
			<div
				class="absolute bottom-full right-0 mb-2 rounded-xl bg-black/80 p-2 shadow-lg backdrop-blur-sm"
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => e.key === 'Escape' && (open = false)}
				role="dialog"
				aria-label="Select cast strength and strata"
				tabindex="-1"
			>
				{#each castOptions as cast, ci (cast)}
					{@const isRowDisabled = !tackle.rod.allowedCastStrengths.includes(cast)}
					<div
						class="flex items-center gap-2 {ci > 0 ? 'border-t border-white/10' : ''} {ci > 0
							? 'pt-2'
							: ''}"
					>
						<span
							class="w-16 shrink-0 text-sm font-medium text-white/80 {isRowDisabled
								? 'opacity-20'
								: ''}"
						>
							{cast}
						</span>
						{#each strataOptions as strata (strata)}
							<button
								onclick={() => select(cast, strata)}
								disabled={isDisabled(cast, strata)}
								class="flex aspect-square flex-1 cursor-pointer items-center justify-center rounded-lg p-2 transition-colors
                  {isActive(cast, strata)
									? 'bg-primary/30 text-primary ring-inset ring-1 ring-primary/50'
									: isDisabled(cast, strata)
										? 'opacity-20 cursor-default text-white/40'
										: 'text-white/80 hover:bg-white/10'}"
							>
								<svg viewBox="0 0 24 24" class="h-7 w-7">
									{#each ['Top', 'Middle', 'Bottom'] as layer, i (layer)}
										<rect
											x="5"
											y={12 + i * 4}
											width="14"
											height="3"
											rx="1"
											fill="currentColor"
											opacity={strata === layer ? 1 : 0.2}
										/>
									{/each}
								</svg>
							</button>
						{/each}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
