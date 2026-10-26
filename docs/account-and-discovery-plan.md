# FirstPatch: accounts, contribution tracking, and discovery improvements

Proposal date: 26 October 2026. Status: approved for implementation; the local account release and infrastructure setup are in progress. See account-implementation.md for delivered work and release gates.

## Product outcome

Help a newcomer move from discovering an appropriate issue to following through on a contribution. Public browsing stays accessible without an account. Optional GitHub login adds durable, cross-device saves and a private progress workspace.

The first release should complete this loop:

1. Find an issue using understandable repository and issue signals.
2. Save it; if signed out, sign in with GitHub and return to the same issue and filters.
3. Move the saved issue to an in-progress shortlist and add a private note.
4. Link a pull request authored by the signed-in GitHub identity.
5. See its verified GitHub state and the time it was last checked.

No implementation, provider project, OAuth application, scheduled job, or deployment is authorized merely by this proposal. Future implementation should preserve the approved design in DESIGN.md.

## Release scope

### First release

| Capability | Proposed behavior |
| --- | --- |
| Optional GitHub sign-in | One Continue with GitHub action; first login provisions an account. No custom password or separate registration form. |
| Saved issues | Save/remove from list and expanded detail; dedicated Saved page, cross-device persistence, search and filters. |
| Private shortlist | Saved, In progress, and Archived are personal workflow states. They do not assign a GitHub issue or reserve it with a maintainer. |
| Private notes | Short plain-text notes attached to saved issues, with explicit save/error feedback and a length limit. |
| Linked pull requests | Paste a GitHub PR URL. Validate the host, target repository, PR author against the immutable GitHub user ID, and association evidence. |
| Contribution progress | Show submitted, open, merged, and closed-without-merge PRs separately; count distinct target repositories and show a clear date window. |
| Preferences | Saved filter presets and theme in the account. Guest filters remain shareable URLs; guest theme can use a preference cookie or system default. |
| Account controls | Sign out, export personal data, disconnect integrations, and delete the FirstPatch account/data. |
| Data health | Checked timestamps, partial refresh states, retained data notices, and actionable retry/error states. |

Actual GitHub PR state is separate from a user's manually chosen shortlist status. A manually marked task is not counted as a verified merged contribution. A closed issue is not proof that this user completed it.

### Next improvements

| Area | Improvement and constraints |
| --- | --- |
| Framework/topic discovery | Add confirmed GitHub topics or explicitly sourced framework tags. Dart alone does not establish Flutter. Preserve provenance and missing values. |
| Result diversity | Optional one-issue-per-repository or capped-per-project mode. Keep chronological and popularity sorts available and explain the active ordering. |
| Practical filter presets | Examples: unassigned + recent repository push + detected contribution guide. Presets describe their actual rules and do not claim verified ease. |
| Project context | Show contribution-guide links, repository archive state, relevant labels and checked beginner-issue coverage. Only add project detail pages if they have useful original context. |
| Saved searches | Store search definitions in the account; show matching fresh issues on return. No paid email pipeline in the initial release. |
| Public GitHub overview | Bounded, cached public contribution data for the authenticated user, with explicit scope, period, exclusions and partial-result notices. |
| First-contribution guide | Original guidance on choosing an issue, asking maintainers, following project rules, and submitting an appropriate PR. |

Defer public profiles, leaderboards, streaks, email notifications, AI matching, bulk profile harvesting, automatic PR creation, and private-repository access. These add cost, privacy obligations, or incentives unrelated to a useful first contribution.

## Contribution measurement

Use two explicitly separate contexts:

- **Tracked in FirstPatch:** PRs explicitly linked to saved issues. Authorship can be verified; issue association is marked user-linked unless GitHub provides relationship evidence. Even a verified link does not prove FirstPatch caused the contribution.
- **Public GitHub activity:** optional cached overview of the user's public PRs during a bounded period, proposed as the last 12 months. This is not a complete lifetime record or a general measure of developer ability.

Avoid a single ambiguous contribution score. Public repositories can be personal projects or lack an identified open-source license. If the UI offers an open-source subset, disclose the exact rule, distinguish license-not-identified records, and do not imply SPDX detection is legal clearance. Default external-project views exclude the user's own repositories where ownership is known; organization membership is not inferred as third-party contribution.

Start with explicitly linked PRs before building broad historical aggregation. The narrower feature is easier to verify and cheaper to maintain. Reviews, commits, issue creation, and cross-repository relationships can be added later with separate definitions.

## UX and visual direction

Retain Source Sans 3, Source Code Pro for identifiers, ivory/forest-green surfaces, the sprout mark, compact navigation, the existing Phosphor icon family, unified issue rows, and initially collapsed details. Apply the established Anti Slop direction during future design and implementation; this proposal is not a redesign.

Proposed navigation: Issues, Projects, Sources, Saved, and Progress. The account menu contains Settings and sign-out. On mobile, keep search and discovery prominent and move account destinations into a compact menu.

Use a bookmark icon with an accessible text label; GitHub star icons continue to mean repository stars. Saving requires authentication, while opening an issue does not. Preserve the pending save server-side or in a short-lived cookie across OAuth, validate the return path, and return to the original filter context. Do not place tokens or private notes in return URLs.

Saved and Progress should initially be list/table views consistent with discovery, rather than a large dashboard or mandatory kanban. Include useful empty states, keyboard support, visible focus, screen-reader announcements, narrow-screen reflow, and tested light/dark contrast.

Each write action must communicate success or failure. Do not display an issue as durably saved after a rejected database write. Concurrent toggles and multiple tabs should not create duplicates or overwrite newer notes silently.

External content links continue opening in a new tab. OAuth navigation follows a deliberate authentication flow so callbacks, cancellation and return-to-issue behavior work reliably.

## Proposed architecture

```text
Public visitor -> Cloudflare Pages -> prerendered HTML + public catalogue JSON

Signed-in browser -> Cloudflare Pages Functions -> Supabase Auth / PostgreSQL
                    same-origin API + session

External scheduled runner -> authenticated private batch endpoint
                           -> due GitHub metadata checks -> Supabase summaries

Existing catalogue workflow -> licensed sources + GitHub metadata
                            -> checked static snapshot -> existing Pages deployment
```

Keep the existing HTML/CSS/native JavaScript stack. A frontend framework migration is not required by these features.

Route only `/api/*` and `/auth/*` through Functions. Public pages and catalogue files must not require session middleware or database access. Account outages should not break public discovery. Personal data responses use private/no-store caching and never enter shared HTML or public catalogue outputs.

Supabase Auth supports GitHub OAuth. Use a server-mediated PKCE flow and an application session cookie with Secure, HttpOnly and appropriate SameSite settings. Access/refresh tokens stay on the server, with renewal, expiry and revocation handled deliberately. Standard browser SDK persistence must not be enabled accidentally. Supabase's standard browser/SSR cookie flow is not automatically HttpOnly; the server-only session boundary is an explicit implementation requirement.

Current source inspection found `firstpatch-theme` in localStorage. Remove that existing use as part of the account/preference work; also check the initial theme script and every built asset. Do not introduce sessionStorage as a substitute for durable personal data.

GitHub OAuth authenticates the person; it does not automatically supply a contribution dashboard or perpetual background access. Confirm provider scopes and token lifecycle before implementing background statistics. Public-data tracking should not request repository-write or private-repository scopes. If a provider requires identity/email access for login, explain it accurately and minimize retained fields.

## Data model and boundaries

| Record | Contents and ownership |
| --- | --- |
| Auth identity | Supabase Auth user linked to immutable GitHub ID; do not key ownership by a mutable username. |
| Profile/preferences | Display identity, theme and filter preferences; private by default. |
| Saved issue | Owner, stable GitHub issue/repository identifiers, source URL, personal state and optional short note. Unique per owner and issue. |
| Linked PR | Owner, saved issue link, PR identifier, verified author ID, API state, relationship evidence and checked time. |
| Contribution summary | Bounded aggregates with period, definition/version, completeness and checked time. |
| Integration/session | Server-only secrets or encrypted tokens only where necessary, expiry and revocation information. |
| Job state | Bounded due work, last success, retries and failure category; retain minimal diagnostics. |

Enable RLS on exposed tables and enforce ownership on reads, writes and changes to owner fields. Use the user's authenticated identity for ordinary data access rather than treating an admin key as authorization. Keep privileged job operations narrowly scoped and server-only. Secret/service-role keys must never appear in public JavaScript, feeds, GitHub logs or artifacts.

Validate OAuth state/PKCE and callback allowlists, protect cookie-authenticated write endpoints against CSRF, constrain request sizes and text lengths, and apply per-user throttling to writes and refreshes. Validate PR URLs as GitHub identifiers rather than fetching arbitrary submitted URLs. Escape user-provided notes in every render path. Test these boundaries with separate user sessions.

Store public GitHub facts only when needed; do not copy PR bodies, review text or source code into the personal database. Shared public PR facts can be deduplicated while keeping private user associations and notes separate. On repository visibility changes or access failures, stop fresh exposure, mark unavailable, and remove sensitive cached details as appropriate.

## Rp0 operating plan

Verified provider documentation on 26 October 2026 lists these relevant Free limits. They are reference limits, not a measurement of remaining account quota or a promise of future provider pricing.

| Provider resource | Published Free allowance |
| --- | --- |
| Supabase Auth | 50,000 monthly active users |
| Supabase database | 500 MB per project |
| Supabase egress | 5 GB/month; cached egress has a separate 5 GB bucket |
| Supabase active projects | 2 across organizations in which the user is Owner/Administrator |
| Cloudflare Workers / Pages Functions | 100,000 requests/day for the account; 10 ms CPU per invocation on Free |
| Cloudflare Pages builds | 500/month on Free |

Use an organization on Supabase Free, verify an available project slot, and inspect the actual Cloudflare plan/usage before provisioning. No paid add-ons or automatic upgrade path. Do not assume the account is empty or that FirstPatch has all shared Cloudflare capacity available.

Budget controls:

- Keep the large public catalogue on Cloudflare static hosting.
- Paginate private lists, index owner/date fields, return only needed columns, and batch counts.
- Proposed starting limits: 200 saved issues per user, 1,000 characters per note, 20 filter presets. These are application limits, not provider quotas, and should be revisited using real usage.
- Cache personal summaries for about 24 hours. Proposed manual refresh cooldown: 6 hours, subject to remaining GitHub quota.
- Background work checks only due tracked PRs and users active recently. Do not refresh every registered user forever.
- No realtime subscription, uploaded avatars or source-code storage is needed for the first release.
- Monitor database size, egress, Functions usage/CPU, build count and GitHub rate-limit headers. Proposed review thresholds: 60% warning and 80% discretionary-job reduction; provider limits remain authoritative.
- At exhaustion, keep public browsing available and show account-feature limitations honestly. Do not upgrade automatically.

Do not equate 50,000 Auth MAU with guaranteed capacity for 50,000 active users of every feature. Egress, query load, session traffic, shared Functions quota, GitHub limits or storage can bind first. Measure representative workflows before advertising capacity.

## Daily scheduling and pausing

Keep the existing public-data schedule configured for 00:00 WIB, while stating that GitHub Actions can start late. Personal progress updates are a separate workflow and must not invoke the deploy hook or rebuild Pages.

Propose one external scheduled runner, initially GitHub Actions using the project's eligible free public-repository runner, with bounded batches through a private job endpoint. Set a runtime cap and ensure no private user records, notes, credentials or response payloads are committed, logged or uploaded as public artifacts. Verify runner eligibility and account settings before enabling it.

The job updates actually tracked PRs, refreshes due summaries and removes expired application sessions/cache. Use checkpoints, capped retries/backoff and GitHub rate-limit feedback. A run or batch can be repeated without duplicate PRs or counts. Fit each private endpoint invocation to Workers Free CPU and subrequest limits; do not put an unbounded all-users loop inside one request.

Supabase evaluates sufficient user database activity over a seven-day period. A few daily database requests typically suffice according to its documentation, but a cron is not a guarantee against pausing. Do useful bounded work rather than inventing data or assuming a request to the Cloudflare homepage counts. Monitor warning emails; an already paused database requires recovery, not more database pings. The public site remains usable while account features show a temporary-unavailability state.

## Privacy, reuse and abuse prevention

Preserve the existing licensed-source policy and provenance. MIT notices and the CC BY-SA catalogue notice continue to accompany derived public exports. Sources without an established dataset reuse basis remain external links. Do not blanket-license private notes or GitHub-authored text as part of the public catalogue.

Update About and publish an accurate privacy notice before enabling accounts: actual identity fields collected, purposes, GitHub/Supabase/Cloudflare processing, session cookies, retention, user controls and contact path. No public profiles by default, private-repository import, geography inference, marketing use of GitHub email, or people ranking.

Provide export and deletion flows. Deleting a FirstPatch account removes its saved data and sessions and cancels future personal jobs; it does not delete GitHub contributions. Explain separately how GitHub application authorization can be revoked. Set and test a retention policy for operational logs, expired sessions and any backups, including limits on immediate deletion from provider-retained backups.

Avoid incentives for low-value PR spam. Before starting, direct contributors to maintainer instructions, assignment policies, licenses and AI-use rules. Stars, forks and activity are observed facts, not difficulty or responsiveness guarantees. Retain correction/removal reporting.

This is an engineering risk-reduction plan, not legal certification. Account functionality changes the privacy/data-processing scope of the existing catalogue-only product. Review the actual fields, processors, applicable privacy obligations and provider terms before release; no blanket claim that public GitHub data is unrestricted or that all jurisdictions are covered.

## Discovery, performance and SEO

Keep existing prerendered lists, crawlable pagination, language pages, canonicals, sitemap and visible-content JSON-LD. Add framework/topic pages only when data coverage and original guidance make them useful; do not mass-generate thin filter combinations or duplicate upstream issue pages.

Account, callback, saved and progress routes must not be indexed. Authentication and authorization protect private data; noindex is an additional search directive, not a privacy control. Keep private data out of sitemaps and structured data. Public profiles require a separate opt-in product decision.

Improve explanatory content and internal links around choosing a first issue, contribution etiquette and language/framework paths. Inspect Search Console indexing and sitemap reports before diagnosing current Google visibility; prior records are historical. Google does not guarantee indexing or ranking when technical guidelines are followed.

For performance, measure first-render and filter behavior before changing delivery. Consider loading the larger public feed only when required and splitting it if measured transfer/parse costs justify it. Preserve functioning HTML and pagination without JavaScript.

## Delivery stages and acceptance

| Stage | Deliverable | Required evidence |
| --- | --- | --- |
| 0. Confirm scope and setup | First-release scope, actual free slots/quotas, permissions and privacy data inventory | No paid resource selected; OAuth scopes reviewed; environment/secret boundaries documented. |
| 1. UX and states | Account action, save/sign-in/return flow, Saved, Progress, Settings and failure states in the existing visual system | Desktop/mobile review; intentional empty, loading, signed-out, expired-session and service-unavailable states. |
| 2. Identity and saves | GitHub sign-in, server sessions, cross-device saved list, private notes and preferences | Two-user isolation, session renewal/logout, OAuth denial/return validation, duplicate-save handling and no localStorage calls. |
| 3. Verified tracking | Linked PR validation and distinct personal/GitHub states | Reject another author's PR; show merged vs closed correctly; mark user-linked vs API-confirmed associations; show stale/partial data. |
| 4. Discovery improvements | Confirmed topics, result diversity, clear presets and data-health UX | Fixture-based checks for missing metadata, truthful labels, filters and accessible narrow-screen use. |
| 5. Operations and release | Scheduled personal sync, quota handling, privacy/account controls, SEO checks and production verification | Rate-limit/outage/paused-service behavior; export/deletion; no secrets or user data in static outputs/logs; existing tests/build/check plus focused auth/API tests; actual post-release flow checks. |

Code preview comes before production release. A new feature should have a scoped commit and a rollback path; private DB schema changes should be additive where possible. Personal-data export or cleanup steps must be documented for rollback without silently abandoning user data.

Success is a verified find -> save -> link PR -> see state workflow, reliable cross-device persistence and an intact public discovery experience. Initial measurement should use aggregate application counts with disclosed definitions; no fingerprinting or invasive visitor analytics is needed.

## Sources

Existing behavior was checked against README.md, DESIGN.md, public/assets/app.js, public/assets/issues.mjs and docs/data-reuse-review.md in this checkout. These files are implementation context, not a fresh account-usage or Search Console audit.

- [Supabase Free pricing](https://supabase.com/pricing)
- [Supabase billing and free-project scope](https://supabase.com/docs/guides/platform/billing-on-supabase)
- [Supabase project pausing](https://supabase.com/docs/guides/platform/free-project-pausing)
- [Supabase GitHub sign-in](https://supabase.com/docs/guides/auth/social-sign-in/auth-github)
- [Supabase session storage and cookie considerations](https://supabase.com/docs/guides/auth/server-side/advanced-guide)
- [Supabase Free billing behavior](https://supabase.com/docs/guides/platform/cost-control)
- [Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits/)
- [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
- [GitHub GraphQL limits](https://docs.github.com/en/graphql/overview/rate-limits-and-query-limits-for-the-graphql-api)
- [GitHub API and content terms](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service)
- [Google Search Essentials](https://developers.google.com/search/docs/essentials)
