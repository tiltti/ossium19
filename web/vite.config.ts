import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5179,
    strictPort: true,
    headers: {
      // Required for SharedArrayBuffer (needed for AudioWorklet)
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  optimizeDeps: {
    exclude: ['syna-wasm'],
  },
  build: {
    target: 'esnext',
  },
})
