# HANDOFF_NOTE — SBGlobal Plus
**Updated:** 2026-09-21 · **Checkpoint:** `DEV-COMMERCIAL-RESTRICTION-INPUT-001`

Fresh-fetch branch/HEAD/CI before continuation.

Verified feature executable `b0ff514b4063b648f8869a7e12008a68ebd8fe5a`, tree `d7b28ba1310bc77283cc479002052fbde2febe7b`: **216 Core + 56 PostgreSQL + full 46/40 DB bootstrap + Next.js 15.5.25 build PASS**.

DD-072 is the latest feature decision and implementation:
- server-owned resolver seam receives exact target PlanVersion + DD-071 preview;
- v1 normalized restriction authority is DENY-only and exact-existing-entitlement-target only;
- policy/evidence binding is required and deterministically normalized;
- missing target, selector fan-out, ALLOW, numeric/opaque effect, duplicate tuple, stale binding and malformed evidence fail closed;
- resolver failure does not become an implicit empty/allow result.

Do not overclaim: DD-072 does **not** provide a production compliance/security policy source or apply restrictions. Concrete eligibility logic, restriction application, usage impact, lifecycle overlay, final publication/apply, Billing/Workflow producers and public changePlan remain unfinished.

Next safe independent slice: inspect F-14/DD-04 BR-SUB-04 + existing `usage_meter` ownership and implement only a source-backed usage-impact prerequisite. Final preview still requires concrete governed compliance/security authority/application. RawSourceCorpus immutable; `main` unmerged; PR #2 review-only/draft.
