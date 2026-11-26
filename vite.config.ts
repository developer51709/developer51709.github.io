import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The site is served from the root of developer51709.github.io, so Vite's
// default base ('/') is correct for both dev and the Pages build.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    hmr: false,
  },
})
