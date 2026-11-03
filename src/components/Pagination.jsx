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
      {pageNumbers(page, totalPages).map((n, i) =>
        n === null ? (
          <span key={`gap-${i}`} className="gap">
            …
          </span>
        ) : (
          <Link key={n} to={hrefFor(n)} className={n === page ? 'active' : ''}>
            {n}
          </Link>
        )
      )}
      {page < totalPages && (
        <Link to={hrefFor(page + 1)} aria-label="Next page">
          <i className="fa-solid fa-chevron-right"></i>
        </Link>
      )}
    </nav>
  );
}

// First, last and the pages around the current one; null marks a gap ("…")
function pageNumbers(page, total) {
  const near = new Set([1, total, page - 2, page - 1, page, page + 1, page + 2]);
  const list = [...near].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  return list.flatMap((n, i) => (i > 0 && n - list[i - 1] > 1 ? [null, n] : [n]));
}

export const pageParam = (searchParams) => Math.max(parseInt(searchParams.get('page'), 10) || 1, 1);
