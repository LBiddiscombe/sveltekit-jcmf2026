import { baits, species, presets, resolvePreset, tacticalOverride } from '$lib/data';
import type { TackleSelection, Peg, Lake } from '$lib/data';
import { TackleBox } from '$lib/data/tackle';
import { passesTolerances, fishMatchScore, weightedSelectIndex } from './env-utils';
import type { SpeciesFilterKind } from './match-rules';
import { SPECIES_GROUPS } from './match-rules';

const defaultBox = new TackleBox();
const SILVER_FISH_PRESETS = ['Tiddler Basher', 'Light', 'Medium'];

export const defaultTackle: TackleSelection = {
	rod: defaultBox.rods.find((r) => r.name === 'Pole')!,
	reel: defaultBox.reels.find((r) => r.name === 'n/a')!,
	line: defaultBox.lines.find((l) => l.name === '2 lb')!,
	hook: defaultBox.hooks.find((h) => h.name === '22')!,
	bait: baits[0],
	strata: 'Top',
	castStrength: 'Short'
};

const silverFishFallback = (): TackleSelection => {
	const silverPresets = presets.filter(
		(p) => !p.targetSpecies && SILVER_FISH_PRESETS.includes(p.name)
	);
	const preset = silverPresets[Math.floor(Math.random() * silverPresets.length)];
	const tackle = resolvePreset(preset);
	const { strata, castStrength } = tacticalOverride(null, tackle.rod);
	return { ...tackle, strata, castStrength };
};

export function pickBotTackle(
	skill: number,
	peg: Peg,
	lake: Lake,
	speciesFilterKind: SpeciesFilterKind = 'all'
): TackleSelection {
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

			if (speciesFilterKind === 'silverfish') {
				if (SPECIES_GROUPS.silverfish.includes(targetName)) {
					const preset = presets.find((p) => p.targetSpecies === targetName);
					if (preset) {
						const tackle = resolvePreset(preset);
						const sp = species.find((s) => s.name === targetName) ?? null;
						const { strata, castStrength } = tacticalOverride(sp, tackle.rod);
						return { ...tackle, strata, castStrength };
					}
				}
			} else {
				const preset = presets.find((p) => p.targetSpecies === targetName);
				if (preset) {
					const tackle = resolvePreset(preset);
					const sp = species.find((s) => s.name === targetName) ?? null;
					const { strata, castStrength } = tacticalOverride(sp, tackle.rod);
					return { ...tackle, strata, castStrength };
				}
			}
		}
	}

	if (speciesFilterKind === 'silverfish') {
		return silverFishFallback();
	}

	const generalPresets = presets.filter((p) => !p.targetSpecies);
	const preset = generalPresets[Math.floor(Math.random() * generalPresets.length)];
	const tackle = resolvePreset(preset);
	const { strata, castStrength } = tacticalOverride(null, tackle.rod);
	return { ...tackle, strata, castStrength };
}
