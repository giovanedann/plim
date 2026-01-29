import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: '@plim/shared',
    color: 'green',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
