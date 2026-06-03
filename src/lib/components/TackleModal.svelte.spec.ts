import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TackleModal from './TackleModal.svelte';
import type { TackleSelection } from '$lib/data';

const defaultTackle: TackleSelection = {
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
};

function defaultProps(overrides: Record<string, unknown> = {}) {
	return {
		isTimed: false,
		isMidGame: false,
		initialTackle: defaultTackle,
		pegName: 'A1',
		selectedPegData: null,
		venueName: 'Test Venue',
		lakeName: 'Test Lake',
		onconfirm: vi.fn(),
		timerDisplay: '',
		...overrides
	};
}

describe('TackleModal.svelte', () => {
	it('renders the overlay and card', async () => {
		render(TackleModal, defaultProps());
		await expect.element(page.getByText('Test Venue')).toBeInTheDocument();
	});

	it('shows Start Fishing when isMidGame is false', async () => {
		render(TackleModal, defaultProps());
		await expect.element(page.getByText('Start Fishing')).toBeInTheDocument();
	});

	it('shows Return & Recast when isMidGame is true', async () => {
		render(TackleModal, defaultProps({ isMidGame: true }));
		await expect.element(page.getByText('Return & Recast')).toBeInTheDocument();
	});

	it('shows timer display when isTimed and timerDisplay provided', async () => {
		render(TackleModal, defaultProps({ isTimed: true, timerDisplay: '5:00' }));
		await expect.element(page.getByText('5:00')).toBeInTheDocument();
	});

	it('does not show timer when isTimed is false', async () => {
		render(TackleModal, defaultProps({ timerDisplay: '5:00' }));
		await expect.element(page.getByText('5:00')).not.toBeInTheDocument();
	});

	it('shows peg venue and lake info', async () => {
		render(TackleModal, defaultProps());
		await expect.element(page.getByText('Test Venue')).toBeInTheDocument();
		await expect.element(page.getByText('Test Lake')).toBeInTheDocument();
		await expect.element(page.getByText(/Peg A1/)).toBeInTheDocument();
	});

	it('displays rod name from initial tackle', async () => {
		render(TackleModal, defaultProps());
		await expect.element(page.getByText('Float').first()).toBeInTheDocument();
	});

	it('shows No Reel when rod is Pole', async () => {
		render(
			TackleModal,
			defaultProps({
				initialTackle: {
					...defaultTackle,
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
				}
			})
		);
		await expect.element(page.getByText('No Reel')).toBeInTheDocument();
	});

	it('shows cast strength and strata', async () => {
		render(
			TackleModal,
			defaultProps({
				initialTackle: { ...defaultTackle, castStrength: 'Long', strata: 'Bottom' }
			})
		);
		await expect.element(page.getByText('Long')).toBeInTheDocument();
		await expect.element(page.getByText('Bottom')).toBeInTheDocument();
	});

	it('opens rod picker when rod button clicked', async () => {
		render(TackleModal, defaultProps());
		await page.getByAltText('Float').click();
		await expect.element(page.getByText('Select Rod')).toBeInTheDocument();
	});

	it('calls onconfirm when confirm button clicked', async () => {
		const onconfirm = vi.fn();
		render(TackleModal, defaultProps({ onconfirm }));
		await page.getByText('Start Fishing').click();
		expect(onconfirm).toHaveBeenCalledOnce();
	});

	it('shows peg description when selectedPegData provided', async () => {
		render(
			TackleModal,
			defaultProps({
				selectedPegData: {
					name: 'A1',
					image: 'peg-a1.jpeg',
					description: 'A scenic peg by the lily pads',
					strata: [],
					current: { flow: 0.5, clarity: 0.5, temp: 15 }
				}
			})
		);
		await expect.element(page.getByText('A scenic peg by the lily pads')).toBeInTheDocument();
	});
});
