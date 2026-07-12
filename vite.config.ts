import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-32x32.png', 'apple-touch-icon.png', 'icon.svg'],
      manifest: {
        name: 'Spell Manager — D&D 5.5e',
        short_name: 'Spell Manager',
        description: 'Manage, play, and reference your D&D 5.5e character spells offline.',
        theme_color: '#14151f',
        background_color: '#14151f',
        display: 'standalone',
        orientation: 'portrait',
        categories: ['games', 'utilities'],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the app shell plus the bundled spell/class data so the app works fully offline.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2,json}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: 'index.html',
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  base: process.env.GITHUB_ACTIONS ? '/rp-tools/' : '/',
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
