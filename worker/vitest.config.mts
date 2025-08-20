import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
	test: {
		poolOptions: {
			workers: {
				wrangler: { configPath: './wrangler.toml' },
				miniflare: {
					compatibilityDate: '2024-01-01',
					compatibilityFlags: ['nodejs_compat'],
					bindings: {
						// Force WORKER_TYPE for testing AI Gateway
						WORKER_TYPE: 'AI_GATEWAY_API',
					},
				},
			},
		},
		setupFiles: ['./test/setup.ts'],
	},
	resolve: {
		alias: {
			'@helicone-package/cost': new URL('../packages/cost', import.meta.url).pathname,
		},
	},
});
