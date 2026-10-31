import { Link, useSearchParams } from 'react-router-dom';
import ArticleCards from '../components/ArticleCards.jsx';
import Pagination, { paginate } from '../components/Pagination.jsx';
import useSeo from '../useSeo.js';
import { useSite } from '../data/SiteData.jsx';

export default function Blog() {
  const [params] = useSearchParams();
  const { categories, posts } = useSite(); // already sorted newest first by the API
  const { page, totalPages, pageItems } = paginate(posts, params);
  useSeo({ title: page > 1 ? `All Articles - Page ${page}` : 'All Articles' });

  return (
    <div className="container" id="mainContainer">
      <div className="section-header">
        <h1>
          All <span>Articles</span>
        </h1>
        <p className="result-count">{posts.length} articles</p>
      </div>
      <div className="category-chips">
        {categories.map((c) => (
          <Link key={c.slug} to={`/category/${c.slug}`}>
            {c.name}
          </Link>
        ))}
      </div>
      <ArticleCards posts={pageItems} />
      <Pagination page={page} totalPages={totalPages} />
    </div>
  );
}
