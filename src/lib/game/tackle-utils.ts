import { baits, species, presets, resolvePreset, tacticalOverride } from '$lib/data';
import type { TackleSelection, Peg, Lake } from '$lib/data';
import { passesTolerances, fishMatchScore, weightedSelectIndex } from './population';

export const defaultTackle: TackleSelection = {
	rod: { name: 'Float', image: 'rod-float.png', deter: 0.1 },
	reel: { name: 'Fixed Spool', image: 'reel-fixed-spool.png', deter: 0.2 },
	line: { name: '4 lb', image: 'line.png', size: 64, minOz: 3, maxOz: 160, deter: 0.15 },
	hook: { name: '16', image: 'hook.png', size: 16, minOz: 10, maxOz: 200, deter: 0.15 },
	bait: baits[0],
	strata: 'Bottom',
	castStrength: 'Medium'
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
				const { strata, castStrength } = tacticalOverride(sp, tackle.rod.name);
				return { ...tackle, strata, castStrength };
			}
		}
	}

	const generalPresets = presets.filter((p) => !p.targetSpecies);
	const preset = generalPresets[Math.floor(Math.random() * generalPresets.length)];
	const tackle = resolvePreset(preset);
	const { strata, castStrength } = tacticalOverride(null, tackle.rod.name);
	return { ...tackle, strata, castStrength };
}
