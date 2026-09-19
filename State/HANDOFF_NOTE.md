# HANDOFF_NOTE — SBGlobal Plus
**Updated:** 2026-09-19 · **Checkpoint:** `DEV-COMMERCIAL-PUBLICATION-001`

Fresh-fetch branch/HEAD/CI before continuation.

Verified executable `a810af51c93dba5959d4b26502c47100afd631fa`, tree `5b4b662acdc450a9878101652e2bd0ce98404da4`: **182 Core + 47 PostgreSQL + 44 migrations / 38 verification files PASS + Next.js 15.5.25 production build/lock/clean-state PASS**.

DD-065 closes the atomic publication prerequisite: a trusted SERVICE/TENANT_CORE publication service plus dedicated PostgreSQL writer re-locks expected Subscription/current snapshot, validates target/facts, then atomically updates plan/version, appends transition, publishes immutable snapshot/facts and writes both DD-063 events + Commercial audit. General app roles remain non-writers.

Public `core.commercial.subscription.changePlan` remains blocked. Next governed slice is physical DD-062 assessment/remediation/route-resolution evidence persistence and least-privilege Billing/approval producer boundaries; client-supplied payment/approval/remediation evidence is never authority.

RawSourceCorpus immutable; `main` unmerged; PR #2 review-only/draft.
