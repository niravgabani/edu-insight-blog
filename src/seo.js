// SEO tags for every page. Shared by the website (updates <head> while browsing), the API server
// and the pre-render script (both write the same tags into the HTML, so search engines and
// social media previews see them without running JavaScript).

const RTL = ['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'yi'];
export const isRtl = (lang) => RTL.includes(String(lang || '').split('-')[0]);

const STATIC_PAGES = {
  '/blog': { title: 'All Articles', description: (s) => `Browse all articles published on ${s}.` },
  '/about': { title: 'About Us', description: (s) => `Who we are and how ${s} researches and publishes its articles.` },
  '/privacypolicy': { title: 'Privacy Policy', description: (s) => `Read the privacy policy of ${s}.` },
  '/contactus': { title: 'Contact Us', description: (s) => `Get in touch with the ${s} team.` },
  '/terms': { title: 'Terms and Conditions', description: (s) => `The terms and conditions for using ${s}.` },
  '/disclaimer': { title: 'Disclaimer', description: (s) => `Disclaimer for the information published on ${s}.` },
  '/search': { title: 'Search', noindex: true },
};

const stripHtml = (html) =>
  String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const clip = (text, max) => (text.length > max ? `${text.slice(0, max - 1).replace(/\s+\S*$/, '')}…` : text);

// The site's organisation, with the logo Google shows in search results (public/logo.png)
const organization = (siteName, base) => ({
  '@type': 'Organization',
  '@id': `${base}/#organization`,
  name: siteName,
  url: `${base}/`,
  logo: { '@type': 'ImageObject', url: `${base}/logo.png`, width: 512, height: 512 },
});

const absolute = (origin, url) => (!url ? '' : /^https?:\/\//.test(url) ? url : origin + (url.startsWith('/') ? url : `/${url}`));

/**
 * Builds the SEO data for a page.
 * origin: the site's public address (settings.siteUrl, or the current host)
 * path: the page path, e.g. "/my-article" or "/category/travel"
 */
export function pageMeta({ settings, origin, path, post, category, title, description, noindex, notFound }) {
  const siteName = settings.siteName;
  const base = String(settings.siteUrl || origin || '').replace(/\/+$/, '');
  const url = base + path;
  const meta = {
    siteName,
    url,
    lang: 'en',
    type: 'website',
    title: siteName,
    description: settings.metaDescription || `${siteName} — articles on education, technology, travel, business and more.`,
    keywords: settings.keywords || '',
    image: absolute(base, settings.ogImage),
    robots: 'index, follow, max-image-preview:large',
    jsonLd: null,
  };

  if (notFound) return { ...meta, title: `Page Not Found | ${siteName}`, robots: 'noindex, follow' };

  if (post) {
    const cat = category || { slug: post.category, name: post.category };
    Object.assign(meta, {
      type: 'article',
      lang: post.lang || 'en',
      title: post.metaTitle || `${post.title} | ${siteName}`,
      description: clip(post.metaDescription || post.excerpt || stripHtml(post.content), 160),
      keywords: post.keywords || '',
      image: absolute(base, post.image) || meta.image,
      published: post.date,
      modified: (post.updatedAt || post.date || '').slice(0, 10),
      section: cat.name,
    });
    meta.jsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BlogPosting',
          headline: post.title,
          description: meta.description,
          ...(meta.image && { image: [meta.image] }),
          datePublished: meta.published,
          dateModified: meta.modified,
          inLanguage: meta.lang,
          articleSection: cat.name,
          ...(post.keywords && { keywords: post.keywords }),
          mainEntityOfPage: { '@type': 'WebPage', '@id': url },
          author: { '@type': 'Organization', name: siteName, url: `${base}/about` },
          publisher: { '@id': `${base}/#organization` },
        },
        organization(siteName, base),
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${base}/` },
            { '@type': 'ListItem', position: 2, name: cat.name, item: `${base}/category/${cat.slug}` },
            { '@type': 'ListItem', position: 3, name: post.title, item: url },
          ],
        },
        // Articles written by the daily automation carry their FAQ separately for Google's FAQ results
        ...(post.faq?.length
          ? [
              {
                '@type': 'FAQPage',
                mainEntity: post.faq.map((f) => ({
                  '@type': 'Question',
                  name: f.question,
                  acceptedAnswer: { '@type': 'Answer', text: f.answer },
                })),
              },
            ]
          : []),
      ],
    };
    return meta;
  }

  if (category) {
    Object.assign(meta, {
      lang: category.lang || 'en',
      title: `${category.name} | ${siteName}`,
      description: clip(category.description || `Read the latest ${category.name} articles on ${siteName}.`, 160),
    });
    meta.jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: category.name,
      url,
      inLanguage: meta.lang,
      isPartOf: { '@type': 'WebSite', name: siteName, url: `${base}/` },
    };
    return meta;
  }

  const page = STATIC_PAGES[path] || {};
  const pageTitle = title || page.title;
  if (pageTitle) meta.title = `${pageTitle} | ${siteName}`;
  if (description || page.description) meta.description = description || page.description(siteName);
  if (noindex || page.noindex) meta.robots = 'noindex, follow';
  if (path === '/')
    meta.jsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          name: siteName,
          url: `${base}/`,
          publisher: { '@id': `${base}/#organization` },
          potentialAction: {
            '@type': 'SearchAction',
            target: `${base}/search?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        },
        organization(siteName, base),
      ],
    };
  if (path === '/about')
    meta.jsonLd = { '@context': 'https://schema.org', '@type': 'AboutPage', url, mainEntity: organization(siteName, base) };
  return meta;
}

// The <head> tags for a page, as plain descriptors: [tagName, attributes, text?]
export function headTags(meta) {
  const tags = [
    ['meta', { name: 'description', content: meta.description }],
    meta.keywords && ['meta', { name: 'keywords', content: meta.keywords }],
    ['meta', { name: 'robots', content: meta.robots }],
    ['link', { rel: 'canonical', href: meta.url }],
    ['meta', { property: 'og:type', content: meta.type }],
    ['meta', { property: 'og:site_name', content: meta.siteName }],
    ['meta', { property: 'og:title', content: meta.title }],
    ['meta', { property: 'og:description', content: meta.description }],
    ['meta', { property: 'og:url', content: meta.url }],
    ['meta', { property: 'og:locale', content: meta.lang.replace('-', '_') }],
    meta.image && ['meta', { property: 'og:image', content: meta.image }],
    meta.published && ['meta', { property: 'article:published_time', content: meta.published }],
    meta.modified && ['meta', { property: 'article:modified_time', content: meta.modified }],
    meta.section && ['meta', { property: 'article:section', content: meta.section }],
    ['meta', { name: 'twitter:card', content: meta.image ? 'summary_large_image' : 'summary' }],
    ['meta', { name: 'twitter:title', content: meta.title }],
    ['meta', { name: 'twitter:description', content: meta.description }],
    meta.image && ['meta', { name: 'twitter:image', content: meta.image }],
    // "<" is escaped so the JSON can't close the script tag
    meta.jsonLd && ['script', { type: 'application/ld+json' }, JSON.stringify(meta.jsonLd).replace(/</g, '\\u003c')],
  ];
  return tags.filter(Boolean);
}

const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Writes the page's language, title and SEO tags into an HTML document (server and pre-render)
export function injectHead(html, meta) {
  const tags = headTags(meta)
    .map(([tag, attrs, body]) => {
      const a = Object.entries(attrs).map(([k, v]) => ` ${k}="${escAttr(v)}"`).join('');
      return tag === 'script' ? `<script${a} data-seo>${body}</script>` : `<${tag}${a} data-seo />`;
    })
    .join('\n    ');
  // Function replacers: article text may contain "$" patterns
  return html
    .replace(/<html lang="[^"]*"/, () => `<html lang="${escAttr(meta.lang)}"`)
    .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${escAttr(meta.title)}</title>`)
    .replace('</head>', () => `    ${tags}\n  </head>`);
}
