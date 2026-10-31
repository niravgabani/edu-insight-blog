# Edu Insight Blog

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
