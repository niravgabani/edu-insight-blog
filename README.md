# Daily InfoScope

A multilingual blog built with React, plus an admin panel and an Express + MongoDB API.

- `src/` — the public website (React + Vite)
- `admin/` — the admin panel (React + Vite, served at `/admin`)
- `server/` — the API (Express + MongoDB). It also serves both built apps in production.

Features: articles and categories managed from the admin panel, each article written in its own language (with right-to-left support), SEO tags per article (meta title/description, Open Graph, structured data), `sitemap.xml` and `robots.txt`.

## Setup

Requires Node.js 20.6 or newer and a MongoDB database (for example a free MongoDB Atlas cluster).

```bash
npm install
npm --prefix server install
npm --prefix admin install
```

Copy `server/.env.example` to `server/.env` and set `MONGODB_URI`.

On first start with an empty database the server creates the site settings, the categories and an admin login: `admin` / `admin123`. Change it in Admin → Settings.

## Development

Run each in its own terminal:

```bash
npm run server   # API on http://localhost:5000
npm run dev      # website on http://localhost:5173
npm run admin    # admin panel on http://localhost:5174/admin/
```

## Production

```bash
npm run build:all
npm start        # everything on http://localhost:5000 (PORT can be changed in server/.env)
```

Set the **Website URL** in Admin → Settings → SEO so the sitemap and share links use your domain. The server imports `src/seo.js`, so deploy the `src/` folder together with `server/`.

Uploaded images are stored in `server/uploads/`.

## Importing articles from another site

`server/scripts/import-site.js` copies every article listed in a site's `sitemap.xml` (title, category, featured image, content, meta title/description, keywords) into MongoDB, keeping the same URL slugs:

```bash
cd server
node --env-file=.env scripts/import-site.js --site https://lesothoeducation.info
```

It can be run again at any time — articles already imported are skipped.

Because the slugs are the same, the old site can send visitors and Google to the new one with a permanent (301) redirect of every path: `https://old-site/<anything>` → `https://dailyinfoscope.com/<anything>`.

## Images on Cloudinary

Set `CLOUDINARY_URL` in `server/.env` (and on the API host). New uploads from the admin panel then go to Cloudinary, and this copies existing article images there:

```bash
cd server
node --env-file=.env scripts/migrate-images.js
```

## Daily articles written by Claude

`server/scripts/daily-posts.js` researches yesterday's news, trending searches and upcoming festivals on the web, then writes and publishes SEO-optimised articles (meta tags, keywords, FAQ with structured data, sources, internal links).

It runs every day on GitHub Actions (`.github/workflows/daily-posts.yml`). Add the secrets `ANTHROPIC_API_KEY` and `MONGODB_URI` in GitHub → Settings → Secrets and variables → Actions, and allow `0.0.0.0/0` in MongoDB Atlas → Network Access. Run it by hand from the Actions tab, or locally:

```bash
cd server
node --env-file=.env scripts/daily-posts.js --count 2 --dry-run   # writes 2 articles without saving them
```

## Firebase Hosting (pre-rendered pages)

`npm run build:firebase` builds the website and admin panel, then writes a real HTML file for every page — each article, category and static page with its full content and SEO tags — plus `sitemap.xml`, `news-sitemap.xml`, `rss.xml`, `robots.txt` and `404.html` (`scripts/prerender.mjs`). Search engines and link previews get everything without running JavaScript; in the browser React takes over the page. It reads the database directly, so it needs `MONGODB_URI` (from `server/.env`), and takes about 3 minutes for ~8,500 pages.

```bash
npm run build:firebase
firebase deploy --only hosting
```

The daily GitHub workflow does both after writing new articles when the `FIREBASE_SERVICE_ACCOUNT` secret is set. Articles added in the admin panel appear on the site immediately, and get their own pre-rendered page at the next build.

Production builds call the API at `VITE_API_URL` (see `.env.production`).
