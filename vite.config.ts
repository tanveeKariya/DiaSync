import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: '/', // usually '/' is recommended for Netlify
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://diasync-ez2f.onrender.com', // replace with your backend URL
        changeOrigin: true,
        secure: true, // backend is HTTPS, so secure should be true
      },
    },
  },
}));
