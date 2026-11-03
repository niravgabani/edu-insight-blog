// Renders one page to HTML at build time (used by scripts/prerender.mjs).
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import App from './App.jsx';
import { SiteProvider } from './data/SiteData.jsx';
import { primeCache, clearCache } from './api.js';

// data: { "/api/...": response } — everything the page reads, so nothing is fetched while rendering
export function render(url, data) {
  clearCache();
  primeCache(data);
  return renderToString(
    <StaticRouter location={url}>
      <SiteProvider>
        <App />
      </SiteProvider>
    </StaticRouter>
  );
}

// The pre-render script needs the same API paths the pages use
export { paths } from './api.js';
