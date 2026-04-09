import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@uber_fe/shared': resolve(__dirname, '../../packages/shared/src/index.ts'),
      '@uber_fe/ui': resolve(__dirname, '../../packages/ui/src/index.ts'),
    },
  },
  server: { port: 5174 },
});
