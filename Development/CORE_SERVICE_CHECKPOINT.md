# CORE SERVICE CHECKPOINT — DEV-AUTHZ-AUDIT-001
**Updated:** 2026-09-18  
**Branch:** `docs/architecture-branch-2`  
**Status:** IMPLEMENTED / TESTED — durable final Authorization decision audit floor

## Verified executable snapshot
- Commit: `09d81fc23d44747ac566fa4fe1957c1efe32479f`.
- Tree: `64ac15c7f06933c52c7ed1e8a3ffadc6204540d8`.
- Prior executable checkpoint: `ed36486e45011c6dc2bae1bcc87c2a13574e177c` (`DEV-AUTHZ-RESOURCE-RULE-001`).
- Database remains **37 migrations / 31 verification files**.
- Industry SQL scope remains **9 Current Supported Industries / 41 canonical MS / 181 canonical Industry tables**.
- Core/server acceptance inventory: **114 tests**; real PostgreSQL inventory: **24 tests**.

## Current Authorization audit boundary
DD-047 / `DEV-AUTHZ-AUDIT-001` implements one final durable access audit for protected GuardPipeline paths:
- success is audited once only after Commercial, PDP, resource/context and resource-rule checks complete;
- every normalized guard deny is audited before returning the denial;
- direct PDP denial preserves exact decision/policy/version metadata;
- pre-PDP Commercial/context/resource denial never fabricates a PDP decision ID;
- resource/workflow denial may retain the immediately preceding PDP decision ID for correlation while final audit outcome remains DENIED;
- required audit persistence failure prevents successful access and remains fail closed as non-disclosing DEPENDENCY_UNAVAILABLE;
- existing `core_audit.audit_event_identity` + partitioned `audit_event` remain the physical truth; no competing audit store was created;
- evidence is metadata-only and excludes request bodies, tokens, Commercial fact values, restriction contents and resource/workflow payloads;
- sibling Industry audit visibility is zero under real PostgreSQL RLS;
- application runtime role can append but cannot mutate durable audit evidence.

PUBLIC and EXPLICIT_CROSS_CONTEXT are not widened through the single-context RequestScopedSql writer and retain separate future governed entry paths.

## Exact executable evidence
| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / core-service-verify | 35315598861 | 105506445804 | **PASS — 114/114** |
| Core Service Verify / postgres-context-verify | 35315598861 | 105506446007 | **PASS — 24/24** |
| Database Verify / postgres-verify | 35315598867 | 105506445886 | **PASS — 37 migrations / 31 verification files** |

All jobs asserted exact tested HEAD `09d81fc23d44747ac566fa4fe1957c1efe32479f` and tree `64ac15c7f06933c52c7ed1e8a3ffadc6204540d8`.

## Scope limits / next governed work
Next shared-Core runtime blocker: **Authorization source-to-snapshot compiler calculation algorithm only** — deterministically calculate effective RBAC role/permission facts from governed role assignments/templates/permissions into the already verified monotonic publication boundary. Do not bypass source truth, do not let ABAC/Commercial create grants, and fail closed on stale/invalid source state.

Still unfinished: concrete per-module resource/workflow adapters, dedicated suspended restricted-mode/UPGRADE_CTA flows, SURFACE/API_SERVICE Commercial applicability, enforceable ABAC RESTRICT payload/reducer, DD-06 transports/rate limiter/idempotency, UI/mobile/desktop, deployment and production certification. RawSourceCorpus remains immutable. `main` remains unmerged; PR #2 stays review-only/draft.
