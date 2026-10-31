import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSite } from './data/SiteData.jsx';
import { headTags, pageMeta } from './seo.js';

// Sets the page title, meta description, Open Graph/Twitter tags, canonical URL and structured data.
// Usage: useSeo({ post, category }) for articles, useSeo({ title: 'Contact Us' }) for simple pages.
export default function useSeo(options = {}) {
  const { settings } = useSite();
  const { pathname, search } = useLocation();
  const { post, category, title, description, noindex, notFound } = options;
  // Keep ?page=N in the canonical URL of paginated lists
  const page = new URLSearchParams(search).get('page');
  const path = pathname + (page && page !== '1' ? `?page=${page}` : '');

  useEffect(() => {
    const meta = pageMeta({
      settings,
      origin: window.location.origin,
      path,
      post,
      category,
      title,
      description,
      noindex,
      notFound,
    });
    document.title = meta.title;
    document.documentElement.lang = meta.lang;

    // Replace the tags written by the server (or by the previous page)
    document.head.querySelectorAll('[data-seo]').forEach((el) => el.remove());
    for (const [tag, attrs, text] of headTags(meta)) {
      const el = document.createElement(tag);
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      el.setAttribute('data-seo', '');
      if (text) el.textContent = text;
      document.head.appendChild(el);
    }
  }, [settings, path, post, category, title, description, noindex, notFound]);
}
