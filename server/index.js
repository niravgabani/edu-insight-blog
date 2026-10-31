import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import * as mongo from './mongo.js';
import { NO_ID } from './mongo.js';
import { ensureDb } from './seed.js';
import { makeToken, verifyToken, hashPassword, checkPassword } from './auth.js';
import { pageMeta, headTags } from '../src/seo.js';
import cors from 'cors';

const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(SERVER_DIR, '..');
const UPLOAD_DIR = path.join(SERVER_DIR, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const PORT = process.env.PORT || 5000;
const app = express();
app.use(express.json({ limit: '5mb' }));

app.use(cors({
  origin: [
    'https://edu-insight-blog.web.app',
    'https://edu-insight-blog.firebaseapp.com',
    'http://localhost:5173',
    'http://localhost:5174',
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));


// Website routes a post slug can't use
const RESERVED = new Set(['blog', 'search', 'privacypolicy', 'contactus', 'category', 'admin', 'api', 'uploads']);
const HOME_LISTS = ['hero', 'popular', 'latest', 'trending', 'featured'];
const NEWEST = { date: -1, createdAt: -1 };

const slugify = (s) =>
  String(s || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');

// Language codes such as "en", "hi", "pt-BR"
const LANG_RE = /^[a-z]{2,3}(-[a-z0-9]{2,8})?$/i;
const readLang = (lang) => (LANG_RE.test(String(lang || '')) ? String(lang) : 'en');
const text = (value, max) => String(value || '').trim().slice(0, max);

const today = () => new Date().toISOString().slice(0, 10);
const bad = (res, error, code = 400) => res.status(code).json({ error });
// Express 4 doesn't catch rejected promises — pass them to the error handler
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const getSettings = () => mongo.settings().findOne({ _id: 'site' }, { projection: { _id: 0 } });
const SEO_SETTINGS = ['siteUrl', 'metaDescription', 'keywords', 'ogImage'];
const publicSettings = (s) => ({
  siteName: s.siteName,
  siteDomain: s.siteDomain,
  ...Object.fromEntries(SEO_SETTINGS.map((k) => [k, s[k] || ''])),
});
const getCategories = () => mongo.categories().find({}, { projection: { _id: 0, position: 0 } }).sort({ position: 1 }).toArray();

// ---------- Public API (used by the website) ----------

app.get(
  '/api/site',
  wrap(async (req, res) => {
    const [settings, categories, posts] = await Promise.all([
      getSettings(),
      getCategories(),
      mongo
        .posts()
        .find({ status: 'published' }, { projection: { _id: 0, createdAt: 0, status: 0 } })
        .sort(NEWEST)
        .toArray(),
    ]);
    const slugOf = new Map(posts.map((p) => [p.id, p.slug]));
    const toSlugs = (ids) => (ids || []).map((id) => slugOf.get(id)).filter(Boolean);
    const h = settings.home || {};

    res.json({
      settings: publicSettings(settings),
      categories,
      posts: posts.map(({ id, ...rest }) => rest),
      home: {
        ...Object.fromEntries(HOME_LISTS.map((k) => [k, toSlugs(h[k])])),
        trendingImage: slugOf.get(h.trendingImage) ?? null,
        topCategories: (h.topCategories || []).filter((s) => categories.some((c) => c.slug === s)),
      },
    });
  })
);

app.post(
  '/api/contact',
  wrap(async (req, res) => {
    const { name = '', email = '', subject = '', message = '' } = req.body || {};
    if (!String(name).trim() || !/^\S+@\S+\.\S+$/.test(email) || String(message).trim().length < 10)
      return bad(res, 'Please fill in your name, a valid email and a message.');
    await mongo.messages().insertOne({
      id: crypto.randomUUID(),
      name: String(name).trim().slice(0, 200),
      email: String(email).trim().slice(0, 200),
      subject: String(subject).trim().slice(0, 300),
      message: String(message).trim().slice(0, 5000),
      read: false,
      createdAt: new Date().toISOString(),
    });
    res.status(201).json({ ok: true });
  })
);

// ---------- Auth ----------

const getAuth = () => mongo.auth().findOne({ _id: 'admin' });

app.post(
  '/api/auth/login',
  wrap(async (req, res) => {
    const { username, password } = req.body || {};
    const auth = await getAuth();
    if (username !== auth.username || !checkPassword(password, auth)) return bad(res, 'Invalid username or password', 401);
    res.json({ token: makeToken(auth.username, auth.secret), username: auth.username });
  })
);

const requireAuth = wrap(async (req, res, next) => {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '');
  const user = verifyToken(token, (await getAuth()).secret);
  if (!user) return bad(res, 'Unauthorized', 401);
  req.user = user;
  next();
});

app.get('/api/auth/me', requireAuth, (req, res) => res.json({ username: req.user }));

// ---------- Admin API ----------

const admin = express.Router();
admin.use(requireAuth);
app.use('/api/admin', admin);

const LIST_FIELDS = { projection: { _id: 0, content: 0 } };

admin.get(
  '/stats',
  wrap(async (req, res) => {
    const [total, published, drafts, cats, msgs, unread, recent] = await Promise.all([
      mongo.posts().countDocuments(),
      mongo.posts().countDocuments({ status: 'published' }),
      mongo.posts().countDocuments({ status: 'draft' }),
      mongo.categories().countDocuments(),
      mongo.messages().countDocuments(),
      mongo.messages().countDocuments({ read: false }),
      mongo.posts().find({}, LIST_FIELDS).sort(NEWEST).limit(5).toArray(),
    ]);
    res.json({ posts: total, published, drafts, categories: cats, messages: msgs, unread, recent });
  })
);

// Posts
admin.get(
  '/posts',
  wrap(async (req, res) => {
    res.json(await mongo.posts().find({}, LIST_FIELDS).sort(NEWEST).toArray());
  })
);

admin.get(
  '/posts/:id',
  wrap(async (req, res) => {
    const post = await mongo.posts().findOne({ id: req.params.id }, NO_ID);
    post ? res.json(post) : bad(res, 'Post not found', 404);
  })
);

async function readPost(body, id) {
  const title = String(body.title || '').trim();
  const slug = slugify(body.slug || title);
  if (!title) return { error: 'Title is required' };
  if (!slug) return { error: 'Slug is required' };
  if (RESERVED.has(slug)) return { error: `"${slug}" is reserved, please choose another slug` };
  if (await mongo.posts().findOne({ slug, id: { $ne: id } })) return { error: 'Another post already uses this slug' };
  if (typeof body.category !== 'string' || !(await mongo.categories().findOne({ slug: body.category })))
    return { error: 'Please choose a category' };
  return {
    post: {
      title,
      slug,
      category: body.category,
      date: /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : today(),
      image: String(body.image || '').trim(),
      excerpt: String(body.excerpt || '').trim(),
      content: String(body.content || ''),
      status: body.status === 'draft' ? 'draft' : 'published',
      lang: readLang(body.lang),
      // SEO — empty values fall back to the title / excerpt on the website
      metaTitle: text(body.metaTitle, 200),
      metaDescription: text(body.metaDescription, 400),
      keywords: text(body.keywords, 300),
    },
  };
}

admin.post(
  '/posts',
  wrap(async (req, res) => {
    const { error, post } = await readPost(req.body || {}, null);
    if (error) return bad(res, error);
    const now = new Date().toISOString();
    const created = { id: crypto.randomUUID(), ...post, createdAt: now, updatedAt: now };
    await mongo.posts().insertOne({ ...created });
    res.status(201).json(created);
  })
);

admin.put(
  '/posts/:id',
  wrap(async (req, res) => {
    if (!(await mongo.posts().findOne({ id: req.params.id }))) return bad(res, 'Post not found', 404);
    const { error, post } = await readPost(req.body || {}, req.params.id);
    if (error) return bad(res, error);
    const updated = await mongo
      .posts()
      .findOneAndUpdate(
        { id: req.params.id },
        { $set: { ...post, updatedAt: new Date().toISOString() } },
        { returnDocument: 'after', ...NO_ID }
      );
    res.json(updated);
  })
);

admin.delete(
  '/posts/:id',
  wrap(async (req, res) => {
    const { deletedCount } = await mongo.posts().deleteOne({ id: req.params.id });
    if (!deletedCount) return bad(res, 'Post not found', 404);
    // Remove it from every homepage section
    const id = req.params.id;
    await mongo.settings().updateOne(
      { _id: 'site' },
      { $pull: Object.fromEntries(HOME_LISTS.map((k) => [`home.${k}`, id])) }
    );
    await mongo.settings().updateOne({ _id: 'site', 'home.trendingImage': id }, { $set: { 'home.trendingImage': null } });
    res.json({ ok: true });
  })
);

// Categories
admin.get(
  '/categories',
  wrap(async (req, res) => {
    const [cats, counts] = await Promise.all([
      getCategories(),
      mongo.posts().aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]).toArray(),
    ]);
    const countOf = new Map(counts.map((c) => [c._id, c.count]));
    res.json(cats.map((c) => ({ ...c, count: countOf.get(c.slug) || 0 })));
  })
);

const categoryExtras = (body) => ({ lang: readLang(body?.lang), description: text(body?.description, 400) });

admin.post(
  '/categories',
  wrap(async (req, res) => {
    const name = String(req.body?.name || '').trim();
    const slug = slugify(req.body?.slug || name);
    if (!name || !slug) return bad(res, 'Category name is required');
    if (await mongo.categories().findOne({ slug })) return bad(res, 'A category with this slug already exists');
    const [last] = await mongo.categories().find().sort({ position: -1 }).limit(1).toArray();
    const category = { slug, name, ...categoryExtras(req.body) };
    await mongo.categories().insertOne({ ...category, position: (last?.position ?? -1) + 1 });
    res.status(201).json(category);
  })
);

admin.put(
  '/categories/:slug',
  wrap(async (req, res) => {
    const old = req.params.slug;
    if (!(await mongo.categories().findOne({ slug: old }))) return bad(res, 'Category not found', 404);
    const name = String(req.body?.name || '').trim();
    const slug = slugify(req.body?.slug || name);
    if (!name || !slug) return bad(res, 'Category name is required');
    if (slug !== old && (await mongo.categories().findOne({ slug }))) return bad(res, 'A category with this slug already exists');

    const extras = categoryExtras(req.body);
    await mongo.categories().updateOne({ slug: old }, { $set: { slug, name, ...extras } });
    if (slug !== old) {
      // Cascade slug change to posts and the homepage
      await mongo.posts().updateMany({ category: old }, { $set: { category: slug } });
      await mongo
        .settings()
        .updateOne({ _id: 'site' }, { $set: { 'home.topCategories.$[c]': slug } }, { arrayFilters: [{ c: old }] });
    }
    res.json({ slug, name, ...extras });
  })
);

admin.delete(
  '/categories/:slug',
  wrap(async (req, res) => {
    const used = await mongo.posts().countDocuments({ category: req.params.slug });
    if (used) return bad(res, `This category has ${used} post(s). Move or delete them first.`);
    await mongo.categories().deleteOne({ slug: req.params.slug });
    await mongo.settings().updateOne({ _id: 'site' }, { $pull: { 'home.topCategories': req.params.slug } });
    res.json({ ok: true });
  })
);

// Settings (site name, domain, homepage sections)
admin.get(
  '/settings',
  wrap(async (req, res) => res.json(await getSettings()))
);

admin.put(
  '/settings',
  wrap(async (req, res) => {
    const { siteName, siteDomain, home } = req.body || {};
    const $set = {};
    if (siteName !== undefined) {
      if (!String(siteName).trim()) return bad(res, 'Site name is required');
      $set.siteName = String(siteName).trim();
    }
    if (siteDomain !== undefined) $set.siteDomain = String(siteDomain).trim();
    for (const key of SEO_SETTINGS) if (req.body[key] !== undefined) $set[key] = text(req.body[key], 400);
    if ($set.siteUrl) {
      $set.siteUrl = $set.siteUrl.replace(/\/+$/, '');
      if (!/^https?:\/\/[^\s/]+$/i.test($set.siteUrl)) return bad(res, 'Site URL must look like https://www.example.com');
    }
    if (home) {
      const [postIds, catSlugs] = await Promise.all([
        mongo.posts().distinct('id'),
        mongo.categories().distinct('slug'),
      ]);
      const ids = new Set(postIds);
      const next = {};
      HOME_LISTS.forEach((k) => (next[k] = (Array.isArray(home[k]) ? home[k] : []).filter((id) => ids.has(id))));
      next.trendingImage = ids.has(home.trendingImage) ? home.trendingImage : null;
      next.topCategories = (Array.isArray(home.topCategories) ? home.topCategories : []).filter((s) => catSlugs.includes(s));
      $set.home = next;
    }
    if (Object.keys($set).length) await mongo.settings().updateOne({ _id: 'site' }, { $set });
    res.json(await getSettings());
  })
);

admin.put(
  '/password',
  wrap(async (req, res) => {
    const auth = await getAuth();
    const { current, next, username } = req.body || {};
    if (!checkPassword(current, auth)) return bad(res, 'Current password is incorrect');
    if (typeof next !== 'string' || next.length < 6) return bad(res, 'New password must be at least 6 characters');
    const newName = username && String(username).trim() ? String(username).trim() : auth.username;
    await mongo.auth().updateOne({ _id: 'admin' }, { $set: { username: newName, ...hashPassword(next) } });
    res.json({ ok: true, username: newName });
  })
);

// Contact messages
admin.get(
  '/messages',
  wrap(async (req, res) => res.json(await mongo.messages().find({}, NO_ID).sort({ createdAt: -1 }).toArray()))
);

admin.put(
  '/messages/:id/read',
  wrap(async (req, res) => {
    const msg = await mongo
      .messages()
      .findOneAndUpdate({ id: req.params.id }, { $set: { read: req.body?.read !== false } }, { returnDocument: 'after', ...NO_ID });
    msg ? res.json(msg) : bad(res, 'Message not found', 404);
  })
);

admin.delete(
  '/messages/:id',
  wrap(async (req, res) => {
    await mongo.messages().deleteOne({ id: req.params.id });
    res.json({ ok: true });
  })
);

// Image upload (files are stored on disk in server/uploads)
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) =>
      cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /^image\/(jpeg|png|webp|gif|avif)$/.test(file.mimetype)),
});

admin.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return bad(res, 'Please choose a JPG, PNG, WEBP, GIF or AVIF image');
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

// ---------- SEO: sitemap, robots.txt, tags in the page HTML ----------

const originOf = (req, settings) => settings.siteUrl || `${req.protocol}://${req.get('host')}`;
const escXml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

app.get(
  '/sitemap.xml',
  wrap(async (req, res) => {
    const [settings, categories, posts] = await Promise.all([
      getSettings(),
      getCategories(),
      mongo.posts().find({ status: 'published' }, { projection: { slug: 1, date: 1, updatedAt: 1 } }).sort(NEWEST).toArray(),
    ]);
    const origin = originOf(req, settings);
    const url = (path, lastmod) =>
      `  <url><loc>${escXml(origin + encodeURI(path))}</loc>${lastmod ? `<lastmod>${lastmod.slice(0, 10)}</lastmod>` : ''}</url>`;
    const newest = posts[0]?.updatedAt || posts[0]?.date;
    const urls = [
      url('/', newest),
      url('/blog', newest),
      ...categories.map((c) => url(`/category/${c.slug}`)),
      ...posts.map((p) => url(`/${p.slug}`, p.updatedAt || p.date)),
      url('/contactus'),
      url('/privacypolicy'),
    ];
    res
      .type('application/xml')
      .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
  })
);

app.get(
  '/robots.txt',
  wrap(async (req, res) => {
    const origin = originOf(req, await getSettings());
    res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nDisallow: /search\n\nSitemap: ${origin}/sitemap.xml\n`);
  })
);

// Works out the SEO data for a website URL (same rules as the website's useSeo hook)
async function seoForRequest(req) {
  const settings = await getSettings();
  const origin = originOf(req, settings);
  const path = req.path.replace(/\/+$/, '') || '/';
  const result = (options, status = 200) => ({ status, meta: pageMeta({ settings, origin, path, ...options }) });
  const notFound = () => result({ notFound: true }, 404);
  let segments;
  try {
    segments = path.split('/').slice(1).map(decodeURIComponent);
  } catch {
    return notFound();
  }

  if (['/', '/privacypolicy', '/contactus'].includes(path)) return result({});
  if (path === '/search') return result({ title: req.query.q ? `Search: ${req.query.q}` : 'Search' });
  if (path === '/blog') {
    const page = Number(req.query.page) || 1;
    if (page > 1) return { status: 200, meta: pageMeta({ settings, origin, path: `/blog?page=${page}`, title: `All Articles - Page ${page}` }) };
    return result({ title: 'All Articles' });
  }
  if (segments.length === 2 && segments[0] === 'category') {
    const category = await mongo.categories().findOne({ slug: segments[1] }, NO_ID);
    return category ? result({ category }) : notFound();
  }
  if (segments.length === 1) {
    const post = await mongo.posts().findOne({ slug: segments[0], status: 'published' }, NO_ID);
    if (!post) return notFound();
    const category = await mongo.categories().findOne({ slug: post.category }, NO_ID);
    return result({ post, category });
  }
  return notFound();
}

const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function injectSeo(html, meta) {
  const tags = headTags(meta)
    .map(([tag, attrs, body]) => {
      const a = Object.entries(attrs).map(([k, v]) => ` ${k}="${escAttr(v)}"`).join('');
      return tag === 'script' ? `<script${a} data-seo>${body}</script>` : `<${tag}${a} data-seo />`;
    })
    .join('\n    ');
  // Function replacers: article text may contain "$" patterns
  return html
    .replace(/<html lang="[^"]*"/, () => `<html lang="${escAttr(meta.lang)}"`)
    .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${escAttr(meta.title)}</title>`)
    .replace('</head>', () => `    ${tags}\n  </head>`);
}

// ---------- Static files ----------

app.use('/uploads', express.static(UPLOAD_DIR));
app.use('/api', (req, res) => bad(res, 'Not found', 404));

// Built apps (after `npm run build:all` in the project root)
const adminDist = path.join(ROOT, 'admin', 'dist');
if (fs.existsSync(adminDist)) {
  app.use('/admin', express.static(adminDist));
  app.get('/admin/*', (req, res) => res.sendFile(path.join(adminDist, 'index.html')));
}
const siteDist = path.join(ROOT, 'dist');
if (fs.existsSync(siteDist)) {
  app.use(express.static(siteDist, { index: false }));
  app.get(
    '*',
    wrap(async (req, res) => {
      const [html, { status, meta }] = await Promise.all([
        fs.promises.readFile(path.join(siteDist, 'index.html'), 'utf8'),
        seoForRequest(req),
      ]);
      res.status(status).type('html').send(injectSeo(html, meta));
    })
  );
}

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) return bad(res, err.code === 'LIMIT_FILE_SIZE' ? 'Image must be under 5 MB' : err.message);
  if (err.type === 'entity.parse.failed') return bad(res, 'Invalid JSON');
  console.error(err);
  bad(res, 'Server error', 500);
});

try {
  await mongo.connect();
  await ensureDb();
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT} (MongoDB connected)`));
} catch (err) {
  console.error('Could not start the server:', err.message);
  process.exit(1);
}
