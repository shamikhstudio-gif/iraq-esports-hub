import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    define: {
      'process.env': JSON.stringify(env),
    },
    plugins: [
      react(),
      {
        name: 'api-server',
        async configureServer(server) {
          const { getRequestListener } = await import('@hono/node-server');
          const { api } = await import('./src/server/api');
          server.middlewares.use('/api', getRequestListener(api.fetch));
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
        'stream-chat': path.resolve(import.meta.dirname, './node_modules/stream-chat/dist/esm/index.mjs'),
        'lucide-react': path.resolve(import.meta.dirname, './src/lib/material3-bridge.tsx'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      watch: {
        ignored: ['**/dist-electron/**', '**/android/**', '**/.gradle/**'],
      },
    },
    preview: {
      port: 3000,
      host: '0.0.0.0',
    },
  };
});
