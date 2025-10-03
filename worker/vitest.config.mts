// vitest.config.ts (root)
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      "./test/ai-gateway/vitest.config.mts",
      "./test/cache/vitest.config.mts",
      "./test/alerts/vitest.config.mts",
    ],
  },
});
