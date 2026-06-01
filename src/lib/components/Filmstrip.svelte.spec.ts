import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Filmstrip from './Filmstrip.svelte';

const sampleItems = [
	{ id: '1', label: 'Roach' },
	{ id: '2', label: 'Perch' },
	{ id: '3', label: 'Carp', description: 'A big fish' }
];

describe('Filmstrip.svelte', () => {
	it('renders all items in selectable mode', async () => {
		render(Filmstrip, { items: sampleItems, selected: null });
		const buttons = page.getByRole('button').all();
		expect(buttons.length).toBe(sampleItems.length);
	});

	it('calls onselect when a tile is clicked', async () => {
		const onselect = vi.fn();
		render(Filmstrip, { items: sampleItems, selected: null, onselect });
		await page.getByRole('button', { name: /Perch/ }).click();
		expect(onselect).toHaveBeenCalledWith('2');
	});

	it('shows selected state styling', async () => {
		render(Filmstrip, { items: sampleItems, selected: '2' });
		const buttons = page.getByRole('button').all();
		const buttonElements = buttons.map((b) => b.element());
		const selectedButton = buttonElements.find((el) => el.textContent?.includes('Perch'));
		expect(selectedButton?.className).toContain('scale-105');
	});

	it('renders divs in display variant', async () => {
		render(Filmstrip, { items: sampleItems, selected: null, variant: 'display' });
		const buttons = page.getByRole('button').all();
		expect(buttons.length).toBe(0);
	});

	it('shows description in display mode', async () => {
		render(Filmstrip, { items: sampleItems, selected: null, variant: 'display' });
		await expect.element(page.getByText('A big fish')).toBeInTheDocument();
	});

	it('applies small size class', async () => {
		render(Filmstrip, { items: sampleItems, selected: null, size: 'small' });
		const buttons = page.getByRole('button').all();
		if (buttons.length > 0) {
			const tileDiv = buttons[0].element().querySelector('div');
			expect(tileDiv?.className).toContain('h-16');
		}
	});
});
