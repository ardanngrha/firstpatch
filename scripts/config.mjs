// One origin for HTML, feeds and SEO. Override when deploying a fork/custom domain.
const url = new URL(process.env.SITE_URL || 'https://firstpatch.pages.dev');
if (url.protocol !== 'https:' || url.search || url.hash || url.username || url.password) {
  throw new Error('SITE_URL must be an HTTPS URL without credentials, query or fragment.');
}
export const base = url.pathname.replace(/\/$/, '');
export const site = url.origin + base;
export const href = path => `${base}${path}`;
