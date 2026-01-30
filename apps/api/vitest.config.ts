import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: '@plim/api',
    color: 'yellow',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
