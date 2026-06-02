import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Set VITE_BASE_PATH (e.g. "/ChatsViewer/") when deploying to a GitHub Pages subdirectory.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || './',
})
