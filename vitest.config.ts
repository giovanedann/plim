import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: ['apps/*', 'packages/*'],
    // Resource limits to prevent system overload
    maxWorkers: 2,
    maxConcurrency: 5,
    pool: 'forks',
    maxForks: 2,
    minForks: 1,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['apps/*/src/**/*.{ts,tsx}', 'packages/*/src/**/*.{ts,tsx}'],
      exclude: ['**/*.test.{ts,tsx}', '**/test-utils/**'],
    },
  },
})
