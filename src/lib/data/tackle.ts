import type { Rod, Reel, Line, Hook } from './types';

export class TackleBox {
  rods: Rod[] = [
    { name: 'Leger', deter: 0.2 },
    { name: 'Float', deter: 0.1 },
    { name: 'Pole', deter: 0 }
  ];

  reels: Reel[] = [
    { name: 'Fixed Spool', deter: 0.2 },
    { name: 'Centre Pin', deter: 0.1 },
    { name: 'n/a', deter: 0 }
  ];

  lines: Line[] = [
    { name: '2 lb', size: 32, minOz: 1, maxOz: 80, deter: 0 },
    { name: '3 lb', size: 48, minOz: 2, maxOz: 120, deter: 0.1 },
    { name: '4 lb', size: 64, minOz: 3, maxOz: 160, deter: 0.15 },
    { name: '6 lb', size: 96, minOz: 5, maxOz: 240, deter: 0.2 },
    { name: '8 lb', size: 128, minOz: 7, maxOz: 320, deter: 0.25 },
    { name: '10 lb', size: 160, minOz: 9, maxOz: 400, deter: 0.3 },
    { name: '12 lb', size: 192, minOz: 11, maxOz: 600, deter: 0.35 },
    { name: '15 lb', size: 240, minOz: 14, maxOz: 1100, deter: 0.5 }
  ];

  hooks: Hook[] = [
    { name: '22', size: 22, minOz: 1, maxOz: 50, deter: 0 },
    { name: '20', size: 20, minOz: 3, maxOz: 100, deter: 0.05 },
    { name: '18', size: 18, minOz: 5, maxOz: 150, deter: 0.1 },
    { name: '16', size: 16, minOz: 10, maxOz: 200, deter: 0.15 },
    { name: '14', size: 14, minOz: 15, maxOz: 250, deter: 0.2 },
    { name: '12', size: 12, minOz: 20, maxOz: 300, deter: 0.25 },
    { name: '10', size: 10, minOz: 30, maxOz: 400, deter: 0.3 },
    { name: '8', size: 8, minOz: 40, maxOz: 500, deter: 0.35 },
    { name: '6', size: 6, minOz: 60, maxOz: 700, deter: 0.4 },
    { name: '4', size: 4, minOz: 80, maxOz: 900, deter: 0.45 },
    { name: '2', size: 2, minOz: 100, maxOz: 1100, deter: 0.5 }
  ];
}
