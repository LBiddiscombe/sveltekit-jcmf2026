import type { Rod, Reel, Line, Hook } from './types';

export class TackleBox {
	rods: Rod[] = [
		{ name: 'Leger', image: 'rod-leger.png', deter: 0.2 },
		{ name: 'Float', image: 'rod-float.png', deter: 0.1 },
		{ name: 'Pole', image: 'rod-pole.png', deter: 0 }
	];

	reels: Reel[] = [
		{ name: 'Fixed Spool', image: 'reel-fixed-spool.png', deter: 0.2 },
		{ name: 'Centre Pin', image: 'reel-centre-pin.png', deter: 0.1 },
		{ name: 'n/a', image: '', deter: 0 }
	];

	lines: Line[] = [
		{ name: '2 lb', image: 'line.png', size: 32, minOz: 1, maxOz: 80, deter: 0 },
		{ name: '3 lb', image: 'line.png', size: 48, minOz: 2, maxOz: 120, deter: 0.1 },
		{ name: '4 lb', image: 'line.png', size: 64, minOz: 3, maxOz: 160, deter: 0.15 },
		{ name: '6 lb', image: 'line.png', size: 96, minOz: 5, maxOz: 240, deter: 0.2 },
		{ name: '8 lb', image: 'line.png', size: 128, minOz: 7, maxOz: 320, deter: 0.25 },
		{ name: '10 lb', image: 'line.png', size: 160, minOz: 9, maxOz: 400, deter: 0.3 },
		{ name: '12 lb', image: 'line.png', size: 192, minOz: 11, maxOz: 600, deter: 0.35 },
		{ name: '15 lb', image: 'line.png', size: 240, minOz: 14, maxOz: 1100, deter: 0.5 }
	];

	hooks: Hook[] = [
		{ name: '22', image: 'hook.png', size: 22, minOz: 1, maxOz: 50, deter: 0 },
		{ name: '20', image: 'hook.png', size: 20, minOz: 3, maxOz: 100, deter: 0.05 },
		{ name: '18', image: 'hook.png', size: 18, minOz: 5, maxOz: 150, deter: 0.1 },
		{ name: '16', image: 'hook.png', size: 16, minOz: 10, maxOz: 200, deter: 0.15 },
		{ name: '14', image: 'hook.png', size: 14, minOz: 15, maxOz: 250, deter: 0.2 },
		{ name: '12', image: 'hook.png', size: 12, minOz: 20, maxOz: 300, deter: 0.25 },
		{ name: '10', image: 'hook.png', size: 10, minOz: 30, maxOz: 400, deter: 0.3 },
		{ name: '8', image: 'hook.png', size: 8, minOz: 40, maxOz: 500, deter: 0.35 },
		{ name: '6', image: 'hook.png', size: 6, minOz: 60, maxOz: 700, deter: 0.4 },
		{ name: '4', image: 'hook.png', size: 4, minOz: 80, maxOz: 900, deter: 0.45 },
		{ name: '2', image: 'hook.png', size: 2, minOz: 100, maxOz: 1100, deter: 0.5 }
	];
}
