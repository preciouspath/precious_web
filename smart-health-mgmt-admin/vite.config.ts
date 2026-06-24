import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    allowedHosts: [
      "smart-health-management.devtechnosys.tech",
      "smart-health-admin.devtechnosys.tech",
    ],
    host: true // optional but useful when running on remote servers
  }
})