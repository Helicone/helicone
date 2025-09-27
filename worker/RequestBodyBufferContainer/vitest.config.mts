import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.spec.ts'],
    environment: 'node',
    globals: false,
    pool: 'threads',
    reporters: ['basic'],
    watch: false,
    testTimeout: 15000,
  },
})

