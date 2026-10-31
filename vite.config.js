import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The API server (server/) runs on port 5000
const api = 'https://edu-insight-blog.onrender.com';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // admin/ and server/ are separate projects; watching their build output crashed Vite on Windows (EBUSY)
    watch: { ignored: ['**/admin/**', '**/server/**'] },
    proxy: { '/api': api, '/uploads': api, '/sitemap.xml': api, '/robots.txt': api },
  },
});
