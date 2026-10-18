# FirstPatch

Find a small issue in a project you care about.

**[Open FirstPatch](https://ardanngrha.github.io/firstpatch/)**

FirstPatch combines public open-source project directories and recently updated GitHub issues. Search by project or topic, filter by language, contribution type, discovery source and assignment, then read the issue context and project contribution guide in place.

## What is included

- Real, checked open issues from GitHub's official API. The timestamp is shown; this is not a live availability guarantee.
- Complete public seed catalogues from Good First Issue, First Contributions and Up For Grabs.
- Bounded public directory snapshots from CodeTriage and GoodFirstIssue.org.
- FirstIssue.dev and First Timers Only as explicitly labeled resources. We do not claim to import a private personalized feed or treat a guide as a database.
- Credited source membership, readable inline issue context, keyboard controls, light/dark themes and mobile reflow.
- Pre-rendered HTML, crawlable pagination and language pages, canonical URLs, JSON-LD, metadata and a sitemap.
- No visitor accounts, analytics, third-party font requests or API tokens in the browser.

The [Sources page](https://ardanngrha.github.io/firstpatch/sources/) and `data/catalog.json` document the exact coverage. Issue discovery samples up to 100 recent good-first issues for each of 10 languages, extra batches of First Contributions projects, and up to 100 `first-timers-only` issues. Only projects in the imported directories or issues explicitly carrying `first-timers-only` enter the feed. It does not claim to mirror all issues in the catalogued repositories. Labels indicate maintainer intent, not measured difficulty.

## Run locally

Requires Node.js 22+ (24 in CI). A committed public snapshot is included, so preview and build work without GitHub credentials.

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:4173/firstpatch/`. To use a different port: `npm run dev -- --port 4180`. Re-run the build after editing source files; the preview serves `dist/`.

```sh
npm test
npm run build
npm run check
```

The build emits a self-contained static site in `dist/`. The frontend uses native HTML and a small progressive-enhancement script. The content, native issue disclosures and pagination remain usable without JavaScript. This production static architecture is intentional for GitHub Pages and SEO.

## Refresh the public data

Install the [GitHub CLI](https://cli.github.com/) and authenticate with `gh auth login`, or provide `GH_TOKEN` in the process environment. Do not put credentials into source files or the public data directory.

```sh
npm run sync
npm run build
```

`SOURCE_PAGE_LIMIT=5` is the default bounded CodeTriage import; it can be raised to a maximum of 140. HTML imports read public repository references, not user profiles or contact information. Source parsing is validated. The First Contributions object data is parsed with JSON5, not evaluated as JavaScript.

If a catalogue fails, its previous successful records are retained and marked. If all issue checks fail, the previous issue snapshot retains its original checked time. Partial refreshes are marked in `/data/status.json`. Scheduled deployment loads the currently published snapshot as the fallback before trying a refresh. If the first-ever issue import has no valid snapshot, sync fails instead of inventing or silently publishing issue data.

## GitHub Pages

The `Refresh data and deploy Pages` workflow builds on a push to `main`, a manual run, and a daily schedule at **09:37 Asia/Jakarta** (GitHub schedules can run late). It uses the repository-scoped GitHub token only in CI. Refresh degradation is recorded as a workflow warning and in the public status data. A successful build, tests and internal-link/SEO checks are required before deployment.

Configure the repository's Pages source as **GitHub Actions**. The workflow uploads `dist/` and deploys using the official Pages actions. The project path and canonical origin are defined in `scripts/render.mjs`; change both if you fork or use a custom domain.

## SEO

Issue/project lists and pagination are real HTML, not an empty app shell. Language collection pages have individual titles, descriptions, H1s and canonicals. `WebSite`, `CollectionPage`, `ItemList` and breadcrumb JSON-LD describe only visible content. There are no invented reviews or ratings. Search-query combinations canonicalize to their collection page rather than creating unlimited indexable URLs. The 404 page is `noindex` and GitHub Pages supplies its 404 status.

`/sitemap.xml` contains all indexable pages. The project also emits `robots.txt`, but crawlers only consult a file at the **host root**. A project under `/firstpatch/` cannot control `https://ardanngrha.github.io/robots.txt`; it does not pretend otherwise. For stronger site-level control, use a custom domain or configure the owner site's root separately. Search Console verification, sitemap submission and search ranking are not claimed by this repository.

## Contribute

Keep changes scoped. Run the commands above, describe the behavior you verified, and include screenshots for visual changes. Preserve data attribution and never change checked timestamps without a successful source check. Do not submit speculative issue summaries or difficulty/time estimates.

The visual direction was selected with the owner using Product Design; the approved humanist sans treatment is recorded in `DESIGN.md`. The stitched sprout asset was generated for FirstPatch. Anti Slop was applied during implementation. Browser evidence and remaining verification limits are in `design-qa.md` and `QUALITY.md`.

## License & credits

Application code: [MIT](LICENSE). The combined project catalogue: [CC BY-SA 4.0](data/LICENSE.md), with upstream MIT notices retained. Individual project and issue content remains attributable to its authors and subject to its source terms. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for directory, font and icon attribution.
