import type { Species } from './types';

export const species: Species[] = [
	{
		name: 'Barbel',
		record: 338,
		frequency: 1,
		strata: ['Bottom'],
		description:
			'A powerful, bronze-sided bottom feeder with whiskers that prefers clear, moderate-flow water over gravel and moderate cover.',
		preferences: { flow: 0.7, clarity: 0.8, substrate: 0.2, vegetation: 0.3, shelter: 0.4 },
		classifications: [
			{
				label: 'Small',
				maxOz: 36,
				preferredBaits: ['maggot', 'caster', 'bread', 'worm', 'pellet', 'sweetcorn']
			},
			{
				label: '',
				maxOz: 169,
				preferredBaits: ['maggot', 'caster', 'bread', 'worm', 'pellet', 'sweetcorn', 'boilie']
			},
			{ label: 'Specimen', maxOz: 253, preferredBaits: ['pellet', 'meat', 'boilie'] },
			{ label: 'Monster', maxOz: Infinity, preferredBaits: ['pellet', 'meat', 'boilie'] }
		]
	},
	{
		name: 'Bream',
		record: 363,
		frequency: 5,
		strata: ['Bottom'],
		description:
			'A deep-bodied, silvery fish that thrives in slower water with soft silt, moderate clarity and healthy weed beds.',
		preferences: { flow: 0.2, clarity: 0.4, substrate: 0.8, vegetation: 0.6, shelter: 0.5 },
		classifications: [
			{
				label: 'Skimmer',
				maxOz: 16,
				preferredBaits: ['maggot', 'caster', 'bread', 'worm', 'pellet', 'sweetcorn']
			},
			{
				label: '',
				maxOz: 181,
				preferredBaits: ['maggot', 'caster', 'bread', 'worm', 'pellet', 'sweetcorn']
			},
			{
				label: 'Specimen',
				maxOz: 272,
				preferredBaits: ['caster', 'worm', 'pellet', 'sweetcorn', 'boilie']
			},
			{
				label: 'Monster',
				maxOz: Infinity,
				preferredBaits: ['caster', 'worm', 'pellet', 'sweetcorn', 'boilie']
			}
		]
	},
	{
		name: 'Carp',
		record: 1089,
		frequency: 5,
		strata: ['Top', 'Middle', 'Bottom'],
		description:
			'A large, bronze-scaled fish that prefers still or slow water with muddy silt, dense weed and plenty of cover.',
		preferences: { flow: 0.2, clarity: 0.4, substrate: 0.9, vegetation: 0.6, shelter: 0.5 },
		classifications: [
			{
				label: 'Small',
				maxOz: 64,
				preferredBaits: ['maggot', 'caster', 'bread', 'worm', 'pellet', 'sweetcorn']
			},
			{
				label: '',
				maxOz: 544,
				preferredBaits: ['caster', 'bread', 'worm', 'pellet', 'meat', 'sweetcorn', 'boilie']
			},
			{ label: 'Specimen', maxOz: 816, preferredBaits: ['bread', 'pellet', 'meat', 'boilie'] },
			{ label: 'Monster', maxOz: Infinity, preferredBaits: ['meat', 'boilie'] }
		]
	},
	{
		name: 'Chub',
		record: 149,
		frequency: 2,
		strata: ['Top', 'Middle'],
		description:
			'A sleek, dark-backed river fish that likes moderate current, cleaner water and a mix of gravelly patches with some vegetation.',
		preferences: { flow: 0.6, clarity: 0.7, substrate: 0.3, vegetation: 0.5, shelter: 0.4 },
		classifications: [
			{
				label: 'Small',
				maxOz: 16,
				preferredBaits: ['maggot', 'caster', 'bread', 'worm', 'pellet', 'sweetcorn']
			},
			{
				label: '',
				maxOz: 74,
				preferredBaits: ['maggot', 'caster', 'bread', 'worm', 'pellet', 'sweetcorn']
			},
			{ label: 'Specimen', maxOz: 111, preferredBaits: ['worm', 'pellet', 'meat'] },
			{ label: 'Monster', maxOz: Infinity, preferredBaits: ['worm', 'pellet', 'meat'] }
		]
	},
	{
		name: 'Crucian',
		record: 74,
		frequency: 2,
		strata: ['Middle', 'Bottom'],
		description:
			'A compact, golden-bodied carp relative that inhabits still, weedy waters with soft silt and lush plant cover.',
		preferences: { flow: 0.1, clarity: 0.3, substrate: 0.9, vegetation: 0.9, shelter: 0.7 },
		classifications: [
			{
				label: 'Small',
				maxOz: 8,
				preferredBaits: ['maggot', 'caster', 'bread', 'pellet', 'sweetcorn']
			},
			{
				label: '',
				maxOz: 37,
				preferredBaits: ['maggot', 'caster', 'bread', 'pellet', 'sweetcorn']
			},
			{
				label: 'Specimen',
				maxOz: 55,
				preferredBaits: ['maggot', 'caster', 'bread', 'pellet', 'sweetcorn']
			},
			{
				label: 'Monster',
				maxOz: Infinity,
				preferredBaits: ['maggot', 'caster', 'bread', 'pellet', 'sweetcorn']
			}
		]
	},
	{
		name: 'Dace',
		record: 21,
		frequency: 2,
		strata: ['Top', 'Middle'],
		description:
			'A slender, silver shoaling fish that favours fast, clear water over gravel with moderate plant cover.',
		preferences: { flow: 0.8, clarity: 0.8, substrate: 0.2, vegetation: 0.4, shelter: 0.4 },
		classifications: [
			{ label: 'Tiny', maxOz: 2, preferredBaits: ['maggot', 'caster'] },
			{ label: '', maxOz: 10, preferredBaits: ['maggot', 'caster'] },
			{ label: 'Specimen', maxOz: 15, preferredBaits: ['maggot', 'caster'] },
			{ label: 'Monster', maxOz: Infinity, preferredBaits: ['maggot', 'caster'] }
		]
	},
	{
		name: 'Eel',
		record: 172,
		frequency: 1,
		strata: ['Bottom'],
		description:
			'A long, snake-like hunter that prefers slow, murky water with soft mud, dense vegetation and shaded structure.',
		preferences: { flow: 0.2, clarity: 0.3, substrate: 0.9, vegetation: 0.7, shelter: 0.8 },
		classifications: [
			{ label: 'Small', maxOz: 16, preferredBaits: ['maggot', 'worm'] },
			{ label: '', maxOz: 86, preferredBaits: ['maggot', 'worm', 'meat'] },
			{ label: 'Specimen', maxOz: 129, preferredBaits: ['worm', 'meat', 'fish'] },
			{ label: 'Monster', maxOz: Infinity, preferredBaits: ['meat', 'fish'] }
		]
	},
	{
		name: 'Grayling',
		record: 68,
		frequency: 1,
		strata: ['Middle', 'Bottom'],
		description:
			'A streamlined river fish with a sail-like dorsal fin that prefers fast, crystal-clear flow over clean gravel and sparse weed.',
		preferences: { flow: 0.8, clarity: 0.9, substrate: 0.2, vegetation: 0.2, shelter: 0.3 },
		classifications: [
			{ label: 'Small', maxOz: 8, preferredBaits: ['maggot', 'caster', 'sweetcorn'] },
			{ label: '', maxOz: 34, preferredBaits: ['maggot', 'caster', 'worm', 'sweetcorn'] },
			{ label: 'Specimen', maxOz: 51, preferredBaits: ['maggot', 'caster', 'worm', 'sweetcorn'] },
			{
				label: 'Monster',
				maxOz: Infinity,
				preferredBaits: ['maggot', 'caster', 'worm', 'sweetcorn']
			}
		]
	},
	{
		name: 'Perch',
		record: 99,
		frequency: 8,
		strata: ['Middle', 'Bottom'],
		description:
			'A green-striped predator that likes clear, slow water with abundant weed and structure for ambush.',
		preferences: { flow: 0.2, clarity: 0.6, substrate: 0.5, vegetation: 0.8, shelter: 0.6 },
		classifications: [
			{ label: 'Small', maxOz: 8, preferredBaits: ['maggot', 'caster', 'worm'] },
			{ label: '', maxOz: 49, preferredBaits: ['maggot', 'caster', 'worm'] },
			{ label: 'Specimen', maxOz: 75, preferredBaits: ['worm', 'meat', 'fish'] },
			{ label: 'Monster', maxOz: Infinity, preferredBaits: ['meat', 'fish'] }
		]
	},
	{
		name: 'Pike',
		record: 749,
		frequency: 1,
		strata: ['Top', 'Middle', 'Bottom'],
		description:
			'A torpedo-shaped ambush predator that prefers clear, slow water with dense weed beds and sheltered margins.',
		preferences: { flow: 0.2, clarity: 0.6, substrate: 0.6, vegetation: 0.9, shelter: 0.8 },
		classifications: [
			{ label: 'Jack', maxOz: 80, preferredBaits: ['worm', 'meat'] },
			{ label: '', maxOz: 374, preferredBaits: ['worm', 'meat', 'fish'] },
			{ label: 'Specimen', maxOz: 561, preferredBaits: ['fish'] },
			{ label: 'Monster', maxOz: Infinity, preferredBaits: ['fish'] }
		]
	},
	{
		name: 'Roach',
		record: 68,
		frequency: 10,
		strata: ['Top', 'Middle', 'Bottom'],
		description:
			'A schooling silver fish that favours moderate clarity, slower water and softer bottoms with some weed cover.',
		preferences: { flow: 0.3, clarity: 0.5, substrate: 0.7, vegetation: 0.6, shelter: 0.5 },
		classifications: [
			{ label: 'Small', maxOz: 8, preferredBaits: ['maggot', 'caster'] },
			{
				label: '',
				maxOz: 34,
				preferredBaits: ['maggot', 'caster', 'bread', 'worm', 'pellet', 'sweetcorn']
			},
			{
				label: 'Specimen',
				maxOz: 51,
				preferredBaits: ['caster', 'bread', 'worm', 'pellet', 'meat', 'sweetcorn']
			},
			{
				label: 'Monster',
				maxOz: Infinity,
				preferredBaits: ['bread', 'worm', 'pellet', 'meat', 'sweetcorn']
			}
		]
	},
	{
		name: 'Rudd',
		record: 74,
		frequency: 7,
		strata: ['Top', 'Middle'],
		description:
			'A bright-bodied, surface-feeding fish that prefers clearer, slower waters with lush weed and soft silt.',
		preferences: { flow: 0.2, clarity: 0.6, substrate: 0.8, vegetation: 0.8, shelter: 0.7 },
		classifications: [
			{ label: 'Small', maxOz: 8, preferredBaits: ['maggot', 'caster'] },
			{
				label: '',
				maxOz: 37,
				preferredBaits: ['maggot', 'caster', 'bread', 'worm', 'pellet', 'sweetcorn']
			},
			{
				label: 'Specimen',
				maxOz: 55,
				preferredBaits: ['caster', 'bread', 'worm', 'pellet', 'meat', 'sweetcorn']
			},
			{
				label: 'Monster',
				maxOz: Infinity,
				preferredBaits: ['bread', 'worm', 'pellet', 'meat', 'sweetcorn']
			}
		]
	},
	{
		name: 'Tench',
		record: 243,
		frequency: 4,
		strata: ['Bottom'],
		description:
			'A thickset, olive-green fish that thrives in still, murky waters with deep mud, dense vegetation and shaded shelter.',
		preferences: { flow: 0.1, clarity: 0.2, substrate: 1.0, vegetation: 0.9, shelter: 0.9 },
		classifications: [
			{ label: 'Small', maxOz: 16, preferredBaits: ['maggot', 'caster', 'bread', 'sweetcorn'] },
			{ label: '', maxOz: 121, preferredBaits: ['caster', 'bread', 'pellet', 'sweetcorn'] },
			{ label: 'Specimen', maxOz: 182, preferredBaits: ['caster', 'bread', 'pellet', 'sweetcorn'] },
			{
				label: 'Monster',
				maxOz: Infinity,
				preferredBaits: ['caster', 'bread', 'pellet', 'sweetcorn']
			}
		]
	}
];
