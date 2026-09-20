# CORE SERVICE CHECKPOINT — DEV-COMMERCIAL-PLAN-BASELINE-001
**Updated:** 2026-09-20  
**Branch:** `docs/architecture-branch-2`  
**Status:** IMPLEMENTED / TESTED — PlanVersion v1 source schema + licensed baseline expansion

## Verified executable snapshot
- Commit: `8f9e7a23e2b383eb7cb3e964d8ed57e35678d2e4`.
- Tree: `eab90b5ad7c269994686790e1d76c2c90b7953a6`.
- Core/server acceptance: **190/190 PASS**.
- Real PostgreSQL regression: **49/49 PASS**.
- Database: **45 migrations / 39 verification files PASS**.
- Next.js 15.5.25 production build, deterministic npm lock and generated-state cleanliness: **PASS**.

## DD-067 / DD-068 executable boundary
- PlanVersion entitlement/limit JSON has a strict executable v1 parser; unsupported versions, unknown fields, marker/value conflicts and duplicate scoped keys fail closed;
- F-14 value markers are explicit: entitlement INCLUDED/NOT_INCLUDED/ADD_ON_ONLY and limit FINITE/UNLIMITED/NOT_INCLUDED/ADD_ON_ONLY;
- TENANT, LICENSED_INDUSTRIES and INDUSTRY_CODE scope selectors are deterministic catalog selectors;
- baseline expansion resolves Industry selectors only to ACTIVE same-Tenant Contexts with independently effective INDUSTRY licenses;
- PlanVersion never creates or replaces an Industry license;
- stale license references and overlapping resolved selectors fail closed;
- explicit markers remain intact for later precedence/impact stages.

## Exact evidence
| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / core-service-verify | 35488007135 | 106017815813 | **PASS — 190/190** |
| Core Service Verify / postgres-context-verify | 35488007135 | 106017815702 | **PASS — 49/49 + DB bootstrap PASS** |
| Database Verify / postgres-verify | 35488011144 | 106017825756 | **PASS — 45 migrations / 39 verification files** |
| Web Boundary Verify / web-boundary-verify | 35488011149 | 106017825814 | **PASS — Next 15.5.25 production build + clean generated state** |

All evidence above asserted exact tested HEAD `8f9e7a23e2b383eb7cb3e964d8ed57e35678d2e4` and tree `eab90b5ad7c269994686790e1d76c2c90b7953a6`.

## Remaining compiler/evaluator blockers
- `add_on.entitlement_delta_json` still lacks an executable schema;
- tenant override value normalization/precedence is not yet executable;
- compliance/security restriction inputs are not yet wired into target preview;
- usage-meter vs target-limit impact evaluator is not yet implemented;
- actual Billing/payment/proration and Workflow approval producer runtimes remain missing;
- public changePlan remains unbound.

Next: lock/implement normalized add-on delta + tenant-override source semantics and their deterministic precedence only.

RawSourceCorpus immutable; `main` unmerged; PR #2 review-only/draft.
