import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatDate } from '../api.js';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/admin/stats').then(setStats).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error-text">{error}</p>;
  if (!stats) return <div className="spinner"></div>;

  const cards = [
    { label: 'Total Articles', value: stats.posts, icon: 'fa-newspaper', to: '/posts' },
    { label: 'Published', value: stats.published, icon: 'fa-circle-check', to: '/posts' },
    { label: 'Drafts', value: stats.drafts, icon: 'fa-file-pen', to: '/posts' },
    { label: 'Categories', value: stats.categories, icon: 'fa-folder', to: '/categories' },
    { label: 'Messages', value: stats.messages, icon: 'fa-envelope', to: '/messages', badge: stats.unread },
  ];

  return (
    <>
      <div className="page-head">
        <h1>
          Dash<span>board</span>
        </h1>
        <Link to="/posts/new" className="btn btn-primary">
          <i className="fa-solid fa-plus"></i> Add Article
        </Link>
      </div>

      <div className="stat-grid">
        {cards.map((c) => (
          <Link to={c.to} className="stat-card" key={c.label}>
            <span className="stat-icon">
              <i className={`fa-solid ${c.icon}`}></i>
            </span>
            <div>
              <strong>{c.value}</strong>
              <span>
                {c.label}
                {c.badge > 0 && <em className="badge">{c.badge} new</em>}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Recent Articles</h2>
          <Link to="/posts">View all</Link>
        </div>
        <table className="table">
          <tbody>
            {stats.recent.map((p) => (
              <tr key={p.id}>
                <td className="thumb-cell">{p.image && <img src={p.image} alt="" className="thumb" />}</td>
                <td>
                  <Link to={`/posts/${p.id}`} className="title-link">
                    {p.title}
                  </Link>
                </td>
                <td className="hide-sm">
                  <span className={`status ${p.status}`}>{p.status}</span>
                </td>
                <td className="hide-sm nowrap">{formatDate(p.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
