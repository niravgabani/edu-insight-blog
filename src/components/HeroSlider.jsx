import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { truncate } from '../utils.js';

export default function HeroSlider({ items, autoPlay = 6000 }) {
  const [active, setActive] = useState(0);

  useEffect(() => setActive(0), [items]);

  // Auto-advance; restarting the timer whenever the slide changes
  useEffect(() => {
    if (!autoPlay || items.length < 2) return;
    const id = setInterval(() => setActive((i) => (i + 1) % items.length), autoPlay);
    return () => clearInterval(id);
  }, [items, autoPlay, active]);

  if (!items.length) return null;
  const post = items[Math.min(active, items.length - 1)];
  const url = `/${post.slug}`;

  return (
    <section className="main-section">
      <div className="content-left article-item fade-in" key={`t-${post.slug}`}>
        <h2>
          <Link to={url}>{post.title}</Link>
        </h2>
        <Link to={url}>
          <p className="article-description">{truncate(post.excerpt)}</p>
        </Link>
        <Link to={url} className="read-more-btn">
          <span className="text">Read More</span>
          <span className="icon">&gt;</span>
        </Link>
        {items.length > 1 && (
          <div className="number-container">
            {items.map((p, i) => (
              <button
                key={p.slug}
                className={`number-button${i === active ? ' dark' : ''}`}
                onClick={() => setActive(i)}
                aria-label={`Show slide ${i + 1}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="image-container article-item fade-in" key={`i-${post.slug}`}>
        <Link to={url}>
          <div className="hero-img-absolute"></div>
        </Link>
        <Link to={url}>
          <img src={post.image} alt={post.title} className="main-image" />
        </Link>
        <div className="hero-img-absolute-bottom"></div>
      </div>
    </section>
  );
}
