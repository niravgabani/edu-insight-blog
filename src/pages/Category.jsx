import { useParams, useSearchParams } from 'react-router-dom';
import HeroSlider from '../components/HeroSlider.jsx';
import ArticleCards from '../components/ArticleCards.jsx';
import Pagination, { pageParam } from '../components/Pagination.jsx';
import NotFound from './NotFound.jsx';
import useSeo from '../useSeo.js';
import { useApi, paths } from '../api.js';
import { useSite, Loading } from '../data/SiteData.jsx';

const HERO_COUNT = 3;

export default function Category() {
  const { slug } = useParams();
  const { getCategory } = useSite();
  const [params] = useSearchParams();
  const category = getCategory(slug);
  useSeo(category ? { category } : { notFound: true });

  // The newest 3 go in the slider; the paginated list starts after them
  const hero = useApi(category ? paths.categoryHero(slug, HERO_COUNT) : null);
  const list = useApi(category ? paths.categoryList(slug, HERO_COUNT, pageParam(params)) : null);

  if (!category) return <NotFound />;

  return (
    <div className="container" id="mainContainer">
      <div className="section-header">
        <h1>{category.name}</h1>
      </div>
      {!hero.data || !list.data ? (
        <Loading />
      ) : hero.data.total === 0 ? (
        <p className="empty-state">No articles in this category yet. Check back soon!</p>
      ) : (
        <>
          <HeroSlider items={hero.data.posts} />
          {list.data.posts.length > 0 && (
            <>
              <h2 className="section-title">
                More in <span>{category.name}</span>
              </h2>
              <ArticleCards posts={list.data.posts} />
              <Pagination page={list.data.page} totalPages={list.data.pages} />
            </>
          )}
        </>
      )}
    </div>
  );
}
