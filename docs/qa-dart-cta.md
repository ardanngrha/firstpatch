# Dart discovery and guide CTA verification

18 October 2026. Scoped maintenance of the approved FirstPatch design, using Anti Slop during as requested by the owner. Direction: approachable contribution directory, Source Sans 3, ivory/forest-green palette, ENERGY 1 / RHYTHM 2 / MOTION 1. No new visual assets, sections or motion.

## Data and coverage

- Before: zero Dart issues; discovery explicitly searched ten languages. `flutter/flutter` already existed in three credited directories.
- After: the official GitHub API refresh includes Dart plus direct batches of directory-listed Dart/Flutter projects. The complete snapshot has 655 issues, including 18 Dart issues from seven projects. All imported sources reported `ok`.
- The main `flutter/flutter` repository had zero open issues with the `good first issue` label during the check. Its directory entry is retained; no ordinary issue is relabeled as beginner-friendly.
- The language option reads `Dart / Flutter`; its underlying language value and URL remain `Dart`. This covers Dart projects, including Flutter projects, rather than pretending Flutter is a programming language.
- The generated Dart landing page, JSON feed and sitemap use the same checked snapshot.

## Button defect and verification

The reported screenshot is the Getting started page's final CTA. Its accessible text existed, but `.prose a` overrode the primary label color. Browser-computed dark text and background were both `rgb(139, 211, 176)`, giving 1:1 contrast. The scoped primary-button rule now preserves the semantic canvas color inside prose.

Recorded click-through:

- Theme button: switches between light and dark on the guide. CTA computed colors are ivory on forest green in light mode, and dark canvas on mint in dark mode.
- Guide CTA: mouse click and Enter activation both navigate to the issue directory.
- CTA keyboard focus: solid visible outline observed after Tab/Shift+Tab.
- Language select: `Dart / Flutter` produces `?language=Dart` and 18 issues.
- Issue search: `flutter` with Dart selected produces 16 issues.
- Search for a nonexistent project: displays the empty state. Reset filters restores the complete feed; selecting Dart again restores 18 results.
- No application console errors were observed during these checks.
- 390 × 844 mobile: document width equals viewport width, 390px; CTA height is 44.75px. Both themes show the full label. Desktop default viewport is 1280 × 720.

Local browser evidence is retained outside the public repository in the task's outputs folder: `guide-cta-before.png`, `guide-cta-mobile-light.png`, `guide-cta-mobile-dark.png`, and `dart-flutter-filter.png`.

## Anti Slop delivery gate, scoped to this change

### Hard Gate

- PASS R-03, R-25, R-32, R-34: mobile width, visible label, keyboard activation/focus and both themes were inspected in the browser. The action label now uses contrasting semantic colors.
- PASS R-17, R-36, R-38: counts and issue fields come from the checked GitHub/catalogue snapshot; source provenance tests pass. No estimated difficulty or invented Flutter issues.
- PASS R-24, R-26, R-27, R-35: CTA and filters were exercised as listed above; empty/reset behavior works. Existing loading/error handling remains in place. Five tests, production build, and metadata/link checker pass.
- PASS R-02, R-18, R-23, R-28, R-33, R-37: no fabricated content, assets, FAQ, script-based CSS rewriting, or new design direction. UI changes are written directly in source.

### Purpose-Gate

- PASS R-01, R-04, R-06, R-07, R-08, R-09, R-10, R-12, R-13, R-14, R-19, R-22: existing palette, typography, components and icons are retained. No decorative technique is introduced. The only color change restores the intended filled-button contrast, documented in DESIGN.md.

### Liveliness

- PASS: ENERGY 1 / RHYTHM 2 / MOTION 1 remains consistent with the approved directory. Search stays the focal interaction; structural whitespace, humanist typography, sprout identity and green actions are retained.

### Craftsmanship and Quality Locks

- PASS C-1 through C-5, R-05, R-11, R-15, R-16, R-20, R-21, R-29, R-30, R-31: scoped corrections preserve composition, specific CTA copy, radius and theme system. The reason for the button rule is recorded; data coverage is explicit and the new filter works with real content.

Validation: 5 tests passed; 97 generated HTML pages and 14,352 local links/assets checked, including JSON-LD, canonicals, metadata and sitemap. Semantic text-pair contrast checks pass in both themes. These checks cover this maintenance change; no new claim of a full-site accessibility certification is made.
