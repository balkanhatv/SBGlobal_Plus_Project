# CORE SERVICE CHECKPOINT — DEV-COMMERCIAL-AUDIT-CORRECTION-001
**Updated:** 2026-09-20  
**Branch:** `docs/architecture-branch-2`  
**Status:** IMPLEMENTED / TESTED — zero-trust current-state correction; DD-069 remains last feature slice

## Verified executable basis
- Commit: `895f0c6c53dd2cabcf5b3d53f8b5f053803e9122`.
- Tree: `5e4bee4f8ede04024ac3cf4ac0cad8d356106224`.
- Core/server acceptance: **194/194 PASS**.
- Real PostgreSQL regression: **53/53 PASS**.
- Database: **45 migrations / 39 verification files PASS**.
- Next.js 15.5.25 production build, deterministic npm lock and generated-state cleanliness: **PASS**.

## Audit correction scope
- DD-068 baseline inventory now accepts the canonical `PENDING | ACTIVE | SUSPENDED | DISABLED` lifecycle; only ACTIVE + independently licensed Industry Contexts receive plan baseline facts/limits.
- Commercial publication now locks only an effective CURRENT snapshot (`valid_from <= now < expires_at`) and verifies the Tenant still points at the selected current Subscription before mutation.
- PostgreSQL regressions prove expired/future snapshot rejection, removed current-subscription-pointer rejection, and rollback of business/outbox writes when final audit append fails.
- A-04 F-14 section references/suspension wording, DD decision-index gaps, DD-06 current tRPC query wording and App Router CI path coverage were reconciled.
- CI now treats current-state/checkpoint artifacts as verification-triggering paths; Database Verify also runs on target-branch push, closing the metadata-head evidence gap.

## Exact evidence
| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / core-service-verify | 35492880766 | 106030721739 | **PASS — 194/194** |
| Core Service Verify / postgres-context-verify | 35492880766 | 106030721643 | **PASS — 53/53 + DB bootstrap PASS** |
| Database Verify / postgres-verify | 35492882333 | 106030725899 | **PASS — 45 migrations / 39 verification files** |
| Web Boundary Verify / web-boundary-verify | 35492880666 | 106030721131 | **PASS — Next 15.5.25 production build + clean generated state** |

All evidence above asserted exact tested HEAD `895f0c6c53dd2cabcf5b3d53f8b5f053803e9122` and tree `5e4bee4f8ede04024ac3cf4ac0cad8d356106224`.

## Last governed feature slice
DD-069 remains verified: quota-additive add-on normalization + typed tenant overrides, including Tenant-vs-Industry DENY representation.

## Remaining target-preview blockers
- `add_on.eligibility_json` lacks a governed executable resolver;
- active TenantAddOn + tenant_override source-row read normalization is not bound to a compiler store;
- deterministic baseline → override → eligible add-on precedence is not implemented;
- compliance/security restriction inputs and usage-meter impact remain downstream;
- Billing/payment/proration and Workflow approval producer runtimes remain unfinished;
- public `core.commercial.subscription.changePlan` remains unbound.

Next: lock add-on eligibility + active adjustment source-read semantics before applying precedence.

RawSourceCorpus immutable; `main` unmerged; PR #2 review-only/draft.
