/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test, type Page } from '@playwright/test';
import { spawn, type ChildProcess } from 'child_process';

let partykitProcess: ChildProcess | null = null;

test.describe('Multiplayer catch flow', () => {
	test.beforeAll(async () => {
		partykitProcess = spawn('npx', ['partykit', 'dev'], {
			cwd: process.cwd(),
			stdio: 'pipe'
		});
		await new Promise<void>((resolve, reject) => {
			const timeout = setTimeout(() => reject(new Error('PartyKit startup timeout')), 15000);
			partykitProcess!.stdout?.on('data', (data: Buffer) => {
				const text = data.toString();
				if (text.includes('Ready on http') || text.includes('listening')) {
					clearTimeout(timeout);
					resolve();
				}
			});
			partykitProcess!.stderr?.on('data', (data: Buffer) => {
				const text = data.toString();
				if (text.includes('Ready on http') || text.includes('listening')) {
					clearTimeout(timeout);
					resolve();
				}
			});
			partykitProcess!.on('error', (err) => {
				clearTimeout(timeout);
				reject(err);
			});
		});
	});

	test.afterAll(() => {
		if (partykitProcess) {
			partykitProcess.kill();
			partykitProcess = null;
		}
	});

	async function catchTwoFish(page: Page): Promise<void> {
		for (let i = 0; i < 2; i++) {
			await page.waitForFunction(
				() => {
					const p = (window as any).__gameState?.playerSnapshot?.phase;
					return p === 'waiting' || p === 'idle';
				},
				{ timeout: 60000 }
			);

			if (
				await page.evaluate(() => (window as any).__gameState?.playerSnapshot?.phase === 'idle')
			) {
				await page.waitForFunction(
					() => (window as any).__gameState?.playerSnapshot?.phase === 'waiting',
					{ timeout: 5000 }
				);
			}

			const result = await page.evaluate(() => {
				const gs = (window as any).__gameState;
				const angler = gs.playerAngler;
				if (!angler) return { ok: false, reason: 'no-angler' };
				const pop = gs.getPegPopulation(angler.pegName);
				if (!pop || pop.length === 0) return { ok: false, reason: 'no-fish' };
				const fish = pop.find(
					(f: any) =>
						f.weightOz >= angler.tackle.hook.minOz &&
						f.weightOz <= angler.tackle.hook.maxOz &&
						f.weightOz >= angler.tackle.line.minOz
				);
				if (!fish) return { ok: false, reason: 'no-suitable-fish', popSize: pop.length };
				const ok = gs.debugForceFish(fish.id);
				return ok
					? { ok: true }
					: { ok: false, reason: 'debugForceFish-failed', phase: gs.playerSnapshot?.phase };
			});
			expect(result.ok).toBe(true);

			await page.waitForFunction(
				() => (window as any).__gameState?.playerSnapshot?.phase === 'bite',
				{ timeout: 10000 }
			);

			await page.evaluate(() => (window as any).__gameState.strike());
			await page.evaluate(() => (window as any).__gameState.handleReelingOutcome('caught'));

			await page.waitForFunction(
				() => (window as any).__gameState?.lastEvent?.type === 'fishCaught',
				{ timeout: 5000 }
			);

			await page.evaluate(() => (window as any).__gameState.dismissCaught());
		}
	}

	test('two players catch fish and both see results', async ({ browser }) => {
		const hostCtx = await browser.newContext();
		const joinCtx = await browser.newContext();
		const host = await hostCtx.newPage();
		const joiner = await joinCtx.newPage();

		await host.goto('/');
		await host.evaluate(() => localStorage.setItem('jcmf-debug', 'true'));
		await joiner.goto('/');
		await joiner.evaluate(() => localStorage.setItem('jcmf-debug', 'true'));

		// --- HOST: create room ---
		await host.goto('/multiplayer/host');
		await host.locator('#name').fill('HostAngler');
		await host.getByRole('button', { name: 'Create Match' }).click();
		await host.waitForURL('/multiplayer/lobby');
		const joinCode = await host.locator('text=/[BCDFGHJKLMNPRTVWXYZ2346789]{4}/').textContent();
		expect(joinCode).toBeTruthy();

		// --- JOINER: join room ---
		await joiner.goto('/multiplayer/join');
		await joiner.locator('#name').fill('JoinerAngler');
		await joiner.locator('#code').fill(joinCode!.trim());
		await joiner.getByRole('button', { name: 'Join Match' }).click();
		await joiner.waitForURL('/multiplayer/lobby');

		await expect(host.getByText('HostAngler').first()).toBeVisible();
		await expect(host.getByText('JoinerAngler').first()).toBeVisible();
		await expect(joiner.getByText('HostAngler').first()).toBeVisible();
		await expect(joiner.getByText('JoinerAngler').first()).toBeVisible();

		// --- HOST: start match ---
		await host.getByRole('button', { name: 'Start Match' }).click();
		await host.waitForURL('/game?multi=1');
		await joiner.waitForURL('/game?multi=1');

		await expect(host.getByRole('button', { name: 'Start Fishing' })).toBeVisible({
			timeout: 15000
		});
		await expect(joiner.getByRole('button', { name: 'Start Fishing' })).toBeVisible({
			timeout: 15000
		});
		await host.getByRole('button', { name: 'Start Fishing' }).click();
		await joiner.getByRole('button', { name: 'Start Fishing' }).click();

		// Both players catch 2 fish each
		await catchTwoFish(host);
		await catchTwoFish(joiner);

		// Wait for all WebSocket catch broadcasts to arrive
		await host.waitForTimeout(2000);

		// Verify catches are visible on both sides BEFORE game-end
		// (each player sees their own + the other's catches via server broadcasts)
		const hostCatchCount = await host.evaluate(
			() => (window as any).__multiplayer?.catchEvents?.length ?? 0
		);
		const joinerCatchCount = await joiner.evaluate(
			() => (window as any).__multiplayer?.catchEvents?.length ?? 0
		);
		expect(hostCatchCount).toBe(4);
		expect(joinerCatchCount).toBe(4);

		// --- END GAME ---
		// finishGame sets gameState.phase → 'results', which triggers the
		// $effect to call multiplayer.sendDoneFishing()
		await joiner.evaluate(() => (window as any).__gameState.finishGame());
		await host.evaluate(() => (window as any).__gameState.finishGame());

		// Wait for server to broadcast game-over
		await host.waitForFunction(() => (window as any).__multiplayer?.phase === 'results', {
			timeout: 15000
		});
		await joiner.waitForFunction(() => (window as any).__multiplayer?.phase === 'results', {
			timeout: 15000
		});

		// After game-over, catchEvents is replaced with server's authoritative catchAudit
		// Verify it still has all 4 catches
		const hostFinalCount = await host.evaluate(
			() => (window as any).__multiplayer?.catchEvents?.length ?? 0
		);
		const joinerFinalCount = await joiner.evaluate(
			() => (window as any).__multiplayer?.catchEvents?.length ?? 0
		);
		expect(hostFinalCount).toBe(4);
		expect(joinerFinalCount).toBe(4);

		// Verify catch event data integrity
		const hostCatches = await host.evaluate(() =>
			((window as any).__multiplayer?.catchEvents ?? []).map((c: any) => c.anglerName)
		);
		expect(hostCatches.filter((n: string) => n === 'HostAngler').length).toBe(2);
		expect(hostCatches.filter((n: string) => n === 'JoinerAngler').length).toBe(2);

		await hostCtx.close();
		await joinCtx.close();
	});
});
