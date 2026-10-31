import { Link } from 'react-router-dom';
import HeroSlider from '../components/HeroSlider.jsx';
import PopularSection from '../components/PopularSection.jsx';
import TopCategories from '../components/TopCategories.jsx';
import LatestArticles from '../components/LatestArticles.jsx';
import TrendingSection from '../components/TrendingSection.jsx';
import FeaturedArticles from '../components/FeaturedArticles.jsx';
import useSeo from '../useSeo.js';
import { useSite } from '../data/SiteData.jsx';

export default function Home() {
  useSeo();
  const { home } = useSite();

  return (
    <>
      <div className="container" id="mainContainer">
        <HeroSlider items={home.hero} />
        <PopularSection posts={home.popular} />
      </div>
      <div className="container">
        <TopCategories items={home.topCategories} />
      </div>
      <LatestArticles posts={home.latest} />
      <TrendingSection posts={home.trending} imagePost={home.trendingImage} />
      <FeaturedArticles posts={home.featured} />
      <div className="container view-all">
        <Link to="/blog" className="read-more-btn">
          <span className="text">All Articles</span>
          <span className="icon">&gt;</span>
        </Link>
      </div>
    </>
  );
}
