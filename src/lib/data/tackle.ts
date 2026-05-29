import type { Rod, Reel, Line, Hook } from './types';

export class TackleBox {
	rods: Rod[] = [
		{ name: 'Leger', image: 'rod-leger.png', deter: 0.2, rodMultiplier: 1 },
		{ name: 'Float', image: 'rod-float.png', deter: 0.1, rodMultiplier: 0.67 },
		{ name: 'Pole', image: 'rod-pole.png', deter: 0, rodMultiplier: 0.33 }
	];

	reels: Reel[] = [
		{ name: 'Fixed Spool', image: 'reel-fixed-spool.png', deter: 0.2 },
		{ name: 'Centre Pin', image: 'reel-centre-pin.png', deter: 0.1 },
		{ name: 'n/a', image: '', deter: 0 }
	];

	lines: Line[] = [
		{ name: '2 lb', image: 'line.png', size: 32, minOz: 1, maxOz: 96, deter: 0 },
		{ name: '3 lb', image: 'line.png', size: 48, minOz: 2, maxOz: 125, deter: 0.1 },
		{ name: '4 lb', image: 'line.png', size: 64, minOz: 4, maxOz: 160, deter: 0.15 },
		{ name: '6 lb', image: 'line.png', size: 96, minOz: 8, maxOz: 265, deter: 0.2 },
		{ name: '8 lb', image: 'line.png', size: 128, minOz: 16, maxOz: 410, deter: 0.25 },
		{ name: '10 lb', image: 'line.png', size: 160, minOz: 24, maxOz: 600, deter: 0.3 },
		{ name: '12 lb', image: 'line.png', size: 192, minOz: 32, maxOz: 830, deter: 0.35 },
		{ name: '15 lb', image: 'line.png', size: 240, minOz: 48, maxOz: 1250, deter: 0.5 }
	];

	hooks: Hook[] = [
		{ name: '22', image: 'hook.png', size: 22, minOz: 1, maxOz: 64, deter: 0 },
		{ name: '20', image: 'hook.png', size: 20, minOz: 1, maxOz: 95, deter: 0.05 },
		{ name: '18', image: 'hook.png', size: 18, minOz: 2, maxOz: 145, deter: 0.1 },
		{ name: '16', image: 'hook.png', size: 16, minOz: 4, maxOz: 210, deter: 0.15 },
		{ name: '14', image: 'hook.png', size: 14, minOz: 8, maxOz: 300, deter: 0.2 },
		{ name: '12', image: 'hook.png', size: 12, minOz: 12, maxOz: 410, deter: 0.25 },
		{ name: '10', image: 'hook.png', size: 10, minOz: 16, maxOz: 540, deter: 0.3 },
		{ name: '8', image: 'hook.png', size: 8, minOz: 24, maxOz: 685, deter: 0.35 },
		{ name: '6', image: 'hook.png', size: 6, minOz: 32, maxOz: 855, deter: 0.4 },
		{ name: '4', image: 'hook.png', size: 4, minOz: 40, maxOz: 1040, deter: 0.45 },
		{ name: '2', image: 'hook.png', size: 2, minOz: 64, maxOz: 1250, deter: 0.5 }
	];
}
