import { Link } from 'react-router-dom';
import useSeo from '../useSeo.js';
import { useSite } from '../data/SiteData.jsx';
import { ContactLine, LAST_UPDATED } from './PrivacyPolicy.jsx';

export default function Disclaimer() {
  useSeo();
  const { siteName: SITE_NAME } = useSite();

  return (
    <div className="container static-page" id="mainContainer">
      <h1>
        <span>Disclaimer</span>
      </h1>
      <p>
        <em>Last updated: {LAST_UPDATED}</em>
      </p>
      <p>
        All information on {SITE_NAME} is published in good faith and for general information purposes only. We make no
        warranties about the completeness, reliability or accuracy of this information. Any action you take based on it
        is strictly at your own risk.
      </p>

      <h2>No Professional Advice</h2>
      <p>
        Articles about health, finance, law, education, careers or similar topics are not a substitute for advice from a
        qualified professional. Always check with a doctor, financial adviser, lawyer or the relevant official authority
        before making decisions. Dates, fees, deadlines and results mentioned in articles should be confirmed on the
        official website of the organisation concerned.
      </p>

      <h2>News and Trending Topics</h2>
      <p>
        News and trending articles are based on information available at the time of writing and link to their
        sources where possible. Details may change after publication. Some articles are drafted with the help of AI
        writing tools and are researched from public sources.
      </p>

      <h2>External Links</h2>
      <p>
        Our articles may link to external websites. We have no control over their content and nature, and a link does
        not imply a recommendation of everything found on them. Websites can change without notice.
      </p>

      <h2>Advertising</h2>
      <p>
        This website shows advertisements, including ads served by Google AdSense. We are not responsible for the
        products or services advertised. See our <Link to="/privacypolicy">Privacy Policy</Link> for how advertising
        cookies are used.
      </p>

      <h2>Corrections</h2>
      <p>
        If you find an error or outdated information, please let us know <ContactLine /> and we will correct it as soon
        as possible.
      </p>
    </div>
  );
}
