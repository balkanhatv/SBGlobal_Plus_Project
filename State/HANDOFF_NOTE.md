# HANDOFF_NOTE — SBGlobal Plus
**Updated:** 2026-09-20 · **Checkpoint:** `DEV-COMMERCIAL-ADJUSTMENT-SOURCE-001`

Fresh-fetch branch/HEAD/CI before continuation.

Verified executable `8b735dd19b18ae5e9f0d1d3894cd497bb56c26b0`, tree `631abc2f75e108027440771507ee85350b9eb698`: **196 Core + 56 PostgreSQL + 45 migrations / 39 verification files PASS + Next.js 15.5.25 production build/lock/clean-state PASS**.

DD-070 physicalizes the active adjustment-source boundary:
- current Subscription pointer/version/source PlanVersion revalidated;
- active/effective target PlanVersion/Plan/route required;
- exact same-Tenant/Subscription TenantAddOns and active/effective overrides only;
- sibling Tenant adjustment rows excluded under predicates + FORCE-RLS;
- add-on eligibility remains an opaque server-owned resolver seam;
- only resolver-ELIGIBLE add-ons can contribute DD-069 quota deltas.

Do not overclaim eligibility business rules: the repository has no concrete production eligibility resolver yet.

Next governed slice: deterministic F-14/DD-04 precedence over DD-068 baseline + DD-070 prepared adjustments. Tenant override LIMIT_SET/LIMIT_DELTA must fail closed if an entitlement maps to multiple target meter keys; never guess the meter.

RawSourceCorpus immutable; `main` unmerged; PR #2 review-only/draft.
