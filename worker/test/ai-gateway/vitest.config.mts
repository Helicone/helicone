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
            // Force WORKER_TYPE for testing AI Gateway
            WORKER_TYPE: "AI_GATEWAY_API",
            HELICONE_ORG_ID: "0afe3a6e-d095-4ec0-bc1e-2af6f57bd2a5",
          },
          kvNamespaces: [
            "CACHE_KV",
            "SECURE_CACHE",
            "EU_SECURE_CACHE",
            "RATE_LIMIT_KV",
            "INSERT_KV",
            "UTILITY_KV",
            "REQUEST_AND_RESPONSE_QUEUE_KV",
            "WALLET_KV",
          ],
          durableObjects: {
            WALLET: {
              className: "Wallet",
              useSQLite: true,
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
