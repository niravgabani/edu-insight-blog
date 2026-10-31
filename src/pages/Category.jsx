import { useParams, useSearchParams } from 'react-router-dom';
import HeroSlider from '../components/HeroSlider.jsx';
import ArticleCards from '../components/ArticleCards.jsx';
import Pagination, { paginate } from '../components/Pagination.jsx';
import NotFound from './NotFound.jsx';
import useSeo from '../useSeo.js';
import { useSite } from '../data/SiteData.jsx';

export default function Category() {
  const { slug } = useParams();
  const { getCategory, postsByCategory } = useSite();
  const [params] = useSearchParams();
  const category = getCategory(slug);
  useSeo(category ? { category } : { notFound: true });

  if (!category) return <NotFound />;

  const items = postsByCategory(slug);
  const { page, totalPages, pageItems } = paginate(items.slice(3), params);

  return (
    <div className="container" id="mainContainer">
      <div className="section-header">
        <h1>{category.name}</h1>
      </div>
      {items.length === 0 ? (
        <p className="empty-state">No articles in this category yet. Check back soon!</p>
      ) : (
        <>
          <HeroSlider items={items.slice(0, 3)} />
          {pageItems.length > 0 && (
            <>
              <h2 className="section-title">
                More in <span>{category.name}</span>
              </h2>
              <ArticleCards posts={pageItems} />
              <Pagination page={page} totalPages={totalPages} />
            </>
          )}
        </>
      )}
    </div>
  );
}
