import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

class FilteredPushArray<T> extends Array<T> {
	constructor(private readonly predicate: (item: T) => boolean) {
		super();
	}

	push(...items: T[]) {
		return super.push(...items.filter(this.predicate));
	}
}

export default defineWorkersConfig({
	test: {
		poolOptions: {
			workers: {
				wrangler: { configPath: './wrangler.toml' },
			},
		},
		server: {
			deps: {
				// Vitest automatically adds `/^(?!.*node_modules).*\.mjs$/` as an
				// `inline` RegExp: https://github.com/vitest-dev/vitest/blob/v2.1.1/packages/vitest/src/constants.ts#L9
				// We'd like `packages/vitest-pool-workers/dist/pool/index.mjs` to be
				// externalised though. Unfortunately, `inline`s are checked before
				// `external`s, so there's no nice way we can override this. Instead,
				// we prevent the extra `inline` being added in the first place.
				inline: new FilteredPushArray((item) => {
					const str = item.toString();
					return str !== "/^(?!.*node_modules).*\\.mjs$/";
				}),
				external: [
					/packages\/vitest-pool-workers\/dist/,
					/packages\/wrangler\//,
				],
			},
		},
	},
});
