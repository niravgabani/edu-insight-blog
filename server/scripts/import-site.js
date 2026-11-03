// Imports every article of an existing site (default: lesothoeducation.info) into MongoDB.
//
//   node --env-file=.env scripts/import-site.js [--limit 20] [--site https://lesothoeducation.info]
//
// - Reads the site's sitemap.xml and each article page.
// - Keeps the SAME URL slug, so old links can be 301-redirected to the new domain (/same-slug).
// - Creates missing categories (merging into existing ones with the same slug).
// - Safe to run again: articles whose slug already exists are skipped, so an interrupted run resumes.
// - Images keep their original URLs; run scripts/migrate-images.js afterwards to copy them to Cloudinary.
import crypto from 'node:crypto';
import * as cheerio from 'cheerio';
import * as mongo from '../mongo.js';

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const SITE = arg('site', 'https://lesothoeducation.info').replace(/\/+$/, '');
const LIMIT = Number(arg('limit', 0)) || Infinity;
const CONCURRENCY = 6;
const PER_DAY = 25; // spread publish dates: the first 25 sitemap articles get today's date, the next 25 yesterday's, ...
const RESERVED = new Set(['blog', 'search', 'about', 'privacypolicy', 'contactus', 'category', 'admin', 'api', 'uploads']);

// The old site's own URL segment, unchanged (only put in the standard composed Unicode form), so
// old links can be redirected to the same path on the new domain
const oldSlug = (url) => lastSegment(url).normalize('NFC');

const lastSegment = (url) => {
  const parts = new URL(url).pathname.split('/').filter(Boolean);
  return decodeURIComponent(parts[parts.length - 1] || '');
};

async function fetchText(url, tries = 3) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (site import)' }, signal: AbortSignal.timeout(30000) });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (attempt >= tries) throw err;
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}

// ---------- Language detection (the old site has no lang attribute) ----------

const SCRIPTS = [
  [/[؀-ۿ]/, 'ar'],
  [/[぀-ヿ]/, 'ja'], // hiragana / katakana before Chinese characters
  [/[가-힯]/, 'ko'],
  [/[一-鿿]/, 'zh'],
  [/[฀-๿]/, 'th'],
  [/[຀-໿]/, 'lo'],
  [/[ऀ-ॿ]/, 'hi'],
  [/[઀-૿]/, 'gu'],
  [/[Ѐ-ӿ]/, 'ru'],
  [/[֐-׿]/, 'he'],
  [/[Ͱ-Ͽ]/, 'el'],
];
const STOPWORDS = {
  en: ['the', 'and', 'of', 'to', 'is', 'in', 'for', 'with', 'that', 'are'],
  es: ['el', 'la', 'los', 'las', 'de', 'y', 'que', 'en', 'para', 'con', 'del', 'una'],
  pt: ['o', 'a', 'os', 'as', 'de', 'e', 'que', 'em', 'para', 'com', 'do', 'da', 'uma', 'não'],
  fr: ['le', 'la', 'les', 'de', 'et', 'des', 'en', 'pour', 'dans', 'une', 'est', 'du'],
  de: ['der', 'die', 'das', 'und', 'ist', 'zu', 'mit', 'für', 'ein', 'eine', 'den', 'von'],
  it: ['il', 'la', 'di', 'e', 'che', 'per', 'con', 'una', 'del', 'della', 'sono', 'gli'],
  nl: ['de', 'het', 'een', 'en', 'van', 'is', 'voor', 'met', 'zijn', 'op'],
  tr: ['ve', 'bir', 'bu', 'için', 'ile', 'olarak', 'da', 'de', 'daha', 'çok'],
  pl: ['i', 'w', 'na', 'jest', 'się', 'z', 'do', 'że', 'nie', 'oraz'],
  cs: ['a', 'v', 'je', 'na', 'se', 'pro', 'jsou', 'nebo', 'také', 'které'],
  id: ['dan', 'yang', 'di', 'untuk', 'dengan', 'ini', 'dalam', 'adalah', 'dari', 'atau'],
  vi: ['và', 'của', 'là', 'các', 'cho', 'với', 'được', 'trong', 'những', 'một'],
};

function detectLang(text) {
  const sample = text.slice(0, 3000);
  for (const [re, lang] of SCRIPTS) {
    const matches = sample.match(new RegExp(re.source, 'g'));
    if (matches && matches.length > 30) return lang;
  }
  const words = sample.toLowerCase().split(/[^\p{L}]+/u);
  let best = 'en';
  let bestScore = 0;
  for (const [lang, list] of Object.entries(STOPWORDS)) {
    const set = new Set(list);
    const score = words.filter((w) => set.has(w)).length;
    if (score > bestScore) [best, bestScore] = [lang, score];
  }
  return best;
}

// ---------- Page parsing ----------

// "word, word, word, word" with no sentence — the old site sometimes used its keywords as text
export const looksLikeKeywords = (text) => !text || (text.split(',').length >= 4 && !/[.!?。！？]/.test(text));

const clip = (text, max) => (text.length > max ? `${text.slice(0, max - 1).replace(/\s+\S*$/, '')}…` : text);

// The first one or two sentences of a paragraph, at most ~300 characters
export function firstSentences(text) {
  // Some first paragraphs start with a bold "Introduction" heading
  const clean = String(text || '').replace(/\s+/g, ' ').trim().replace(/^(Introduction|Overview)\s*:?\s+/i, '');
  const sentences = clean.match(/[^.!?。！？]+[.!?。！？]+/g) || [clean];
  let out = '';
  for (const s of sentences) {
    if (out && (out + s).length > 300) break;
    out += s;
  }
  return clip(out.trim(), 300);
}

const isOldSite = (href) => {
  try {
    const host = new URL(href, SITE).hostname;
    return host === new URL(SITE).hostname || host.endsWith(`.${new URL(SITE).hostname}`);
  } catch {
    return false;
  }
};

function parseArticle(html, url) {
  const $ = cheerio.load(html);
  const meta = (sel) => $(sel).attr('content')?.trim() || '';
  const title = $('main h1').first().text().trim() || $('h1').first().text().trim();
  const content = $('.post-content').first();
  if (!title || !content.length) return null;

  // Category from the breadcrumb: Home - <a href="/Category/business/">Business</a> - title
  const crumb = $('.breadcrumb a[href*="ategory/"]').first();
  const categorySlug = oldSlug(new URL(crumb.attr('href') || '/category/general/', SITE).href).toLowerCase();
  const categoryName = crumb.text().trim() || categorySlug;

  // Clean the article body: no ads/scripts/tracking attributes, links to the old site become local
  content.find('script, style, iframe, noscript, [id^="relatedsearches"], ins.adsbygoogle').remove();
  content.find('*').each((_, el) => {
    for (const name of Object.keys(el.attribs || {})) {
      if (name.startsWith('data-') || name === 'class' || name === 'id' || name === 'style') $(el).removeAttr(name);
    }
  });
  content.find('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (isOldSite(href)) {
      const u = new URL(href, SITE);
      $(el).attr('href', u.pathname.replace(/\/+$/, '') || '/');
    }
  });
  content.find('img[src]').each((_, el) => $(el).attr('src', new URL($(el).attr('src'), SITE).href));
  // Plain <span> wrappers add nothing but size
  content.find('span').each((_, el) => {
    if (!Object.keys(el.attribs || {}).length) $(el).replaceWith($(el).contents());
  });
  content.find('p').each((_, el) => {
    if (!$(el).text().trim() && !$(el).find('img').length) $(el).remove();
  });

  // The first paragraph on the old site is usually a short summary — use it as the excerpt.
  // On some pages it is only a keyword list: drop it and summarise from the first real paragraph.
  const lead = content.children('p').first();
  let excerpt = lead.text().replace(/\s+/g, ' ').trim();
  if (looksLikeKeywords(excerpt)) {
    lead.remove();
    excerpt = '';
  } else if (excerpt.length > 400) excerpt = '';
  else if (excerpt) lead.remove();
  if (!excerpt) excerpt = firstSentences(content.children('p').first().text());

  const body = content.html().replace(/\n\s*\n+/g, '\n').trim();
  let description = meta('meta[name="description"]');
  if (looksLikeKeywords(description)) description = clip(excerpt, 160);
  const image = meta('meta[property="og:image"]') || content.find('img').first().attr('src') || '';

  return {
    title,
    slug: oldSlug(url),
    categorySlug,
    categoryName,
    image: image && new URL(image, SITE).href,
    excerpt: excerpt || description,
    content: body,
    metaTitle: meta('meta[property="og:title"]'),
    metaDescription: description,
    keywords: meta('meta[name="keywords"]'),
    lang: detectLang(`${title} ${content.text()}`),
  };
}

// ---------- Run ----------

async function main() {
  await mongo.connect();
  const sitemap = await fetchText(`${SITE}/sitemap.xml`);
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  const articles = urls.filter((u) => {
    const path = new URL(u).pathname;
    return path !== '/' && !/\/category\//i.test(path);
  });
  console.log(`Sitemap: ${articles.length} article URLs.`);

  const existing = new Set(await mongo.posts().distinct('slug'));
  const categories = new Map((await mongo.categories().find().toArray()).map((c) => [c.slug, c]));
  let position = Math.max(-1, ...[...categories.values()].map((c) => c.position ?? -1));
  const today = new Date();
  const stats = { added: 0, skipped: 0, failed: 0, newCategories: 0 };
  const failures = [];

  const queue = articles.map((url, index) => ({ url, index })).filter(({ url }) => {
    const slug = oldSlug(url);
    if (existing.has(slug) || RESERVED.has(slug)) {
      stats.skipped++;
      return false;
    }
    return true;
  });
  const todo = queue.slice(0, LIMIT);
  console.log(`${stats.skipped} already imported or reserved; importing ${todo.length} now.`);

  async function ensureCategory(slug, name, lang) {
    if (categories.has(slug)) return;
    const category = { slug, name, lang, description: '', position: ++position };
    categories.set(slug, category);
    await mongo.categories().updateOne({ slug }, { $setOnInsert: category }, { upsert: true });
    stats.newCategories++;
  }

  async function importOne({ url, index }) {
    try {
      const html = await fetchText(url);
      const a = html && parseArticle(html, url);
      if (!a || !a.slug) throw new Error('no article content found');
      if (existing.has(a.slug)) return;
      existing.add(a.slug);
      await ensureCategory(a.categorySlug, a.categoryName, a.lang);
      const date = new Date(today - Math.floor(index / PER_DAY) * 86400000).toISOString().slice(0, 10);
      const now = new Date().toISOString();
      const { categorySlug, categoryName, ...fields } = a;
      await mongo.posts().insertOne({
        id: crypto.randomUUID(),
        ...fields,
        category: categorySlug,
        date,
        status: 'published',
        importedFrom: url,
        createdAt: now,
        updatedAt: now,
      });
      stats.added++;
    } catch (err) {
      stats.failed++;
      failures.push(`${url}  (${err.message})`);
    }
  }

  let next = 0;
  let done = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < todo.length) {
        await importOne(todo[next++]);
        if (++done % 100 === 0 || done === todo.length) {
          console.log(`  ${done}/${todo.length}  added ${stats.added}, failed ${stats.failed}, new categories ${stats.newCategories}`);
        }
      }
    })
  );

  console.log(`Done. Added ${stats.added}, skipped ${stats.skipped}, failed ${stats.failed}, new categories ${stats.newCategories}.`);
  if (failures.length) console.log(`Failed URLs (run the script again to retry):\n${failures.slice(0, 50).join('\n')}`);
}

try {
  await main();
} catch (err) {
  console.error(err);
  process.exitCode = 1;
} finally {
  await mongo.close();
}
