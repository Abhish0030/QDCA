import { useEffect } from 'react';

const siteName = 'Question Difficulty Classification Agent';
const baseDescription =
  'Classify questions across five cognitive difficulty levels, from Very Easy to Expert, with a clean AI-powered workflow.';

function upsertMeta(selector, attributes) {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, value);
  });
}

function Seo({ title = siteName, description = baseDescription, path = '/' }) {
  useEffect(() => {
    const pageTitle = title === siteName ? siteName : `${title} | QDCA`;
    const canonicalUrl = `${window.location.origin}${path}`;

    document.title = pageTitle;
    upsertMeta('meta[name="description"]', { name: 'description', content: description });
    upsertMeta('meta[name="theme-color"]', { name: 'theme-color', content: '#F8F1EB' });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: pageTitle });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary' });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: pageTitle });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);
  }, [description, path, title]);

  return null;
}

export default Seo;
