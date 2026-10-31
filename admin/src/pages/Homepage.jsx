import { useEffect, useState } from 'react';
import { api, SITE_URL } from '../api.js';
import Picker from '../components/Picker.jsx';

const sections = [
  { key: 'hero', title: 'Hero Slider', help: 'Big slider at the top (numbered 1, 2, 3...).', max: 5 },
  { key: 'popular', title: 'Popular Articles', help: '1–2: grid cards, 2: wide card, 3–5: right column.', max: 5 },
  { key: 'latest', title: 'Latest Articles', help: 'Large image cards on the light background.', max: 6 },
  { key: 'trending', title: 'Trending Articles', help: 'Text list next to the curved image.', max: 5 },
  { key: 'featured', title: 'Featured Articles', help: 'Card row at the bottom of the page.', max: 8 },
];

export default function Homepage() {
  const [home, setHome] = useState(null);
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    Promise.all([api('/admin/settings'), api('/admin/posts'), api('/admin/categories')])
      .then(([s, p, c]) => {
        setHome(s.home);
        setPosts(p.filter((x) => x.status === 'published'));
        setCategories(c);
      })
      .catch((e) => setError(e.message));
  }, []);

  const postOptions = posts.map((p) => ({ value: p.id, label: p.title, image: p.image }));
  const set = (key, value) => setHome((h) => ({ ...h, [key]: value }));

  const save = async () => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const s = await api('/admin/settings', { method: 'PUT', body: { home } });
      setHome(s.home);
      setNotice('Homepage updated.');
    } catch (ex) {
      setError(ex.message);
    } finally {
      setSaving(false);
    }
  };

  if (!home) return error ? <p className="error-text">{error}</p> : <div className="spinner"></div>;

  return (
    <>
      <div className="page-head">
        <h1>
          Home<span>page</span>
        </h1>
        <div className="head-actions">
          <a href={`${SITE_URL}/`} target="_blank" rel="noreferrer" className="btn btn-light">
            <i className="fa-solid fa-eye"></i> Preview
          </a>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            <i className="fa-solid fa-floppy-disk"></i> {saving ? 'Saving...' : 'Save Homepage'}
          </button>
        </div>
      </div>
      <p className="muted">
        Choose which articles appear in each homepage section. Empty sections automatically show the newest articles.
      </p>

      {error && <div className="alert error">{error}</div>}
      {notice && <div className="alert success">{notice}</div>}

      <div className="section-grid">
        {sections.map((s) => (
          <div className="panel" key={s.key}>
            <h3>{s.title}</h3>
            <p className="muted small">
              {s.help} Max {s.max}.
            </p>
            <Picker
              options={postOptions}
              value={home[s.key] || []}
              onChange={(v) => set(s.key, v)}
              max={s.max}
              placeholder="+ Add article..."
            />
          </div>
        ))}

        <div className="panel">
          <h3>Trending Image</h3>
          <p className="muted small">Article whose image appears beside the trending list.</p>
          <select value={home.trendingImage || ''} onChange={(e) => set('trendingImage', e.target.value || null)}>
            <option value="">Automatic</option>
            {posts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        <div className="panel">
          <h3>Top Categories</h3>
          <p className="muted small">Category tiles under the popular section. Max 8.</p>
          <Picker
            options={categories.map((c) => ({ value: c.slug, label: c.name }))}
            value={home.topCategories || []}
            onChange={(v) => set('topCategories', v)}
            max={8}
            placeholder="+ Add category..."
          />
        </div>
      </div>
    </>
  );
}
