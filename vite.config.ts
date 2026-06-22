import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
  server: {
    // In dev, proxy /api to the local Python backend
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
