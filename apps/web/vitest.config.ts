import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    name: '@plim/web',
    color: 'cyan',
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
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
