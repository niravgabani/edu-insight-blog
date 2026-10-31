import { Link, useLocation } from 'react-router-dom';

// Page links keep the current path and any other query params (e.g. ?q= on search)
export default function Pagination({ page, totalPages }) {
  const { pathname, search } = useLocation();
  if (totalPages <= 1) return null;

  const hrefFor = (n) => {
    const params = new URLSearchParams(search);
    if (n === 1) params.delete('page');
    else params.set('page', n);
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  return (
    <nav className="pagination" aria-label="Pagination">
      {page > 1 && (
        <Link to={hrefFor(page - 1)} aria-label="Previous page">
          <i className="fa-solid fa-chevron-left"></i>
        </Link>
      )}
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
        <Link key={n} to={hrefFor(n)} className={n === page ? 'active' : ''}>
          {n}
        </Link>
      ))}
      {page < totalPages && (
        <Link to={hrefFor(page + 1)} aria-label="Next page">
          <i className="fa-solid fa-chevron-right"></i>
        </Link>
      )}
    </nav>
  );
}

export function paginate(items, searchParams, perPage = 9) {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const requested = parseInt(searchParams.get('page'), 10) || 1;
  const page = Math.min(Math.max(requested, 1), totalPages);
  return { page, totalPages, pageItems: items.slice((page - 1) * perPage, page * perPage) };
}
