// sitemap.xml, news-sitemap.xml, rss.xml and robots.txt — served by the API (index.js) and
// written as static files by the pre-render script for Firebase Hosting.
// origin = the website's public address, e.g. https://dailyinfoscope.com
import * as mongo from './mongo.js';
import { NEWEST, PUBLISHED, getCategories, getSettings } from './data.js';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const link = (origin, path) => esc(origin + encodeURI(path));
const absolute = (origin, url) => (!url ? '' : /^https?:\/\//.test(url) ? url : origin + url);

export async function sitemap(origin) {
  const [categories, posts] = await Promise.all([
    getCategories(),
    mongo.posts().find(PUBLISHED, { projection: { _id: 0, slug: 1, title: 1, image: 1, date: 1, updatedAt: 1 } }).sort(NEWEST).toArray(),
  ]);
  const newest = (posts[0]?.updatedAt || posts[0]?.date || '').slice(0, 10);
  const url = (path, lastmod, image, title) =>
    `  <url><loc>${link(origin, path)}</loc>${lastmod ? `<lastmod>${lastmod.slice(0, 10)}</lastmod>` : ''}` +
    (image ? `<image:image><image:loc>${esc(absolute(origin, image))}</image:loc><image:title>${esc(title)}</image:title></image:image>` : '') +
    '</url>';
  const urls = [
    url('/', newest),
    url('/blog', newest),
    ...categories.map((c) => url(`/category/${c.slug}`)),
    ...posts.map((p) => url(`/${p.slug}`, p.updatedAt || p.date, p.image, p.title)),
    url('/about'),
    url('/contactus'),
    url('/privacypolicy'),
  ];
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' +
    `${urls.join('\n')}\n</urlset>\n`
  );
}

// Google News sitemap: articles written in the last 2 days (Google only reads those)
export async function newsSitemap(origin) {
  const [settings, posts] = await Promise.all([
    getSettings(),
    mongo
      .posts()
      .find(
        { ...PUBLISHED, importedFrom: { $exists: false }, createdAt: { $gte: new Date(Date.now() - 2 * 86400000).toISOString() } },
        { projection: { _id: 0, slug: 1, title: 1, lang: 1, createdAt: 1 } }
      )
      .sort({ createdAt: -1 })
      .limit(1000)
      .toArray(),
  ]);
  const items = posts.map(
    (p) =>
      `  <url><loc>${link(origin, `/${p.slug}`)}</loc><news:news><news:publication><news:name>${esc(settings.siteName)}</news:name>` +
      `<news:language>${esc((p.lang || 'en').split('-')[0])}</news:language></news:publication>` +
      `<news:publication_date>${esc(p.createdAt)}</news:publication_date><news:title>${esc(p.title)}</news:title></news:news></url>`
  );
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n' +
    `${items.join('\n')}\n</urlset>\n`
  );
}

export async function rss(origin) {
  const [settings, posts] = await Promise.all([
    getSettings(),
    mongo
      .posts()
      .find(PUBLISHED, { projection: { _id: 0, slug: 1, title: 1, excerpt: 1, image: 1, date: 1, createdAt: 1 } })
      .sort(NEWEST)
      .limit(50)
      .toArray(),
  ]);
  const items = posts.map((p) => {
    const url = link(origin, `/${p.slug}`);
    const image = absolute(origin, p.image);
    return (
      `    <item><title>${esc(p.title)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid>` +
      `<pubDate>${new Date(p.createdAt || p.date).toUTCString()}</pubDate><description>${esc(p.excerpt)}</description>` +
      (image ? `<enclosure url="${esc(image)}" type="image/jpeg" length="0"/>` : '') +
      '</item>'
    );
  });
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n  <channel>\n' +
    `    <title>${esc(settings.siteName)}</title><link>${esc(origin)}/</link>` +
    `<description>${esc(settings.metaDescription || settings.siteName)}</description>` +
    `<atom:link href="${esc(origin)}/rss.xml" rel="self" type="application/rss+xml"/>\n` +
    `${items.join('\n')}\n  </channel>\n</rss>\n`
  );
}

export const robots = (origin) =>
  'User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nDisallow: /search\n\n' +
  `Sitemap: ${origin}/sitemap.xml\nSitemap: ${origin}/news-sitemap.xml\n`;
