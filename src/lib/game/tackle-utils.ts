import { baits, species, presets, resolvePreset, tacticalOverride } from '$lib/data';
import type { TackleSelection, Peg, Lake } from '$lib/data';
import { TackleBox } from '$lib/data/tackle';
import { passesTolerances, fishMatchScore, weightedSelectIndex } from './env-utils';

const defaultBox = new TackleBox();

export const defaultTackle: TackleSelection = {
	rod: defaultBox.rods.find((r) => r.name === 'Pole')!,
	reel: defaultBox.reels.find((r) => r.name === 'n/a')!,
	line: defaultBox.lines.find((l) => l.name === '2 lb')!,
	hook: defaultBox.hooks.find((h) => h.name === '22')!,
	bait: baits[0],
	strata: 'Top',
	castStrength: 'Short'
};

export function pickBotTackle(skill: number, peg: Peg, lake: Lake): TackleSelection {
	const speciesChance = Math.min(1, skill * 0.1);

	if (Math.random() < speciesChance) {
		const weights = lake.species.map((ls) => {
			const sp = species.find((s) => s.name === ls.name);
			if (!sp) return 0;
			if (!passesTolerances(sp, peg.features)) return 0;
			return ls.frequency * fishMatchScore(sp, peg.features);
		});

		const idx = weightedSelectIndex(weights, Math.random);
		if (idx !== -1) {
			const targetName = lake.species[idx].name;
			const preset = presets.find((p) => p.targetSpecies === targetName);
			if (preset) {
				const tackle = resolvePreset(preset);
				const sp = species.find((s) => s.name === targetName) ?? null;
				const { strata, castStrength } = tacticalOverride(sp, tackle.rod);
				return { ...tackle, strata, castStrength };
			}
		}
	}

	const generalPresets = presets.filter((p) => !p.targetSpecies);
	const preset = generalPresets[Math.floor(Math.random() * generalPresets.length)];
	const tackle = resolvePreset(preset);
	const { strata, castStrength } = tacticalOverride(null, tackle.rod);
	return { ...tackle, strata, castStrength };
}
