// Writes a real HTML file for every page into dist/ (for Firebase Hosting), so search engines and
// link previews get each page's full content and SEO tags without running JavaScript:
//   dist/index.html, dist/blog.html, dist/<article-slug>.html, dist/category/<slug>.html, ...
//   plus sitemap.xml, news-sitemap.xml, rss.xml, robots.txt and 404.html.
//
// Run by `npm run build:firebase` after the client build (dist/) and the server build (dist-ssr/).
// Needs MONGODB_URI (server/.env locally, a secret on GitHub Actions).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as mongo from '../server/mongo.js';
import { siteData, listPosts, postDetail, getSettings, getCategories, PUBLISHED, NEWEST } from '../server/data.js';
import * as feeds from '../server/feeds.js';
import { pageMeta, injectHead } from '../src/seo.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const { render, paths } = await import(pathToFileURL(path.join(ROOT, 'dist-ssr', 'entry-server.js')).href);

// Uploaded images ("/uploads/...") live on the API server
const env = fs.readFileSync(path.join(ROOT, '.env.production'), 'utf8');
const API_URL = env.match(/^VITE_API_URL=(.+)$/m)?.[1].trim().replace(/\/+$/, '') || '';
const HERO_COUNT = 3; // same as pages/Category.jsx
// Article slugs that would overwrite a site file
const CLASHES = new Set(['index', '404', 'assets', 'admin', 'category', 'favicon', 'logo']);

const shell = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
// Data embedded in a <script>: "<" and line separators are written as \u escapes so they can't end it
const BACKSLASH = String.fromCharCode(92);
const json = (data) =>
  JSON.stringify(data)
    .replace(/</g, BACKSLASH + 'u003c')
    // U+2028/U+2029 end a line inside a <script>; escape them like "<"
    .split(String.fromCharCode(0x2028)).join(BACKSLASH + 'u2028')
    .split(String.fromCharCode(0x2029)).join(BACKSLASH + 'u2029');

function page(file, url, meta, data) {
  const body = render(url, data);
  const html = injectHead(shell, meta).replace(
    '<div id="root"></div>',
    () => `<div id="root">${body}</div>\n    <script>window.__PRERENDER__=${json({ url, data })}</script>`
  );
  const out = path.join(DIST, file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
}

async function main() {
  await mongo.connect();
  const settings = await getSettings();
  const origin = String(settings.siteUrl || '').replace(/\/+$/, '');
  if (!origin) throw new Error('Set the Website URL in Admin → Settings → SEO first');
  const [full, partial, categories] = await Promise.all([
    siteData({ imageBase: API_URL }),
    siteData({ imageBase: API_URL, full: false }),
    getCategories(),
  ]);
  const meta = (pathname, options = {}) => pageMeta({ settings, origin, path: pathname, ...options });
  const site = { [paths.site]: partial };

  // 404.html: served for unknown addresses; the app still loads and shows "not found"
  // (or an article published after this build, until the next one)
  fs.writeFileSync(path.join(DIST, '404.html'), injectHead(shell, meta('/404', { notFound: true })));

  page('index.html', '/', meta('/'), { [paths.site]: full });
  page('blog.html', '/blog', meta('/blog', { title: 'All Articles' }), { ...site, [paths.blog(1)]: await listPosts({ page: 1 }, API_URL) });
  for (const p of ['about', 'privacypolicy', 'contactus', 'terms', 'disclaimer']) page(`${p}.html`, `/${p}`, meta(`/${p}`), site);
  page('search.html', '/search', meta('/search', { title: 'Search' }), site);

  for (const c of categories) {
    const url = `/category/${encodeURIComponent(c.slug)}`;
    page(`category/${c.slug}.html`, url, meta(url, { category: c }), {
      ...site,
      [paths.categoryHero(c.slug, HERO_COUNT)]: await listPosts({ category: c.slug, limit: HERO_COUNT }, API_URL),
      [paths.categoryList(c.slug, HERO_COUNT, 1)]: await listPosts({ category: c.slug, offset: HERO_COUNT, page: 1 }, API_URL),
    });
  }
  console.log(`Pages: home, blog, 6 static, ${categories.length} categories.`);

  const slugs = (await mongo.posts().find(PUBLISHED, { projection: { _id: 0, slug: 1 } }).sort(NEWEST).toArray()).map((p) => p.slug);
  const byCategory = new Map(categories.map((c) => [c.slug, c]));
  let done = 0;
  let next = 0;
  const skipped = [];
  await Promise.all(
    Array.from({ length: 12 }, async () => {
      while (next < slugs.length) {
        const slug = slugs[next++];
        if (CLASHES.has(slug.toLowerCase())) {
          skipped.push(slug);
          continue;
        }
        const detail = await postDetail(slug, API_URL);
        if (detail) {
          const url = `/${encodeURIComponent(slug)}`;
          const category = byCategory.get(detail.post.category);
          page(`${slug}.html`, url, meta(url, { post: detail.post, category }), { ...site, [paths.article(slug)]: detail });
        }
        if (++done % 1000 === 0) console.log(`  ${done}/${slugs.length} articles`);
      }
    })
  );
  console.log(`Articles: ${done} pages.${skipped.length ? ` Skipped (name clashes with a site file): ${skipped.join(', ')}` : ''}`);

  for (const [file, build] of [
    ['sitemap.xml', feeds.sitemap],
    ['news-sitemap.xml', feeds.newsSitemap],
    ['rss.xml', feeds.rss],
    ['robots.txt', async (o) => feeds.robots(o)],
  ]) {
    fs.writeFileSync(path.join(DIST, file), await build(origin));
  }
  console.log('Feeds: sitemap.xml, news-sitemap.xml, rss.xml, robots.txt');
}

try {
  await main();
} catch (err) {
  console.error(err);
  process.exitCode = 1;
} finally {
  await mongo.close();
}
