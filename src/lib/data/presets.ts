import type { TacklePreset, TackleSelection, Species } from './types';
import { TackleBox } from './tackle';
import { baits } from './baits';

export const presets: TacklePreset[] = [
	// ── General-purpose ──
	{
		name: 'Tiddler Basher',
		rod: 'Pole',
		reel: 'n/a',
		line: '2 lb',
		hook: '22',
		bait: 'maggot',
		strata: 'Top',
		castStrength: 'Short'
	},
	{
		name: 'Light',
		rod: 'Float',
		reel: 'Centre Pin',
		line: '3 lb',
		hook: '18',
		bait: 'maggot',
		strata: 'Middle',
		castStrength: 'Short'
	},
	{
		name: 'Medium',
		rod: 'Float',
		reel: 'Fixed Spool',
		line: '4 lb',
		hook: '14',
		bait: 'sweetcorn',
		strata: 'Bottom',
		castStrength: 'Medium'
	},
	{
		name: 'Heavy',
		rod: 'Leger',
		reel: 'Fixed Spool',
		line: '8 lb',
		hook: '10',
		bait: 'pellet',
		strata: 'Bottom',
		castStrength: 'Long'
	},
	{
		name: 'Predator',
		rod: 'Leger',
		reel: 'Fixed Spool',
		line: '12 lb',
		hook: '4',
		bait: 'fish',
		strata: 'Bottom',
		castStrength: 'Long'
	},
	
	// ── Species-specific ──
	{
		name: 'Barbel Rig',
		targetSpecies: 'Barbel',
		rod: 'Leger',
		reel: 'Centre Pin',
		line: '8 lb',
		hook: '10',
		bait: 'pellet',
		strata: 'Bottom',
		castStrength: 'Long'
	},
	{
		name: 'Bream Rig',
		targetSpecies: 'Bream',
		rod: 'Leger',
		reel: 'Fixed Spool',
		line: '4 lb',
		hook: '16',
		bait: 'caster',
		strata: 'Bottom',
		castStrength: 'Medium'
	},
	{
		name: 'Carp Rig',
		targetSpecies: 'Carp',
		rod: 'Leger',
		reel: 'Fixed Spool',
		line: '8 lb',
		hook: '10',
		bait: 'boilie',
		strata: 'Bottom',
		castStrength: 'Long'
	},
	{
		name: 'Chub Rig',
		targetSpecies: 'Chub',
		rod: 'Float',
		reel: 'Centre Pin',
		line: '4 lb',
		hook: '14',
		bait: 'bread',
		strata: 'Middle',
		castStrength: 'Short'
	},
	{
		name: 'Crucian Rig',
		targetSpecies: 'Crucian',
		rod: 'Pole',
		reel: 'n/a',
		line: '2 lb',
		hook: '22',
		bait: 'maggot',
		strata: 'Bottom',
		castStrength: 'Short'
	},
	{
		name: 'Dace Rig',
		targetSpecies: 'Dace',
		rod: 'Pole',
		reel: 'n/a',
		line: '2 lb',
		hook: '22',
		bait: 'caster',
		strata: 'Top',
		castStrength: 'Short'
	},
	{
		name: 'Eel Rig',
		targetSpecies: 'Eel',
		rod: 'Leger',
		reel: 'Fixed Spool',
		line: '6 lb',
		hook: '8',
		bait: 'worm',
		strata: 'Bottom',
		castStrength: 'Medium'
	},
	{
		name: 'Grayling Rig',
		targetSpecies: 'Grayling',
		rod: 'Float',
		reel: 'Centre Pin',
		line: '3 lb',
		hook: '18',
		bait: 'maggot',
		strata: 'Middle',
		castStrength: 'Short'
	},
	{
		name: 'Perch Rig',
		targetSpecies: 'Perch',
		rod: 'Float',
		reel: 'Fixed Spool',
		line: '4 lb',
		hook: '14',
		bait: 'worm',
		strata: 'Middle',
		castStrength: 'Medium'
	},
	{
		name: 'Pike Rig',
		targetSpecies: 'Pike',
		rod: 'Leger',
		reel: 'Fixed Spool',
		line: '12 lb',
		hook: '4',
		bait: 'fish',
		strata: 'Bottom',
		castStrength: 'Long'
	},
	{
		name: 'Roach Rig',
		targetSpecies: 'Roach',
		rod: 'Float',
		reel: 'Centre Pin',
		line: '3 lb',
		hook: '18',
		bait: 'maggot',
		strata: 'Middle',
		castStrength: 'Short'
	},
	{
		name: 'Rudd Rig',
		targetSpecies: 'Rudd',
		rod: 'Float',
		reel: 'Centre Pin',
		line: '2 lb',
		hook: '20',
		bait: 'caster',
		strata: 'Top',
		castStrength: 'Short'
	},
	{
		name: 'Tench Rig',
		targetSpecies: 'Tench',
		rod: 'Float',
		reel: 'Fixed Spool',
		line: '6 lb',
		hook: '12',
		bait: 'sweetcorn',
		strata: 'Bottom',
		castStrength: 'Medium'
	}
];

const box = new TackleBox();

export function resolvePreset(preset: TacklePreset): TackleSelection {
	const rod = box.rods.find((r) => r.name === preset.rod);
	const reel = box.reels.find((r) => r.name === preset.reel);
	const line = box.lines.find((l) => l.name === preset.line);
	const hook = box.hooks.find((h) => h.name === preset.hook);
	const bait = baits.find((b) => b.name === preset.bait);

	if (!rod || !reel || !line || !hook || !bait) {
		throw new Error(`Invalid preset "${preset.name}": failed to resolve tackle components`);
	}

	return { rod, reel, line, hook, bait, strata: preset.strata, castStrength: preset.castStrength };
}

export function tacticalOverride(
	species: Species | null,
	rodName: string
): { strata: string; castStrength: string } {
	let strata: string;

	if (rodName === 'Leger') {
		strata = 'Bottom';
	} else if (species) {
		const valid = species.strata;
		strata = valid[Math.floor(Math.random() * valid.length)];
	} else {
		const allStrata = ['Top', 'Middle', 'Bottom'];
		strata = allStrata[Math.floor(Math.random() * allStrata.length)];
	}

	const castStrength =
		rodName === 'Pole'
			? 'Short'
			: (['Short', 'Medium', 'Long'] as const)[Math.floor(Math.random() * 3)];

	return { strata, castStrength };
}
