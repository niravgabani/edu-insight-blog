import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// API used by the dev server. Set API_PROXY=http://localhost:5000 to use the local server (server/).
const api = process.env.API_PROXY || 'https://edu-insight-blog.onrender.com';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // admin/ and server/ are separate projects; watching their build output crashed Vite on Windows (EBUSY)
    watch: { ignored: ['**/admin/**', '**/server/**'] },
    proxy: { '/api': api, '/uploads': api, '/sitemap.xml': api, '/robots.txt': api },
  },
});
