import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';
import { useSite } from '../data/SiteData.jsx';

export default function Footer() {
  const { siteDomain } = useSite();
  return (
    <footer>
      <div className="footer-top">
        <div className="footer-logo">
          <Logo light />
        </div>
        <div className="footer-links">
          <Link to="/blog">All Articles</Link>
          <Link to="/privacypolicy">Privacy Policy</Link>
          <Link to="/contactus">Contact Us</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <Link to="/">{siteDomain}</Link>&nbsp; &copy; {new Date().getFullYear()}
      </div>
    </footer>
  );
}
