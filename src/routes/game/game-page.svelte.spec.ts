import { page } from 'vitest/browser';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { prepState } from '$lib/game/prep-state.svelte';
import { gameState } from '$lib/game/state.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/state', () => ({
	page: { url: new URL('http://localhost/game') }
}));

describe('Game page', () => {
	beforeEach(() => {
		prepState.mode = 'session';
		prepState.venueName = 'Test Venue';
		prepState.lakeName = 'Test Lake';
		prepState.playerPeg = 'A1';
		gameState.phase = 'fishing';
	});

	it('renders the game page without error', async () => {
		const { default: GamePage } = await import('./+page.svelte');
		render(GamePage);
		await expect.element(page.getByText('Test Venue')).toBeInTheDocument();
	});

	it('shows lake name', async () => {
		const { default: GamePage } = await import('./+page.svelte');
		render(GamePage);
		await expect.element(page.getByText('Test Lake')).toBeInTheDocument();
	});

	it('shows peg name', async () => {
		const { default: GamePage } = await import('./+page.svelte');
		render(GamePage);
		await expect.element(page.getByText(/Peg A1/)).toBeInTheDocument();
	});
});
