import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function normalizeProxyTarget(target) {
  if (!target) {
    return 'http://127.0.0.1:3000'
  }

  try {
    const url = new URL(target)
    if (url.hostname === 'localhost') {
      url.hostname = '127.0.0.1'
    }
    return url.toString()
  } catch {
    return target
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = normalizeProxyTarget(env.VITE_BACKEND_URL || 'http://127.0.0.1:3000')
  
  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
