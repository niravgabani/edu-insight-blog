// Website data, shared by the API (index.js) and the pre-render script (../scripts/prerender.mjs)
// so pre-rendered pages contain exactly what the API would return.
import * as mongo from './mongo.js';

export const NEWEST = { date: -1, createdAt: -1 };
export const PUBLISHED = { status: 'published' };
export const HOME_LISTS = ['hero', 'popular', 'latest', 'trending', 'featured'];
// Cards only need these fields; the full content comes with a single article
export const SUMMARY = { projection: { _id: 0, id: 1, slug: 1, title: 1, category: 1, date: 1, image: 1, excerpt: 1, lang: 1 } };

export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const intParam = (value, fallback, max) => Math.min(Math.max(parseInt(value, 10) || fallback, 1), max);

export const getSettings = () => mongo.settings().findOne({ _id: 'site' }, { projection: { _id: 0 } });
export const getCategories = () =>
  mongo.categories().find({}, { projection: { _id: 0, position: 0 } }).sort({ position: 1 }).toArray();

export const SEO_SETTINGS = ['siteUrl', 'metaDescription', 'keywords', 'ogImage'];
export const publicSettings = (s) => ({
  siteName: s.siteName,
  siteDomain: s.siteDomain,
  ...Object.fromEntries(SEO_SETTINGS.map((k) => [k, s[k] || ''])),
  aboutText: s.aboutText || '',
});

// Images uploaded to the API server are stored as "/uploads/..."; make them absolute so they
// also load when the website runs on another domain. imageBase = the API server's address.
const fixImage = (imageBase, url) => (url?.startsWith('/uploads/') ? imageBase + url : url);
const fixSummary = (imageBase) => ({ id, ...p }) => ({ ...p, image: fixImage(imageBase, p.image) });

// Settings, categories, homepage sections and the newest articles.
// full = false leaves out the parts that change every day (used for pre-rendered pages other than
// the homepage, so their files only change when the article itself changes).
export async function siteData({ imageBase, full = true }) {
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);
  if (!full) {
    return {
      settings: publicSettings(settings),
      categories,
      latest: [],
      home: { ...Object.fromEntries(HOME_LISTS.map((k) => [k, []])), trendingImage: null, topCategories: [] },
      partial: true,
    };
  }
  const latest = await mongo.posts().find(PUBLISHED, SUMMARY).sort(NEWEST).limit(8).toArray();
  const h = settings.home || {};
  const chosenIds = [...HOME_LISTS.flatMap((k) => h[k] || []), h.trendingImage].filter(Boolean);
  const chosen = await mongo.posts().find({ ...PUBLISHED, id: { $in: chosenIds } }, SUMMARY).toArray();
  const byId = new Map(chosen.map((p) => [p.id, p]));
  const toPosts = (ids) => (ids || []).map((id) => byId.get(id)).filter(Boolean).map(fixSummary(imageBase));

  return {
    settings: publicSettings(settings),
    categories,
    latest: latest.map(fixSummary(imageBase)),
    home: {
      ...Object.fromEntries(HOME_LISTS.map((k) => [k, toPosts(h[k])])),
      trendingImage: toPosts([h.trendingImage])[0] ?? null,
      topCategories: (h.topCategories || []).filter((s) => categories.some((c) => c.slug === s)),
    },
  };
}

// A page of articles: { category, q, page, limit, offset } (strings from a query string are fine)
export async function listPosts(params, imageBase) {
  const filter = { ...PUBLISHED };
  if (params.category) filter.category = String(params.category);
  const q = String(params.q || '').trim().slice(0, 100);
  if (q) {
    const re = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ title: re }, { excerpt: re }, { keywords: re }];
  }
  const limit = intParam(params.limit, 9, 50);
  const offset = Math.max(parseInt(params.offset, 10) || 0, 0);
  const total = Math.max((await mongo.posts().countDocuments(filter)) - offset, 0);
  const pages = Math.max(Math.ceil(total / limit), 1);
  const page = Math.min(intParam(params.page, 1, 100000), pages);
  const posts = await mongo
    .posts()
    .find(filter, SUMMARY)
    .sort(NEWEST)
    .skip(offset + (page - 1) * limit)
    .limit(limit)
    .toArray();
  return { posts: posts.map(fixSummary(imageBase)), total, page, pages };
}

// Related articles: the 3 published just before this one in the same category (newer ones if there
// aren't enough). Unlike "the 3 newest", this doesn't change every time a new article is added.
async function relatedTo(post) {
  const base = { ...PUBLISHED, category: post.category, slug: { $ne: post.slug } };
  const older = await mongo
    .posts()
    .find({ ...base, $or: [{ date: { $lt: post.date } }, { date: post.date, createdAt: { $lt: post.createdAt } }] }, SUMMARY)
    .sort(NEWEST)
    .limit(3)
    .toArray();
  if (older.length === 3) return older;
  const newer = await mongo
    .posts()
    .find({ ...base, $or: [{ date: { $gt: post.date } }, { date: post.date, createdAt: { $gt: post.createdAt } }] }, SUMMARY)
    .sort({ date: 1, createdAt: 1 })
    .limit(3 - older.length)
    .toArray();
  return [...older, ...newer];
}

// One published article with its related articles, or null
export async function postDetail(slug, imageBase) {
  const post = await mongo.posts().findOne({ ...PUBLISHED, slug }, { projection: { _id: 0, id: 0, status: 0, importedFrom: 0, source: 0 } });
  if (!post) return null;
  const related = await relatedTo(post);
  delete post.createdAt;
  post.image = fixImage(imageBase, post.image);
  post.content = post.content.replace(/(src=["'])\/uploads\//g, `$1${imageBase}/uploads/`);
  return { post, related: related.map(fixSummary(imageBase)) };
}
