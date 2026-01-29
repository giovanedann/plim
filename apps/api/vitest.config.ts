import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: '@plim/api',
    color: 'blue',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
