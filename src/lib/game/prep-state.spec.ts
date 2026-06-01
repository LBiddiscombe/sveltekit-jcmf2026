import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrepState } from './prep-state.svelte';
import { venues, bots } from '$lib/data';
import type { TackleSelection } from '$lib/data';

const testVenue = venues[0];
const testLake = testVenue.lakes[0];

const defaultTackle: TackleSelection = {
	rod: { name: 'Float', image: 'rod-float.png', deter: 0.1, rodMultiplier: 1.0 },
	reel: { name: 'Fixed Spool', image: 'reel-fixed-spool.png', deter: 0.2 },
	line: { name: '4 lb', image: 'line.png', size: 64, minOz: 3, maxOz: 160, deter: 0.15 },
	hook: { name: '16', image: 'hook.png', size: 16, minOz: 10, maxOz: 200, deter: 0.15 },
	bait: { name: 'maggot', image: 'maggot.png', minOz: 1, maxOz: 512 },
	strata: 'Bottom',
	castStrength: 'Medium'
};

describe('PrepState', () => {
	let ps: PrepState;

	beforeEach(() => {
		ps = new PrepState();
		ps.init('session');
	});

	describe('init', () => {
		it('resets all state', () => {
			ps.selectVenue(testVenue.name);
			ps.selectLake(testLake.name);
			ps.assignPeg(testLake.pegs[0].name);
			ps.chooseTackle({ ...defaultTackle, strata: 'Top' });

			ps.init('match');

			expect(ps.mode).toBe('match');
			expect(ps.venueName).toBe('');
			expect(ps.lakeName).toBe('');
			expect(ps.playerPeg).toBeUndefined();
			expect(ps.playerName).toBe('');
			expect(ps.playerAvatar).toBe('');
			expect(ps.timeLimitMinutes).toBeUndefined();
			expect(ps.matchStartTime).toBeUndefined();
			expect(ps.anglers).toEqual([]);
		});

		it('sets mode to session', () => {
			ps.init('session');
			expect(ps.mode).toBe('session');
		});

		it('sets mode to match', () => {
			ps.init('match');
			expect(ps.mode).toBe('match');
		});
	});

	describe('selectVenue', () => {
		it('sets venue name and clears lake and peg', () => {
			ps.selectVenue(testVenue.name);
			expect(ps.venueName).toBe(testVenue.name);
			expect(ps.lakeName).toBe('');
			expect(ps.playerPeg).toBeUndefined();
		});

		it('throws for unknown venue', () => {
			expect(() => ps.selectVenue('NonExistent')).toThrow('Venue not found');
		});
	});

	describe('selectLake', () => {
		it('selects a lake from the current venue', () => {
			ps.selectVenue(testVenue.name);
			ps.selectLake(testLake.name);
			expect(ps.lakeName).toBe(testLake.name);
			expect(ps.playerPeg).toBeUndefined();
		});

		it('throws when no venue is selected', () => {
			expect(() => ps.selectLake(testLake.name)).toThrow('Venue must be selected');
		});

		it('throws for unknown lake', () => {
			ps.selectVenue(testVenue.name);
			expect(() => ps.selectLake('NonExistent')).toThrow('Lake not found');
		});
	});

	describe('assignPeg', () => {
		it('assigns a valid peg to the player', () => {
			ps.selectVenue(testVenue.name);
			ps.selectLake(testLake.name);
			ps.assignPeg(testLake.pegs[0].name);
			expect(ps.playerPeg).toBe(testLake.pegs[0].name);
			expect(ps.playerAngler?.pegName).toBe(testLake.pegs[0].name);
		});

		it('throws when no lake is selected', () => {
			expect(() => ps.assignPeg('1')).toThrow('Lake must be selected');
		});

		it('throws when peg does not exist at lake', () => {
			ps.selectVenue(testVenue.name);
			ps.selectLake(testLake.name);
			expect(() => ps.assignPeg('999')).toThrow('Peg not found');
		});
	});

	describe('setMatchTimeLimit', () => {
		it('sets time limit in match mode', () => {
			ps.init('match');
			ps.setMatchTimeLimit(180);
			expect(ps.timeLimitMinutes).toBe(180);
		});

		it('throws when not in match mode', () => {
			expect(() => ps.setMatchTimeLimit(180)).toThrow(
				'Match time limit can only be set in match mode'
			);
		});
	});

	describe('drawMatch', () => {
		beforeEach(() => {
			vi.spyOn(Math, 'random').mockReturnValue(0.1);
		});

		afterEach(() => {
			vi.restoreAllMocks();
		});

		it('assigns pegs and populates bots in match mode', () => {
			ps.init('match');
			ps.selectVenue(testVenue.name);
			ps.selectLake(testLake.name);

			ps.drawMatch();

			expect(testLake.pegs.some((p) => p.name === ps.playerPeg)).toBe(true);
			expect(ps.anglers.length).toBe(testLake.pegs.length);
			expect(ps.anglers.filter((a) => !a.isPlayer).length).toBe(testLake.pegs.length - 1);
			expect(ps.anglers.filter((a) => a.isPlayer)).toHaveLength(1);
		});

		it('each bot has a unique peg assignment', () => {
			ps.init('match');
			ps.selectVenue(testVenue.name);
			ps.selectLake(testLake.name);

			ps.drawMatch();

			const botPegs = ps.anglers.filter((a) => !a.isPlayer).map((a) => a.pegName);
			const uniquePegs = new Set(botPegs);
			expect(uniquePegs.size).toBe(botPegs.length);
		});

		it('throws when not in match mode', () => {
			ps.init('session');
			expect(() => ps.drawMatch()).toThrow('Draw can only happen in match mode');
		});

		it('throws when no lake is selected', () => {
			ps.init('match');
			expect(() => ps.drawMatch()).toThrow('Lake must be selected');
		});

		it('excludes player avatar from bot pool when avatar is set', () => {
			const avatarBot = bots.find((b) => b.image === 'alan.jpeg');
			if (!avatarBot) return;

			ps.init('match');
			ps.selectVenue(testVenue.name);
			ps.selectLake(testLake.name);
			ps.playerAvatar = avatarBot.image;

			ps.drawMatch();

			const drawnAlan = ps.anglers.find((a) => a.name === 'Alan');
			expect(drawnAlan).toBeUndefined();
		});
	});

	describe('chooseTackle', () => {
		it('updates the player tackle selection', () => {
			ps.selectVenue(testVenue.name);
			const newTackle: TackleSelection = {
				...defaultTackle,
				strata: 'Top',
				castStrength: 'Long'
			};

			ps.chooseTackle(newTackle);
			expect(ps.playerAngler?.tackle.strata).toBe('Top');
			expect(ps.playerAngler?.tackle.castStrength).toBe('Long');
		});
	});

	describe('computed getters', () => {
		it('venue returns undefined when no venue selected', () => {
			expect(ps.venue).toBeUndefined();
		});

		it('lake returns undefined when no lake selected', () => {
			expect(ps.lake).toBeUndefined();
		});

		it('playerAngler returns undefined when no anglers exist', () => {
			expect(ps.playerAngler).toBeUndefined();
		});
	});
});
