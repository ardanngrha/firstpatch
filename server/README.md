# Account API

Public browsing remains static. Only /api/* and /auth/* use Pages Functions.
The public interface uses no Supabase browser SDK, localStorage or sessionStorage.

The cookie stores an AES-GCM encrypted Supabase session. Decrypted access and
refresh tokens exist only in the request handler; the encrypted cookie is HttpOnly,
Secure in production, SameSite=Lax, host-only and capped at 14 days. A readable
fp-signed-in cookie is only a UI hint and never authorizes access. API requests
validate the session through Supabase Auth. Mutations also require the exact
configured Origin and the X-FirstPatch header.

Ordinary database operations use the verified user's JWT and ownership RLS.
GitHub identity is taken from Auth's identities, not an editable metadata claim.
Protected app_metadata provider claims additionally constrain table access.

Progress writes use a separate secret-authenticated Supabase Edge Function.
The underlying privileged RPCs are executable only by service_role, which is
available only in the Supabase Edge runtime. Neither this key nor plaintext
session/provider tokens are shipped to the browser. The job credential is verified
against a SHA-256 hash; changing JOB_KEY also requires updating the hash in the
database settings and progress-internal function before deploying that function.

Manual PR checks can use the GitHub public-read provider access token inside the
encrypted session. It is not written to the database or exported. If it expires,
checks fall back to unauthenticated public metadata and can be rate-limited;
signing in again refreshes the GitHub connection. No provider refresh token is
retained.

The authenticated fp_take_action RPC intentionally uses SECURITY DEFINER to
increment only the caller's private rate bucket. It has a fixed search_path,
accepts three named actions, derives the owner from auth.uid(), and returns a
boolean. Its Supabase advisor warning is reviewed and expected. It cannot read
another user's private data or modify PR facts.

Limits: 200 saves, 1,000 characters per note, 20 search presets, 400 linked
PR associations per user; 120 saved-work writes, 10 PR-check actions and 40
preference writes per hour. Existing linked PR facts can be reused for six hours.
Nightly jobs process up to 100 due PRs in batches of five; open/unavailable PRs
become due after 24 hours and closed PRs after seven days. Merged PRs retain their
verified final state. The displayed check date, not the schedule, establishes
freshness.

Supabase Edge Functions use their own authentication checks instead of the
gateway's legacy JWT verifier: delete-account validates the supplied user session
against Auth before deleting exactly that identity, while progress-internal
validates the high-entropy job credential before calling privileged storage.

Free plan quotas for MAU, egress and Edge invocations are shared across the
Personal organization, including Cardrove. Database size is 500 MB per project.
No paid subscription or add-on has been enabled. Cloudflare subscription billing
could not be inspected with the OAuth connector: that endpoint requires a Billing
API token and has no OAuth scope. Do not claim an audited remaining balance.

For a fresh isolated project, run supabase/schema.sql, account-limits.sql,
progress-jobs.sql and hardening.sql in that order. Existing project changes were
applied directly through the SQL connector after apply_migration returned invalid
request state; no migration-history entry is claimed. Replaying the baseline on
an existing database is not supported. The transaction-only rls-test.sql checks
ownership, verified PR boundaries and limits, then rolls all fixtures back.

The two Edge Function entrypoints are in supabase/functions. Deploy them to the
same project as Auth and PostgreSQL. The provider-managed service key stays
inside that runtime.

Use .dev.vars locally, never commit it, and set the same configuration as
encrypted Pages secrets where appropriate. APP_ORIGIN must match an exact
Supabase redirect allowlist entry. FirstPatch production and the local 4173
callback were configured explicitly; wildcard preview callbacks are not allowed.

The progress workflow is gated by FIRSTPATCH_ACCOUNTS_ENABLED=true and needs
the repository secret FIRSTPATCH_JOB_KEY. Both were configured after owner
approval and production endpoint verification on 26 October 2026. The first
workflow run passed with an empty queue. It does not run the deploy hook or
publish personal data to the repository. Disable the variable for rollback.
