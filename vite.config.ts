import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/spelldrop/',
  server: {
    port: 5173,
    strictPort: true,
    open: '/spelldrop/',
  },
  preview: {
    port: 4173,
    strictPort: true,
    open: '/spelldrop/',
  },
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
})
