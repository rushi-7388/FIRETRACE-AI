import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendPort = env.BACKEND_PORT || process.env.BACKEND_PORT || 8000
  const frontendPort = env.FRONTEND_PORT || process.env.FRONTEND_PORT || 5173

  return {
    plugins: [react()],
    server: {
      port: Number(frontendPort),
      proxy: {
        '/api': {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
        }
      }
    },
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom', 'zustand', 'axios'],
            leaflet: ['leaflet', 'react-leaflet'],
            charts: ['recharts'],
            icons: ['lucide-react']
          }
        }
      }
    }
  }
})
