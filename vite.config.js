import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import svgr from "vite-plugin-svgr"; // Ensure this import is present


export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    svgr()
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000", // Backend
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '') // Usuwa "/api" z żądania
      }
    }
  }
});