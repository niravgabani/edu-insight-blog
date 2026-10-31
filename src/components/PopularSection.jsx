import { Link } from 'react-router-dom';

export default function PopularSection({ posts }) {
  const grid = posts.slice(0, 2);
  const wide = posts[1];
  const side = posts.slice(2, 5);

  return (
    <>
      <div className="section-header">
        <h2>
          <strong>Popular</strong> <span>Articles</span>
        </h2>
      </div>
      <section className="articles-section">
        <div className="left-artical">
          <div className="articles-grid">
            {grid.map((p) => (
              <article className="card-1" key={p.slug}>
                <Link to={`/${p.slug}`}>
                  <img src={p.image} alt={p.title} loading="lazy" />
                  <h3>{p.title}</h3>
                  <span>Read More</span>
                </Link>
              </article>
            ))}
          </div>
          {wide && (
            <article className="mansh">
              <Link to={`/${wide.slug}`}>
                <img src={wide.image} alt={wide.title} loading="lazy" />
                <div className="mansh-content">
                  <h3>{wide.title}</h3>
                  <span>Read More</span>
                </div>
              </Link>
            </article>
          )}
        </div>
        <div className="right-artical">
          {side.map((p) => (
            <Link to={`/${p.slug}`} key={p.slug}>
              <article className="card">
                <img src={p.image} alt={p.title} loading="lazy" />
                <div className="right-text">
                  <h3>{p.title}</h3>
                  <span>Read More</span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
