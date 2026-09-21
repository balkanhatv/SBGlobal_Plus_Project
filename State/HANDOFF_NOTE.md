# HANDOFF_NOTE — SBGlobal Plus
**Updated:** 2026-09-21 · **Checkpoint:** `DEV-COMMERCIAL-USAGE-IMPACT-001`

Fresh-fetch branch/HEAD/CI before continuation.

Verified feature executable `d982eb59098e4dc51586a2cf5e92771909566ea4`, tree `ad4b22497f93956337f6a86e0fa4f76a13bec46a`: **225 Core + 56 PostgreSQL + full 46/40 DB bootstrap + Next.js 15.5.25 build + Database Verify PASS**.

DD-073 is the latest feature decision and implementation:
- server-owned usage source receives exact target PlanVersion/effectiveAt/DD-071 target limits;
- FINITE compares selected persisted `used_value` to the exact target;
- NOT_INCLUDED/still-ADD_ON_ONLY are zero included target capacity;
- UNLIMITED is non-blocking;
- missing/unknown/multi-period measurement fails closed;
- relevant `reserved_value > 0` fails closed because downgrade reservation semantics are not governed.

Do not overclaim: no production current-period selector or reservation reconciliation rule exists yet. Concrete eligibility logic, compliance/security source/application, lifecycle overlay, final publication/apply, Billing/Workflow producers and public changePlan are unfinished.

Next safe independent slice: inspect F-14 §2/§6 + DD-04 lifecycle matrix and implement only deterministic lifecycle target-overlay semantics. RawSourceCorpus immutable; `main` unmerged; PR #2 review-only/draft.
