import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  define: { CESIUM_BASE_URL: JSON.stringify('/cesiumStatic/') },
  plugins: [
    react(),
    tailwindcss(),
    viteStaticCopy({ targets: ['Workers', 'ThirdParty', 'Assets', 'Widgets'].map((folder) => ({ src: `node_modules/cesium/Build/Cesium/${folder}`, dest: 'cesiumStatic', rename: { stripBase: 4 } })) }),
  ],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
