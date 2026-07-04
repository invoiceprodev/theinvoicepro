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
          // Heavy PDF / canvas — only fetched when generating a PDF
          if (id.includes('html2canvas') || id.includes('jspdf') || id.includes('pdf-generator')) {
            return 'pdf';
          }
          // Recharts + d3 — only fetched on dashboard/analytics pages
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory')) {
            return 'charts';
          }
          // OpenAI SDK — only used for AI contract generation
          if (id.includes('openai') || id.includes('@llamaindex')) {
            return 'ai';
          }
          // Supabase
          if (id.includes('@supabase')) {
            return 'supabase';
          }
          // Refine framework
          if (id.includes('@refinedev')) {
            return 'refine';
          }
          // Auth0
          if (id.includes('@auth0')) {
            return 'auth0';
          }
          // Radix UI / shadcn primitives
          if (id.includes('@radix-ui')) {
            return 'radix';
          }
          // Lucide icons (large — 511 icons)
          if (id.includes('lucide-react')) {
            return 'icons';
          }
          // Form validation
          if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform')) {
            return 'forms';
          }
          // Date utilities
          if (id.includes('date-fns') || id.includes('dayjs')) {
            return 'dates';
          }
          // React Router
          if (id.includes('react-router') || id.includes('@remix-run')) {
            return 'router';
          }
          // Tanstack table
          if (id.includes('@tanstack')) {
            return 'tanstack';
          }
          // React + react-dom — always cached separately
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

