# CORE SERVICE CHECKPOINT — DEV-AUTHZ-EVAL-001
**Updated:** 2026-09-18  
**Branch:** `docs/architecture-branch-2`  
**Status:** IMPLEMENTED / TESTED — fail-closed AuthorizationDecisionPort RBAC/ABAC evaluator floor; compiler not yet claimed

## Verified executable snapshot
- Commit: `96b051ca6feef26d3f8534ce6d3240f6843dc31e`.
- Tree: `1e9d6151cc4fa01232b4ee1e7397a33fa81249b0`.
- Prior executable checkpoint: `4916b30359cea056a352245176dcb33f739fc0a0` (`DEV-AUTHZ-READ-STORE-001`).
- Design correction prerequisite: `b879be93913e3ec1b4d6e6ac0bda32ee7eff2db5` (DD-045 fail-closed evaluator floor).
- Database: **36 migrations / 30 verification files** through 0036 + 0099.
- Industry SQL scope remains **9 Current Supported Industries / 41 canonical MS / 181 canonical Industry tables**.
- Core/server acceptance inventory: **87 tests**; real PostgreSQL inventory: **15 tests**.

## Current Authorization evaluator boundary
`DEV-AUTHZ-EVAL-001` consumes the independently verified Authorization read store and locked v1 policy grammar:
- exact CURRENT compiled permission snapshot drives RBAC;
- missing permission or compiled DENY is final `DENY / RBAC_DENY`;
- ABAC never creates an allow;
- matching persisted `DENY` is final `DENY / ABAC_DENY`;
- matching persisted `RESTRICT` also fails closed as `DENY / ABAC_DENY` because current persistence has no governed restriction payload/reducer contract;
- base evaluation defers policies requiring `resource.*` attributes; resource evaluation re-reads current Authorization state and evaluates the full applicable policy set;
- unavailable non-`exists` server policy facts fail closed; supplemental facts are server-owned and cannot override directly resolved subject/resource/environment facts;
- tenant RequestContext permissionVersion + roleIds must match the exact CURRENT compiled snapshot and tenant decisions require the current entitlementSnapshotVersion;
- PLATFORM_GLOBAL uses the dedicated platform snapshot and does not invent a tenant entitlement version sentinel;
- evaluator failures normalize through GuardPipeline as non-disclosing `DEPENDENCY_UNAVAILABLE`;
- decisions in this bounded floor set `auditRequired=true`; durable audit emission remains a separate integration responsibility.

This checkpoint does **not** claim a restriction payload schema/reducer, concrete Commercial supplemental-fact adapter, compiler publication, complete resource/workflow business-rule evaluation, transport wiring, or production authorization certification.

## Exact executable evidence
| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / core-service-verify | 35281558425 | 105404441228 | **PASS — 87/87** |
| Core Service Verify / postgres-context-verify | 35281558425 | 105404440896 | **PASS — 15/15** |
| Database Verify / postgres-verify | 35281558472 | 105404441482 | **PASS — 36 migrations / 30 verification files** |

All jobs asserted exact tested HEAD `96b051ca6feef26d3f8534ce6d3240f6843dc31e` and tree `1e9d6151cc4fa01232b4ee1e7397a33fa81249b0`.

## Correction lineage
The first evaluator implementation `80fa65502fbe682963405e9cc01c47cdf800381d` was **not promoted**: Core/PostgreSQL builds failed TS2322 because a mutable optional `resourceDescriptor` lost narrowing inside an async closure. Commit `96b051ca6feef26d3f8534ce6d3240f6843dc31e` passed the immutable resolved resource directly and restored exact-head Core/PostgreSQL success without changing authorization semantics.

## Scope limits / next governed work
Next governed unfinished slice: **dedicated Authorization compiler write boundary only** — implement the DD-041 monotonic publication/invalidation protocol with a least-privilege compiler role/policy and exact tenant/platform scope separation. Do not make runtime app roles writers.

True enforceable ABAC RESTRICT payload/reducer, concrete Commercial current-state facts, broader resource/workflow rules, transports/rate limiter/idempotency, UI/mobile/desktop, deployment and production readiness remain unfinished. RawSourceCorpus remains immutable. `main` remains unmerged; PR #2 stays review-only/draft.
