import { page } from 'vitest/browser';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { prepState } from '$lib/game/prep-state.svelte';
import { gameState } from '$lib/game/state.svelte';
import ResultsPage from './+page.svelte';

vi.mock('$app/state', () => ({
	page: { url: new URL('http://localhost/results') }
}));

describe('Results page', () => {
	beforeEach(() => {
		prepState.mode = 'session';
		gameState.anglers = [];
		gameState.catchAudit = [];
	});

	it('shows Session Results title in session mode', async () => {
		render(ResultsPage);
		await expect.element(page.getByText('Session Results')).toBeInTheDocument();
	});

	it('shows Match Results title in match mode', async () => {
		prepState.mode = 'match';
		render(ResultsPage);
		await expect.element(page.getByText('Match Results')).toBeInTheDocument();
	});

	it('shows no fish caught when catch is empty', async () => {
		render(ResultsPage);
		await expect.element(page.getByText('No fish were caught')).toBeInTheDocument();
	});

	it('renders Main Menu link', async () => {
		render(ResultsPage);
		await expect.element(page.getByText('Main Menu')).toBeInTheDocument();
	});
});
