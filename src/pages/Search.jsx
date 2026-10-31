import { useSearchParams } from 'react-router-dom';
import ArticleCards from '../components/ArticleCards.jsx';
import Pagination, { paginate } from '../components/Pagination.jsx';
import useSeo from '../useSeo.js';
import { useSite } from '../data/SiteData.jsx';

export default function Search() {
  const { searchPosts } = useSite();
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';
  const results = searchPosts(q);
  const { page, totalPages, pageItems } = paginate(results, params);
  useSeo({ title: q ? `Search: ${q}` : 'Search' });

  return (
    <div className="container" id="mainContainer">
      <div className="section-header">
        <h1>
          Search results for <span>"{q}"</span>
        </h1>
        <p className="result-count">
          {results.length} {results.length === 1 ? 'article' : 'articles'} found
        </p>
      </div>
      {results.length ? (
        <>
          <ArticleCards posts={pageItems} />
          <Pagination page={page} totalPages={totalPages} />
        </>
      ) : (
        <p className="empty-state">No articles matched your search. Try a different keyword.</p>
      )}
    </div>
  );
}
