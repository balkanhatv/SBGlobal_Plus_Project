# DEVELOPMENT DD-073 VERIFICATION — 2026-09-21

**Decision:** DD-073 — Downgrade usage impact compares only source-safe selected usage  
**Checkpoint candidate:** `DEV-COMMERCIAL-USAGE-IMPACT-001`  
**Promoted predecessor:** `069e7640fccf30321c1fedc4b8c21fc00dc591c5` / `c248f2a88a9ca9b9dba98b455fff99770f10c30d`  
**Verified feature executable:** `d982eb59098e4dc51586a2cf5e92771909566ea4`  
**Verified feature tree:** `ad4b22497f93956337f6a86e0fa4f76a13bec46a`

## Exact-head CI evidence

- Core Service Verify push run **35566030874**, core job **106227915903**: exact tested commit/tree asserted in log; **225/225 PASS**, fail 0, skipped 0.
- Same run PostgreSQL context job **106227915891**: exact tested commit/tree asserted in log; **56/56 PASS** plus **full 46 migrations / 40 verification files database bootstrap PASS**.
- Web Boundary Verify push run **35566030848**, job **106227915741**: **PASS** at the feature head.
- Database Verify push run **35566030870**, job **106227915671**: **PASS** at the feature head.
- No failed DD-073 implementation attempt preceded this verified feature commit.

## Verified scope

DD-073 adds a server-owned usage-measurement source seam plus deterministic BR-SUB-04 target-impact comparison:
- SERVICE + TENANT_CORE caller floor;
- exact target PlanVersion/effectiveAt/DD-071 target-limit input;
- exact entitlement + meter + optional Industry Context measurement binding;
- FINITE `used_value` comparison;
- NOT_INCLUDED / still-ADD_ON_ONLY zero included target capacity;
- UNLIMITED non-blocking handling;
- mandatory exact selected measurement for bounded targets;
- missing/unknown/multiple-period measurement fail-closed behavior;
- relevant non-zero `reserved_value` fail closed as unresolved semantics;
- deterministic immutable output and aggregate blocking-usage flag.

## Explicitly not claimed

- no concrete PostgreSQL current-period selector;
- no rule that adds, subtracts or ignores `reserved_value`;
- no DD-066 impact/remediation evidence writer integration;
- no concrete production add-on eligibility resolver;
- no concrete compliance/security policy source or restriction application;
- no subscription lifecycle overlay;
- no Billing/payment/proration or Workflow approval producer runtime;
- no public `core.commercial.subscription.changePlan`.

RawSourceCorpus is unchanged. `main` is unchanged/unmerged. PR #2 remains review-only/draft.
