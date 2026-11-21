import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@worker": new URL("../../src", import.meta.url).pathname,
      "@helicone-package/cost": new URL(
        "../../../packages/cost",
        import.meta.url
      ).pathname,
      "@helicone-package/llm-mapper": new URL(
        "../../../packages/llm-mapper",
        import.meta.url
      ).pathname,
    },
  },
});
