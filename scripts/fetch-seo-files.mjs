// Firebase Hosting serves only static files, so copy the API's current sitemap.xml and robots.txt
// into dist/ during `npm run build:firebase`. New articles appear in the sitemap at the next deploy.
import fs from 'node:fs';

const env = fs.readFileSync(new URL('../.env.production', import.meta.url), 'utf8');
const api = env.match(/^VITE_API_URL=(.+)$/m)?.[1].trim().replace(/\/+$/, '');
if (!api) throw new Error('VITE_API_URL is missing in .env.production');

for (const file of ['sitemap.xml', 'robots.txt']) {
  const res = await fetch(`${api}/${file}`, { signal: AbortSignal.timeout(120000) });
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status} from ${api}`);
  const text = await res.text();
  fs.writeFileSync(new URL(`../dist/${file}`, import.meta.url), text);
  console.log(`dist/${file}: ${text.length} bytes`);
}
