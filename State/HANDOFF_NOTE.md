# HANDOFF_NOTE — SBGlobal Plus
**Updated:** 2026-09-21 · **Checkpoint:** `DEV-COMMERCIAL-ADJUSTMENT-PRECEDENCE-001`

Fresh-fetch branch/HEAD/CI before continuation.

Verified feature executable `1c8844ec982ef91cacc3545576d102fbac3fcaf9`, tree `0792a28622e000beba2e785ce1f0a3282b1fff96`: **207 Core + 56 PostgreSQL + full 46/40 DB bootstrap + Next.js 15.5.25 build PASS**.

DD-071 is the latest feature decision and implementation:
- baseline → override → resolver-eligible quota-add-on precedence;
- deny wins;
- limit override requires exactly one target meter;
- add-ons are quota-additive only and apply after overrides;
- missing/ambiguous/type-invalid targets fail closed.

Do not overclaim: concrete eligibility logic, compliance/security restriction stage, usage impact, lifecycle overlay, final publication/apply, Billing/Workflow producers and public changePlan are unfinished.

Next safe slice: bind the server-owned compliance/security restriction inputs that **only restrict** DD-071 output. RawSourceCorpus immutable; `main` unmerged; PR #2 review-only/draft.
