# PROJECT_STATE — SBGlobal Plus
**Updated:** 2026-09-19 · **Checkpoint:** `DEV-COMMERCIAL-PUBLICATION-001`

- Branch: `docs/architecture-branch-2`.
- Verified executable: `a810af51c93dba5959d4b26502c47100afd631fa` / `5b4b662acdc450a9878101652e2bd0ce98404da4`.
- Core **182/182 PASS**; PostgreSQL **47/47 PASS**; Database **44 migrations / 38 verification files PASS**.
- Next.js 15.5.25 production build, deterministic npm lock, and generated-state cleanliness: **PASS**.
- Identity, Workspace and client-safe Commercial query remain green.
- DD-063 event catalog and DD-064 dedicated writer remain verified.
- DD-065 internal atomic publication now advances Subscription + immutable entitlement snapshot + outbox/audit in one fail-closed transaction.
- Public `core.commercial.subscription.changePlan` is still intentionally unbound.
- RawSourceCorpus immutable; `main` unmerged; PR #2 draft/unmerged.

Next: **physical DD-062 plan-change assessment/remediation/route-resolution evidence persistence + producer boundaries**.
