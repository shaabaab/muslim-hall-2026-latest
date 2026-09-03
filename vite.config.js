// vite.config.js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

// Inside DDEV the dev server runs in the web container, so it must bind 0.0.0.0
// and advertise the routed https URL rather than 127.0.0.1. Outside DDEV this is
// undefined and Vite keeps its normal defaults.
const ddevUrl = process.env.DDEV_PRIMARY_URL;

export default defineConfig({
    server: ddevUrl
        ? {
              host: '0.0.0.0',
              port: 5173,
              strictPort: true,
              origin: `${ddevUrl}:5173`,
              hmr: {
                  protocol: 'wss',
                  host: new URL(ddevUrl).hostname,
                  clientPort: 5173,
              },
          }
        : undefined,
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
        }),
        react(),
    ],
    optimizeDeps: {
        include: ['pdfjs-dist']
    },
    build: {
        rollupOptions: {
            external: []
        }
    }
});