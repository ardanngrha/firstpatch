# Detailed discovery filters: local verification

18 October 2026. Local review only: no commit, push or deployment. Previous requests remain applied: every issue starts collapsed and repeated GitHub icons are absent from issue summaries. The destination button still identifies GitHub.

## Scope and design read

An approachable contribution directory for first-time contributors, retaining the approved Source Sans 3, ivory/forest-green system and unified rows. ENERGY 1 / RHYTHM 2 / MOTION 1. No new visual assets or animation.

Repository identity now groups stars, forks and a detected license; task context groups title, licensed-catalogue description, maintainer labels, comments and issue number. Code push, issue update, snapshot check and discovery source remain separate. Less common criteria live in a native More filters disclosure, with an active count and independent reset. These changes add evidence for comparison, not a quality/difficulty score.

## Checked data

- Official GitHub API refreshed 651 open issue records, including 18 Dart issues. All 651 include real fork counts; no missing fork value was fabricated as zero.
- Three licensed catalogues produce 2,177 deduplicated projects. CodeTriage and GoodFirstIssue.org now remain external links only, with zero imported records. All three catalogue imports and GitHub reported success.
- Issue bodies/comment text/profile locations are no longer requested. Historical bodies and retired discovery sources are removed by the policy during sync and build, including retained snapshots.
- Exports carry attribution/reuse notices; issue metadata has a separate rights statement. See [data-reuse-review.md](data-reuse-review.md) for remaining legal uncertainty.

## Interaction evidence

Each field below was selected in the browser, compared against the checked snapshot and reset independently. Starting with Dart selected:

| Extra filter | Selection | Result |
|---|---|---:|
| Minimum stars | 1,000+ | 11 |
| Maximum stars | 100 or fewer | 1 |
| Minimum forks | 100+ | 13 |
| Last code push | Last 30 days | 5 |
| Issue updated | Last 90 days | 2 |
| Maximum comments | No comments | 0 |
| Repository license | MIT | 2 |
| Maintainer label | first-timers-only | 2 |
| Root CONTRIBUTING.md detected | Checked | 13 |

- Combined Dart + unassigned + minimum 1,000 stars + minimum 100 forks + code push within 90 days: 4 results. The URL preserves every criterion. Reload restores 4 results, opens More filters to reveal the selected extras, and leaves all issue panels closed.
- Reset extra filters preserves Dart and unassigned: 14 results. Clear filters restores all 651 issues.
- All six sort controls were exercised: recently updated, newest, fewest comments, most stars, most forks and latest code push. Each changes the URL and displayed order. Pure-function tests separately verify sorting, unknown values and stable tie behavior.
- First issue: Enter opens Project context; Enter closes it. Its real opened date, detected license and contribution-file detection are visible. Original descriptions remain linked on GitHub.
- Deliberately unavailable local issues feed: error state appears while 30 pre-rendered rows remain available. Restoring the file and clicking Try again recovers all 651 records. The loading status is implemented and cleared after completion; no claim is made that a throttled loading frame was visually captured.
- Project directory search for `flutter`: 11 project results. The new ES module also preserves theme and search behavior on that page.
- Sources page shows linked-only services, the new coverage text, and licence/attribution links. Clicking machine-readable attribution opens the exported JSON with the CC statement and source notices.
- No unexpected application console errors observed. The missing-feed test intentionally produces a failed HTTP request in its isolated test tab.

## Responsive and theme evidence

- Default desktop 1280 × 720: four filter columns when expanded; metadata rows and the original search hierarchy remain visible.
- Mobile 390 × 844: document width 390px; two filter columns with 171 × 46px native select targets. MIT filtering works at this size. Metadata wraps within the row.
- Narrow mobile 320 × 780: document width 320px; one filter column, 284px wide. No horizontal overflow.
- Light/dark toggle, detail disclosure, resets and selected values were exercised. Extra-select carets use the already licensed Phosphor SVG with 12px inset; forced-colors uses the native appearance.
- Temporary viewport overrides were reset. Screenshots are in the task outputs folder: `detailed-list-desktop-dark.png`, `detailed-list-preview-light.png`, `detailed-filters-mobile-dark.png`, `detailed-filters-mobile-dark-full.png`, and `detailed-filters-mobile-320-light.png`.

## Anti Slop delivery gate

- **Hard Gate PASS:** responsive widths, both themes, visible native labels, keyboard disclosure, real filter behavior, empty/reset and error/retry were verified as above. Data comes from credited sources; unknown counts and unidentified licences remain unknown. No personal-country inference, invented difficulty, new assets, claims or decorative controls.
- **Purpose-Gate PASS:** metadata is grouped for repository/task comparison; dates have explicit meanings. The expanded filter panel is optional to retain the approved search focal point. Existing palette, typography, library icons and radius are retained; no new glow, gradient, decorative illustration or motion.
- **Liveliness PASS:** ENERGY 1 / RHYTHM 2 / MOTION 1 remains consistent. Structured rows, humanist typography, sprout identity and green actions remain specific to FirstPatch; whitespace separates search, filters and results.
- **Craftsmanship and Quality Locks PASS:** source and browser share one row/filter module. Eleven tests cover numeric zero/missing values, AND combinations, date boundaries, sorting, injection handling and retained-data sanitation. Build/SEO/link checks passed for 94 HTML pages, 8,272 local references, structured data, canonical metadata and sitemap. Semantic text-pair contrast checks pass in both themes. This is a scoped feature verification, not an accessibility certification or legal certification.
