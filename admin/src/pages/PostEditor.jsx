import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, slugify, SITE_URL, LANGUAGES } from '../api.js';
import RichEditor from '../components/RichEditor.jsx';
import ImageInput from '../components/ImageInput.jsx';

const blank = () => ({
  title: '',
  slug: '',
  category: '',
  date: new Date().toISOString().slice(0, 10),
  image: '',
  excerpt: '',
  content: '',
  status: 'published',
  lang: 'en',
  metaTitle: '',
  metaDescription: '',
  keywords: '',
});

export default function PostEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;

  const [post, setPost] = useState(isNew ? blank() : null);
  const [categories, setCategories] = useState([]);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    api('/admin/categories').then(setCategories).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    setError('');
    setNotice('');
    if (isNew) {
      setPost(blank());
      setSlugTouched(false);
      return;
    }
    setPost(null);
    api(`/admin/posts/${id}`)
      .then((p) => {
        // Older articles have no language / SEO fields yet
        setPost({ ...blank(), ...p });
        setSlugTouched(true);
      })
      .catch((e) => setError(e.message));
  }, [id, isNew]);

  const set = (field, value) =>
    setPost((p) => {
      const next = { ...p, [field]: value };
      if (field === 'title' && !slugTouched) next.slug = slugify(value);
      // A category written in one language (e.g. "旅行") sets the article's language too
      if (field === 'category') {
        const lang = categories.find((c) => c.slug === value)?.lang;
        if (lang) next.lang = lang;
      }
      return next;
    });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      if (isNew) {
        const created = await api('/admin/posts', { method: 'POST', body: post });
        navigate(`/posts/${created.id}`, { replace: true });
      } else {
        setPost({ ...blank(), ...(await api(`/admin/posts/${id}`, { method: 'PUT', body: post })) });
        setNotice('Article saved.');
      }
    } catch (ex) {
      setError(ex.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    try {
      await api(`/admin/posts/${id}`, { method: 'DELETE' });
      navigate('/posts');
    } catch (ex) {
      setError(ex.message);
    }
  };

  if (!post) return error ? <p className="error-text">{error}</p> : <div className="spinner"></div>;

  return (
    <form onSubmit={save}>
      <div className="page-head">
        <h1>
          {isNew ? 'Add' : 'Edit'} <span>Article</span>
        </h1>
        <div className="head-actions">
          {!isNew && post.status === 'published' && (
            <a href={`${SITE_URL}/${post.slug}`} target="_blank" rel="noreferrer" className="btn btn-light">
              <i className="fa-solid fa-eye"></i> View
            </a>
          )}
          <Link to="/posts" className="btn btn-light">
            Back
          </Link>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}
      {notice && <div className="alert success">{notice}</div>}

      <div className="editor-layout">
        <div className="panel form">
          <label>
            Title
            <input value={post.title} onChange={(e) => set('title', e.target.value)} placeholder="Article title" />
          </label>
          <label>
            URL slug
            <div className="slug-input">
              <span>/</span>
              <input
                value={post.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set('slug', e.target.value);
                }}
                onBlur={(e) => set('slug', slugify(e.target.value))}
                placeholder="article-url"
              />
            </div>
          </label>
          <label>
            Short description (excerpt)
            <textarea
              rows="3"
              value={post.excerpt}
              onChange={(e) => set('excerpt', e.target.value)}
              placeholder="Shown on cards, the homepage slider and at the top of the article"
            />
          </label>
          <div className="label">
            Content
            <RichEditor value={post.content} onChange={(v) => set('content', v)} />
          </div>

          <h3 className="form-section">
            <i className="fa-solid fa-magnifying-glass-chart"></i> SEO
          </h3>
          <SeoPreview post={post} />
          <label>
            <span className="label-row">
              Meta title <Counter value={post.metaTitle || post.title} max={60} />
            </span>
            <input
              value={post.metaTitle}
              onChange={(e) => set('metaTitle', e.target.value)}
              placeholder={`Empty = "${post.title || 'Article title'} | Site name"`}
            />
          </label>
          <label>
            <span className="label-row">
              Meta description <Counter value={post.metaDescription || post.excerpt} max={160} />
            </span>
            <textarea
              rows="3"
              value={post.metaDescription}
              onChange={(e) => set('metaDescription', e.target.value)}
              placeholder="Shown in Google results. Empty = the short description above"
            />
          </label>
          <label>
            Focus keywords
            <input
              value={post.keywords}
              onChange={(e) => set('keywords', e.target.value)}
              placeholder="e.g. study tips, exam preparation, learning"
            />
          </label>
        </div>

        <div className="side">
          <div className="panel form">
            <h3>Publish</h3>
            <label>
              Status
              <select value={post.status} onChange={(e) => set('status', e.target.value)}>
                <option value="published">Published</option>
                <option value="draft">Draft (hidden from website)</option>
              </select>
            </label>
            <label>
              Date
              <input type="date" value={post.date} onChange={(e) => set('date', e.target.value)} />
            </label>
            <label>
              Language
              <select value={post.lang} onChange={(e) => set('lang', e.target.value)}>
                {LANGUAGES.map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Category
              <select value={post.category} onChange={(e) => set('category', e.target.value)}>
                <option value="">Choose category...</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn btn-primary block" disabled={saving}>
              <i className="fa-solid fa-floppy-disk"></i> {saving ? 'Saving...' : isNew ? 'Publish Article' : 'Save Changes'}
            </button>
            {!isNew && (
              <button type="button" className="btn btn-danger block" onClick={remove}>
                <i className="fa-solid fa-trash"></i> Delete
              </button>
            )}
          </div>
          <div className="panel form">
            <h3>Featured Image</h3>
            <ImageInput value={post.image} onChange={(v) => set('image', v)} />
          </div>
        </div>
      </div>
    </form>
  );
}

function Counter({ value, max }) {
  const n = (value || '').length;
  return <span className={`counter${n > max ? ' over' : ''}`}>{`${n} / ${max}`}</span>;
}

// How the article may look in Google results
function SeoPreview({ post }) {
  const title = post.metaTitle || `${post.title || 'Article title'} | Site name`;
  const description = post.metaDescription || post.excerpt || 'Add a short description so Google can show it here.';
  const clip = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
  return (
    <div className="serp" lang={post.lang}>
      <div className="serp-url">
        {(SITE_URL || window.location.origin).replace(/^https?:\/\//, '')} › {post.slug || 'article-url'}
      </div>
      <div className="serp-title">{clip(title, 65)}</div>
      <div className="serp-desc">{clip(description, 160)}</div>
    </div>
  );
}
