import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectManifest: {
        minify: false,
      },
      // Provide an explicit manifest so the plugin injects the
      // <link rel="manifest"> into the built index.html. We keep
      // icons in public/icons so the paths below are correct.
      manifest: {
        name: 'Cup Budd',
        short_name: 'CupBudd',
        description: 'World Cup notifications that explain why it matters',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0ea5a3',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
