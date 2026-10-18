# Collapsed issue list verification

18 October 2026. Local changes only: the owner asked to hold deployment. No push or deployment was performed for this change.

The approved direction remains ENERGY 1 / RHYTHM 2 / MOTION 1, with existing typography, palette and row layout. All issue details now start closed. The repeated GitHub icon is removed from each summary in both server-rendered and client-rendered lists. The GitHub destination button remains inside the detail panel.

## Recorded behavior

- Initial home page: 30 rows, 0 open panels, 0 GitHub icons inside summaries.
- First summary click: 1 open panel; second click: closed.
- Selecting Dart: 18 rows, 0 open panels and 0 summary GitHub icons. Reload: 0 open panels.
- Theme toggle: changes dark to light while keeping rows collapsed and repository names visible.
- Narrow viewport: reported document width matched innerWidth, with no horizontal overflow. Enter on the first summary opens it; Enter again closes it.
- No application console errors observed.
- Five existing tests passed. Build and checker passed for 97 HTML pages, 13,042 local links/assets, structured data, canonical metadata and sitemap. Semantic contrast checks passed for both themes.
- Screenshots retained in the task outputs folder: `issue-list-collapsed-dark.png` and `issue-list-collapsed-light.png`.

## Anti Slop delivery gate for this maintenance scope

- Hard Gate PASS: real native disclosure controls were exercised by mouse and keyboard; initial state was inspected before and after filtering/reload. Responsive width and theme behavior were checked. No new claims, assets, navigation, FAQ or content were introduced.
- Purpose-Gate PASS: repeated destination marks were removed at the owner's request; the action retains its GitHub destination cue. No new decorative technique, typeface, palette or motion was introduced.
- Liveliness PASS: the existing ENERGY 1 / RHYTHM 2 / MOTION 1 direction, search focal point, structural whitespace and sprout identity remain intact.
- Craftsmanship and Quality Locks PASS: the change is written directly in source, covers server and client rendering, preserves working disclosure actions, and passes the checks above. The reason is recorded in DESIGN.md.

Verification is scoped to these list changes, not a fresh full-site audit. This local result is ready for review; the deployed website is unchanged.
