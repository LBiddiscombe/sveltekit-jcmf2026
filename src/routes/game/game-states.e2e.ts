import { expect, test } from '@playwright/test';

test.describe('App route states', () => {
	test('splash page renders and navigates to menu', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByText('tap anywhere to begin')).toBeVisible();

		await page.locator('div[role="button"]').click();
		await page.waitForURL('/menu');
		await expect(page.getByText('Session')).toBeVisible();
	});

	test('about page renders with back link', async ({ page }) => {
		await page.goto('/about');
		await expect(page.getByText('About')).toBeVisible();
		await expect(page.getByRole('link', { name: 'Back to Menu' })).toBeVisible();

		await page.getByRole('link', { name: 'Back to Menu' }).click();
		await page.waitForURL('/menu');
	});

	test('fish log page renders with back link', async ({ page }) => {
		await page.goto('/fish-log');
		await expect(page.getByText('Fish Log')).toBeVisible();
		await expect(page.getByRole('link', { name: 'Back to Menu' })).toBeVisible();

		await page.getByRole('link', { name: 'Back to Menu' }).click();
		await page.waitForURL('/menu');
	});

	test('results page renders empty state when navigated directly', async ({ page }) => {
		await page.goto('/results');
		await expect(page.getByText('Session Results')).toBeVisible();
		await expect(page.getByText('No fish were caught')).toBeVisible();
		await expect(page.getByRole('link', { name: 'Main Menu' })).toBeVisible();
	});

	test('prep/draw shows error state without match context', async ({ page }) => {
		await page.goto('/prep/draw');
		await expect(page.getByText('No Match in Progress')).toBeVisible();
		await expect(page.getByRole('link', { name: 'Back to Menu' })).toBeVisible();
	});

	test('game page handles direct navigation gracefully without prep state', async ({ page }) => {
		await page.goto('/game');
		// Page should not crash — shows fallback UI
		await expect(page.getByText('Pack Up and Go Home')).toBeVisible();
		// No peg, venue, or lake data means peg/venue text is absent
		const pegTexts = await page.getByText(/Peg/).all();
		expect(pegTexts.length).toBeLessThanOrEqual(1);
	});
});
