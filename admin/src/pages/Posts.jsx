import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatDate, SITE_URL, languageName } from '../api.js';

const PER_PAGE = 15;

export default function Posts() {
  const [posts, setPosts] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [status, setStatus] = useState('');
  const [lang, setLang] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    Promise.all([api('/admin/posts'), api('/admin/categories')])
      .then(([p, c]) => {
        setPosts(p);
        setCategories(c);
      })
      .catch((e) => setError(e.message));
  }, []);

  const catName = (slug) => categories.find((c) => c.slug === slug)?.name ?? slug;

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (posts || []).filter(
      (p) =>
        (!term || p.title.toLowerCase().includes(term) || p.slug.includes(term)) &&
        (!cat || p.category === cat) &&
        (!status || p.status === status) &&
        (!lang || (p.lang || 'en') === lang)
    );
  }, [posts, q, cat, status, lang]);

  useEffect(() => setPage(1), [q, cat, status, lang]);

  const languages = useMemo(() => [...new Set((posts || []).map((p) => p.lang || 'en'))].sort(), [posts]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const remove = async (post) => {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    try {
      await api(`/admin/posts/${post.id}`, { method: 'DELETE' });
      setPosts((list) => list.filter((p) => p.id !== post.id));
    } catch (e) {
      alert(e.message);
    }
  };

  if (error) return <p className="error-text">{error}</p>;
  if (!posts) return <div className="spinner"></div>;

  return (
    <>
      <div className="page-head">
        <h1>
          All <span>Articles</span>
        </h1>
        <Link to="/posts/new" className="btn btn-primary">
          <i className="fa-solid fa-plus"></i> Add Article
        </Link>
      </div>

      <div className="filters">
        <div className="search">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input placeholder="Search articles..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <select value={lang} onChange={(e) => setLang(e.target.value)}>
          <option value="">All languages</option>
          {languages.map((code) => (
            <option key={code} value={code}>
              {languageName(code)}
            </option>
          ))}
        </select>
      </div>

      <div className="panel">
        <p className="muted small">{filtered.length} articles</p>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th></th>
                <th>Title</th>
                <th className="hide-sm">Category</th>
                <th className="hide-sm">Status</th>
                <th className="hide-sm">Date</th>
                <th className="right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((p) => (
                <tr key={p.id}>
                  <td className="thumb-cell">{p.image && <img src={p.image} alt="" className="thumb" />}</td>
                  <td>
                    <Link to={`/posts/${p.id}`} className="title-link">
                      {p.title}
                    </Link>
                    <div className="muted small">
                      <span className="lang-badge" title={languageName(p.lang)}>
                        {p.lang || 'en'}
                      </span>{' '}
                      /{p.slug}
                    </div>
                  </td>
                  <td className="hide-sm">{catName(p.category)}</td>
                  <td className="hide-sm">
                    <span className={`status ${p.status}`}>{p.status}</span>
                  </td>
                  <td className="hide-sm nowrap">{formatDate(p.date)}</td>
                  <td className="right nowrap">
                    {p.status === 'published' && (
                      <a href={`${SITE_URL}/${p.slug}`} target="_blank" rel="noreferrer" className="icon-btn" title="View">
                        <i className="fa-solid fa-eye"></i>
                      </a>
                    )}
                    <Link to={`/posts/${p.id}`} className="icon-btn" title="Edit">
                      <i className="fa-solid fa-pen"></i>
                    </Link>
                    <button className="icon-btn danger" onClick={() => remove(p)} title="Delete">
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan="6" className="empty">
                    No articles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pager">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button key={n} className={n === page ? 'active' : ''} onClick={() => setPage(n)}>
                {n}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
