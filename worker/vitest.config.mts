// vitest.config.ts (root)
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      "./test/openai/vitest.config.mts",
      "./test/ai-gateway/vitest.config.mts",
    ],
  },
});
