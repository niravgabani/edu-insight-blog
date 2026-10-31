import { Link } from 'react-router-dom';
import { useSite } from '../data/SiteData.jsx';

export default function Logo({ light = false }) {
  const { siteName } = useSite();
  const [first, ...rest] = siteName.split(' ');
  return (
    <Link to="/" className={`logo${light ? ' logo-light' : ''}`} aria-label={`${siteName} home`}>
      <span className="logo-mark">
        <i className="fa-solid fa-graduation-cap"></i>
      </span>
      <span className="logo-text">
        {first}
        <span>{rest.join(' ')}</span>
      </span>
    </Link>
  );
}
