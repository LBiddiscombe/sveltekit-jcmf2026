import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import PickerModal from './PickerModal.svelte';

const sampleItems = [
	{ name: 'Float', image: 'rod-float.png' },
	{ name: 'Leger', image: 'rod-leger.png' },
	{ name: 'Pole', image: 'rod-pole.png' }
];

const sampleImages: Record<string, string> = {
	'/img/rods/rod-float.png': '',
	'/img/rods/rod-leger.png': '',
	'/img/rods/rod-pole.png': ''
};

describe('PickerModal.svelte', () => {
	const defaultProps = {
		title: 'Select Rod',
		items: sampleItems,
		images: sampleImages,
		imageBasePath: '/img/rods',
		selectedName: 'Float',
		onselect: vi.fn(),
		onclose: vi.fn()
	};

	it('renders the title', async () => {
		render(PickerModal, defaultProps);
		await expect.element(page.getByText('Select Rod')).toBeInTheDocument();
	});

	it('renders dialog with aria-label', async () => {
		render(PickerModal, defaultProps);
		await expect.element(page.getByLabelText('Select Rod')).toBeInTheDocument();
	});

	it('renders all items', async () => {
		render(PickerModal, defaultProps);
		for (const item of sampleItems) {
			await expect.element(page.getByText(item.name)).toBeInTheDocument();
		}
	});

	it('highlights the selected item', async () => {
		render(PickerModal, { ...defaultProps, selectedName: 'Pole' });
		const poleBtn = page.getByText('Pole').element().closest('button');
		expect(poleBtn?.className).toContain('border-primary');
	});

	it('calls onselect when an item is clicked', async () => {
		const onselect = vi.fn();
		render(PickerModal, { ...defaultProps, onselect });
		await page.getByText('Leger').click();
		expect(onselect).toHaveBeenCalledWith(sampleItems[1]);
	});

	it('calls onclose when close button clicked', async () => {
		const onclose = vi.fn();
		render(PickerModal, { ...defaultProps, onclose });
		await page.getByLabelText('Close').click();
		expect(onclose).toHaveBeenCalledOnce();
	});

	it('calls onclose when backdrop clicked', async () => {
		const onclose = vi.fn();
		render(PickerModal, { ...defaultProps, onclose });
		const backdrop = page.getByLabelText('Select Rod').element().parentElement;
		backdrop?.click();
		expect(onclose).toHaveBeenCalledOnce();
	});

	it('calls onclose on Escape key', async () => {
		const onclose = vi.fn();
		render(PickerModal, { ...defaultProps, onclose });
		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
		expect(onclose).toHaveBeenCalledOnce();
	});

	it('renders icons for items without images', async () => {
		const iconItems = [
			{ name: 'Short', image: '' },
			{ name: 'Medium', image: '' }
		];
		render(PickerModal, {
			...defaultProps,
			items: iconItems,
			images: {},
			imageBasePath: '',
			itemIcons: {
				Short: '<svg data-testid="short-icon"><circle/></svg>',
				Medium: '<svg data-testid="medium-icon"><rect/></svg>'
			}
		});
		await expect.element(page.getByText('Short')).toBeInTheDocument();
		await expect.element(page.getByText('Medium')).toBeInTheDocument();
	});
});
