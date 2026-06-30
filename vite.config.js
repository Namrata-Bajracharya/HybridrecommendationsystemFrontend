/* ── vite.config.js ──
   Vite build config with React plugin for JSX transform. */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
