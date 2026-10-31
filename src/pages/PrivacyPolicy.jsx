import useSeo from '../useSeo.js';
import { useSite } from '../data/SiteData.jsx';

export default function PrivacyPolicy() {
  useSeo();
  const { siteName: SITE_NAME, siteDomain: SITE_DOMAIN } = useSite();

  return (
    <div className="container static-page" id="mainContainer">
      <h1>
        Privacy <span>Policy</span>
      </h1>
      <p>
        At {SITE_NAME} ({SITE_DOMAIN}), the privacy of our visitors is important to us. This policy explains what
        information we collect and how we use it.
      </p>
      <h2>Information We Collect</h2>
      <p>
        We may collect information you provide directly, such as your name and email address when you contact us, as
        well as standard log data such as browser type, pages visited and time spent on the site.
      </p>
      <h2>Cookies</h2>
      <p>
        We use cookies to improve your browsing experience and to understand how visitors use the site. You can
        disable cookies in your browser settings at any time.
      </p>
      <h2>Third-Party Services</h2>
      <p>
        We may use third-party analytics and advertising partners. These services may use cookies or similar
        technologies according to their own privacy policies.
      </p>
      <h2>Your Rights</h2>
      <p>
        You may request access to, correction of, or deletion of your personal data at any time by contacting us
        through our Contact Us page.
      </p>
      <h2>Changes to This Policy</h2>
      <p>We may update this policy from time to time. Changes will be posted on this page.</p>
    </div>
  );
}
