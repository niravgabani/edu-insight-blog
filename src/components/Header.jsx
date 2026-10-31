import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from './Logo.jsx';
import { useSite } from '../data/SiteData.jsx';

export default function Header() {
  const { categories } = useSite();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const close = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  // Close dropdown on navigation
  useEffect(() => setMenuOpen(false), [location]);

  const performSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="header">
      <div className="container">
        <header className="header-content">
          <Logo />
          <div className="header-right">
            <form onSubmit={performSearch} className="searchForm">
              <div className="search-container">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search articles"
                />
                <button type="submit" className="fas fa-search search-icon" aria-label="Search"></button>
              </div>
            </form>
            <div className="dropdown-container" ref={dropdownRef}>
              <button
                id="dropdownBtn"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Categories menu"
                aria-expanded={menuOpen}
              >
                <i className={`fa-solid ${menuOpen ? 'fa-xmark' : 'fa-bars'} fa-xl`}></i>
              </button>
              <div className={`menu-dropdown${menuOpen ? ' show' : ''}`}>
                <Link to="/blog" className="menu-all">
                  All Articles
                </Link>
                {categories.map((c) => (
                  <Link key={c.slug} to={`/category/${c.slug}`}>
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </header>
      </div>
    </div>
  );
}
