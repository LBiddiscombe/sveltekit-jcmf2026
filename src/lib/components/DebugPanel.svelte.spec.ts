import { page } from 'vitest/browser';
import { describe, expect, it, beforeEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import DebugPanel from './DebugPanel.svelte';
import { gameState } from '$lib/game/state.svelte';
import { prepState } from '$lib/game/prep-state.svelte';
import type { AnglerState } from '$lib/game/prep-state.svelte';

const defaultPlayer: AnglerState = {
	id: 'player-1',
	name: 'Test Angler',
	image: 'avatar.png',
	isPlayer: true,
	skill: 5,
	pegName: 'A1',
	phase: 'waiting',
	tackle: {
		rod: {
			name: 'Float',
			image: 'rod-float.png',
			deter: 0.1,
			rodMultiplier: 0.67,
			allowedCastStrengths: ['Short', 'Medium', 'Long'],
			allowedStrata: ['Top', 'Middle', 'Bottom'],
			maxLineLb: 15,
			requiresReel: true
		},
		reel: { name: 'Fixed Spool', image: 'reel-fixed-spool.png', deter: 0.2 },
		line: { name: '4 lb', image: 'line.png', size: 64, minOz: 4, maxOz: 160, deter: 0.15 },
		hook: { name: '16', image: 'hook.png', size: 16, minOz: 4, maxOz: 210, deter: 0.15 },
		bait: { name: 'Maggot', image: 'maggot.png', minOz: 1, maxOz: 640 },
		strata: 'Middle',
		castStrength: 'Medium'
	},
	totalWeightOz: 0,
	score: 0,
	biggestFish: null,
	catch: []
};

describe('DebugPanel.svelte', () => {
	beforeEach(() => {
		gameState.anglers = [defaultPlayer];
		gameState.catchAudit = [];
		prepState.mode = 'session';
		prepState.playerPeg = 'A1';
	});

	it('shows peg name in fish distribution header', async () => {
		render(DebugPanel);
		await expect.element(page.getByText(/Peg A1/)).toBeInTheDocument();
	});

	it('shows My Catch section header', async () => {
		render(DebugPanel);
		await expect.element(page.getByText(/My Catch/)).toBeInTheDocument();
	});

	it('does not show bots section in session mode', async () => {
		render(DebugPanel);
		await expect.element(page.getByText('Bots')).not.toBeInTheDocument();
	});

	it('shows bots section in match mode', async () => {
		prepState.mode = 'match';
		const bot: AnglerState = {
			...defaultPlayer,
			id: 'bot-1',
			name: 'Bot Angler',
			isPlayer: false,
			pegName: 'B2',
			phase: 'waiting'
		};
		gameState.anglers = [defaultPlayer, bot];
		render(DebugPanel);
		await expect.element(page.getByText('Bots')).toBeInTheDocument();
	});

	it('shows no fish caught when catch is empty', async () => {
		render(DebugPanel);
		const fishBtn = page.getByText(/Peg A1/);
		await fishBtn.click();
		await expect.element(page.getByText(/0 fish/)).toBeInTheDocument();
	});
});
