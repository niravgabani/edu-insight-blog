import { useEffect, useState } from 'react';
import { api, SITE_URL } from '../api.js';
import ImageInput from '../components/ImageInput.jsx';

const SITE_FIELDS = ['siteName', 'siteDomain', 'siteUrl', 'metaDescription', 'keywords', 'ogImage'];
const pickSite = (s) => Object.fromEntries(SITE_FIELDS.map((k) => [k, s[k] || '']));

export default function Settings({ onUserChange }) {
  const [site, setSite] = useState(null);
  const [siteMsg, setSiteMsg] = useState({});
  const [pw, setPw] = useState({ username: '', current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState({});

  useEffect(() => {
    api('/admin/settings')
      .then((s) => setSite(pickSite(s)))
      .catch((e) => setSiteMsg({ error: e.message }));
  }, []);

  const saveSite = async (e) => {
    e.preventDefault();
    setSiteMsg({});
    try {
      const s = await api('/admin/settings', { method: 'PUT', body: site });
      setSite(pickSite(s));
      setSiteMsg({ ok: 'Website settings saved.' });
    } catch (ex) {
      setSiteMsg({ error: ex.message });
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPwMsg({});
    if (pw.next !== pw.confirm) return setPwMsg({ error: 'New passwords do not match' });
    try {
      const res = await api('/admin/password', { method: 'PUT', body: pw });
      onUserChange(res.username);
      setPw({ username: '', current: '', next: '', confirm: '' });
      setPwMsg({ ok: 'Login details updated.' });
    } catch (ex) {
      setPwMsg({ error: ex.message });
    }
  };

  return (
    <>
      <div className="page-head">
        <h1>
          Set<span>tings</span>
        </h1>
      </div>

      <div className="section-grid">
        <form className="panel form" onSubmit={saveSite}>
          <h3>Website</h3>
          {!site ? (
            <div className="spinner"></div>
          ) : (
            <>
              <label>
                Site name (logo text)
                <input value={site.siteName} onChange={(e) => setSite({ ...site, siteName: e.target.value })} />
              </label>
              <label>
                Domain (shown in footer)
                <input value={site.siteDomain} onChange={(e) => setSite({ ...site, siteDomain: e.target.value })} />
              </label>
              <h3 className="form-section">
                <i className="fa-solid fa-magnifying-glass-chart"></i> SEO
              </h3>
              <label>
                Website URL (used in Google, sitemap and share links)
                <input
                  value={site.siteUrl}
                  onChange={(e) => setSite({ ...site, siteUrl: e.target.value })}
                  placeholder="https://dailyinfoscope.com"
                />
              </label>
              <label>
                Homepage meta description
                <textarea
                  rows="3"
                  value={site.metaDescription}
                  onChange={(e) => setSite({ ...site, metaDescription: e.target.value })}
                  placeholder="Shown under your site name in Google results"
                />
              </label>
              <label>
                Homepage keywords
                <input
                  value={site.keywords}
                  onChange={(e) => setSite({ ...site, keywords: e.target.value })}
                  placeholder="education, technology, travel, business"
                />
              </label>
              <div className="label">
                Default share image (used when a page has no image)
                <ImageInput value={site.ogImage} onChange={(v) => setSite({ ...site, ogImage: v })} />
              </div>
              <p className="muted small">
                Sitemap for Google Search Console: <code>{(site.siteUrl || SITE_URL || window.location.origin).replace(/\/+$/, '')}/sitemap.xml</code>
              </p>
              {siteMsg.error && <div className="alert error">{siteMsg.error}</div>}
              {siteMsg.ok && <div className="alert success">{siteMsg.ok}</div>}
              <button className="btn btn-primary">Save</button>
            </>
          )}
        </form>

        <form className="panel form" onSubmit={savePassword}>
          <h3>Login Details</h3>
          <label>
            New username (optional)
            <input value={pw.username} onChange={(e) => setPw({ ...pw, username: e.target.value })} autoComplete="username" />
          </label>
          <label>
            Current password
            <input
              type="password"
              value={pw.current}
              onChange={(e) => setPw({ ...pw, current: e.target.value })}
              autoComplete="current-password"
            />
          </label>
          <label>
            New password
            <input
              type="password"
              value={pw.next}
              onChange={(e) => setPw({ ...pw, next: e.target.value })}
              autoComplete="new-password"
            />
          </label>
          <label>
            Confirm new password
            <input
              type="password"
              value={pw.confirm}
              onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
              autoComplete="new-password"
            />
          </label>
          {pwMsg.error && <div className="alert error">{pwMsg.error}</div>}
          {pwMsg.ok && <div className="alert success">{pwMsg.ok}</div>}
          <button className="btn btn-primary">Update Login</button>
        </form>
      </div>
    </>
  );
}
