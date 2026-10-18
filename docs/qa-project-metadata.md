# Projects metadata and metric icons: local QA

18 October 2026. Local changes only. No commit, push, workflow dispatch or deployment.

## Direction and implementation

Reading this as an approachable contribution directory for first-time contributors, retaining the approved humanist typography, ivory/forest-green palette and unified rows. ENERGY 1 / RHYTHM 2 / MOTION 1. The requested Phosphor star, fork, comment, issue and scales icons identify actual metadata, with visible text labels. No new decorative assets or motion.

Issues and Projects share repository range filters and row/filter functions. Stars and forks accept custom inclusive minimum and maximum values, including zero. License selection supports detected SPDX identifiers and unidentified licenses. More filters retains activity and contribution-file detection; issue-specific criteria remain on Issues.

Projects adds primary language, stars, forks, all open issues, detected license, last code push and metadata check dates. Comment counts remain per issue. A missing primary language on a checked repository is distinguished from unchecked metadata. Counts do not imply quality, beginner suitability or maintainer response time.

## Data evidence

- 2,177 licensed-catalogue project entries; official GitHub GraphQL metadata succeeded for 2,118 repositories, with 4 unavailable and 55 external-host entries explicitly labeled. Zero is not substituted for missing metadata.
- A separate visibility check confirmed all 2,118 enriched repositories are public. The sync query rejects private repositories and preserves only the selected factual fields. No issue bodies, comment text, user profiles or location fields are requested.
- Repository metadata is queried independently of the bounded issue feed, in batches of 40. Per-batch successful check timestamps and a final directory-check timestamp keep activity windows tied to the snapshot. Previous successful metadata can be retained with its original date if an API request fails; a known-private repository does not retain metadata.
- The local issue refresh produced 667 issues, including 18 Dart issues. This is a refreshed snapshot, not a live availability guarantee.
- Existing daily sync will include the directory enrichment after these local changes are published. No new job, paid service or visitor-side GitHub API request was introduced.

## Recorded interaction checks

- Projects: Dart + 100–10,000 stars + 10–1,000 forks + MIT returned SankethBK/diaryvault (211 stars, 90 forks, 5 open issues). Reset repository filters preserved Dart, yielding 12 projects. Adding First Contributions yielded one project.
- Maximum forks = 0 returned 39 projects. Reload, waiting for the full snapshot, restored 39 results and the selected threshold. Unknown fork counts do not satisfy the zero threshold, also covered by unit tests.
- Last code push and CONTRIBUTING.md selections displayed two active extra filters; Reset extra filters cleared them independently.
- All four Projects sorts were exercised: stars led with freeCodeCamp, forks with first-contributions, latest code push with opentelemetry-java-instrumentation, name with OpenMLDB. Show more expanded 60 rows to 120.
- Unmatched search displayed the empty state; Reset filters restored all 2,177 projects. Search input and number inputs apply on Enter as well as input/change.
- An intentionally unavailable local projects JSON displayed the error/retry state while retaining 60 pre-rendered rows. Restoring the file and selecting Try again recovered all 2,177 projects. The loading status is implemented and removed after completion; no claim of capturing a throttled loading frame.
- Issues: 100–1,000 stars + 0–100 forks + MIT produced two matching issues. URL reload preserved the filter results; Reset repository filters restored the full issue feed. Every issue remained initially collapsed, and issue summaries contain no repeated GitHub logo.
- Desktop 1280px: three aligned repository-filter groups and wrapping metadata. Mobile Projects at 390px dark and 320px light had document widths equal to their viewport widths, with no horizontal overflow. The 320px screenshot includes real Dart project metrics and contribution links. Existing theme controls and focus styles remain functional.
- No unexpected application console errors were observed. A failed local feed request was deliberately induced for recovery testing. Temporary viewport overrides are reset after QA.

## Verification and Anti Slop delivery gate

- **Hard Gate PASS:** real public metadata, unknown-value labels, verified filter/reset/sort/pagination/empty/error/retry behavior, Enter-based form application, visible focus and responsive reflow as recorded above. Existing navigation and original-source links resolve. No invented statistics, personal-country inference or new endorsement/security claims.
- **Purpose-Gate PASS:** each icon names a factual property; the star is the requested GitHub star metric. Visible count ranges support direct comparison without arbitrary buckets. Typography, palette, native disclosures and source links retain their documented purposes; no ornamental gradients, glow, badges or animation.
- **Liveliness PASS:** ENERGY 1 / RHYTHM 2 / MOTION 1 retains the search focal point, structured whitespace, green interaction accent, Source Sans voice and sprout identity. Directory rows carry the actual comparison content instead of template filler.
- **Craftsmanship and Quality Locks PASS:** 13 tests cover inclusive/zero/missing thresholds, AND combinations, project/issue filtering, snapshot-relative dates, sorting, HTML/URL escaping and retained-data sanitation. Build and SEO/link checks pass: 96 HTML pages, 95 indexable pages, 28,570 local references, canonical/OG/JSON-LD metadata and sitemap. Semantic text-pair contrast minimums are 5.36:1 light and 6.08:1 dark. This is bounded feature QA, not an accessibility or legal certification.

Screenshots: task `outputs/projects-metadata-desktop.png` and `outputs/projects-metadata-mobile.png`.
