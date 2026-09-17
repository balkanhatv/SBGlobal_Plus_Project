# CORE SERVICE CHECKPOINT — DEV-AUTHZ-PDP-001
**Updated:** 2026-09-17  
**Branch:** `docs/architecture-branch-2`  
**Status:** IMPLEMENTED / TESTED — Core + Clerk session-security + PLATFORM_GLOBAL Authorization persistence prerequisite

## Verified executable snapshot
- Commit: `54e6fd0972699e31c4650e54faa9e41086f55755`.
- Prior exact executable baseline: `6b0497c1773a2e10c470c0fd2f7ecfe72e439445` (DD-044 Clerk session-security complete).
- Database: **35 migrations / 29 verification files**, including 0035 and 0099.
- Industry SQL scope remains **9 Current Supported Industries / 41 canonical MS / 181 canonical Industry tables**.
- Core/server acceptance inventory remains **65 tests**; real PostgreSQL inventory remains **13 tests**.

## Fresh zero-trust correction
The 2026-09-17 audit did not accept the earlier 0035 implementation claim. Exact-head CI on `c4ceff50d76730ef18232d448523ff5d1e896cd4` failed before the prerequisite could be promoted.

Two blocking defects were corrected:
1. `core_authz.rls_table_registry` still restricted `scope_class` to Tenant-only/Mixed values although the governed scope vocabulary had already added `PLATFORM_GLOBAL`; migration 0035 now evolves the current registry constraint before registering platform Authorization tables.
2. The 0035 rollback-only verification fixture addressed its deferred current-snapshot FK by an unqualified constraint name; it now uses deterministic transaction-wide deferral for the isolated fixture.

No historical migration was rewritten. Existing tenant/industry persistence and RLS boundaries were not weakened.

## Current Authorization persistence boundary
`DEV-AUTHZ-PDP-001` adds only the missing PLATFORM_GLOBAL physical owner required before a truthful PDP can exist:
- `core_authz.platform_role_assignment` for active PLATFORM_OPERATOR/SERVICE principals and active PLATFORM role templates;
- `core_authz.compiled_platform_permission_subject`;
- immutable/versioned `core_authz.compiled_platform_permission_snapshot`;
- FORCE RLS + active RLS registry entries;
- application runtime SELECT-only access; Control Plane role-assignment lifecycle only; no compiler writer invented.

Tenant compiled-Authorization persistence from DD-041 remains separate and unchanged, preserving Tenant + Industry isolation and avoiding null-Tenant overloading.

## Exact executable evidence
| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / core-service-verify | 35242938042 | 105275719996 | **PASS** |
| Core Service Verify / postgres-context-verify | 35242938042 | 105275720386 | **PASS** |
| Database Verify / postgres-verify | 35242938026 | 105275719655 | **PASS** |

All three jobs asserted exact tested HEAD `54e6fd0972699e31c4650e54faa9e41086f55755`; database bootstrap applied the complete current migration/verification chain and the PostgreSQL job revalidated pooled RLS isolation.

## Scope limits / next governed work
Next: **deterministic executable permission-set v1 + ABAC expression v1 grammar**. The grammar must be data-only, bounded, schema-versioned, fail closed, use only approved attribute namespaces, and permit no arbitrary JavaScript, SQL, shell, template or dynamic code execution.

Only after that contract is locked: Authorization read store → fail-closed PDP/ABAC evaluator and DD-17 AUTH acceptance → dedicated compiler boundary → Commercial integration → DD-06 transports.

UI/mobile/desktop, deployment and production readiness remain unfinished. RawSourceCorpus remains immutable. `main` remains unmerged; PR #2 stays review-only/draft.
