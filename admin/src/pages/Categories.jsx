import { useEffect, useState } from 'react';
import { api, slugify, SITE_URL, LANGUAGES, languageName } from '../api.js';

export default function Categories() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [lang, setLang] = useState('en');
  const [editing, setEditing] = useState(null); // { original, name, slug, lang, description }

  const load = () =>
    api('/admin/categories')
      .then(setItems)
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  const add = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api('/admin/categories', { method: 'POST', body: { name, lang } });
      setName('');
      load();
    } catch (ex) {
      setError(ex.message);
    }
  };

  const saveEdit = async () => {
    setError('');
    try {
      await api(`/admin/categories/${encodeURIComponent(editing.original)}`, {
        method: 'PUT',
        body: { name: editing.name, slug: editing.slug, lang: editing.lang, description: editing.description },
      });
      setEditing(null);
      load();
    } catch (ex) {
      setError(ex.message);
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete category "${c.name}"?`)) return;
    setError('');
    try {
      await api(`/admin/categories/${encodeURIComponent(c.slug)}`, { method: 'DELETE' });
      load();
    } catch (ex) {
      setError(ex.message);
    }
  };

  return (
    <>
      <div className="page-head">
        <h1>
          Cate<span>gories</span>
        </h1>
      </div>

      <form className="panel inline-form" onSubmit={add}>
        <input placeholder="New category name" value={name} onChange={(e) => setName(e.target.value)} />
        <select value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Language">
          <LanguageOptions />
        </select>
        <button className="btn btn-primary" disabled={!name.trim()}>
          <i className="fa-solid fa-plus"></i> Add Category
        </button>
      </form>

      {error && <div className="alert error">{error}</div>}

      {!items ? (
        <div className="spinner"></div>
      ) : (
        <div className="panel">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th className="hide-sm">Language</th>
                  <th>Articles</th>
                  <th className="right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) =>
                  editing?.original === c.slug ? (
                    <tr key={c.slug}>
                      <td>
                        <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                      </td>
                      <td>
                        <input
                          value={editing.slug}
                          onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                          onBlur={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })}
                        />
                        <textarea
                          rows="2"
                          className="mt"
                          placeholder="SEO description (optional)"
                          value={editing.description}
                          onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                        />
                      </td>
                      <td className="hide-sm">
                        <select value={editing.lang} onChange={(e) => setEditing({ ...editing, lang: e.target.value })}>
                          <LanguageOptions />
                        </select>
                      </td>
                      <td>{c.count}</td>
                      <td className="right nowrap">
                        <button className="btn btn-primary sm" onClick={saveEdit}>
                          Save
                        </button>{' '}
                        <button className="btn btn-light sm" onClick={() => setEditing(null)}>
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={c.slug}>
                      <td className="title-link">{c.name}</td>
                      <td className="muted">{c.slug}</td>
                      <td className="hide-sm">{languageName(c.lang)}</td>
                      <td>{c.count}</td>
                      <td className="right nowrap">
                        <a
                          href={`${SITE_URL}/category/${c.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="icon-btn"
                          title="View"
                        >
                          <i className="fa-solid fa-eye"></i>
                        </a>
                        <button
                          className="icon-btn"
                          title="Edit"
                          onClick={() =>
                            setEditing({
                              original: c.slug,
                              name: c.name,
                              slug: c.slug,
                              lang: c.lang || 'en',
                              description: c.description || '',
                            })
                          }
                        >
                          <i className="fa-solid fa-pen"></i>
                        </button>
                        <button className="icon-btn danger" title="Delete" onClick={() => remove(c)}>
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

const LanguageOptions = () =>
  LANGUAGES.map(([code, name]) => (
    <option key={code} value={code}>
      {name}
    </option>
  ));
