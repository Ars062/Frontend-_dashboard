import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/Frontend-_dashboard/',  // ✅ Must match your GitHub repo name exactly (case-sensitive)
  plugins: [react()],
})
