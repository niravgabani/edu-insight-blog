// Loads all website content (settings, categories, posts, homepage sections) from the API
// and exposes the same helpers the pages used before the data became dynamic.
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const SiteContext = createContext(null);

function buildSite({ settings, categories, posts, home }) {
  const bySlug = new Map(posts.map((p) => [p.slug, p]));
  const getPost = (slug) => bySlug.get(slug);
  const getCategory = (slug) => categories.find((c) => c.slug === slug);
  const postsByCategory = (slug) => posts.filter((p) => p.category === slug);

  const searchPosts = (q) => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        p.excerpt.toLowerCase().includes(term) ||
        (getCategory(p.category)?.name.toLowerCase().includes(term) ?? false)
    );
  };

  // Homepage sections chosen in the admin panel; fall back to newest posts when a section is empty
  const pick = (slugs, count) => {
    const list = (slugs || []).map(getPost).filter(Boolean);
    return list.length ? list : posts.slice(0, count);
  };
  const popular = pick(home.popular, 5);
  const topCategories = (home.topCategories || []).map(getCategory).filter(Boolean);

  return {
    settings,
    siteName: settings.siteName,
    siteDomain: settings.siteDomain,
    categories,
    posts,
    getPost,
    getCategory,
    postsByCategory,
    searchPosts,
    home: {
      hero: pick(home.hero, 3),
      popular,
      latest: pick(home.latest, 3),
      trending: pick(home.trending, 3),
      trendingImage: getPost(home.trendingImage) ?? popular[1] ?? popular[0],
      featured: pick(home.featured, 4),
      topCategories: topCategories.length ? topCategories : categories.slice(0, 4),
    },
  };
}

export function SiteProvider({ children }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('https://edu-insight-blog.onrender.com/api/site')
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
      .then(setData)
      .catch(() => setError(true));
  }, []);

  const site = useMemo(() => (data ? buildSite(data) : null), [data]);

  if (error)
    return (
      <div className="site-loading">
        <p>Unable to load content. Please try again later.</p>
      </div>
    );
  if (!site)
    return (
      <div className="site-loading">
        <div className="spinner"></div>
      </div>
    );

  return <SiteContext.Provider value={site}>{children}</SiteContext.Provider>;
}

export const useSite = () => useContext(SiteContext);
