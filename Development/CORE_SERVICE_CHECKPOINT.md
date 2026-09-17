# CORE SERVICE CHECKPOINT — DEV-AUTHZ-POLICY-GRAMMAR-001
**Updated:** 2026-09-17  
**Branch:** `docs/architecture-branch-2`  
**Status:** IMPLEMENTED / TESTED — deterministic Permission Set v1 + ABAC Expression v1 grammar; PDP reader/evaluator not yet claimed

## Verified executable snapshot
- Commit: `1b0f90dc900e0ab49cde2f8305f11cfadadae31c`.
- Tree: `a48a2b8cd4d9447522ca2c5721d23a85175dbfa8`.
- Prior executable checkpoint: `54e6fd0972699e31c4650e54faa9e41086f55755` (`DEV-AUTHZ-PDP-001`).
- Database: **35 migrations / 29 verification files**, including 0035 and 0099.
- Industry SQL scope remains **9 Current Supported Industries / 41 canonical MS / 181 canonical Industry tables**.
- Core/server acceptance inventory: **71 tests**; real PostgreSQL inventory: **13 tests**.

## Zero-trust correction lineage retained
The 2026-09-17 audit did not accept the first 0035 persistence claim. Exact-head CI at `c4ceff50d76730ef18232d448523ff5d1e896cd4` failed because the RLS registry CHECK had not yet admitted the governed `PLATFORM_GLOBAL` scope. Commit `07d7a760e547d1c07618e4fe0bf95d6588fe2836` corrected that vocabulary but exposed a schema-local deferred-FK verification defect. Commit `54e6fd0972699e31c4650e54faa9e41086f55755` corrected both and passed exact-head Core + PostgreSQL + full database verification.

No historical migration was rewritten. Existing Tenant/Industry persistence, RLS and 9/41/181 Industry boundaries were not weakened.

## Current Authorization boundary
`DEV-AUTHZ-PDP-001` remains the physical PLATFORM_GLOBAL persistence prerequisite:
- platform role assignment for active PLATFORM_OPERATOR/SERVICE principals and active PLATFORM roles;
- immutable/versioned compiled platform permission subjects/snapshots;
- FORCE RLS and least-privilege runtime/control-plane boundaries;
- no compiler writer invented.

`DEV-AUTHZ-POLICY-GRAMMAR-001` now locks the executable v1 data contracts before any evaluator exists:
- Permission Set v1 is canonical, strictly sorted, unique `code + ALLOW|DENY` data only;
- permission codes use the governed four-segment lowercase grammar;
- ABAC Expression v1 accepts only allowlisted server-derived subject/resource/environment/commercial attributes;
- bounded data-only operators: logical, scalar comparison, set membership, presence and UTC time comparison;
- bounded depth/node/list sizes;
- permission matching is exact or terminal-prefix wildcard only;
- unknown fields/operators/attributes/versions fail closed at the parser boundary;
- arbitrary JavaScript/eval, SQL, shell, regex/glob ASTs, templates, network/filesystem/provider calls and dynamic object traversal are not executable policy surfaces.

The grammar does not evaluate RBAC/ABAC, publish snapshots or widen access. Existing ABAC `DENY`/`RESTRICT` semantics remain narrowing only.

## Exact executable evidence
| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / core-service-verify | 35247193977 | 105290285420 | **PASS — 71/71** |
| Core Service Verify / postgres-context-verify | 35247193977 | 105290285531 | **PASS — 13/13** |
| Database Verify / postgres-verify | 35247193986 | 105290285053 | **PASS** |

The Core and PostgreSQL jobs asserted exact tested HEAD `1b0f90dc900e0ab49cde2f8305f11cfadadae31c` and tree `a48a2b8cd4d9447522ca2c5721d23a85175dbfa8`. Full database bootstrap applied migrations `0001`–`0035` and every verification including `0099_all_industries.verify.sql` successfully.

## Scope limits / next governed work
Next governed unfinished slice: **Authorization read store only** — read the exact tenant or platform CURRENT compiled snapshot plus applicable ACTIVE ABAC policies, validate the stored payloads through the locked v1 parsers, preserve Tenant + Industry / PLATFORM_GLOBAL scope boundaries, and fail closed on missing/current-version/invalid-payload/dependency errors.

Only after that reader is independently tested: fail-closed `AuthorizationDecisionPort` PDP/ABAC evaluator + DD-17 AUTH acceptance → dedicated compiler boundary → Commercial integration → DD-06 transports.

PDP/ABAC evaluation, compiler publication, Commercial integration, transports/rate limiter/idempotency, UI/mobile/desktop, deployment and production readiness remain unfinished. RawSourceCorpus remains immutable. `main` remains unmerged; PR #2 stays review-only/draft.
