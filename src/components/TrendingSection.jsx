import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { truncate } from '../utils.js';

export default function TrendingSection({ posts, imagePost }) {
  return (
    <div className="container trade-article">
      <h2>
        <span className="art-light">Trending</span> <span className="art-dark">Articles</span>
      </h2>
      <section className="Trending-section">
        <div className="text-left">
          {posts.map((p) => (
            <Fragment key={p.slug}>
              <div className="inner">
                <Link to={`/${p.slug}`}>
                  <h3>{p.title}</h3>
                </Link>
                <Link to={`/${p.slug}`}>
                  <p>{truncate(p.excerpt)}</p>
                </Link>
              </div>
              <hr />
            </Fragment>
          ))}
        </div>
        {imagePost && (
          <div className="hotel-pic">
            <Link to={`/${imagePost.slug}`}>
              <img src={imagePost.image} alt={imagePost.title} loading="lazy" />
            </Link>
            <div className="img-box"></div>
          </div>
        )}
      </section>
    </div>
  );
}
