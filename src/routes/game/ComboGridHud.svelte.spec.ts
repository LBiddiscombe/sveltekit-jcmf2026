import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ComboGridHud from './ComboGridHud.svelte';
import type { TackleSelection } from '$lib/data';

function makeTackle(overrides: Partial<TackleSelection> = {}): TackleSelection {
	return {
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
		castStrength: 'Medium',
		...overrides
	};
}

describe('ComboGridHud.svelte', () => {
	it('renders toggle button with current cast strength', async () => {
		render(ComboGridHud, { tackle: makeTackle(), onselect: vi.fn() });
		await expect.element(page.getByLabelText('Quick tackle change')).toBeInTheDocument();
	});

	it('opens dropdown grid on toggle click', async () => {
		render(ComboGridHud, { tackle: makeTackle(), onselect: vi.fn() });
		await page.getByLabelText('Quick tackle change').click();
		await expect
			.element(page.getByLabelText('Select cast strength and strata'))
			.toBeInTheDocument();
	});

	it('shows 9 combo buttons in the grid', async () => {
		render(ComboGridHud, { tackle: makeTackle(), onselect: vi.fn() });
		await page.getByLabelText('Quick tackle change').click();
		const buttons = page
			.getByLabelText('Select cast strength and strata')
			.element()
			.querySelectorAll('button');
		expect(buttons.length).toBe(9);
	});

	it('disables Long casts when rod is Pole', async () => {
		render(ComboGridHud, {
			tackle: makeTackle({
				rod: {
					name: 'Pole',
					image: 'rod-pole.png',
					deter: 0,
					rodMultiplier: 0.33,
					allowedCastStrengths: ['Short', 'Medium'],
					allowedStrata: ['Top', 'Middle', 'Bottom'],
					maxLineLb: 6,
					requiresReel: false
				}
			}),
			onselect: vi.fn()
		});
		await page.getByLabelText('Quick tackle change').click();
		const disabled = page
			.getByLabelText('Select cast strength and strata')
			.element()
			.querySelectorAll('button:disabled');
		expect(disabled.length).toBe(3);
	});

	it('disables non-Bottom stratas when rod is Leger', async () => {
		render(ComboGridHud, {
			tackle: makeTackle({
				rod: {
					name: 'Leger',
					image: 'rod-leger.png',
					deter: 0.2,
					rodMultiplier: 1,
					allowedCastStrengths: ['Short', 'Medium', 'Long'],
					allowedStrata: ['Bottom'],
					maxLineLb: 15,
					requiresReel: true
				}
			}),
			onselect: vi.fn()
		});
		await page.getByLabelText('Quick tackle change').click();
		const disabled = page
			.getByLabelText('Select cast strength and strata')
			.element()
			.querySelectorAll('button:disabled');
		expect(disabled.length).toBe(6);
	});

	it('calls onselect and closes when a combo is clicked', async () => {
		const onselect = vi.fn();
		render(ComboGridHud, { tackle: makeTackle(), onselect });
		await page.getByLabelText('Quick tackle change').click();
		const buttons = page
			.getByLabelText('Select cast strength and strata')
			.element()
			.querySelectorAll('button');
		const firstEnabled = Array.from(buttons).find((b) => !b.hasAttribute('disabled'));
		firstEnabled?.click();
		expect(onselect).toHaveBeenCalledOnce();
		await expect
			.element(page.getByLabelText('Select cast strength and strata'))
			.not.toBeInTheDocument();
	});

	it('closes dropdown on Escape key', async () => {
		render(ComboGridHud, { tackle: makeTackle(), onselect: vi.fn() });
		await page.getByLabelText('Quick tackle change').click();
		await expect
			.element(page.getByLabelText('Select cast strength and strata'))
			.toBeInTheDocument();
		const dropdown = document.querySelector(
			'[aria-label="Select cast strength and strata"]'
		) as HTMLElement;
		dropdown?.focus();
		dropdown?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
		await expect
			.element(page.getByLabelText('Select cast strength and strata'))
			.not.toBeInTheDocument();
	});

	it('highlights active combo', async () => {
		render(ComboGridHud, {
			tackle: makeTackle({ castStrength: 'Long', strata: 'Bottom' }),
			onselect: vi.fn()
		});
		await page.getByLabelText('Quick tackle change').click();
		const active = page
			.getByLabelText('Select cast strength and strata')
			.element()
			.querySelector('.bg-primary\\/30');
		expect(active).toBeTruthy();
	});
});
