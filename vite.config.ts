import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { codeInspectorPlugin } from 'code-inspector-plugin'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  server: {
    port: 3080,
    strictPort: true,
    proxy: {
      '/api': 'http://localhost:3070',
    },
  },
  preview: {
    port: 3080,
    strictPort: true,
  },
  plugins: [
    tailwindcss(),
    codeInspectorPlugin({
      bundler: 'vite',
      hideDomPathAttr: true,
    }),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
