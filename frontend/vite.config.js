import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },

  server: {
    port: 5173,
    proxy: {
      '/api':     { target: 'https://construction-platform-server.onrender.com', changeOrigin: true },
      '/uploads': { target: 'https://construction-platform-server.onrender.com', changeOrigin: true },
    },
  },

  build: {
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      output: {
        /*
         * manualChunks — vendor grouping for long-lived browser caching.
         *
         * DESIGN DECISIONS:
         *
         * 1. react-vendor: React + DOM + Router always load together.
         *    Explicit node_modules/<pkg>/ matching (not a loose substring)
         *    avoids accidentally capturing packages whose names contain "react".
         *
         * 2. recharts-vendor: Recharts pulls in victory-vendor (d3 subset),
         *    recharts-scale, react-smooth, and eventemitter3. Grouping them
         *    means one request when a chart page is first visited rather than
         *    5 separate ones. victory-vendor has no root entry so it can only
         *    be matched by path, not by package name (hence function form).
         *
         * 3. form-vendor: react-hook-form is used on 8+ pages and at 26 kB /
         *    10 kB gzipped is worth isolating so it caches independently.
         *
         * 4. Everything else (axios, lodash partials, lucide icons, react-is,
         *    etc.) is left without a return value so Rollup's default
         *    chunk-splitting algorithm handles it. This prevents the
         *    "circular chunk" warning that arises when you force all
         *    remaining node_modules into a single named bucket — Rollup
         *    then has to emit cross-chunk imports between the named chunks.
         */
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          // React core stack — match exact package directory boundaries
          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/react-router-dom/') ||
            id.includes('/node_modules/react-router/') ||
            id.includes('/node_modules/scheduler/')
          ) {
            return 'react-vendor';
          }

          // Recharts + heavy transitive deps — only fetched on chart pages
          if (
            id.includes('/node_modules/recharts/') ||
            id.includes('/node_modules/victory-vendor/') ||
            id.includes('/node_modules/recharts-scale/') ||
            id.includes('/node_modules/react-smooth/') ||
            id.includes('/node_modules/eventemitter3/')
          ) {
            return 'recharts-vendor';
          }

          // react-hook-form — shared across form-heavy pages
          if (id.includes('/node_modules/react-hook-form/')) {
            return 'form-vendor';
          }

          // lucide-react — tree-shaken icons. Without this, Rollup creates one
          // tiny file per icon (15+ files × 0.3-1.6 kB). Consolidating them into
          // a single named chunk means one request, proper caching, and no icon
          // waterfall on pages with many icons.
          if (id.includes('/node_modules/lucide-react/')) {
            return 'icons-vendor';
          }

          // Return nothing for everything else.
          // Rollup's default algorithm handles axios, lucide, lodash, etc.
          // and creates shared chunks automatically without circular deps.
        },
      },
    },
  },
});
