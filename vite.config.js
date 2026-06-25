import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
const API_TARGET = process.env.DEVSTYLE_API || 'http://127.0.0.1:8787'

export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': API_TARGET } },
  preview: { proxy: { '/api': API_TARGET } },
})
