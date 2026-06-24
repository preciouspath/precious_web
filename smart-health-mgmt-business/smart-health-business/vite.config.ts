import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  server: {
    allowedHosts: [
      'smart-health-management.devtechnosys.tech',
      'smart-health-business.devtechnosys.tech'
    ],
  },
})
