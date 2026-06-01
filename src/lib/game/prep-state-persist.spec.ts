import { describe, it, expect, beforeEach, vi } from 'vitest';
import { venues } from '$lib/data';

vi.mock('$app/environment', () => ({ browser: true }));

const store: Record<string, string> = {};
const localStore: Record<string, string> = {};
const sessionSetItem = vi.fn((key: string, value: string) => {
	store[key] = value;
});
vi.stubGlobal('sessionStorage', {
	getItem: vi.fn((key: string) => store[key] ?? null),
	setItem: sessionSetItem,
	removeItem: vi.fn((key: string) => {
		delete store[key];
	})
});
vi.stubGlobal('localStorage', {
	getItem: vi.fn((key: string) => localStore[key] ?? null),
	setItem: vi.fn((key: string, value: string) => {
		localStore[key] = value;
	}),
	removeItem: vi.fn((key: string) => {
		delete localStore[key];
	})
});

const testVenue = venues[0];
const testLake = testVenue.lakes[0];
const STORAGE_KEY = 'jcmf-prep';

describe('PrepState persist / restore', () => {
	beforeEach(() => {
		for (const key of Object.keys(store)) {
			delete store[key];
		}
		for (const key of Object.keys(localStore)) {
			delete localStore[key];
		}
	});

	it('persists state on selectVenue', async () => {
		const { PrepState } = await import('./prep-state.svelte');
		const state = new PrepState();
		state.init('match');
		state.selectVenue(testVenue.name);

		expect(sessionStorage.setItem).toHaveBeenCalledWith(
			STORAGE_KEY,
			expect.stringContaining('"mode":"match"')
		);
	});

	it('restores persisted state on construction', async () => {
		store[STORAGE_KEY] = JSON.stringify({
			mode: 'match',
			venueName: testVenue.name,
			lakeName: testLake.name,
			playerPeg: testLake.pegs[0].name,
			playerName: 'Test',
			playerAvatar: '',
			timeLimitMinutes: 120,
			matchStartTime: 1000,
			anglers: []
		});

		const { PrepState } = await import('./prep-state.svelte');
		const state = new PrepState();

		expect(state.mode).toBe('match');
		expect(state.venueName).toBe(testVenue.name);
		expect(state.lakeName).toBe(testLake.name);
		expect(state.playerPeg).toBe(testLake.pegs[0].name);
		expect(state.timeLimitMinutes).toBe(120);
	});

	it('silently clears corrupt sessionStorage data', async () => {
		store[STORAGE_KEY] = 'not valid json at all';

		const { PrepState } = await import('./prep-state.svelte');
		const state = new PrepState();

		expect(store[STORAGE_KEY]).toBeUndefined();
		expect(state.mode).toBe('session');
	});

	it('skips restore when stored mode is invalid', async () => {
		store[STORAGE_KEY] = JSON.stringify({
			mode: 'invalid',
			venueName: testVenue.name,
			lakeName: testLake.name
		});

		const { PrepState } = await import('./prep-state.svelte');
		const state = new PrepState();

		expect(state.mode).toBe('session');
	});

	it('skips restore when venue is not found', async () => {
		store[STORAGE_KEY] = JSON.stringify({
			mode: 'match',
			venueName: 'NonExistentVenue',
			lakeName: testLake.name
		});

		const { PrepState } = await import('./prep-state.svelte');
		const state = new PrepState();

		expect(state.venueName).toBe('');
	});

	it('skips restore when lake is not found at venue', async () => {
		store[STORAGE_KEY] = JSON.stringify({
			mode: 'match',
			venueName: testVenue.name,
			lakeName: 'NonExistentLake'
		});

		const { PrepState } = await import('./prep-state.svelte');
		const state = new PrepState();

		expect(state.lakeName).toBe('');
	});
});
