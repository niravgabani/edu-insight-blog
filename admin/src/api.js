const TOKEN_KEY = 'admin_token';

export const SITE_URL = import.meta.env.VITE_SITE_URL || '';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage unavailable (private mode) — the session just won't persist
  }
}

// fetch wrapper: adds the auth header, parses JSON and throws the server's error message
export async function api(path, { method = 'GET', body } = {}) {
  const isForm = body instanceof FormData;
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(body && !isForm && { 'Content-Type': 'application/json' }),
    },
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== '/auth/login') {
    setToken(null);
    window.dispatchEvent(new Event('auth:logout'));
  }
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const slugify = (s) =>
  String(s || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';

// Languages an article or category can be written in (no translation — each article has one language)
export const LANGUAGES = [
  ['en', 'English'],
  ['hi', 'Hindi — हिन्दी'],
  ['gu', 'Gujarati — ગુજરાતી'],
  ['mr', 'Marathi — मराठी'],
  ['bn', 'Bengali — বাংলা'],
  ['ta', 'Tamil — தமிழ்'],
  ['te', 'Telugu — తెలుగు'],
  ['pa', 'Punjabi — ਪੰਜਾਬੀ'],
  ['ur', 'Urdu — اردو'],
  ['ar', 'Arabic — العربية'],
  ['es', 'Spanish — Español'],
  ['fr', 'French — Français'],
  ['de', 'German — Deutsch'],
  ['pt', 'Portuguese — Português'],
  ['it', 'Italian — Italiano'],
  ['nl', 'Dutch — Nederlands'],
  ['ru', 'Russian — Русский'],
  ['tr', 'Turkish — Türkçe'],
  ['pl', 'Polish — Polski'],
  ['cs', 'Czech — Čeština'],
  ['zh', 'Chinese — 中文'],
  ['ja', 'Japanese — 日本語'],
  ['ko', 'Korean — 한국어'],
  ['th', 'Thai — ไทย'],
  ['vi', 'Vietnamese — Tiếng Việt'],
  ['id', 'Indonesian — Bahasa Indonesia'],
  ['sw', 'Swahili — Kiswahili'],
];

export const languageName = (code) => (LANGUAGES.find(([c]) => c === code)?.[1] ?? code ?? 'English').split(' — ')[0];
