import { defineWorkersProject } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersProject({
  test: {
    poolOptions: {
      workers: {
        singleWorker: true,
        isolatedStorage: true,
        wrangler: { configPath: "../../wrangler.toml" },
        miniflare: {
          compatibilityDate: "2024-01-01",
          compatibilityFlags: ["nodejs_compat"],
          // Only test mocks and logic, not actual DOs
          bindings: {
            WORKER_TYPE: "OPENAI_PROXY",
          },
        },
      },
    },
  },
});