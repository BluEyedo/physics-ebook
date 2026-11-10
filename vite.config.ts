import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset paths, so the built site works at https://<user>.github.io/<repo>/ whatever the repo is called
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      input: ['index.html', '1/index.html', '2/index.html'].map((path) =>
        fileURLToPath(new URL(path, import.meta.url)),
      ),
    },
  },
})
