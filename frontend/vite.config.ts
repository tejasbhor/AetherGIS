import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@brand': path.resolve(__dirname, './src/modules/brand'),
      '@app': path.resolve(__dirname, './src/modules/app'),
      '@shared': path.resolve(__dirname, './src/modules/shared'),
    },
  },
  cacheDir: 'node_modules/.vite_v2',
  optimizeDeps: {
    include: ['framer-motion'],
  },

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/ol/')) return 'ol'
          if (id.includes('node_modules/recharts/')) return 'recharts'
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/zustand/') ||
            id.includes('node_modules/@tanstack/react-query/') ||
            id.includes('node_modules/axios/')
          ) {
            return 'vendor'
          }
          return undefined
        },
      },
    },
  },
})
