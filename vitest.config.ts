import { resolve } from 'node:path'
import swc from 'unplugin-swc'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    root: './',
    alias: {
      '~': resolve(__dirname, './src'),
      '~types': resolve(__dirname, './src/types'),
      '~core': resolve(__dirname, './src/core'),
      '~modules': resolve(__dirname, './src/modules'),
      '~entities': resolve(__dirname, './src/entities'),
      '~utils': resolve(__dirname, './src/utils'),
    },
  },
  plugins: [swc.vite()],
  resolve: {
    alias: {
      // Ensure Vitest correctly resolves TypeScript path aliases
      '~': resolve(__dirname, './src'),
      '~types': resolve(__dirname, './src/types'),
      '~core': resolve(__dirname, './src/core'),
      '~modules': resolve(__dirname, './src/modules'),
      '~entities': resolve(__dirname, './src/entities'),
      '~utils': resolve(__dirname, './src/utils'),
    },
  },
})
