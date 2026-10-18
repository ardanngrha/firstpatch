# FirstPatch verification

This report records predeployment verification on 18 October 2026. The committed baseline contains 2,337 deduplicated projects and 596 checked open issues; subsequent scheduled refreshes may change those counts.

## Anti Slop Delivery Gate

Mode: during, explicitly selected by the owner. Filter: miqdadbadjuber/anti-slop. Direction: the owner-selected Product Design mockup and typography revision in `DESIGN.md`.

### Hard Gate: PASS

- R-02: FirstPatch-authored UI copy contains no em dash. Imported maintainer text is attributed source content and is not rewritten to manufacture a house voice.
- R-03: browser checks at 320, 390, 768 and 1487px found no document overflow in the exercised states. A clipped narrow-screen theme control was fixed and rechecked.
- R-17/R-18/R-36/R-38: catalogue membership, issue state, labels, counts and timestamps come from public sources. There are no invented testimonials, users, ratings, effort estimates or performance claims. Partial source coverage is explicit.
- R-23: the owner selected the visual direction and approved the sprout mark before implementation. The final mark is a generated first-party PNG; functional icons are licensed source files.
- R-24/R-26: all local navigation and asset links were checked across 91 built HTML pages. Core controls were exercised in the browser; the linked issue and guide destinations use their real source URLs. Unsupported filters are hidden when JavaScript is off.
- R-25: computed semantic text-pair minimums are 5.36:1 light and 6.08:1 dark; thresholds are compared before rounding. Visible keyboard focus was checked.
- R-27: real loading, filtered-empty and fetch-error/retry states were observed. An initial HTML list remains available during JSON failure.
- R-28: no generic FAQ was added.
- R-32: Tab navigation and Enter disclosure were tested using native controls and visible focus. No custom inaccessible menu is needed on mobile.
- R-33: UI changes were made directly in source; no script performs CSS or UI string-replacement patching.
- R-34: theme choice changes all semantic surfaces and persists locally; light and dark were inspected on desktop and mobile.
- R-35: build, five data/security tests, internal-link/SEO checks and a recorded browser click-through passed. Details are in `design-qa.md`.
- R-37: the owner-selected source and revised typography provide direction. The product is not an undirected draft.

### Purpose-Gate: PASS

- Typography: humanist sans supports newcomers and readable issue scanning; technical metadata alone uses mono.
- Green identifies actions and selected state. The pale-green panel groups contribution context. No decorative gradient, glow, grid or glass layer is used.
- Search, language, label, disclosure and external-link icons explain real controls; no generic feature-icon wall exists.
- Labels are actual maintainer labels. Assignment is text, not an unexplained status dot.
- Rows support comparison; an inline detail surface preserves search context. Rounded corners are limited to controls and the detail group.
- Motion is restricted to quick state feedback. Reduced motion removes transitions. No looping decoration or hidden entrance content exists.

### Liveliness: PASS

ENERGY 1 / RHYTHM 2 / MOTION 1. The search task is the focal action, repeated rows establish a reading rhythm, and the contextual detail panel deliberately breaks it. The stitched sprout and restrained green connect the interface to the small-contribution identity. Whitespace groups real tasks rather than filling a marketing template.

### Craftsmanship & Quality Locks: PASS

- C-1: decisions are recorded in `DESIGN.md`; they follow the selected reference and actual discovery task.
- C-2: search, filter, sort, reset, disclosures, navigation, themes and pagination were exercised. Real issue/guide links are ordinary source anchors.
- C-3: every section supports issue discovery, project context, contribution preparation or source accountability. No pricing, fake social proof or feature-card filler was added.
- C-4: checked narrow/desktop layouts, both themes, keyboard disclosure, empty/error/loading states and no-JavaScript content fallback.
- C-5: evidence, source scope and limits are explicit. No Lighthouse score, search rank, indexing success, or exhaustive audit is claimed.
- R-05/R-11/R-15/R-16/R-20/R-21/R-29/R-30/R-31: the task-driven list, purposeful radii, contextual actions, limited palette and original approved identity are maintained. The application is not a visual clone of another service.

## Automated checks

`npm test`: five meaningful tests cover canonical repository deduplication with source retention, hostile source URLs/HTML, checked issue provenance, punctuation-safe language paths/plain-text excerpts, and exclusion of navigation/assets from directory imports.

`npm run build`: emits 90 indexable HTML pages plus an actual 404 document, the public data files, local fonts/icons and sitemap.

`npm run check`: checks one H1, language, title, description, unique canonical, parseable JSON/JSON-LD, real local links/assets, sitemap coverage, absence of sample rows and semantic theme contrast. The predeployment build checked 13,414 local links/asset references across 91 HTML pages.

## Browser interaction record

See the element-by-element results in `design-qa.md`. The browser verified search and combined filters, source and sort changes, empty-state recovery, disclosure by Enter, focus, both themes, issue and project load-more, project search, local pages, language page, fetch failure/retry, throttled loading and native content with scripts disabled. No application console errors remained on a fresh normal reload. Temporary network/script/viewport overrides were cleared.

## SEO and limitations

Metadata, canonical URLs, crawlable HTML/pagination, language collections, truthful structured data and sitemap are present and checked. Fonts are self-hosted and unnecessary app frameworks are absent. The Cloudflare migration moves robots.txt to the host root and changes all SEO URLs to the Cloudflare origin. No Search Console account was accessed and search indexing/ranking is not guaranteed.

Public issue content and source availability can change. Discovery coverage is bounded and GitHub remains authoritative. Browser checks do not prove every external project is healthy, every contributor setup works, or every assistive-technology/device combination has been tested.

## Cloudflare migration verification, 18 October 2026

- Cloudflare Pages project `firstpatch` serves `https://firstpatch.pages.dev/` from the public GitHub repository. The Cloudflare build runs the same five tests, build and SEO checks before publishing `dist/`.
- Production HTTP checks passed for the issue directory, Python collection, projects, sources, guide, about, JSON data and PNG mark. Canonicals use the new host; no old GitHub Pages origin remains in these HTML pages.
- The host-root robots.txt returns 200, permits crawling and declares the Cloudflare sitemap. The first Cloudflare deployment contains 90 indexable sitemap URLs. An unknown URL returns HTTP 404 and `noindex,follow`.
- Browser verification confirmed the old GitHub Pages link redirects with its `unassigned` query preserved. On Cloudflare, Python plus unassigned filtering yielded 89 issues, loading more rendered 60 matching rows, and clearing filters restored the full feed. No application console errors were observed.
- GitHub Actions manual data refresh passed and committed its new snapshot. Automatic Cloudflare build triggering is being checked separately from the successful first deployment.
- The old GitHub Pages deployment contains only canonical redirect documents. GitHub cannot supply a custom HTTP 301 here; the browser redirect preserves path, query and fragment.
