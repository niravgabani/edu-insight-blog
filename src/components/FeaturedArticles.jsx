import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export default function FeaturedArticles({ posts }) {
  const rowRef = useRef(null);
  const [progress, setProgress] = useState(0);

  // Indicator bar follows horizontal scroll (cards scroll sideways on small screens)
  const onScroll = () => {
    const el = rowRef.current;
    const max = el.scrollWidth - el.clientWidth;
    setProgress(max > 0 ? el.scrollLeft / max : 0);
  };

  return (
    <div className="container">
      <h2 className="section-title">
        Featured <span>Articles</span>
      </h2>
      <div className="f-Article" ref={rowRef} onScroll={onScroll}>
        {posts.map((p) => (
          <Link to={`/${p.slug}`} key={p.slug}>
            <div className="total-card">
              <img src={p.image} alt={p.title} loading="lazy" />
              <div className="card-list">
                <h3 className="card-desc">{p.title}</h3>
                <div className="read-only">Read More</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <div className="indicator">
        <div className="indicator-track">
          <div className="indicator-bar" style={{ left: `${progress * 60}%` }}></div>
        </div>
      </div>
    </div>
  );
}
