# CORE SERVICE CHECKPOINT — DEV-COMMERCIAL-WRITER-BOUNDARY-001
**Updated:** 2026-09-19  
**Branch:** `docs/architecture-branch-2`  
**Status:** IMPLEMENTED / TESTED — Commercial event catalog + least-privilege transition/compiler DB boundary

## Verified executable snapshot
- Commit: `b420e1547d9366f3c21612643e2ee04c3214c992`.
- Tree: `80fdbb7377247f374801791f09ae75d118ae832b`.
- Core/server acceptance: **180/180 PASS**.
- Real PostgreSQL regression: **44/44 PASS**.
- Database: **43 migrations / 37 verification files PASS**.
- Next.js 15.5.25 production build, deterministic npm lock and generated-state cleanliness: **PASS**.

## DD-062 / DD-063 / DD-064 prerequisite status
- plan change is a governed request/orchestration flow, not direct client-authorized Subscription mutation;
- client input cannot assert route/payment/approval/remediation/effective-date authority;
- `subscription.transitioned` and `entitlement.recompiled` v1 are cataloged TENANT_CORE / INTERNAL / webhook-ineligible events;
- `sbg_app_rw` and `sbg_worker_rw` no longer own Commercial mutation;
- dedicated `sbg_commercial_transition_compiler_rw` is NOLOGIN/NOBYPASSRLS;
- Subscription write is column-limited to plan_version_id/version/updated_at;
- transition and snapshot-fact evidence are append-only;
- snapshot publication allows INSERT + status-only lifecycle update;
- compiler source reads span all Industry Contexts only inside the current Tenant;
- sibling Tenant Commercial state remains invisible;
- outbox/audit append is role-restricted to Commercial TENANT_CORE evidence and the two DD-063 event types.

## Exact evidence
| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / core-service-verify | 35457318557 | 105934800084 | **PASS — 180/180** |
| Core Service Verify / postgres-context-verify | 35457318557 | 105934799909 | **PASS — 44/44 + DB bootstrap PASS** |
| Database Verify / postgres-verify | 35457318585 | 105934799959 | **PASS — 43 migrations / 37 verification files** |
| Web Boundary Verify / web-boundary-verify | 35457318559 | 105934799723 | **PASS — Next 15.5.25 production build + clean generated state** |

All primary jobs asserted exact tested HEAD `b420e1547d9366f3c21612643e2ee04c3214c992` and tree `80fdbb7377247f374801791f09ae75d118ae832b`.

## Next governed work
Implement only the **atomic Commercial publication transaction floor**:
- server-owned expected Subscription version + source PlanVersion checks;
- deterministic publication input, not client authority;
- Subscription plan-version/version update + append-only transition;
- supersede old CURRENT snapshot + insert new immutable snapshot/facts;
- append DD-063 outbox events and required audit in the same transaction;
- fail closed on stale source/version, sibling Tenant facts or invalid event/snapshot state;
- do not bind the public `changePlan` command until DD-062 assessment/resolution evidence persistence and Billing/approval producer runtime are physically available.

RawSourceCorpus immutable; `main` unmerged; PR #2 review-only/draft.
