import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { SiteProvider } from './data/SiteData.jsx';
import { primeCache } from './api.js';
import './styles/index.css';
import './styles/detail.css';

const app = (
  <React.StrictMode>
    <BrowserRouter>
      <SiteProvider>
        <App />
      </SiteProvider>
    </BrowserRouter>
  </React.StrictMode>
);

const root = document.getElementById('root');
// Pre-rendered pages (scripts/prerender.mjs) carry the HTML and the data they were built with.
// React attaches to that HTML; if the address differs (e.g. ?page=2 served by the page-1 file),
// the page is rendered fresh instead.
const prerendered = window.__PRERENDER__;
if (prerendered && prerendered.url === window.location.pathname + window.location.search) {
  primeCache(prerendered.data);
  ReactDOM.hydrateRoot(root, app);
} else {
  if (prerendered) primeCache({ '/api/site': prerendered.data['/api/site'] });
  root.innerHTML = '';
  ReactDOM.createRoot(root).render(app);
}
