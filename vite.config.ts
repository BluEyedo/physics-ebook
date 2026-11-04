import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset paths, so the built site works at https://<user>.github.io/<repo>/ whatever the repo is called
  base: './',
  plugins: [react(), tailwindcss()],
})
