import { Link } from 'react-router-dom';
import useSeo from '../useSeo.js';

export default function NotFound() {
  useSeo({ notFound: true });

  return (
    <div className="container static-page not-found" id="mainContainer">
      <h1>
        404 <span>Page Not Found</span>
      </h1>
      <p>The page you are looking for doesn't exist or has been moved.</p>
      <Link to="/" className="read-more-btn">
        <span className="text">Go Home</span>
        <span className="icon">&gt;</span>
      </Link>
    </div>
  );
}
