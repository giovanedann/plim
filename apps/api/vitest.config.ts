import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: '@plim/api',
    color: 'blue',
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Resource limits to prevent system overload with integration tests
    maxWorkers: 2,
    maxConcurrency: 5,
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks: 2,
        minForks: 1,
      },
    },
  },
})
