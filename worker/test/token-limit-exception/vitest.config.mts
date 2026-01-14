import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: "../../wrangler.toml" },
        miniflare: {
          compatibilityDate: "2024-01-01",
          compatibilityFlags: ["nodejs_compat"],
        },
      },
    },
    setupFiles: [new URL("../setup.ts", import.meta.url).pathname],
  },
  resolve: {
    alias: {
      "@helicone-package/cost": new URL(
        "../../../packages/cost",
        import.meta.url
      ).pathname,
      "@helicone-package/llm-mapper": new URL(
        "../../../packages/llm-mapper",
        import.meta.url
      ).pathname,
      "@worker": new URL("../../src", import.meta.url).pathname,
    },
  },
});
