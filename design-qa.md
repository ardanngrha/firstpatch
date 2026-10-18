# FirstPatch design QA

final result: passed

## Visual truth and captures

- Source: `docs/design-reference.png`, the owner-approved sans-serif revision, 1487 x 1058 pixels.
- Primary implementation: `docs/qa/desktop-final.png`, 1487 x 1058 pixels, CSS viewport 1487 x 1058, density 1, light theme, third initial issue expanded.
- Full-view comparison: `docs/qa/comparison-final.png`. Source and implementation appear together at the same scale.
- Focused typography comparison: `docs/qa/typography-final.png`, the first 350 pixels of both frames. Examines the wordmark, H1, support copy, search and filter controls.
- Matching interaction state: `docs/qa/comparison-matched-state.png` and `docs/qa/desktop-matched-state.png`; unassigned switch checked and third visible issue open, scrolled to the top. This secondary capture required normalization after the in-app browser reported density 1.3: CSS viewport 1487 x 1057, screenshot container 1487 x 1058 with a painted region of 1144 x 814. That region was normalized to 1487 x 1058; use the density-1 primary and focused captures for sharp type inspection. The one-pixel height discrepancy is capture normalization, not an application-layout finding.
- Responsive evidence: `docs/qa/mobile-final.png` and `mobile-dark-final.png` at 390 x 844; `mobile-320-dark.png` at 320 x 780. Tablet layout and guide were exercised at 768 x 1024.
- Dark desktop: `docs/qa/desktop-dark.png`.

## Comparison history

### Initial implementation

- P2: issue provenance was too small at 12px on desktop. Source comparison showed a more readable metadata column. Increased desktop metadata to 14px, body excerpts to 16px, repo language metadata to 13px and detail copy to 15px.
- P2: H1 scale and the repo/title column alignment drifted from the selected composition. Increased the desktop headline ceiling from 60px to 64px and moved the issue-title reading axis from a 26% to a 25% repository track.
- P2: the theme control extended beyond the 320px navigation row. Moved it to the mobile brand row and kept its 44px target. Post-fix inspection measured navigation scroll width and client width both 284px, theme right edge 302px in a 320px viewport, and no document overflow.
- P2 functional: source and sort controls were associated with the search form but lived outside its DOM subtree, so their change events were not received by the form listener. Attached a listener to every associated control. Rechecked both controls and confirmed updated results and query parameters.

### Post-fix comparison

Opened the primary source and implementation images together, then examined the focused typography comparison and matching-state comparison. Rechecked mobile reflow and both themes. No actionable P0/P1/P2 findings remain.

## Required fidelity surfaces

- **Fonts:** actual self-hosted Source Sans 3 is loaded, confirmed with `document.fonts.check`. The heavy serif treatment is absent. Heading, body and controls use the approved humanist sans direction; Source Code Pro is confined to small technical metadata. The H1 remains one deliberate desktop line and wraps naturally on mobile.
- **Spacing:** approved wide gutters, compact navigation, search toolbar, repeated list axes and inline detail surface are retained. The additional provenance/filter row is a production requirement, not a marketing section. Real issue titles and excerpts create taller rows than the short fictional reference content; text is not squeezed to force five rows into the first viewport.
- **Colors:** ivory canvas, dark type, forest-green actions and pale-green details follow the selected direction. Semantic text contrast was computed without rounded-threshold comparisons: minimum 5.36:1 in light and 6.08:1 in dark across the tested pairs. Keyboard focus is visibly outlined.
- **Assets:** the approved stitched sprout is a real generated raster asset, inspected and saved as a 256px PNG. Functional icons are Phosphor source files, not hand-drawn SVG/CSS substitutes. No missing images were found in the browser. The reference's generic GitHub symbols are represented by the selected library's outline GitHub icon; the stroke variation is P3.
- **Copy/content:** production rows use real issue titles, short plain-text excerpts, repository descriptions, actual labels, assignee status and timestamps. Sample counts and invented dates were removed. Maintainer-authored punctuation and emoji in imported content are retained as source content, not FirstPatch editorial decoration. The app's own copy avoids invented difficulty, task duration, endorsement and adoption claims.

## Verified interactions

- Language, issue type and unassigned controls: combined filter produced only the selected language/type and unassigned entries.
- Source filter: selecting Good First Issue updated the count and URL; selecting First Contributions returned 418 issues in the checked predeployment snapshot.
- Sort: selecting Fewest comments changed the first issue and wrote `sort=comments` to the URL.
- Search and submit: an unmatched string showed the named empty state; Reset and Clear filters restored the full feed.
- Native disclosure: Enter opened and closed an issue. Focus stayed visible on the summary.
- Theme: both light and dark rendered correctly; preference survived reload and was restored to light after testing.
- More issues: 30 rendered rows increased to 60.
- Project search and source filter: First Contributions plus `neovim` returned exactly `neovim/neovim`; an unmatched string showed the project empty state. Reset restored the directory and Show more increased 60 rows to 120.
- Navigation: Projects, Getting started, Sources, About & privacy and the Python language collection opened real pages. Sources displayed all seven requested resources plus the underlying GitHub API source.
- Error recovery: deliberately blocked the issue JSON request. The error heading appeared while 30 initial HTML rows remained. Unblocked the request and clicked Try again; the error disappeared and 596 issues returned.
- Loading: throttled the request and observed the live-region announcement for loading the issue snapshot. Removed throttling afterward.
- No JavaScript: disabled page script execution, confirmed 30 HTML issue rows, visible crawlable pagination and working native disclosures. Nonworking search enhancements were hidden. Re-enabled scripts and confirmed filters returned.
- Responsive: no document-level horizontal overflow at 320, 390, 768 and 1487 CSS pixels in the tested states. Navigation controls remained reachable after the narrow-width fix.
- Console: no application errors on a fresh normal reload. The deliberately blocked request was a separate expected failure exercise. Network and script emulation were restored after testing.

## Accepted differences and limits

- The reference contained fictional projects/issues. Production uses live-source snapshots, so content lengths, row heights and counts differ.
- Production includes a project directory, source filter, source/freshness explanation and theme choice to fulfill the actual product scope. Its default list includes both assigned and unassigned issues with explicit status; the matching-state QA capture applies the reference's unassigned filter.
- A P3 icon-stroke variation and minor wordmark/asset optical differences remain. They do not obscure the selected visual identity or core task.
- This is bounded browser QA, not a claim of exhaustive device, screen-reader or external-project setup testing. GitHub Pages deployment and crawler indexing are separate from visual QA.

## Implementation checklist

- [x] Correct the metadata scale and headline/column drift.
- [x] Correct source/sort behavior and narrow navigation overflow.
- [x] Capture and inspect post-fix source/implementation comparisons.
- [x] Exercise core controls, native keyboard disclosure, both themes and failure recovery.
- [x] Verify static HTML content and pagination without JavaScript.
- [x] Preserve explicit source coverage and no fabricated issue guidance.
