import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcjs from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcjs()],
  server: {
    host: true,           // allows external access (Cloudflare tunnel)
    allowedHosts: "all"   // avoids breaking every time URL changes
  }
})