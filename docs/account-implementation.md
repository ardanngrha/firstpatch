# Account release: implementation and verification

26 October 2026. Local branch: feat/github-workspace.

## Implemented

- Optional GitHub OAuth through Supabase Auth and server-mediated PKCE.
- Encrypted HttpOnly session cookie, expiry/renewal, local logout, and no browser
  access to plaintext Supabase/GitHub tokens.
- Cross-device Saved storage, personal status, 1,000-character private notes,
  optimistic note-update conflict handling and explicit write feedback.
- GitHub PR authorship and target-repository verification, private associations,
  distinct PR counts over a disclosed 12-month opening window, and unlinking.
- Theme and saved-search preferences, JSON export, and self-account deletion.
- Explicit catalogue framework/topic tags on Issues and Projects, result
  diversity, rule-based presets, and partial-refresh notices.
- Private/no-store API responses; private pages are noindex and excluded from the
  sitemap. The existing static public browsing architecture and provenance remain.
- Bounded personal-progress sync that never commits personal data or invokes a
  deploy hook.

Broad historical GitHub contribution aggregation, public profiles, leaderboards,
email notifications and additional framework SEO pages remain later scope, as
proposed. Tracked PR counts are not a complete open-source contribution score.

## External setup completed

- Supabase FirstPatch project uqrgtnxxzndtogpywgvt, Singapore, in the Personal
  organization rvnctgqmjfwwvaxvzsez. Organization plan verified Free; quoted new
  project cost was $0/month. Cardrove was not changed.
- Tables, RLS, triggers and bounded job operations applied only to FirstPatch.
- delete-account and progress-internal Edge Functions deployed, version 2.
  Both perform their own authentication checks before privileged operations.
- Owner configured the GitHub OAuth app/provider. The authorization redirect
  requests only user:email, without repository-write/private-repository scopes.
- Exact Supabase callback allowlist: the production /auth/callback path and
  http://127.0.0.1:4173/auth/callback. Site URL is the production Pages origin.
- Pages production environment has Supabase URL/publishable key, APP_ORIGIN,
  encrypted SESSION_KEY and JOB_KEY, and the existing Node setting.
- Owner completed actual GitHub login and returned to the local Saved page.
  Auth and preferences records were independently confirmed without exporting
  credentials or reading private notes.

Permission history: Cloudflare initially lacked Pages Write. Its reconnection
was completed and a Pages PATCH succeeded. Automatic review initially rejected
transmitting SESSION_KEY/JOB_KEY to Cloudflare; the owner explicitly authorized
that exact transmission before the successful retry. No secret values were
printed, committed or added to browser JavaScript.

## Verification

- All 31 native Node tests pass and cover encryption/tampering, OAuth return validation,
  PKCE/cookie behavior, CSRF, user isolation, identifier-only save summaries,
  PR authorship/target/public visibility, expired provider-token fallback,
  self-account deletion identity binding, and privileged-job authentication.
- The live SQL transaction test checks owner isolation, private notes, ownership
  immutability, note limits, verified PR relationships, denial of direct fact
  mutation, private settings isolation, action budgets and anonymous access.
  Its synthetic Auth fixtures were rolled back. They had no passwords or emails.
- Actual OAuth redirect and owner login were verified. Live Edge endpoints
  reject unauthenticated access: delete-account 401, progress-internal 403.
  An authenticated bounded due-work request returned 200 with an empty queue.
- The Cloudflare Functions bundle compiles with Wrangler 4.152.0.
- Static build/link/SEO checks cover 113 HTML pages and 108 indexable pages.
  The source snapshot contains 834 issues and 2,197 projects.
- Private UI interaction tests ran separately against explicitly labeled
  in-memory fixtures: save, notes/status after reload, PR link/unlink,
  saved-search add/remove, appearance persistence and JSON export.
  The downloaded JSON was confirmed to be a fixture and to contain no tokens.
- See the current design-qa.md and docs/qa/account-* screenshots for visual
  comparison, tested dimensions, and any remaining limitations.

The owner's real account was not deleted or used for fabricated PR records.
UI fixture checks are not presented as end-to-end evidence of real GitHub merges.

## Budget and advisory boundaries

Free MAU, egress and Edge allowances are shared across the Personal organization,
including Cardrove. Database size is per project. No paid add-on or upgrade was
activated. Cloudflare billing subscription inspection is unavailable through
this OAuth connection; no remaining-budget measurement is claimed.

The authenticated fp_take_action SECURITY DEFINER warning is intentional and
reviewed: it derives the caller from auth.uid(), fixes search_path, accepts only
three named actions, and accesses only that caller's rate counters. Privileged
progress RPCs have no anon/authenticated execution grants.

Supabase also reports leaked-password protection disabled. The application uses
GitHub OAuth and ownership policies require its protected provider claim.
Disable the unused Email provider before public account rollout; do not enable
a paid password-protection feature merely to silence the advisory.

## Release gate

The new Pages frontend is not deployed yet. Existing public production browsing
and the daily public-catalogue workflow remain on their prior release.

Before release:

1. Review the local account flow and this change set.
2. Disable the unused Supabase Email provider for GitHub-only login.
3. Authorize storing the existing JOB_KEY as the repository Actions secret
   FIRSTPATCH_JOB_KEY. Prior consent specifically covered Cloudflare; no
   GitHub-secret transmission is claimed.
4. Publish the reviewed frontend, verify auth/public discovery/API routing in
   production, then set FIRSTPATCH_ACCOUNTS_ENABLED=true.
5. Run the progress workflow once, confirm its bounded result, and verify no
   deployment was triggered.

The personal workflow is configured for 00:00 WIB (17:00 UTC), with late starts
possible on GitHub Actions. It is currently gated off, and its secret is not yet
installed. Cron activity does not guarantee protection from Supabase Free pauses.

## Rollback

The prior public release is commit 4361ab6eff26736ce6a2c0079557f6d2bb17bcc9.
If account rollout fails, disable FIRSTPATCH_ACCOUNTS_ENABLED, restore the
previous Pages deployment and verify public discovery. Keep the additive private
database and Auth project intact so user data is not silently abandoned or
deleted. Remove secrets only after any recovery/export work is finished.
Restoring the static frontend does not itself revoke active Supabase sessions;
session revocation is a separate incident-response step when warranted.
