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
      "@helicone-package/filters": new URL(
        "../../../packages/filters",
        import.meta.url
      ).pathname,
      "@helicone-package/llm-mapper": new URL(
        "../../../packages/llm-mapper",
        import.meta.url
      ).pathname,
      "@helicone-package/prompts": new URL(
        "../../../packages/prompts",
        import.meta.url
      ).pathname,
      "@helicone-package/secrets": new URL(
        "../../../packages/secrets",
        import.meta.url
      ).pathname,
      "@helicone-package/common": new URL(
        "../../../packages/common",
        import.meta.url
      ).pathname,
    },
  },
});
