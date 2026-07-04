import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Heavy PDF / canvas — only needed when generating a PDF
          if (id.includes('html2canvas') || id.includes('jspdf') || id.includes('pdf-generator')) {
            return 'pdf';
          }
          // Recharts + d3 — only needed on dashboard/analytics pages
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory')) {
            return 'charts';
          }
          // Refine framework
          if (id.includes('@refinedev')) {
            return 'refine';
          }
          // Auth0
          if (id.includes('@auth0')) {
            return 'auth0';
          }
          // Radix UI / shadcn
          if (id.includes('@radix-ui')) {
            return 'radix';
          }
          // React + react-dom (always cached separately)
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react';
          }
          // Everything else in node_modules → vendor
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
})

