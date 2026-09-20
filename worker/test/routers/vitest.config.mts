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
        },
      },
    },
    setupFiles: [new URL("../setup.ts", import.meta.url).pathname],
  },
  resolve: {
    alias: {
      "@worker": new URL("../../src", import.meta.url).pathname,
    },
  },
});
