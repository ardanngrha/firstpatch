# Search Console setup, 18 October 2026

- Property: `https://firstpatch.pages.dev/`, URL-prefix type.
- Google ownership verification: **Ownership verified**, HTML file method.
- Verification file: `public/googleadbd9664c8414571.html`, served publicly with HTTP 200 and the exact Google verification string. Keep it in future deployments.
- Sitemap: `https://firstpatch.pages.dev/sitemap.xml`, 89 URLs at this deployment. XML parsed successfully; normal, Googlebot and Google-Site-Verification user-agent requests all returned HTTP 200, `application/xml`, no redirect or challenge header, and no X-Robots-Tag restriction. User-agent checks alone do not prove access from Google's infrastructure.
- Sitemap submission: Google displayed **Sitemap submitted successfully**. The report displayed **Couldn't fetch / Sitemap could not be read**, with zero discovered pages. It was submitted once more after the live test below; the final inspected report still showed **Couldn't fetch**. Successful submission is distinct from successful processing. This warning remains unresolved by the end of this setup session.
- Google URL Inspection live test of the sitemap: **URL is available to Google / Page can be indexed**, tested at 13:42 Asia/Jakarta. This confirms access from Google's inspection system; it does not prove the sitemap processor has completed or that pages are indexed.
- No indexing or ranking success is claimed. No analytics or tracking script was added.

Local evidence under the task's `outputs/` directory: `firstpatch-search-console-verified.png`, `firstpatch-sitemap-submitted.png`, `firstpatch-sitemap-live-test.png` and `firstpatch-search-console-status.png`.

The dropdown caret fix was deployed in commit `b95fc90` via Cloudflare Pages deployment `43c60f97-8e41-4b1e-9533-56b3e2c2b3c4`. CI tests, static build, local-link/SEO checks and the legacy-redirect build passed. Responsive and focused light/dark evidence is recorded in `design-qa.md`.
