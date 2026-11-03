import { Link, useSearchParams } from 'react-router-dom';
import ArticleCards from '../components/ArticleCards.jsx';
import Pagination, { pageParam } from '../components/Pagination.jsx';
import useSeo from '../useSeo.js';
import { useApi, query } from '../api.js';
import { useSite, Loading } from '../data/SiteData.jsx';

export default function Blog() {
  const [params] = useSearchParams();
  const { categories } = useSite();
  const { data } = useApi(`/api/posts${query({ page: pageParam(params) })}`);
  const page = data?.page ?? pageParam(params);
  useSeo({ title: page > 1 ? `All Articles - Page ${page}` : 'All Articles' });

  return (
    <div className="container" id="mainContainer">
      <div className="section-header">
        <h1>
          All <span>Articles</span>
        </h1>
        {data && <p className="result-count">{data.total} articles</p>}
      </div>
      <div className="category-chips">
        {categories.map((c) => (
          <Link key={c.slug} to={`/category/${c.slug}`}>
            {c.name}
          </Link>
        ))}
      </div>
      {data ? (
        <>
          <ArticleCards posts={data.posts} />
          <Pagination page={data.page} totalPages={data.pages} />
        </>
      ) : (
        <Loading />
      )}
    </div>
  );
}
