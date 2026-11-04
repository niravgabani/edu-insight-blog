import { Link } from 'react-router-dom';
import useSeo from '../useSeo.js';
import { useSite } from '../data/SiteData.jsx';

export const LAST_UPDATED = 'November 4, 2026';

// Contact line used by the legal pages: the email from Admin → Settings, or the contact form
export function ContactLine() {
  const { settings } = useSite();
  return settings.contactEmail ? (
    <>
      by email at <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a> or through our{' '}
      <Link to="/contactus">Contact Us</Link> page
    </>
  ) : (
    <>
      through our <Link to="/contactus">Contact Us</Link> page
    </>
  );
}

export default function PrivacyPolicy() {
  useSeo();
  const { siteName: SITE_NAME, siteDomain: SITE_DOMAIN } = useSite();

  return (
    <div className="container static-page" id="mainContainer">
      <h1>
        Privacy <span>Policy</span>
      </h1>
      <p>
        <em>Last updated: {LAST_UPDATED}</em>
      </p>
      <p>
        At {SITE_NAME} ({SITE_DOMAIN}), the privacy of our visitors is important to us. This Privacy Policy explains
        what information we collect, how we use it, and the choices you have. By using this website you agree to this
        policy.
      </p>

      <h2>Information We Collect</h2>
      <p>
        <strong>Information you give us:</strong> when you use our contact form we receive your name, email address and
        the message you write. We use it only to reply to you.
      </p>
      <p>
        <strong>Information collected automatically:</strong> like most websites, our servers and service providers
        record standard log data such as your IP address, browser type, device, referring page, the pages you visit and
        the time of your visit. We use this to run and secure the website and to understand which content is useful.
      </p>

      <h2>Cookies and Web Beacons</h2>
      <p>
        Cookies are small text files stored on your device. We and our partners use cookies and similar technologies to
        remember your preferences, measure how the site is used, and show and measure advertising. You can block or
        delete cookies in your browser settings; some features may then not work as intended.
      </p>

      <h2>Google AdSense and Advertising</h2>
      <p>
        We use Google AdSense to show advertisements. Google, as a third-party vendor, uses cookies to serve ads on this
        website. Google's use of advertising cookies (including the DoubleClick cookie) enables it and its partners to
        serve ads to you based on your visit to this site and/or other sites on the Internet.
      </p>
      <ul>
        <li>
          You may opt out of personalised advertising by visiting{' '}
          <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">
            Google Ads Settings
          </a>
          .
        </li>
        <li>
          You can also opt out of some third-party vendors' use of cookies for personalised advertising at{' '}
          <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">
            www.aboutads.info
          </a>{' '}
          or, in Europe,{' '}
          <a href="https://www.youronlinechoices.eu/" target="_blank" rel="noopener noreferrer">
            www.youronlinechoices.eu
          </a>
          .
        </li>
        <li>
          Learn more about how Google uses information from sites that use its services:{' '}
          <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">
            How Google uses data
          </a>{' '}
          and{' '}
          <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">
            Google advertising
          </a>
          .
        </li>
      </ul>
      <p>
        Other third-party ad servers or ad networks may also use cookies, JavaScript or web beacons in their
        advertisements. They automatically receive your IP address when this occurs. {SITE_NAME} has no access to or
        control over these cookies; please consult the privacy policies of those advertisers for their practices.
      </p>

      <h2>Google Analytics</h2>
      <p>
        We use Google Analytics to understand how visitors use the website (for example, pages viewed and time spent).
        Google Analytics uses cookies and collects data in aggregated form. You can prevent this with the{' '}
        <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">
          Google Analytics opt-out browser add-on
        </a>
        .
      </p>

      <h2>How We Use Information</h2>
      <ul>
        <li>To provide, operate and maintain the website</li>
        <li>To improve and personalise content and understand how it is used</li>
        <li>To show relevant advertising that keeps the website free</li>
        <li>To reply to messages you send us</li>
        <li>To detect and prevent fraud, spam and abuse</li>
      </ul>
      <p>We do not sell your personal information.</p>

      <h2>Links to Other Websites</h2>
      <p>
        Our articles may link to other websites. We are not responsible for the content or privacy practices of those
        sites, and we encourage you to read their privacy policies.
      </p>

      <h2>Your Privacy Rights (GDPR and CCPA)</h2>
      <p>
        Depending on where you live, you may have the right to access, correct or delete the personal data we hold
        about you, to object to or restrict its processing, to withdraw consent, and to know what data is collected and
        whether it is sold or shared. Visitors in the European Economic Area, the United Kingdom and Switzerland are
        asked for consent before personalised ads are shown. To make a request, contact us <ContactLine />; we will
        respond within 30 days.
      </p>

      <h2>Children's Information</h2>
      <p>
        This website is not directed at children under 13, and we do not knowingly collect personal information from
        them. If you believe your child has provided such information, please contact us and we will promptly remove it.
      </p>

      <h2>Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Changes are posted on this page with a new "Last updated"
        date.
      </p>

      <h2>Contact Us</h2>
      <p>
        If you have any questions about this Privacy Policy, you can contact us <ContactLine />. See also our{' '}
        <Link to="/terms">Terms and Conditions</Link> and <Link to="/disclaimer">Disclaimer</Link>.
      </p>
    </div>
  );
}
