# Account and discovery: Anti Slop Delivery Gate

26 October 2026. Applied in `during` mode using the owner's requested
[miqdadbadjuber/anti-slop skill](https://github.com/miqdadbadjuber/anti-slop/blob/main/skills/antislop/SKILL.md),
alongside Product Design QA. Direction: ENERGY 1 / RHYTHM 2 / MOTION 1.

- **Hard Gate — PASS for the reviewed scope.** Real catalogue content is retained;
  synthetic private UI data is visibly labeled and isolated from the real Auth
  project. Save, notes/status, PR association, preferences and export are backed
  by handlers rather than decorative controls. Sign-out/deletion protection is
  covered by handler tests; the owner's account was not deleted. Service errors
  have recovery feedback. Narrow-screen navigation measures at least 44 × 44px.
- **Purpose-Gate — PASS.** Saved keeps contribution context; Progress distinguishes
  private intent from GitHub-confirmed PR state; Settings exposes preferences,
  export and deletion. Framework tags require explicit source evidence. Presets
  are disclosed filter rules, without invented difficulty or suitability scores.
  Public browsing stays available without sign-in.
- **Liveliness — PASS.** Existing sprout identity, humanist type, reading rhythm and
  forest-green interactions remain. No new visual motif, gradients, decorative
  badges, unnecessary animation or unsupported social proof were introduced.
- **Craftsmanship and Quality Locks — PASS for local delivery.** Five-surface
  review covered fonts, spacing, colors, assets and copy against the existing
  production baseline. Desktop density was normalized before comparison; mobile
  navigation size was corrected and remeasured. Thirty-one Node tests and live
  RLS transaction tests passed. Build/link/SEO checks and the Pages Functions
  compilation passed. Existing minimum text contrast remains 5.36:1 light and
  6.08:1 dark. Secrets and private notes are excluded from static publication.

Evidence: `design-qa.md`, `account-comparison.png`,
`account-saved-fixture-mobile.png`, and `docs/account-implementation.md`.
These gates do not assert a legal certification, exhaustive accessibility audit
or real GitHub merge test. Production release and the first successful scheduled
job test are documented separately in the implementation report.
