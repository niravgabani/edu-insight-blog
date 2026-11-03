import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatDate, SITE_URL, LANGUAGES, languageName } from '../api.js';

export default function Posts() {
  const [result, setResult] = useState(null); // { posts, total, page, pages } from the server
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [status, setStatus] = useState('');
  const [lang, setLang] = useState('');
  const [page, setPage] = useState(1);

  const [reload, setReload] = useState(0);

  useEffect(() => {
    api('/admin/categories')
      .then(setCategories)
      .catch((e) => setError(e.message));
  }, []);

  // Filtering and paging happen on the server (there can be thousands of articles)
  useEffect(() => {
    const params = new URLSearchParams({ q: q.trim(), category: cat, status, lang, page });
    let active = true;
    const timer = setTimeout(
      () =>
        api(`/admin/posts?${params}`)
          .then((r) => active && setResult(r))
          .catch((e) => active && setError(e.message)),
      q ? 300 : 0 // wait for the user to stop typing
    );
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [q, cat, status, lang, page, reload]);

  const catName = (slug) => categories.find((c) => c.slug === slug)?.name ?? slug;

  // Changing a filter goes back to page 1
  const filter = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const remove = async (post) => {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    try {
      await api(`/admin/posts/${post.id}`, { method: 'DELETE' });
      setReload((n) => n + 1);
    } catch (e) {
      alert(e.message);
    }
  };

  if (error) return <p className="error-text">{error}</p>;
  if (!result) return <div className="spinner"></div>;
  const { posts: pageItems, total, pages: totalPages } = result;

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
          <input placeholder="Search articles..." value={q} onChange={filter(setQ)} />
        </div>
        <select value={cat} onChange={filter(setCat)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={status} onChange={filter(setStatus)}>
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <select value={lang} onChange={filter(setLang)}>
          <option value="">All languages</option>
          {LANGUAGES.map(([code]) => (
            <option key={code} value={code}>
              {languageName(code)}
            </option>
          ))}
        </select>
      </div>

      <div className="panel">
        <p className="muted small">{total} articles</p>
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
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <i className="fa-solid fa-chevron-left"></i> Previous
            </button>
            <span className="muted small">
              Page {page} of {totalPages}
            </span>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              Next <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
