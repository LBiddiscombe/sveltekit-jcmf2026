import type { Species } from './types';

export const species: Species[] = [
	{
		name: 'Barbel',
		cautionMs: 7000,
		record: 338,
		strata: ['Bottom'],
		description:
			'A powerful, bronze-sided bottom feeder with whiskers that prefers clear, moderate-flow water over gravel and moderate cover.',
		preferences: { flow: 0.7, clarity: 0.8, substrate: 0.2, vegetation: 0.3, shelter: 0.4 },
		tolerances: { flow: { min: 0.3, max: 1 } },
		classifications: [
			{
				id: 'small',
				label: 'Small',
				maxOz: 36,
				biteSizeExtraMs: 2000,
				preferredBaits: ['maggot', 'caster', 'bread', 'worm', 'pellet', 'sweetcorn']
			},
			{
				id: 'medium',
				label: '',
				maxOz: 169,
				biteSizeExtraMs: 5000,
				preferredBaits: ['maggot', 'caster', 'bread', 'worm', 'pellet', 'sweetcorn', 'boilie']
			},
			{
				id: 'specimen',
				label: 'Specimen',
				maxOz: 253,
				biteSizeExtraMs: 60000,
				preferredBaits: ['pellet', 'meat', 'boilie']
			},
			{
				id: 'monster',
				label: 'Monster',
				maxOz: Infinity,
				biteSizeExtraMs: 120000,
				preferredBaits: ['pellet', 'meat', 'boilie']
			}
		]
	},
	{
		name: 'Bream',
		cautionMs: 5000,
		record: 363,
		strata: ['Bottom'],
		description:
			'A deep-bodied, silvery fish that thrives in slower water with soft silt, moderate clarity and healthy weed beds.',
		preferences: { flow: 0.2, clarity: 0.4, substrate: 0.8, vegetation: 0.6, shelter: 0.5 },
		tolerances: { flow: { min: 0, max: 0.5 } },
		classifications: [
			{
				id: 'small',
				label: 'Skimmer',
				maxOz: 16,
				biteSizeExtraMs: 2000,
				preferredBaits: ['maggot', 'caster', 'bread', 'worm', 'pellet', 'sweetcorn']
			},
			{
				id: 'medium',
				label: '',
				maxOz: 181,
				biteSizeExtraMs: 5000,
				preferredBaits: ['maggot', 'caster', 'bread', 'worm', 'pellet', 'sweetcorn']
			},
			{
				id: 'specimen',
				label: 'Specimen',
				maxOz: 272,
				biteSizeExtraMs: 60000,
				preferredBaits: ['caster', 'worm', 'pellet', 'sweetcorn', 'boilie']
			},
			{
				id: 'monster',
				label: 'Monster',
				maxOz: Infinity,
				biteSizeExtraMs: 120000,
				preferredBaits: ['caster', 'worm', 'pellet', 'sweetcorn', 'boilie']
			}
		]
	},
	{
		name: 'Carp',
		cautionMs: 12000,
		record: 1089,
		strata: ['Top', 'Middle', 'Bottom'],
		description:
			'A large, bronze-scaled fish that prefers still or slow water with muddy silt, dense weed and plenty of cover.',
		preferences: { flow: 0.2, clarity: 0.4, substrate: 0.9, vegetation: 0.6, shelter: 0.5 },
		tolerances: { flow: { min: 0, max: 0.5 } },
		classifications: [
			{
				id: 'small',
				label: 'Small',
				maxOz: 64,
				biteSizeExtraMs: 2000,
				preferredBaits: ['maggot', 'caster', 'bread', 'worm', 'pellet', 'sweetcorn']
			},
			{
				id: 'medium',
				label: '',
				maxOz: 544,
				biteSizeExtraMs: 5000,
				preferredBaits: ['caster', 'bread', 'worm', 'pellet', 'meat', 'sweetcorn', 'boilie']
			},
			{
				id: 'specimen',
				label: 'Specimen',
				maxOz: 816,
				biteSizeExtraMs: 60000,
				preferredBaits: ['bread', 'pellet', 'meat', 'boilie']
			},
			{
				id: 'monster',
				label: 'Monster',
				maxOz: Infinity,
				biteSizeExtraMs: 120000,
				preferredBaits: ['meat', 'boilie']
			}
		]
	},
	{
		name: 'Chub',
		cautionMs: 6000,
		record: 149,
		strata: ['Top', 'Middle'],
		description:
			'A sleek, dark-backed river fish that likes moderate current, cleaner water and a mix of gravelly patches with some vegetation.',
		preferences: { flow: 0.6, clarity: 0.7, substrate: 0.3, vegetation: 0.5, shelter: 0.4 },
		tolerances: { flow: { min: 0.3, max: 1 } },
		classifications: [
			{
				id: 'small',
				label: 'Small',
				maxOz: 16,
				biteSizeExtraMs: 2000,
				preferredBaits: ['maggot', 'caster', 'bread', 'worm', 'pellet', 'sweetcorn']
			},
			{
				id: 'medium',
				label: '',
				maxOz: 74,
				biteSizeExtraMs: 5000,
				preferredBaits: ['maggot', 'caster', 'bread', 'worm', 'pellet', 'sweetcorn']
			},
			{
				id: 'specimen',
				label: 'Specimen',
				maxOz: 111,
				biteSizeExtraMs: 60000,
				preferredBaits: ['worm', 'pellet', 'meat']
			},
			{
				id: 'monster',
				label: 'Monster',
				maxOz: Infinity,
				biteSizeExtraMs: 120000,
				preferredBaits: ['worm', 'pellet', 'meat']
			}
		]
	},
	{
		name: 'Crucian',
		cautionMs: 5000,
		record: 74,
		strata: ['Middle', 'Bottom'],
		description:
			'A compact, golden-bodied carp relative that inhabits still, weedy waters with soft silt and lush plant cover.',
		preferences: { flow: 0.1, clarity: 0.3, substrate: 0.9, vegetation: 0.9, shelter: 0.7 },
		tolerances: { flow: { min: 0, max: 0.3 } },
		classifications: [
			{
				id: 'small',
				label: 'Small',
				maxOz: 8,
				biteSizeExtraMs: 2000,
				preferredBaits: ['maggot', 'caster', 'bread', 'pellet', 'sweetcorn']
			},
			{
				id: 'medium',
				label: '',
				maxOz: 37,
				biteSizeExtraMs: 5000,
				preferredBaits: ['maggot', 'caster', 'bread', 'pellet', 'sweetcorn']
			},
			{
				id: 'specimen',
				label: 'Specimen',
				maxOz: 55,
				biteSizeExtraMs: 60000,
				preferredBaits: ['maggot', 'caster', 'bread', 'pellet', 'sweetcorn']
			},
			{
				id: 'monster',
				label: 'Monster',
				maxOz: Infinity,
				biteSizeExtraMs: 120000,
				preferredBaits: ['maggot', 'caster', 'bread', 'pellet', 'sweetcorn']
			}
		]
	},
	{
		name: 'Dace',
		cautionMs: 2000,
		record: 21,
		strata: ['Top', 'Middle'],
		description:
			'A slender, silver shoaling fish that favours fast, clear water over gravel with moderate plant cover.',
		preferences: { flow: 0.8, clarity: 0.8, substrate: 0.2, vegetation: 0.4, shelter: 0.4 },
		tolerances: { flow: { min: 0.3, max: 1 } },
		classifications: [
			{
				id: 'small',
				label: 'Tiny',
				maxOz: 2,
				biteSizeExtraMs: 2000,
				preferredBaits: ['maggot', 'caster']
			},
			{
				id: 'medium',
				label: '',
				maxOz: 10,
				biteSizeExtraMs: 5000,
				preferredBaits: ['maggot', 'caster']
			},
			{
				id: 'specimen',
				label: 'Specimen',
				maxOz: 15,
				biteSizeExtraMs: 60000,
				preferredBaits: ['maggot', 'caster']
			},
			{
				id: 'monster',
				label: 'Monster',
				maxOz: Infinity,
				biteSizeExtraMs: 120000,
				preferredBaits: ['maggot', 'caster']
			}
		]
	},
	{
		name: 'Eel',
		cautionMs: 8000,
		record: 172,
		strata: ['Bottom'],
		description:
			'A long, snake-like hunter that prefers slow, murky water with soft mud, dense vegetation and shaded structure.',
		preferences: { flow: 0.2, clarity: 0.3, substrate: 0.9, vegetation: 0.7, shelter: 0.8 },
		tolerances: { flow: { min: 0, max: 0.4 } },
		classifications: [
			{
				id: 'small',
				label: 'Small',
				maxOz: 16,
				biteSizeExtraMs: 2000,
				preferredBaits: ['maggot', 'worm']
			},
			{
				id: 'medium',
				label: '',
				maxOz: 86,
				biteSizeExtraMs: 5000,
				preferredBaits: ['maggot', 'worm', 'meat']
			},
			{
				id: 'specimen',
				label: 'Specimen',
				maxOz: 129,
				biteSizeExtraMs: 60000,
				preferredBaits: ['worm', 'meat', 'fish']
			},
			{
				id: 'monster',
				label: 'Monster',
				maxOz: Infinity,
				biteSizeExtraMs: 120000,
				preferredBaits: ['meat', 'fish']
			}
		]
	},
	{
		name: 'Grayling',
		cautionMs: 4000,
		record: 68,
		strata: ['Middle', 'Bottom'],
		description:
			'A streamlined river fish with a sail-like dorsal fin that prefers fast, crystal-clear flow over clean gravel and sparse weed.',
		preferences: { flow: 0.8, clarity: 0.9, substrate: 0.2, vegetation: 0.2, shelter: 0.3 },
		tolerances: { flow: { min: 0.3, max: 1 } },
		classifications: [
			{
				id: 'small',
				label: 'Small',
				maxOz: 8,
				biteSizeExtraMs: 2000,
				preferredBaits: ['maggot', 'caster', 'sweetcorn']
			},
			{
				id: 'medium',
				label: '',
				maxOz: 34,
				biteSizeExtraMs: 5000,
				preferredBaits: ['maggot', 'caster', 'worm', 'sweetcorn']
			},
			{
				id: 'specimen',
				label: 'Specimen',
				maxOz: 51,
				biteSizeExtraMs: 60000,
				preferredBaits: ['maggot', 'caster', 'worm', 'sweetcorn']
			},
			{
				id: 'monster',
				label: 'Monster',
				maxOz: Infinity,
				biteSizeExtraMs: 120000,
				preferredBaits: ['maggot', 'caster', 'worm', 'sweetcorn']
			}
		]
	},
	{
		name: 'Perch',
		cautionMs: 4000,
		record: 99,
		strata: ['Middle', 'Bottom'],
		description:
			'A green-striped predator that likes clear, slow water with abundant weed and structure for ambush.',
		preferences: { flow: 0.2, clarity: 0.6, substrate: 0.5, vegetation: 0.8, shelter: 0.6 },
		tolerances: { flow: { min: 0, max: 0.5 } },
		classifications: [
			{
				id: 'small',
				label: 'Small',
				maxOz: 8,
				biteSizeExtraMs: 2000,
				preferredBaits: ['maggot', 'caster', 'worm']
			},
			{
				id: 'medium',
				label: '',
				maxOz: 49,
				biteSizeExtraMs: 5000,
				preferredBaits: ['maggot', 'caster', 'worm']
			},
			{
				id: 'specimen',
				label: 'Specimen',
				maxOz: 75,
				biteSizeExtraMs: 60000,
				preferredBaits: ['worm', 'meat', 'fish']
			},
			{
				id: 'monster',
				label: 'Monster',
				maxOz: Infinity,
				biteSizeExtraMs: 120000,
				preferredBaits: ['meat', 'fish']
			}
		]
	},
	{
		name: 'Pike',
		cautionMs: 9000,
		record: 749,
		strata: ['Top', 'Middle', 'Bottom'],
		description:
			'A torpedo-shaped ambush predator that prefers clear, slow water with dense weed beds and sheltered margins.',
		preferences: { flow: 0.2, clarity: 0.6, substrate: 0.6, vegetation: 0.9, shelter: 0.8 },
		tolerances: { flow: { min: 0, max: 0.5 } },
		classifications: [
			{
				id: 'small',
				label: 'Jack',
				maxOz: 80,
				biteSizeExtraMs: 2000,
				preferredBaits: ['worm', 'meat']
			},
			{
				id: 'medium',
				label: '',
				maxOz: 374,
				biteSizeExtraMs: 5000,
				preferredBaits: ['worm', 'meat', 'fish']
			},
			{
				id: 'specimen',
				label: 'Specimen',
				maxOz: 561,
				biteSizeExtraMs: 60000,
				preferredBaits: ['fish']
			},
			{
				id: 'monster',
				label: 'Monster',
				maxOz: Infinity,
				biteSizeExtraMs: 120000,
				preferredBaits: ['fish']
			}
		]
	},
	{
		name: 'Roach',
		cautionMs: 3000,
		record: 68,
		strata: ['Top', 'Middle', 'Bottom'],
		description:
			'A schooling silver fish that favours moderate clarity, slower water and softer bottoms with some weed cover.',
		preferences: { flow: 0.3, clarity: 0.5, substrate: 0.7, vegetation: 0.6, shelter: 0.5 },
		tolerances: { flow: { min: 0, max: 0.6 } },
		classifications: [
			{
				id: 'small',
				label: 'Small',
				maxOz: 8,
				biteSizeExtraMs: 2000,
				preferredBaits: ['maggot', 'caster']
			},
			{
				id: 'medium',
				label: '',
				maxOz: 34,
				biteSizeExtraMs: 5000,
				preferredBaits: ['maggot', 'caster', 'bread', 'worm', 'pellet', 'sweetcorn']
			},
			{
				id: 'specimen',
				label: 'Specimen',
				maxOz: 51,
				biteSizeExtraMs: 60000,
				preferredBaits: ['caster', 'bread', 'worm', 'pellet', 'meat', 'sweetcorn']
			},
			{
				id: 'monster',
				label: 'Monster',
				maxOz: Infinity,
				biteSizeExtraMs: 120000,
				preferredBaits: ['bread', 'worm', 'pellet', 'meat', 'sweetcorn']
			}
		]
	},
	{
		name: 'Rudd',
		cautionMs: 3000,
		record: 74,
		strata: ['Top', 'Middle'],
		description:
			'A bright-bodied, surface-feeding fish that prefers clearer, slower waters with lush weed and soft silt.',
		preferences: { flow: 0.2, clarity: 0.6, substrate: 0.8, vegetation: 0.8, shelter: 0.7 },
		tolerances: { flow: { min: 0, max: 0.5 } },
		classifications: [
			{
				id: 'small',
				label: 'Small',
				maxOz: 8,
				biteSizeExtraMs: 2000,
				preferredBaits: ['maggot', 'caster']
			},
			{
				id: 'medium',
				label: '',
				maxOz: 37,
				biteSizeExtraMs: 5000,
				preferredBaits: ['maggot', 'caster', 'bread', 'worm', 'pellet', 'sweetcorn']
			},
			{
				id: 'specimen',
				label: 'Specimen',
				maxOz: 55,
				biteSizeExtraMs: 60000,
				preferredBaits: ['caster', 'bread', 'worm', 'pellet', 'meat', 'sweetcorn']
			},
			{
				id: 'monster',
				label: 'Monster',
				maxOz: Infinity,
				biteSizeExtraMs: 120000,
				preferredBaits: ['bread', 'worm', 'pellet', 'meat', 'sweetcorn']
			}
		]
	},
	{
		name: 'Tench',
		cautionMs: 10000,
		record: 243,
		strata: ['Bottom'],
		description:
			'A thickset, olive-green fish that thrives in still, murky waters with deep mud, dense vegetation and shaded shelter.',
		preferences: { flow: 0.1, clarity: 0.2, substrate: 1.0, vegetation: 0.9, shelter: 0.9 },
		tolerances: { flow: { min: 0, max: 0.3 } },
		classifications: [
			{
				id: 'small',
				label: 'Small',
				maxOz: 16,
				biteSizeExtraMs: 2000,
				preferredBaits: ['maggot', 'caster', 'bread', 'sweetcorn']
			},
			{
				id: 'medium',
				label: '',
				maxOz: 121,
				biteSizeExtraMs: 5000,
				preferredBaits: ['caster', 'bread', 'pellet', 'sweetcorn']
			},
			{
				id: 'specimen',
				label: 'Specimen',
				maxOz: 182,
				biteSizeExtraMs: 60000,
				preferredBaits: ['caster', 'bread', 'pellet', 'sweetcorn']
			},
			{
				id: 'monster',
				label: 'Monster',
				maxOz: Infinity,
				biteSizeExtraMs: 120000,
				preferredBaits: ['caster', 'bread', 'pellet', 'sweetcorn']
			}
		]
	}
];
