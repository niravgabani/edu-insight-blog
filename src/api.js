import { useEffect, useState } from 'react';

// Address of the API server. Empty = same address as the website (Vite proxy in development,
// or the Express server in production). Set VITE_API_URL when the website is hosted elsewhere.
export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

// Responses are kept for the session so going back to a page is instant
const cache = new Map(); // path -> Promise
const resolved = new Map(); // path -> data, readable without waiting (pre-rendered pages)

// Data a pre-rendered page was built with ({ path: data }), so the first render needs no request
export function primeCache(data) {
  for (const [path, value] of Object.entries(data || {})) {
    resolved.set(path, value);
    cache.set(path, Promise.resolve(value));
  }
}

export function getJson(path) {
  if (!cache.has(path)) {
    const request = fetch(API_URL + path).then((r) => {
      if (r.status === 404) return null;
      if (!r.ok) throw new Error(r.statusText || 'Request failed');
      return r.json();
    });
    request.then((data) => resolved.set(path, data)).catch(() => {});
    request.catch(() => cache.delete(path)); // let a failed request be retried
    cache.set(path, request);
  }
  return cache.get(path);
}

// Loads an API path: { data, loading, error }. data is null for "not found".
export function useApi(path) {
  const [state, setState] = useState(() =>
    resolved.has(path) ? { path, data: resolved.get(path), error: null } : { path: null, data: undefined, error: null }
  );

  useEffect(() => {
    if (!path || (state.path === path && state.data !== undefined)) return;
    let active = true;
    getJson(path)
      .then((data) => active && setState({ path, data, error: null }))
      .catch((error) => active && setState({ path, data: undefined, error }));
    return () => {
      active = false;
    };
  }, [path]);

  const current = state.path === path;
  return {
    data: current ? state.data : undefined,
    error: current ? state.error : null,
    loading: Boolean(path) && (!current || (state.data === undefined && !state.error)),
  };
}

export const query = (params) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null));
  return qs.toString() ? `?${qs}` : '';
};

// Forget everything (the pre-render script renders thousands of pages in one process)
export function clearCache() {
  cache.clear();
  resolved.clear();
}

// API paths used by the pages — the pre-render script builds its data with the same paths
export const paths = {
  site: '/api/site',
  article: (slug) => `/api/posts/${encodeURIComponent(slug)}`,
  blog: (page) => `/api/posts${query({ page })}`,
  categoryHero: (slug, limit) => `/api/posts${query({ category: slug, limit })}`,
  categoryList: (slug, offset, page) => `/api/posts${query({ category: slug, offset, page })}`,
};
