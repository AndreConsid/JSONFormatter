import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// GitHub Pages serves the app from /JSONFormatter/, so production builds
// need that base path. The dev server keeps using /.
const githubPagesBase = '/JSONFormatter/'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? githubPagesBase : '/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
  },
}))
