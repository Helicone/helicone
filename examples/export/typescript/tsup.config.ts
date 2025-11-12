import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "index.ts", // Main library export
    cli: "cli.ts", // CLI entry point
  },
  format: ["cjs", "esm"], // Both CommonJS and ESM
  dts: true, // Generate TypeScript definitions
  clean: true, // Clean output directory before build
  bundle: true, // Bundle all dependencies
  minify: false, // Keep readable for debugging
  splitting: false, // Don't split chunks
  sourcemap: true, // Generate sourcemaps for debugging
  shims: true, // Add shims for __dirname, __filename in ESM
});
