import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/ninjaboom/',
  server: {
    port: 5173,
    strictPort: true,
    open: '/ninjaboom/',
  },
  preview: {
    port: 4173,
    strictPort: true,
    open: '/ninjaboom/',
  },
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
})
