import { expect, test } from '@playwright/test';

test.describe('Session flow', () => {
	test('splash → menu → session → game → results → menu', async ({ page }) => {
		// Splash page
		await page.goto('/');
		await expect(page.getByText('tap anywhere to begin')).toBeVisible();

		// Navigate to menu
		await page.locator('div[role="button"]').click();
		await expect(page.getByRole('button', { name: /Session/ })).toBeVisible({ timeout: 15000 });

		// Select session mode
		await page.getByRole('button', { name: /Session/ }).click();
		await expect(page.getByRole('button', { name: /Fish Peg/ })).toBeVisible({ timeout: 15000 });

		// Session rules — peg display + "Fish Peg" button
		await expect(page.getByRole('button', { name: /Fish Peg/ })).toBeVisible();

		// Start fishing — triggers SvelteKit client-nav to /game
		await page.getByRole('button', { name: /Fish Peg/ }).click();

		// Wait for TackleModal to appear (indicates game page loaded client-side)
		await expect(page.getByRole('button', { name: 'Start Fishing' })).toBeVisible({
			timeout: 15000
		});

		// Dismiss initial TackleModal
		await page.getByRole('button', { name: 'Start Fishing' }).click();

		// Game page — venue/lake/peg info
		await expect(page.getByText(/Peg/).first()).toBeVisible();
		await expect(page.getByText('Finish Session')).toBeVisible();

		// Finish session
		await page.getByText('Finish Session').click();

		// Results page (after client-nav from game)
		await expect(page.getByText('Session Results')).toBeVisible({ timeout: 15000 });
		await expect(page.getByRole('link', { name: 'Main Menu' })).toBeVisible();

		// Back to menu
		await page.getByRole('link', { name: 'Main Menu' }).click();
		await expect(page.getByRole('button', { name: /Session/ })).toBeVisible({ timeout: 15000 });
	});
});
