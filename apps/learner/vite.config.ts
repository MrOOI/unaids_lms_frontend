import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    // App-shell precaching only (§13 low-bandwidth resilience) — the
    // learner-progress/quiz offline queue is plain app code backed by
    // IndexedDB (src/lib/offlineOutbox.ts), not Background Sync, since
    // Safari doesn't implement that API. This just lets the shell itself
    // (JS/CSS/HTML) load when the network is down or flaky.
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: "OIV va gender — onlayn kurs",
        short_name: 'OIV va gender',
        description: 'UNAIDS HIV and gender e-learning platform',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#43626a',
        icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: {
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
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
