import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      // Backend API during local development (backend/src/Lms.Api launchSettings).
      '/api': 'http://localhost:5141',
      '/health': 'http://localhost:5141',
    },
  },
  build: {
    // Low-bandwidth budget guard (§13): fail loudly in CI when chunks grow.
    chunkSizeWarningLimit: 250,
  },
})
