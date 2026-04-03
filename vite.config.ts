import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

const isTauri = !!process.env.TAURI_ENV_PLATFORM;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: isTauri ? '/' : '/ContraTiempo/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Tauri needs a fixed port for devUrl
  server: {
    port: 5173,
    strictPort: true,
  },
  // Prevent Vite from obscuring Rust errors
  clearScreen: false,
})
