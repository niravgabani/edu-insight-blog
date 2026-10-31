import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The API server (../server) runs on port 5000.
// In production the server also serves this app at /admin.
const api = 'http://localhost:5000';

export default defineConfig({
  base: '/admin/',
  plugins: [react()],
  server: {
    port: 5174,
    proxy: { '/api': api, '/uploads': api },
  },
});
