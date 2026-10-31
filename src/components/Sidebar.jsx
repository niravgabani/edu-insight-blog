import { Link } from 'react-router-dom';

export default function Sidebar({ posts }) {
  return (
    <aside className="sidebar">
      <h2>
        Latest <span className="art-color">Articles</span>
      </h2>
      <ul>
        {posts.map((p) => (
          <li key={p.slug}>
            <Link to={`/${p.slug}`}>
              <img src={p.image} alt={p.title} loading="lazy" />
              <div>
                <h3>{p.title}</h3>
                <span>Read More</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
