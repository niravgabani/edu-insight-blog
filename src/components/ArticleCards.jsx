import { Link } from 'react-router-dom';

// Image card with an overlapping white title box (Latest Articles, category & search pages)
export default function ArticleCards({ posts }) {
  return (
    <div className="articles">
      {posts.map((p) => (
        <div className="article-card" key={p.slug}>
          <Link to={`/${p.slug}`}>
            <img src={p.image} alt={p.title} loading="lazy" />
            <h3>{p.title}</h3>
            <span className="icon">&gt;</span>
          </Link>
        </div>
      ))}
    </div>
  );
}
