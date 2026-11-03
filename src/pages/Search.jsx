import { useSearchParams } from 'react-router-dom';
import ArticleCards from '../components/ArticleCards.jsx';
import Pagination, { pageParam } from '../components/Pagination.jsx';
import useSeo from '../useSeo.js';
import { useApi, query } from '../api.js';
import { Loading } from '../data/SiteData.jsx';

export default function Search() {
  const [params] = useSearchParams();
  const q = (params.get('q') ?? '').trim();
  const { data } = useApi(q ? `/api/posts${query({ q, page: pageParam(params) })}` : null);
  useSeo({ title: q ? `Search: ${q}` : 'Search' });

  const total = q ? data?.total : 0;

  return (
    <div className="container" id="mainContainer">
      <div className="section-header">
        <h1>
          Search results for <span>"{q}"</span>
        </h1>
        {total !== undefined && (
          <p className="result-count">
            {total} {total === 1 ? 'article' : 'articles'} found
          </p>
        )}
      </div>
      {q && !data ? (
        <Loading />
      ) : total ? (
        <>
          <ArticleCards posts={data.posts} />
          <Pagination page={data.page} totalPages={data.pages} />
        </>
      ) : (
        <p className="empty-state">No articles matched your search. Try a different keyword.</p>
      )}
    </div>
  );
}
