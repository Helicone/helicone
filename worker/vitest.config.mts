import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: "./wrangler.toml" },
      },
    },
    alias: {
      "@supabase/supabase-js": "/test/__mocks__/supabase.ts",
    },
  },
});
