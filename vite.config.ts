import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages 會部署在 https://<帳號>.github.io/pray_count/
// 因此 base 設為 '/pray_count/'。若你的 repo 名稱不同，改這裡即可。
export default defineConfig({
  base: '/pray_count/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: '功課紀錄',
        short_name: '功課紀錄',
        description: '佛教功課次數紀錄與小組共修統計',
        theme_color: '#8d6e63',
        background_color: '#fbf7f0',
        display: 'standalone',
        start_url: '/pray_count/',
        scope: '/pray_count/',
        lang: 'zh-TW',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        navigateFallbackDenylist: [/^\/rest/, /supabase/],
      }
    })
  ]
})
