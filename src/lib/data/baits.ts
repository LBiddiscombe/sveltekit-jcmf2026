import type { Bait } from './types';

export const baits: Bait[] = [
	{ name: 'maggot', image: 'maggot.png', minOz: 1, maxOz: 512 },
	{ name: 'caster', image: 'caster.png', minOz: 2, maxOz: 512 },
	{ name: 'bread', image: 'bread.png', minOz: 2, maxOz: 512 },
	{ name: 'worm', image: 'worm.png', minOz: 4, maxOz: 512 },
	{ name: 'pellet', image: 'pellet.png', minOz: 4, maxOz: 512 },
	{ name: 'meat', image: 'meat.png', minOz: 8, maxOz: 768 },
	{ name: 'sweetcorn', image: 'sweetcorn.png', minOz: 4, maxOz: 512 },
	{ name: 'boilie', image: 'boilie.png', minOz: 8, maxOz: Infinity },
	{ name: 'fish', image: 'fish.png', minOz: 8, maxOz: Infinity }
];
