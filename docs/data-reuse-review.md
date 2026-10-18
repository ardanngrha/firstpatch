# Data reuse and privacy review

18 October 2026. This records a scoped engineering review of source permissions, terms, attribution and data minimization. It is not a legal opinion or a guarantee of compliance in every jurisdiction. The implementation is local pending the owner's release decision.

## Implemented safeguards

| Input | Reuse basis and handling |
|---|---|
| Good First Issue (DeepSource) | MIT catalogue; copyright and permission notice distributed in `/licenses/good-first-issue.txt` and `/data/attribution.json`. Original source URL retained. |
| First Contributions | MIT catalogue; upstream notice distributed in `/licenses/first-contributions.txt` and `/data/attribution.json`. Original source URL retained. |
| Up For Grabs | `_data` content explicitly CC BY-SA 4.0. Derived project catalogue retains source membership, credits Up-For-Grabs contributors, links the original material and legal text, and describes canonicalization, deduplication and enrichment. |
| CodeTriage / GoodFirstIssue.org | External links only. No HTML fetch in the refresh script; historical source membership and source-only records are removed even from retained snapshots. This avoids treating crawlable pages as a dataset reuse permission. |
| FirstIssue.dev / First Timers Only | Links to original resources. No personalized/private feed imported. The first-timers-only label is independently searched on GitHub. |
| GitHub | Official API, bounded queries and one scheduled daily refresh. No bypass of rate limits. Import only issue titles, links, labels, counts, timestamps, contribution-file presence, and repository metadata needed for discovery. No issue bodies, comment text, user profiles or personal locations fetched. |

The same sanitizer runs during sync and build. It removes legacy issue excerpts from retained snapshots, removes retired source credit, drops records supported only by retired sources, and replaces displayed repository descriptions with descriptions from the licensed catalogues.

`/data/projects.json` embeds the derived catalogue reuse statement. `/data/issues.json` carries a separate original-rights statement, with no blanket CC licence over GitHub issue text. Both point to `/data/attribution.json`; `/data/LICENSE.md` is also distributed. Upstream notices and transformation notes travel with the exported data, rather than existing only in the source repository.

## Interpretation limits

- Public access and API access do not by themselves provide unlimited republication rights. Issue titles can still contain original expression. The metadata-and-link approach reduces copying; it is not a legal finding that every title is unprotected or cleared.
- GitHub's `licenseInfo.spdxId` is repository-level detection. A missing identifier or `NOASSERTION` means not identified, not public domain. An identifier is not a guarantee that all issue contributions, trademarks, images or data share that licence. The UI does not equate license detection with legal permission to reuse code or issue content.
- CC BY-SA permits sharing and adaptation, including commercially, subject to its conditions. Applying that licence to the derived project catalogue does not automatically put the independently written application code under CC BY-SA or relicense third-party issue text. MIT notices remain distributed.
- Country is not inferred from contributor location, nationality, names or organization addresses. A repository is often international; GitHub has no standard project-country field. No personal-location filter or scoring is introduced.
- Stars, forks, comment counts and last-push dates describe observed state, not task difficulty, project quality, response time or guaranteed issue availability. Each row includes the check date; code push and issue update are explicitly distinct.
- Correction/removal requests link to the project tracker. Public reports should not include private personal information. No claim of affiliation or endorsement is made.
- New source onboarding must establish a dataset licence or permission before ingestion. Robots instructions are relevant to crawling but do not replace a reuse licence. Terms and upstream attribution may change and require periodic review.

## Ethics assessment

The Projects metadata extension uses only repository facts from the official GitHub API: primary language, stars, forks, open issue count, last push, detected license and root contribution-file presence. It introduces no personal data fields, inferred country or copied GitHub descriptions. Catalogue attribution and separate issue-content rights notices remain in place. Public visibility was separately verified for all 2,118 enriched repositories in the local snapshot; missing and external-host metadata stays labeled as unavailable.

The product adds cross-source search and contribution context while preserving credit and directing work back to original maintainers. It does not resell private feeds, harvest profiles, rank people by geography, invent difficulty estimates or encourage automated spam contributions. On that basis the aggregation model is ethically defensible. That is a reasoned assessment, not a claim that original operators have endorsed FirstPatch.

The unresolved legal boundary is original text such as issue titles and third-party rights that upstream licences cannot grant. For a commercial launch, a dispute or a requested legal guarantee, qualified counsel should review the specific content and relevant jurisdictions. No maintainer or source operator was contacted or represented as having granted permission during this work.

## Primary sources checked

- [DeepSource catalogue MIT notice](https://github.com/DeepSourceCorp/good-first-issue/blob/master/LICENSE)
- [First Contributions MIT notice](https://github.com/firstcontributions/firstcontributions.github.io/blob/main/LICENSE)
- [Up For Grabs licence scopes](https://github.com/up-for-grabs/up-for-grabs.net/blob/gh-pages/LICENSE)
- [CC BY-SA 4.0 legal text](https://creativecommons.org/licenses/by-sa/4.0/legalcode.en)
- [GitHub Terms D and H](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service)
- [GitHub repository API fields](https://docs.github.com/en/graphql/reference/repos)
- [GoodFirstIssue.org terms](https://www.goodfirstissue.org/terms-of-service)

Verification includes tests for retired-source fallback sanitation and body removal, output inspection of both downloadable feeds and attribution, and browser checks of the Sources page and original links. No blanket statement that the application is legally risk-free is made.
