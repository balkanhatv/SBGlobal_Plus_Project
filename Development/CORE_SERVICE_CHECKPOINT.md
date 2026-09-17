# CORE SERVICE CHECKPOINT — DEV-AUTHZ-READ-STORE-001
**Updated:** 2026-09-18  
**Branch:** `docs/architecture-branch-2`  
**Status:** IMPLEMENTED / TESTED — governed Authorization read store; PDP/ABAC evaluator not yet claimed

## Verified executable snapshot
- Commit: `4916b30359cea056a352245176dcb33f739fc0a0`.
- Tree: `16e1a322620de4a0591222356e6db3dd5f0428bf`.
- Prior executable checkpoint: `1b0f90dc900e0ab49cde2f8305f11cfadadae31c` (`DEV-AUTHZ-POLICY-GRAMMAR-001`).
- Database: **36 migrations / 30 verification files**, including 0036 and 0099.
- Industry SQL scope remains **9 Current Supported Industries / 41 canonical MS / 181 canonical Industry tables**.
- Core/server acceptance inventory: **75 tests**; real PostgreSQL inventory: **15 tests**.

## Authorization lineage retained
`DEV-AUTHZ-PDP-001` remains the physical PLATFORM_GLOBAL Authorization persistence prerequisite. `DEV-AUTHZ-POLICY-GRAMMAR-001` remains the deterministic, bounded, data-only Permission Set v1 / ABAC Expression v1 contract. Migration 0036 adds the governed PLATFORM_GLOBAL ABAC write boundary and is covered by the current exact-head regression.

No historical migration was rewritten. Existing Tenant/Industry persistence, FORCE RLS, least-privilege boundaries and the 9/41/181 Industry model were not weakened.

## Current Authorization read boundary
`DEV-AUTHZ-READ-STORE-001` now provides the independently tested read-side contract:
- tenant requests read only the exact CURRENT compiled tenant permission snapshot for the requested Tenant + Industry scope;
- PLATFORM_GLOBAL requests read only the dedicated current platform permission snapshot;
- tenant and platform snapshot paths are physically separate and never cross-fallback;
- only ACTIVE ABAC policies within their effective validity window are returned;
- persisted Permission Set v1 payloads, ABAC expressions and permission patterns are validated through the locked v1 grammar before use;
- missing current snapshots, unsupported versions, malformed payloads, scope mismatches, invalid policy data and persistence/dependency errors fail closed;
- sibling Industry data never expands from a null or different Industry Context;
- the reader does not evaluate authorization, publish compiled snapshots, widen permissions, or invent compiler/commercial behavior.

## Exact executable evidence
| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / core-service-verify | 35252274497 | 105307252647 | **PASS — 75/75** |
| Core Service Verify / postgres-context-verify | 35252274497 | 105307252908 | **PASS — 15/15** |
| Database Verify / postgres-verify | 35252274557 | 105307253170 | **PASS** |

All three jobs asserted exact tested HEAD `4916b30359cea056a352245176dcb33f739fc0a0` and tree `16e1a322620de4a0591222356e6db3dd5f0428bf`. Full database bootstrap applied migrations `0001`–`0036` and all 30 verification files including `0099_all_industries.verify.sql`.

## Scope limits / next governed work
Next governed unfinished slice: **fail-closed `AuthorizationDecisionPort` PDP/ABAC evaluator + DD-17 AUTH acceptance only**, consuming this verified reader and the locked v1 grammar. RBAC remains primary; ABAC remains narrowing-only with explicit DENY/RESTRICT behavior and no executable policy surface.

Only after the evaluator is independently verified: dedicated Authorization compiler write boundary → Commercial current-state integration → DD-06 transports.

Compiler publication, Commercial integration, transports/rate limiter/idempotency, UI/mobile/desktop, deployment and production readiness remain unfinished. RawSourceCorpus remains immutable. `main` remains unmerged; PR #2 stays review-only/draft.
