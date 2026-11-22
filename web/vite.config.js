import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // En dev, replicamos los proxies de Nginx para no depender de Nginx
      '/api/auth': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/auth/, '')
      },
      '/api/eventos': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/eventos/, '/api/events')
      },
      '/api/ordenes': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/ordenes/, '') || '/'
      },
      '/api/pagos':    'http://localhost:3004',
      '/api/tickets':  'http://localhost:3005',
      '/api/notificaciones': {
        target: 'http://localhost:3006',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/notificaciones/, '/api/notifications')
      },
      '/api/checkin': {
        target: 'http://localhost:3007',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/checkin/, '') || '/'
      },
      '/api/reportes': 'http://localhost:3008'
    }
  }
})