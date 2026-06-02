import { expect, test } from '@playwright/test';

test.describe('Match flow', () => {
	test('menu → solo match → rules → draw → game → results → menu', async ({ page }) => {
		// Start at menu (first load establishes the origin for localStorage)
		await page.goto('/menu');

		// Pre-set avatar in localStorage to avoid Filmstrip viewport interaction
		await page.evaluate(() => {
			localStorage.setItem('jcmf-player-avatar', 'aaron.jpeg');
		});

		await expect(page.getByRole('button', { name: /Solo Match/ })).toBeVisible();

		// Select match mode
		await page.getByRole('button', { name: /Solo Match/ }).click();
		await page.waitForURL('/prep/rules');

		// Match rules: fill name (avatar pre-set from localStorage)
		await expect(page.locator('#name')).toBeVisible();
		await page.locator('#name').fill('TestAngler');

		// Select 1 minute match duration
		await page.getByRole('button', { name: '1m' }).click();
		await page.waitForURL('/prep/draw');

		// Draw page — verify peg + Start Match button
		await expect(page.getByRole('button', { name: /Start Match/ })).toBeVisible();

		// Start the match — triggers SvelteKit client-nav to /game?timed=1
		await page.getByRole('button', { name: /Start Match/ }).click();

		// Wait for TackleModal to appear (indicates game page loaded client-side)
		await expect(page.getByRole('button', { name: 'Start Fishing' })).toBeVisible({
			timeout: 15000
		});

		// Dismiss initial TackleModal
		await page.getByRole('button', { name: 'Start Fishing' }).click();

		// Game page — timed mode shows "Weigh in Early"
		await expect(page.getByText(/Peg/).first()).toBeVisible();
		await expect(page.getByText('Weigh in Early')).toBeVisible();

		// Weigh in early
		await page.getByText('Weigh in Early').click();

		// Results page (after client-nav from game)
		await expect(page.getByText('Match Results')).toBeVisible({ timeout: 15000 });
		await expect(page.getByRole('link', { name: 'Main Menu' })).toBeVisible();

		// Back to menu
		await page.getByRole('link', { name: 'Main Menu' }).click();
		await expect(page.getByText('Solo Match')).toBeVisible({ timeout: 15000 });
	});
});
