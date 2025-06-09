import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? './' : '/',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://diasync-ez2f.onrender.com',
        changeOrigin: true,
        secure: false,
      }
    }
  }
}));
