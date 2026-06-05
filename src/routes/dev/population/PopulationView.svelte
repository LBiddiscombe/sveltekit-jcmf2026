<script lang="ts">
	import type { Species, Peg, EnvironmentalFeatures } from '$lib/data/types';
	import type { FishData } from '$lib/game/population';
	import { formatWeight } from '$lib/utils/format';

	type PegPop = { peg: Peg; fish: FishData[] };

	let {
		populations,
		speciesList,
		selectedPeg,
		onselectPeg
	}: {
		populations: PegPop[];
		speciesList: Species[];
		selectedPeg: string | null;
		onselectPeg: (name: string | null) => void;
	} = $props();

	const COLORS: Record<string, string> = {
		Barbel: '#d4a574',
		Bream: '#a0aab0',
		Carp: '#c8982a',
		Chub: '#6b8e23',
		Crucian: '#e8b840',
		Dace: '#7ec8e3',
		Eel: '#3a5f5f',
		Grayling: '#8899aa',
		Perch: '#4caf50',
		Pike: '#2e7d32',
		Roach: '#e04040',
		Rudd: '#ff8a65',
		Tench: '#66bb6a'
	};
	function color(n: string) {
		return COLORS[n] ?? '#999';
	}

	const allSpeciesNames = $derived(speciesList.map((s) => s.name));

	const bySpeciesPerPeg = $derived.by(() => {
		return populations.map((pop) => {
			const m: Record<string, number> = {};
			for (const f of pop.fish) m[f.species] = (m[f.species] ?? 0) + 1;
			return m;
		});
	});

	const lakeTotals = $derived.by(() => {
		const m: Record<string, number> = {};
		for (const counts of bySpeciesPerPeg) {
			for (const [name, c] of Object.entries(counts)) {
				m[name] = (m[name] ?? 0) + c;
			}
		}
		return Object.entries(m).sort((a, b) => b[1] - a[1]);
	});

	const lakeTotalFish = $derived(populations.reduce((a, p) => a + p.fish.length, 0));

	const lakeSpeciesBreakdown = $derived.by(() => {
		const m: Record<
			string,
			{ count: number; tier0: number; tier1: number; specimen: number; monster: number }
		> = {};
		for (const pop of populations) {
			for (const f of pop.fish) {
				if (!m[f.species]) m[f.species] = { count: 0, tier0: 0, tier1: 0, specimen: 0, monster: 0 };
				m[f.species].count++;
				if (f.tierIndex === 0) m[f.species].tier0++;
				else if (f.tierIndex === 1) m[f.species].tier1++;
				else if (f.tierIndex === 2) m[f.species].specimen++;
				else m[f.species].monster++;
			}
		}
		return Object.entries(m).sort((a, b) => b[1].count - a[1].count);
	});

	const maxPegCount = $derived.by(() => {
		let m = 0;
		for (const map of bySpeciesPerPeg) {
			for (const v of Object.values(map)) if (v > m) m = v;
		}
		return m || 1;
	});

	const stratas = ['Top', 'Middle', 'Bottom'];
	const casts = ['Short', 'Medium', 'Long'];

	const selectedPop = $derived(
		selectedPeg ? (populations.find((p) => p.peg.name === selectedPeg) ?? null) : null
	);

	const zoneGrid = $derived.by(() => {
		if (!selectedPop) return [];
		return casts.map((cs) =>
			stratas.map((st) => {
				const zf = selectedPop.fish.filter((f) => f.castStrength === cs && f.strata === st);
				const sc: Record<string, number> = {};
				let monsters = 0,
					specimens = 0;
				for (const f of zf) {
					sc[f.species] = (sc[f.species] ?? 0) + 1;
					if (f.tierIndex >= 3) monsters++;
					else if (f.tierIndex >= 2) specimens++;
				}
				return {
					castStrength: cs,
					strata: st,
					fish: zf,
					species: sc,
					total: zf.length,
					monsters,
					specimens
				};
			})
		);
	});

	const deepest = $derived.by(() => {
		let m = 0;
		for (const row of zoneGrid) for (const c of row) if (c.total > m) m = c.total;
		return m || 1;
	});

	const pegSpecies = $derived.by(() => {
		if (!selectedPop) return [];
		const m: Record<
			string,
			{
				count: number;
				weight: number;
				tier0: number;
				tier1: number;
				specimen: number;
				monster: number;
			}
		> = {};
		for (const f of selectedPop.fish) {
			if (!m[f.species])
				m[f.species] = { count: 0, weight: 0, tier0: 0, tier1: 0, specimen: 0, monster: 0 };
			m[f.species].count++;
			m[f.species].weight += f.weightOz;
			if (f.tierIndex === 0) m[f.species].tier0++;
			else if (f.tierIndex === 1) m[f.species].tier1++;
			else if (f.tierIndex === 2) m[f.species].specimen++;
			else m[f.species].monster++;
		}
		return Object.entries(m).sort((a, b) => b[1].count - a[1].count);
	});

	const pegTotals = $derived.by(() => {
		let count = 0,
			tier0 = 0,
			tier1 = 0,
			specimen = 0,
			monster = 0;
		for (const [, info] of pegSpecies) {
			count += info.count;
			tier0 += info.tier0;
			tier1 += info.tier1;
			specimen += info.specimen;
			monster += info.monster;
		}
		return { count, tier0, tier1, specimen, monster };
	});

	const lakeTotalsRow = $derived.by(() => {
		let count = 0,
			tier0 = 0,
			tier1 = 0,
			specimen = 0,
			monster = 0;
		for (const [, info] of lakeSpeciesBreakdown) {
			count += info.count;
			tier0 += info.tier0;
			tier1 += info.tier1;
			specimen += info.specimen;
			monster += info.monster;
		}
		return { count, tier0, tier1, specimen, monster };
	});

	function featuresSummary(features: EnvironmentalFeatures): string {
		const lbl: Record<string, string> = {
			flow: 'Fl',
			clarity: 'Cl',
			substrate: 'Su',
			vegetation: 'Vg',
			shelter: 'Sh'
		};
		return Object.entries(features)
			.map(([k, v]) => `${lbl[k]}${v.toFixed(1)}`)
			.join(' ');
	}

	let zoneFilter = $state<string | null>(null);
</script>

{#if selectedPop && selectedPeg}
	<div class="flex flex-col gap-2">
		<button
			onclick={() => {
				onselectPeg(null);
				zoneFilter = null;
			}}
			class="self-start rounded bg-dark-teal/10 px-3 py-1 text-sm text-dark-teal hover:bg-dark-teal/20"
			>&larr; All pegs</button
		>

		<div class="rounded-lg border border-olive bg-white/80 p-3">
			<h3 class="text-lg font-bold text-dark-teal">Peg {selectedPop.peg.name}</h3>
			<p class="text-xs text-muted">{selectedPop.peg.description}</p>
			<p class="mt-1 text-[10px] text-muted">{featuresSummary(selectedPop.peg.features)}</p>
		</div>

		<div class="overflow-x-auto">
			<table class="w-full text-xs">
				<thead>
					<tr>
						<th class="p-1 text-left text-muted">Strata \ Cast</th>
						{#each casts as cs (cs)}<th class="p-1 text-center font-bold text-dark-teal">{cs}</th
							>{/each}
					</tr>
				</thead>
				<tbody>
					{#each stratas as strata, ri (strata)}
						<tr>
							<td class="p-1 font-bold text-dark-teal">{strata}</td>
							{#each zoneGrid as row (row[0].castStrength + row[0].strata)}
								{@const cell = row[ri]}
								<td class="p-0.5">
									<button
										onclick={() =>
											(zoneFilter =
												zoneFilter === `${cell.castStrength}|${cell.strata}`
													? null
													: `${cell.castStrength}|${cell.strata}`)}
										class="w-full cursor-pointer rounded border p-1 transition-all hover:border-accent"
										style="background:{cell.total > 0
											? `hsl(120,70%,${80 - (cell.total / deepest) * 50}%)`
											: '#f5f5f5'}; border-color: {zoneFilter ===
										`${cell.castStrength}|${cell.strata}`
											? '#c8982a'
											: '#d1d5db'}"
									>
										<div class="text-center font-bold text-dark-teal">{cell.total}</div>
										{#if cell.total > 0}
											<div class="flex justify-center gap-0.5">
												{#each Object.entries(cell.species).sort((a, b) => b[1] - a[1]) as [n, c] (n)}
													<div
														class="h-2 w-2 rounded-full"
														style="background:{color(n)}"
														title="{n}: {c}"
													></div>
												{/each}
											</div>
										{/if}
										{#if cell.monsters > 0 || cell.specimens > 0}
											<div class="mt-0.5 text-center text-[8px] text-muted">
												{#if cell.specimens > 0}sp{cell.specimens}{/if}
												{#if cell.monsters > 0}
													mo{cell.monsters}{/if}
											</div>
										{/if}
									</button>
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<div class="rounded-lg border border-olive bg-white/80 p-2">
			<h4 class="mb-1 text-xs font-bold text-dark-teal">Peg {selectedPop.peg.name} — all fish</h4>
			<table class="w-full text-xs">
				<thead>
					<tr class="border-b border-olive/20 text-muted">
						<th class="p-1 text-left">Species</th>
						<th class="p-1 text-right">Count</th>
						<th class="p-1 text-right">Small</th>
						<th class="p-1 text-right">Medium</th>
						<th class="p-1 text-right">Specimen</th>
						<th class="p-1 text-right">Monster</th>
					</tr>
				</thead>
				<tbody>
					{#each pegSpecies as [name, info] (name)}
						{@const pct = ((info.count / pegTotals.count) * 100).toFixed(0)}
						<tr class="border-b border-olive/10">
							<td class="flex items-center gap-1 p-1 text-dark-teal">
								<div class="h-2.5 w-2.5 shrink-0 rounded-sm" style="background:{color(name)}"></div>
								{name}
							</td>
							<td class="p-1 text-right font-semibold text-dark-teal">{info.count} ({pct}%)</td>
							<td class="p-1 text-right text-muted">{info.tier0}</td>
							<td class="p-1 text-right text-muted">{info.tier1}</td>
							<td class="p-1 text-right text-muted">{info.specimen}</td>
							<td class="p-1 text-right font-semibold text-orange-600">{info.monster}</td>
						</tr>
					{/each}
				</tbody>
				<tfoot>
					<tr class="border-t-2 border-olive/40 font-bold text-dark-teal">
						<td class="p-1">Total</td>
						<td class="p-1 text-right">{pegTotals.count}</td>
						<td class="p-1 text-right text-muted"
							>{pegTotals.tier0} ({((pegTotals.tier0 / pegTotals.count) * 100).toFixed(0)}%)</td
						>
						<td class="p-1 text-right text-muted"
							>{pegTotals.tier1} ({((pegTotals.tier1 / pegTotals.count) * 100).toFixed(0)}%)</td
						>
						<td class="p-1 text-right text-muted"
							>{pegTotals.specimen} ({((pegTotals.specimen / pegTotals.count) * 100).toFixed(
								0
							)}%)</td
						>
						<td class="p-1 text-right text-orange-600"
							>{pegTotals.monster} ({((pegTotals.monster / pegTotals.count) * 100).toFixed(0)}%)</td
						>
					</tr>
				</tfoot>
			</table>
		</div>

		{#if zoneFilter}
			{@const zc = zoneFilter.split('|')[0]}
			{@const zs = zoneFilter.split('|')[1]}
			{@const cell = zoneGrid[casts.indexOf(zc)]?.[stratas.indexOf(zs)]}
			{#if cell}
				{@const sorted = [...cell.fish].sort((a, b) => b.weightOz - a.weightOz)}
				<div class="rounded-lg border border-accent bg-white/90 p-2">
					<h4 class="mb-1 text-xs font-bold text-dark-teal">
						{cell.castStrength} / {cell.strata} — {cell.total} fish
					</h4>
					<div class="flex max-h-64 flex-wrap gap-1 overflow-y-auto">
						{#each sorted as f (f.id)}
							<div
								class="inline-flex items-center gap-1 rounded-full border border-olive/30 px-2 py-0.5 text-[10px] whitespace-nowrap"
								style="background:{color(f.species)}18; border-color:{color(f.species)}40"
							>
								<span class="font-semibold text-dark-teal">{formatWeight(f.weightOz)}</span>
								{#if f.classificationLabel}<span class="text-muted">{f.classificationLabel}</span
									>{/if}
								<span class="text-dark-teal/70">{f.species}</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{/if}
	</div>
{:else}
	<div class="overflow-x-auto">
		<table class="w-full text-xs">
			<thead>
				<tr>
					<th class="p-1 text-left text-muted">Species</th>
					{#each populations as pop (pop.peg.name)}
						<th class="p-1 text-center">
							<button
								onclick={() => onselectPeg(pop.peg.name)}
								class="cursor-pointer font-bold text-dark-teal underline-offset-2 hover:underline"
								>P{pop.peg.name}</button
							>
						</th>
					{/each}
					<th class="p-1 text-center font-bold text-dark-teal">Total</th>
				</tr>
			</thead>
			<tbody>
				{#each allSpeciesNames as name (name)}
					<tr class="border-b border-olive/20">
						<td class="flex items-center gap-1 p-1 text-dark-teal">
							<div class="h-2.5 w-2.5 shrink-0 rounded-sm" style="background:{color(name)}"></div>
							{name}
						</td>
						{#each bySpeciesPerPeg as counts, i (i)}
							{@const c = counts[name] ?? 0}
							<td class="p-1 text-center">
								<div
									class="mx-auto h-5 w-5 rounded-full"
									style="background:{c > 0
										? `hsl(120,70%,${80 - (c / maxPegCount) * 50}%)`
										: '#f0f0f0'}"
									title="{c} fish"
								>
									<span
										class="flex h-full items-center justify-center text-[8px] font-bold text-dark-teal"
										>{c > 0 ? c : ''}</span
									>
								</div>
							</td>
						{/each}
						<td class="p-1 text-center font-bold text-dark-teal"
							>{lakeTotals.find((t) => t[0] === name)?.[1] ?? 0}</td
						>
					</tr>
				{/each}
			</tbody>
		</table>
		<div class="mt-2 text-center text-xs font-semibold text-dark-teal">
			Lake total: {lakeTotalFish} fish across {populations.length} pegs
		</div>
	</div>

	<div class="mt-3 rounded-lg border border-olive bg-white/80 p-2">
		<h4 class="mb-1 text-xs font-bold text-dark-teal">Lake totals by species</h4>
		<table class="w-full text-xs">
			<thead>
				<tr class="border-b border-olive/20 text-muted">
					<th class="p-1 text-left">Species</th>
					<th class="p-1 text-right">Count</th>
					<th class="p-1 text-right">Small</th>
					<th class="p-1 text-right">Medium</th>
					<th class="p-1 text-right">Specimen</th>
					<th class="p-1 text-right">Monster</th>
				</tr>
			</thead>
			<tbody>
				{#each lakeSpeciesBreakdown as [name, info] (name)}
					{@const pct = ((info.count / lakeTotalsRow.count) * 100).toFixed(0)}
					<tr class="border-b border-olive/10">
						<td class="flex items-center gap-1 p-1 text-dark-teal">
							<div class="h-2.5 w-2.5 shrink-0 rounded-sm" style="background:{color(name)}"></div>
							{name}
						</td>
						<td class="p-1 text-right font-semibold text-dark-teal">{info.count} ({pct}%)</td>
						<td class="p-1 text-right text-muted">{info.tier0}</td>
						<td class="p-1 text-right text-muted">{info.tier1}</td>
						<td class="p-1 text-right text-muted">{info.specimen}</td>
						<td class="p-1 text-right font-semibold text-orange-600">{info.monster}</td>
					</tr>
				{/each}
			</tbody>
			<tfoot>
				<tr class="border-t-2 border-olive/40 font-bold text-dark-teal">
					<td class="p-1">Total</td>
					<td class="p-1 text-right">{lakeTotalsRow.count}</td>
					<td class="p-1 text-right text-muted"
						>{lakeTotalsRow.tier0} ({((lakeTotalsRow.tier0 / lakeTotalsRow.count) * 100).toFixed(
							0
						)}%)</td
					>
					<td class="p-1 text-right text-muted"
						>{lakeTotalsRow.tier1} ({((lakeTotalsRow.tier1 / lakeTotalsRow.count) * 100).toFixed(
							0
						)}%)</td
					>
					<td class="p-1 text-right text-muted"
						>{lakeTotalsRow.specimen} ({(
							(lakeTotalsRow.specimen / lakeTotalsRow.count) *
							100
						).toFixed(0)}%)</td
					>
					<td class="p-1 text-right text-orange-600"
						>{lakeTotalsRow.monster} ({(
							(lakeTotalsRow.monster / lakeTotalsRow.count) *
							100
						).toFixed(0)}%)</td
					>
				</tr>
			</tfoot>
		</table>
	</div>

	<div class="mt-2 text-center text-[10px] text-muted">
		Click a peg header to see its 3×3 zone heatmap
	</div>
{/if}
