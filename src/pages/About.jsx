import { Link } from 'react-router-dom';
import useSeo from '../useSeo.js';
import { useSite } from '../data/SiteData.jsx';

export default function About() {
  useSeo();
  const { siteName, settings } = useSite();
  // Written in Admin → Settings; blank lines separate paragraphs
  const paragraphs = settings.aboutText
    ? settings.aboutText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
    : null;

  return (
    <div className="container static-page" id="mainContainer">
      <h1>
        About <span>Us</span>
      </h1>
      {paragraphs ? (
        paragraphs.map((p, i) => <p key={i}>{p}</p>)
      ) : (
        <>
          <p>
            {siteName} publishes clear, practical articles on education, technology, business, finance, health, travel
            and more — in several languages — to help readers understand the topics that matter in daily life.
          </p>
          <h2>How We Work</h2>
          <p>
            Our articles are researched from reputable sources, and news and trending topics link to the sources they
            are based on. We update articles when information changes and correct mistakes as soon as we learn about
            them.
          </p>
          <h2>Contact</h2>
          <p>
            Questions, corrections or suggestions are always welcome — please write to us through our{' '}
            <Link to="/contactus">Contact Us</Link> page.
          </p>
        </>
      )}
    </div>
  );
}
