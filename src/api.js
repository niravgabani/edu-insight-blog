import { useEffect, useState } from 'react';

// Address of the API server. Empty = same address as the website (Vite proxy in development,
// or the Express server in production). Set VITE_API_URL when the website is hosted elsewhere.
export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

// Responses are kept for the session so going back to a page is instant
const cache = new Map();

export function getJson(path) {
  if (!cache.has(path)) {
    const request = fetch(API_URL + path).then((r) => {
      if (r.status === 404) return null;
      if (!r.ok) throw new Error(r.statusText || 'Request failed');
      return r.json();
    });
    request.catch(() => cache.delete(path)); // let a failed request be retried
    cache.set(path, request);
  }
  return cache.get(path);
}

// Loads an API path: { data, loading, error }. data is null for "not found".
export function useApi(path) {
  const [state, setState] = useState({ path: null, data: undefined, error: null });

  useEffect(() => {
    if (!path) return;
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
