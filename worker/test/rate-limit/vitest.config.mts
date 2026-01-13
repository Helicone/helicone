import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    retry: 2,
    poolOptions: {
      workers: {
        wrangler: { configPath: "../../wrangler.toml" },
        miniflare: {
          compatibilityDate: "2025-08-03",
          compatibilityFlags: ["nodejs_compat"],
          bindings: {
            WORKER_TYPE: "AI_GATEWAY_API",
          },
          durableObjects: {
            TOKEN_BUCKET_RATE_LIMITER: {
              className: "TokenBucketRateLimiterDO",
            },
          },
        },
      },
    },
    setupFiles: ["./../setup.ts"],
  },
  resolve: {
    alias: {
      "@helicone-package/cost": new URL(
        "../../../packages/cost",
        import.meta.url
      ).pathname,
      "@helicone-package/secrets": new URL(
        "../../../packages/secrets",
        import.meta.url
      ).pathname,
      "@worker": new URL("../../src", import.meta.url).pathname,
    },
  },
});
