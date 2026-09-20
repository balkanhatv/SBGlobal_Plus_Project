# CORE SERVICE CHECKPOINT — DEV-COMMERCIAL-ADJUSTMENT-SCHEMA-001
**Updated:** 2026-09-20  
**Branch:** `docs/architecture-branch-2`  
**Status:** IMPLEMENTED / TESTED — Commercial add-on quota + tenant-override normalization v1

## Verified executable snapshot
- Commit: `4a526c8fc9287136ffad0ee723c73df536a50b27`.
- Tree: `1496cb8d43be198edd71cef62171ced096bfc607`.
- Core/server acceptance: **193/193 PASS**.
- Real PostgreSQL regression: **49/49 PASS**.
- Database: **45 migrations / 39 verification files PASS**.
- Next.js 15.5.25 production build, deterministic npm lock and generated-state cleanliness: **PASS**.

## DD-069 executable boundary
- add-on v1 accepts only source-backed INTEGER/DECIMAL metered-quota deltas;
- TenantAddOn quantity scales quota deltas deterministically;
- arbitrary feature grants, pricing, payment and eligibility are not inferred from add-on JSON;
- ALLOW override values are type-validated;
- LIMIT_SET is non-negative numeric replacement; LIMIT_DELTA is signed numeric;
- DENY requires canonical true;
- Tenant DENY maps to snapshot-wide deny set;
- Industry DENY maps to a type-specific disabled Industry fact, preserving sibling-Industry isolation;
- unknown versions/fields, invalid types, duplicate quota keys and unsafe integer scaling fail closed.

## Exact evidence
| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / core-service-verify | 35488577797 | 106019347892 | **PASS — 193/193** |
| Core Service Verify / postgres-context-verify | 35488575846 | 106019342769 | **PASS — 49/49 + DB bootstrap PASS** |
| Database Verify / postgres-verify | 35488577796 | 106019347800 | **PASS — 45 migrations / 39 verification files** |
| Web Boundary Verify / web-boundary-verify | 35488577798 | 106019347861 | **PASS — Next 15.5.25 production build + clean generated state** |

All evidence above asserted exact tested HEAD `4a526c8fc9287136ffad0ee723c73df536a50b27` and tree `1496cb8d43be198edd71cef62171ced096bfc607`.

## Remaining target-preview blockers
- `add_on.eligibility_json` still lacks a governed executable schema/resolver;
- active TenantAddOn and override read normalization has not yet been bound to a compiler store;
- deterministic precedence across baseline → overrides → active eligible add-ons is not yet implemented;
- compliance/security restriction inputs and usage-meter impact remain downstream;
- Billing/payment/proration and Workflow approval producer runtimes remain unfinished;
- public changePlan remains unbound.

Next: lock add-on eligibility + active adjustment source-read semantics before applying precedence.

RawSourceCorpus immutable; `main` unmerged; PR #2 review-only/draft.
