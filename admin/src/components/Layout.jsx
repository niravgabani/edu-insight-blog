import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { SITE_URL } from '../api.js';

const links = [
  { to: '/', icon: 'fa-gauge', label: 'Dashboard', end: true },
  { to: '/posts', icon: 'fa-newspaper', label: 'Articles' },
  { to: '/posts/new', icon: 'fa-pen-to-square', label: 'Add Article' },
  { to: '/categories', icon: 'fa-folder', label: 'Categories' },
  { to: '/homepage', icon: 'fa-house', label: 'Homepage' },
  { to: '/messages', icon: 'fa-envelope', label: 'Messages' },
  { to: '/settings', icon: 'fa-gear', label: 'Settings' },
];

export default function Layout({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className="admin">
      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div className="brand">
          <span className="brand-mark">
            <i className="fa-solid fa-graduation-cap"></i>
          </span>
          Admin <span>Panel</span>
        </div>
        <nav>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end ?? l.to === '/posts'}>
              <i className={`fa-solid ${l.icon}`}></i> {l.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      {open && <div className="backdrop" onClick={() => setOpen(false)}></div>}

      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen(true)} aria-label="Open menu">
            <i className="fa-solid fa-bars"></i>
          </button>
          <div className="topbar-right">
            <a href={`${SITE_URL}/`} target="_blank" rel="noreferrer" className="btn btn-light">
              <i className="fa-solid fa-arrow-up-right-from-square"></i> View Website
            </a>
            <span className="user">
              <i className="fa-solid fa-circle-user"></i> {user}
            </span>
            <button className="btn btn-light" onClick={onLogout}>
              <i className="fa-solid fa-right-from-bracket"></i> Logout
            </button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
