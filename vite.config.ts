import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';

function suppressNoisyBuildWarnings(): import('vite').Plugin {
	return {
		name: 'suppress-noisy-build-warnings',
		enforce: 'post',
		config(config) {
			const existing = config.customLogger;
			if (!existing) return;
			const skip = (msg: unknown) =>
				typeof msg === 'string' &&
				(msg.includes('transport was disconnected') ||
					msg.includes('Error when evaluating SSR module') ||
					msg.includes('Some chunks are larger than 500 kB'));
			const wrap = (logger: typeof existing) => ({
				...logger,
				warn(msg: unknown, options?: unknown) {
					if (skip(msg)) return;
					logger.warn(msg as string, options as import('vite').LogOptions);
				},
				error(msg: unknown, options?: unknown) {
					if (skip(msg)) return;
					logger.error(msg as string, options as import('vite').LogErrorOptions);
				}
			});
			config.customLogger = wrap(existing);
		}
	};
}

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), suppressNoisyBuildWarnings()],
	build: {
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (id.includes('node_modules/p5')) return 'p5';
				}
			}
		}
	},
	test: {
		expect: { requireAssertions: true },
		projects: [
				{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
