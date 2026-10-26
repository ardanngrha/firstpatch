# FirstPatch

Find a small issue in a project you care about.

**[Open FirstPatch](https://firstpatch.pages.dev/)**

FirstPatch combines licensed project catalogues and checked GitHub issue metadata. Search by project or topic, filter by language, assignment, stars, forks, last code push, issue update, comments, license, labels and detected contribution guidance. Open the original issue for its full description and discussion.

## What is included

- Real, checked open issues from GitHub's official API. The timestamp is shown; this is not a live availability guarantee.
- Complete public seed catalogues from Good First Issue, First Contributions and Up For Grabs.
- CodeTriage, GoodFirstIssue.org and FirstIssue.dev as external links only; no HTML catalogue or personalized feed is imported.
- First Timers Only as a contribution guide; its similarly named issue label is searched independently.
- Repository stars, forks, detected license, last push, issue dates and comment counts, with a collapsible set of additional filters and shareable filter URLs.
- Projects show language, stars, forks, all open issues, detected license, last code push and the repository check date with labeled icons. Stars/forks minimum and maximum ranges and license filters are directly visible on both discovery pages; Projects also supports language/source, recent push, detected guidance and name/stars/forks/activity sorting.
- Credited source membership, readable inline issue context, keyboard controls, light/dark themes and mobile reflow.
- Pre-rendered HTML, crawlable pagination and language pages, canonical URLs, JSON-LD, metadata and a sitemap.
- Optional GitHub accounts for private saved issues, shortlist status, notes, filter presets and linked pull request progress. Public browsing does not require login.
- Account sessions use encrypted HttpOnly cookies. No localStorage or sessionStorage, visitor analytics, or third-party font requests.

The account release is being reviewed locally on branch `feat/github-workspace`.
Supabase and Cloudflare environment setup is complete, but the new frontend and
personal-progress schedule have not been released to production. See
`docs/account-implementation.md` and `server/README.md` for the verified state,
limits and remaining release steps.

The [Sources page](https://firstpatch.pages.dev/sources/) and `data/catalog.json` document the exact coverage. Issue discovery samples up to 100 recent good-first issues for each of 11 languages, including Dart for Flutter projects, extra batches of First Contributions and directory-listed Dart/Flutter projects, and up to 100 `first-timers-only` issues. Only projects in the imported directories or issues explicitly carrying `first-timers-only` enter the feed. It does not claim to mirror all issues in the catalogued repositories. Labels indicate maintainer intent, not measured difficulty.

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

Account API routes are in `functions/`, with the shared handler in `server/`.
For local accounts, configure `.dev.vars` from `.env.example`; the local preview
serves those routes as well as static pages. Account pages require JavaScript and
are excluded from indexing and the sitemap. Only identifiers are requested for
save indicators while browsing public pages, rather than loading private notes.

To exercise private UI states without credentials or real user data, run
`node tests/ui-preview.mjs` after building. The separate port 4184 fixture server
labels simulated account/PR data, keeps everything in memory, and never contacts
Supabase or GitHub. It is a QA harness, not the user-facing preview.

## Refresh the public data

Install the [GitHub CLI](https://cli.github.com/) and authenticate with `gh auth login`, or provide `GH_TOKEN` in the process environment. Do not put credentials into source files or the public data directory.

```sh
npm run sync
npm run build
```

Imports use the three explicitly licensed catalogues. No HTML directory scraping is performed. The First Contributions object data is parsed with JSON5, not evaluated as JavaScript. GitHub issue bodies, comment text, personal profiles and locations are not fetched. Descriptions shown in the UI come from the licensed catalogues. The same data policy is applied to retained snapshots and at build time so historical snapshots cannot republish retired sources or issue excerpts.

Repository metadata is refreshed independently for every GitHub directory entry, in batches of 40 using the official GraphQL API. This runs in the existing daily sync, without a visitor-side API call or a new paid service. Missing/deleted/inaccessible repositories retain previously checked metadata with its original date when available; otherwise facts remain unknown. Non-GitHub entries are labeled as external hosts. Project open-issue counts include all open issues, not only beginner tasks. Each row shows its own metadata-check date; the export records the directory refresh time separately from the issue-feed check.

Extra filters use AND semantics. Date windows end at the snapshot check time; repository last push and issue last update are distinct. Missing numeric data is not zero and does not satisfy numeric filters. `NOASSERTION` is displayed as a license that was not identified. A detected SPDX identifier is not legal clearance. Root `CONTRIBUTING.md` detection does not prove the absence of contribution guidance elsewhere. Project country is not inferred from a maintainer’s public location. Stars and forks do not establish task difficulty or maintainer responsiveness.

Project downloads embed their reuse notice and link to `/data/attribution.json`, which distributes original source URLs, upstream MIT notices and the CC BY-SA transformation notice. `/data/LICENSE.md` is also distributed. Issue metadata has a separate rights statement; it is not blanket-relicensed as CC BY-SA. See `docs/data-reuse-review.md` for the scoped assessment and remaining uncertainties.

If a catalogue fails, its previous successful records are retained and marked. If all issue checks fail, the previous issue snapshot retains its original checked time. Partial refreshes are marked in `/data/status.json`. Scheduled deployment loads the currently published snapshot as the fallback before trying a refresh. If the first-ever issue import has no valid snapshot, sync fails instead of inventing or silently publishing issue data.

## Cloudflare Pages

The Cloudflare Pages project `firstpatch` connects to `ardanngrha/firstpatch`, production branch `main`. Its build command is `npm test && npm run build && npm run check` with Node 24 and output directory `dist/`. No Cloudflare deploy token is stored in the repository. Visitor analytics are disabled.

The `Refresh data and check site` GitHub workflow checks pushes and refreshes public data on manual runs and a daily schedule at **00:00 WIB / Asia/Jakarta (UTC+7)**, configured as 17:00 UTC (GitHub schedules can run late). It uses the repository-scoped GitHub token only in CI. A refreshed snapshot passes tests, build and link/SEO checks before being committed to `main`. The workflow then invokes the Cloudflare Pages Deploy Hook and waits for the expected revision and snapshot to appear in production. Source failures retain the last successful data and report degradation.

The project uses Deploy Hook `firstpatch-daily-refresh`, branch `main`, stored only in the repository's `CLOUDFLARE_DEPLOY_HOOK` Actions secret. Both checked pushes and scheduled/manual refreshes invoke it explicitly, so publishing does not depend on the Git push webhook. The dashboard reported the Git account connection disconnected during migration; its reconnect setting was not changed.

`npm run deploy` requires that secret in the process environment. It sends one POST without logging the URL, then checks `/build-meta.json` and all three public JSON feeds for the expected Git revision, generation time and counts. A failed request or a production mismatch after 10 minutes fails the workflow; acceptance of a hook request alone is not treated as a successful deployment. A concurrent update that rejects the snapshot push also fails before the hook is invoked, avoiding deployment of unchecked rebased changes.

Deploy Hooks do not require a paid upgrade. Cloudflare Pages Free currently includes 500 builds per month across the account; one scheduled build per day uses about 30–31 of those, plus manual/push deployments and other projects. This repository uses the standard GitHub-hosted runner for its public workflow. No paid runner or paid Cloudflare service is enabled by this setup. Keep the hook URL private; anyone who obtains it can trigger builds.

`scripts/config.mjs` defines the canonical origin. Set `SITE_URL=https://your-domain.example` when deploying a fork or custom domain; assets, data fallback, canonicals, structured data and sitemap use the same value. Production currently uses `https://firstpatch.pages.dev` at the host root.

The old GitHub Pages address serves only small redirect documents. Existing paths, query filters and fragments are preserved in browsers with JavaScript; HTML fallbacks link and redirect to the equivalent canonical page. GitHub project hosting cannot supply custom HTTP 301 redirects, so no 301 status is claimed.

## SEO

Issue/project lists and pagination are real HTML, not an empty app shell. Language collection pages have individual titles, descriptions, H1s and canonicals. `WebSite`, `CollectionPage`, `ItemList` and breadcrumb JSON-LD describe only visible content. There are no invented reviews or ratings. Search-query combinations canonicalize to their collection page rather than creating unlimited indexable URLs. The 404 page is `noindex`; the root `404.html` lets Cloudflare Pages return an actual 404 instead of an app-shell fallback.

`/sitemap.xml` contains all indexable pages using the Cloudflare origin. `/robots.txt` is now at the **host root**, allows crawling and declares that sitemap. Open Graph and Twitter images are served from the same origin.

The URL-prefix property `https://firstpatch.pages.dev/` was verified in Google Search Console on 18 October 2026 using `public/googleadbd9664c8414571.html`. Keep this file deployed to retain ownership verification. The sitemap submission was accepted, but the Sitemaps report initially displayed "Couldn't fetch". Google's separate live URL test successfully fetched the sitemap and reported "URL is available to Google". A successful live test does not establish successful sitemap processing or indexing. See `docs/seo-status.md` for the recorded result; no search rank or indexing success is claimed.

## Contribute

Keep changes scoped. Run the commands above, describe the behavior you verified, and include screenshots for visual changes. Preserve data attribution and never change checked timestamps without a successful source check. Do not submit speculative issue summaries or difficulty/time estimates.

The visual direction was selected with the owner using Product Design; the approved humanist sans treatment is recorded in `DESIGN.md`. The stitched sprout asset was generated for FirstPatch. Anti Slop was applied during implementation. Browser evidence and remaining verification limits are in `design-qa.md` and `QUALITY.md`.

## License & credits

Application code: [MIT](LICENSE). The combined project catalogue: [CC BY-SA 4.0](data/LICENSE.md), with upstream MIT notices retained. Individual project and issue content remains attributable to its authors and subject to its source terms. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for directory, font and icon attribution.
