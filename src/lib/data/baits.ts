import type { Bait } from './types';

export const baits: Bait[] = [
  { name: 'maggot', minOz: 1, maxOz: 512 },
  { name: 'caster', minOz: 2, maxOz: 512 },
  { name: 'bread', minOz: 2, maxOz: 512 },
  { name: 'worm', minOz: 4, maxOz: 512 },
  { name: 'pellet', minOz: 4, maxOz: 512 },
  { name: 'meat', minOz: 8, maxOz: 768 },
  { name: 'sweetcorn', minOz: 4, maxOz: 512 },
  { name: 'boilie', minOz: 8, maxOz: Infinity },
  { name: 'fish', minOz: 8, maxOz: Infinity }
];
