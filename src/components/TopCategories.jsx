import { Link } from 'react-router-dom';

const icons = {
  education: 'fa-book-open',
  technology: 'fa-microchip',
  auto: 'fa-car',
  travel: 'fa-plane',
  business: 'fa-briefcase',
  finance: 'fa-coins',
  health: 'fa-heart-pulse',
  fashion: 'fa-shirt',
  machinery: 'fa-gears',
  'real-estate': 'fa-house',
  entertainment: 'fa-gamepad',
  lifestyle: 'fa-mug-hot',
};

export default function TopCategories({ items }) {
  return (
    <section className="categories">
      <h2>
        <span className="bold">Top</span> <span className="highlight">Categories</span>
      </h2>
      <div className="cards">
        {items.map((c) => (
          <Link to={`/category/${c.slug}`} key={c.slug}>
            <div className="Top">
              <i className={`fa-solid ${icons[c.slug] || 'fa-folder'} top-icon`}></i>
              <span>{c.name}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
