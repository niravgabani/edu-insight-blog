// Loads the site-wide content once (settings, categories, homepage sections, latest articles).
// Article lists and single articles are loaded page by page — see ../api.js.
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useApi, API_URL, paths } from '../api.js';

const SiteContext = createContext(null);

function buildSite({ settings, categories, home, latest }) {
  const getCategory = (slug) => categories.find((c) => c.slug === slug);

  // Homepage sections chosen in the admin panel; fall back to the newest articles when a section is empty
  const pick = (list, count) => (list?.length ? list : latest.slice(0, count));
  const popular = pick(home.popular, 5);
  const topCategories = (home.topCategories || []).map(getCategory).filter(Boolean);

  return {
    settings,
    siteName: settings.siteName,
    siteDomain: settings.siteDomain,
    categories,
    latest,
    getCategory,
    home: {
      hero: pick(home.hero, 3),
      popular,
      latest: pick(home.latest, 3),
      trending: pick(home.trending, 3),
      trendingImage: home.trendingImage ?? popular[1] ?? popular[0],
      featured: pick(home.featured, 4),
      topCategories: topCategories.length ? topCategories : categories.slice(0, 4),
    },
  };
}

export function SiteProvider({ children }) {
  const { data: initial, error } = useApi(paths.site);
  // Pre-rendered pages (other than the homepage) carry a partial copy without the latest articles;
  // the full version is loaded right after the page appears
  const [full, setFull] = useState(null);
  useEffect(() => {
    if (!initial?.partial) return;
    let active = true;
    fetch(`${API_URL}/api/site`) // not the cache: it holds the partial copy
      .then((r) => r.json())
      .then((d) => active && setFull(d))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [initial]);
  const data = full || initial;
  const site = useMemo(() => (data ? buildSite(data) : null), [data]);

  if (error)
    return (
      <div className="site-loading">
        <p>Unable to load content. Please try again later.</p>
      </div>
    );
  if (!site) return <Loading full />;

  return <SiteContext.Provider value={site}>{children}</SiteContext.Provider>;
}

// full = whole screen while the site starts; otherwise a page-sized spinner
export function Loading({ full }) {
  return (
    <div className={full ? 'site-loading' : 'site-loading page-loading'}>
      <div className="spinner"></div>
    </div>
  );
}

export const useSite = () => useContext(SiteContext);
