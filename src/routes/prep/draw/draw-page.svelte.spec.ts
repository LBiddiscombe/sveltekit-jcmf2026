import { page } from 'vitest/browser';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { prepState } from '$lib/game/prep-state.svelte';
import { venues } from '$lib/data';
import DrawPage from './+page.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

describe('Draw page', () => {
	beforeEach(() => {
		prepState.mode = 'session';
		prepState.playerPeg = undefined;
		prepState.venueName = '';
		prepState.lakeName = '';
		prepState.anglers = [];
		vi.clearAllMocks();
	});

	it('renders venue and lake name when match is set up', async () => {
		const venue = venues.find((v) => v.lakes.length > 0);
		if (!venue) return;
		const lake = venue.lakes[0];
		prepState.mode = 'match';
		prepState.venueName = venue.name;
		prepState.lakeName = lake.name;

		render(DrawPage);
		await expect.element(page.getByText(venue.name)).toBeInTheDocument();
		await expect.element(page.getByText(lake.name)).toBeInTheDocument();
	});

	it('shows Start Match button', async () => {
		const venue = venues.find((v) => v.lakes.length > 0);
		if (!venue) return;
		const lake = venue.lakes[0];
		prepState.mode = 'match';
		prepState.venueName = venue.name;
		prepState.lakeName = lake.name;

		render(DrawPage);
		await expect.element(page.getByText('Start Match')).toBeInTheDocument();
	});
});
