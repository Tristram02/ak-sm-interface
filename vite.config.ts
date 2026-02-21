import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Auto-copy pdfjs-dist worker to public/ as .js so nginx serves the correct MIME type
function pdfWorkerPlugin() {
  return {
    name: 'pdf-worker-copy',
    buildStart() {
      const src  = path.resolve(__dirname, 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs');
      const dest = path.resolve(__dirname, 'public/pdf.worker.min.js'); // .js = correct MIME
      if (fs.existsSync(src)) {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(src, dest);
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), pdfWorkerPlugin()],
  base: process.env.VITE_BASE_PATH ?? '/',
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/auth': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/auth/, ''),
      },
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
