import { Link } from 'react-router-dom';
import useSeo from '../useSeo.js';
import { useSite } from '../data/SiteData.jsx';
import { ContactLine, LAST_UPDATED } from './PrivacyPolicy.jsx';

export default function Terms() {
  useSeo();
  const { siteName: SITE_NAME, siteDomain: SITE_DOMAIN } = useSite();

  return (
    <div className="container static-page" id="mainContainer">
      <h1>
        Terms and <span>Conditions</span>
      </h1>
      <p>
        <em>Last updated: {LAST_UPDATED}</em>
      </p>
      <p>
        Welcome to {SITE_NAME} ({SITE_DOMAIN}). By accessing or using this website you agree to these Terms and
        Conditions. If you do not agree, please do not use the website.
      </p>

      <h2>Use of the Website</h2>
      <p>
        You may read, share links to and print articles for personal, non-commercial use. You agree not to use the
        website for any unlawful purpose, to attempt to gain unauthorised access to it, to disrupt its operation, or to
        copy content in bulk by automated means.
      </p>

      <h2>Intellectual Property</h2>
      <p>
        Unless stated otherwise, the articles, text, graphics and logo on this website belong to {SITE_NAME} and are
        protected by copyright. You may quote short excerpts with a clear link back to the original article.
        Republishing whole articles without written permission is not allowed. Trademarks and images of third parties
        remain the property of their owners.
      </p>

      <h2>Accuracy of Information</h2>
      <p>
        We work to keep our articles accurate and up to date, but information can change and errors can happen. Content
        is provided for general information only. Please read our <Link to="/disclaimer">Disclaimer</Link>.
      </p>

      <h2>Third-Party Links and Advertising</h2>
      <p>
        The website contains links to other websites and shows advertisements served by third parties such as Google.
        We do not control and are not responsible for their content, products or services. How advertising partners use
        data is described in our <Link to="/privacypolicy">Privacy Policy</Link>.
      </p>

      <h2>Limitation of Liability</h2>
      <p>
        The website is provided "as is" without warranties of any kind. To the fullest extent permitted by law,{' '}
        {SITE_NAME} is not liable for any loss or damage arising from your use of the website or reliance on its
        content.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these Terms from time to time. Continued use of the website after changes are posted means you
        accept the updated Terms.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these Terms? Contact us <ContactLine />.
      </p>
    </div>
  );
}
