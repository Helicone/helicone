import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: [],
  },
  resolve: {
    alias: {
      "@worker": new URL("../../src", import.meta.url).pathname,
      "@helicone-package/cost": new URL(
        "../../../packages/cost",
        import.meta.url
      ).pathname,
    },
  },
});


