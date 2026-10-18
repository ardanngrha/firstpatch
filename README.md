# FirstPatch

Find a small issue in a project you care about.

**[Open FirstPatch](https://firstpatch.pages.dev/)**

FirstPatch combines public open-source project directories and recently updated GitHub issues. Search by project or topic, filter by language, contribution type, discovery source and assignment, then read the issue context and project contribution guide in place.

## What is included

- Real, checked open issues from GitHub's official API. The timestamp is shown; this is not a live availability guarantee.
- Complete public seed catalogues from Good First Issue, First Contributions and Up For Grabs.
- Bounded public directory snapshots from CodeTriage and GoodFirstIssue.org.
- FirstIssue.dev and First Timers Only as explicitly labeled resources. We do not claim to import a private personalized feed or treat a guide as a database.
- Credited source membership, readable inline issue context, keyboard controls, light/dark themes and mobile reflow.
- Pre-rendered HTML, crawlable pagination and language pages, canonical URLs, JSON-LD, metadata and a sitemap.
- No visitor accounts, analytics, third-party font requests or API tokens in the browser.

The [Sources page](https://firstpatch.pages.dev/sources/) and `data/catalog.json` document the exact coverage. Issue discovery samples up to 100 recent good-first issues for each of 10 languages, extra batches of First Contributions projects, and up to 100 `first-timers-only` issues. Only projects in the imported directories or issues explicitly carrying `first-timers-only` enter the feed. It does not claim to mirror all issues in the catalogued repositories. Labels indicate maintainer intent, not measured difficulty.

## Run locally

Requires Node.js 22+ (24 in CI). A committed public snapshot is included, so preview and build work without GitHub credentials.

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:4173/`. To use a different port: `npm run dev -- --port 4180`. Re-run the build after editing source files; the preview serves `dist/`.

```sh
npm test
npm run build
npm run check
```

The build emits a self-contained static site in `dist/`. The frontend uses native HTML and a small progressive-enhancement script. The content, native issue disclosures and pagination remain usable without JavaScript. Cloudflare Pages serves the production application.

## Refresh the public data

Install the [GitHub CLI](https://cli.github.com/) and authenticate with `gh auth login`, or provide `GH_TOKEN` in the process environment. Do not put credentials into source files or the public data directory.

```sh
npm run sync
npm run build
```

`SOURCE_PAGE_LIMIT=5` is the default bounded CodeTriage import; it can be raised to a maximum of 140. HTML imports read public repository references, not user profiles or contact information. Source parsing is validated. The First Contributions object data is parsed with JSON5, not evaluated as JavaScript.

If a catalogue fails, its previous successful records are retained and marked. If all issue checks fail, the previous issue snapshot retains its original checked time. Partial refreshes are marked in `/data/status.json`. Scheduled deployment loads the currently published snapshot as the fallback before trying a refresh. If the first-ever issue import has no valid snapshot, sync fails instead of inventing or silently publishing issue data.

## Cloudflare Pages

The Cloudflare Pages project `firstpatch` connects to `ardanngrha/firstpatch`, production branch `main`. Its build command is `npm test && npm run build && npm run check` with Node 24 and output directory `dist/`. No Cloudflare deploy token is stored in the repository. Visitor analytics are disabled.

The `Refresh data and check site` GitHub workflow checks pushes and refreshes public data on manual runs and a daily schedule at **09:37 Asia/Jakarta** (GitHub schedules can run late). It uses the repository-scoped GitHub token only in CI. A refreshed snapshot passes tests, build and link/SEO checks before being committed to `main`; Cloudflare's Git integration deploys that commit. Source failures retain the last successful data and report degradation.

Migration status on 18 October 2026: production deployment and the manual data-refresh workflow passed. Git-triggered Cloudflare builds did not start after the tested commits despite automatic production deployments being enabled. Current production was deployed explicitly from `main`; repairing the Git trigger remains pending. Daily refresh commits alone must not be treated as proof that new data has reached production.

`scripts/config.mjs` defines the canonical origin. Set `SITE_URL=https://your-domain.example` when deploying a fork or custom domain; assets, data fallback, canonicals, structured data and sitemap use the same value. Production currently uses `https://firstpatch.pages.dev` at the host root.

The old GitHub Pages address serves only small redirect documents. Existing paths, query filters and fragments are preserved in browsers with JavaScript; HTML fallbacks link and redirect to the equivalent canonical page. GitHub project hosting cannot supply custom HTTP 301 redirects, so no 301 status is claimed.

## SEO

Issue/project lists and pagination are real HTML, not an empty app shell. Language collection pages have individual titles, descriptions, H1s and canonicals. `WebSite`, `CollectionPage`, `ItemList` and breadcrumb JSON-LD describe only visible content. There are no invented reviews or ratings. Search-query combinations canonicalize to their collection page rather than creating unlimited indexable URLs. The 404 page is `noindex`; the root `404.html` lets Cloudflare Pages return an actual 404 instead of an app-shell fallback.

`/sitemap.xml` contains all indexable pages using the Cloudflare origin. `/robots.txt` is now at the **host root**, allows crawling and declares that sitemap. Open Graph and Twitter images are served from the same origin. Search Console verification, sitemap submission and search ranking are not claimed by this repository.

## Contribute

Keep changes scoped. Run the commands above, describe the behavior you verified, and include screenshots for visual changes. Preserve data attribution and never change checked timestamps without a successful source check. Do not submit speculative issue summaries or difficulty/time estimates.

The visual direction was selected with the owner using Product Design; the approved humanist sans treatment is recorded in `DESIGN.md`. The stitched sprout asset was generated for FirstPatch. Anti Slop was applied during implementation. Browser evidence and remaining verification limits are in `design-qa.md` and `QUALITY.md`.

## License & credits

Application code: [MIT](LICENSE). The combined project catalogue: [CC BY-SA 4.0](data/LICENSE.md), with upstream MIT notices retained. Individual project and issue content remains attributable to its authors and subject to its source terms. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for directory, font and icon attribution.
