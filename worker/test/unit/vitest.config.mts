import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["../../src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@worker": new URL("../../src", import.meta.url).pathname,
    },
  },
});
