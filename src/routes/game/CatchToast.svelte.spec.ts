import { page } from 'vitest/browser';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { mount } from 'svelte';
import CatchToast from './CatchToast.svelte';

let container: HTMLDivElement;

beforeEach(() => {
	container = document.createElement('div');
	document.body.appendChild(container);
});

afterEach(() => {
	container.remove();
});

describe('CatchToast.svelte', () => {
	it('shows nothing when events array is empty', async () => {
		mount(CatchToast, { target: container, props: { events: [] } });
		await expect.element(page.getByText(/caught a/)).not.toBeInTheDocument();
	});

	it('renders first event message with classification', async () => {
		mount(CatchToast, {
			target: container,
			props: {
				events: [{ name: 'Alice', pegName: 'A1', classificationLabel: 'Silver', species: 'Roach' }]
			}
		});
		await expect.element(page.getByText('Alice caught a Silver Roach')).toBeInTheDocument();
	});

	it('renders first event message without classification', async () => {
		mount(CatchToast, {
			target: container,
			props: {
				events: [{ name: 'Bob', pegName: 'B2', classificationLabel: '', species: 'Perch' }]
			}
		});
		await expect.element(page.getByText('Bob caught a Perch')).toBeInTheDocument();
	});

	it('dismisses current toast after 3 seconds', async () => {
		vi.useFakeTimers();
		mount(CatchToast, {
			target: container,
			props: {
				events: [{ name: 'Alice', pegName: 'A1', classificationLabel: '', species: 'Roach' }]
			}
		});
		await expect.element(page.getByText('Alice caught a Roach')).toBeInTheDocument();
		vi.advanceTimersByTime(3000);
		await expect.element(page.getByText('Alice caught a Roach')).not.toBeInTheDocument();
		vi.useRealTimers();
	});

	it('shows second event after first is dismissed', async () => {
		vi.useFakeTimers();
		mount(CatchToast, {
			target: container,
			props: {
				events: [
					{ name: 'Alice', pegName: 'A1', classificationLabel: '', species: 'Roach' },
					{ name: 'Bob', pegName: 'B2', classificationLabel: 'Common', species: 'Carp' }
				]
			}
		});
		await expect.element(page.getByText('Alice caught a Roach')).toBeInTheDocument();
		vi.advanceTimersByTime(3000);
		await expect.element(page.getByText('Alice caught a Roach')).not.toBeInTheDocument();
		await expect.element(page.getByText('Bob caught a Common Carp')).toBeInTheDocument();
		vi.useRealTimers();
	});
});
