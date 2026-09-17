# DEV-AUTHZ-PDP-001 — Authorization PDP/ABAC Persistence Prerequisite
**Date:** 2026-09-17  
**Branch:** `docs/architecture-branch-2`  
**Status:** IMPLEMENTED PERSISTENCE PREREQUISITE / PDP EVALUATOR NOT YET CLAIMED

## Authority and reason

This bounded Development contract follows F-03, A-03, DD-03, DD-041, DD-043 and DD-044. Fresh audit of executable HEAD `6b0497c1773a2e10c470c0fd2f7ecfe72e439445` found that tenant-scoped compiled authorization persistence already exists, but its subject contract is limited to `TENANT_CORE` / `TENANT_INDUSTRY`, while `core_authz.role_assignment.tenant_id` is mandatory. DD-043 explicitly requires a concrete PLATFORM_GLOBAL PDP/ABAC integration next and forbids treating a PLATFORM_GLOBAL RequestContext as an allow decision by itself.

Therefore PLATFORM_GLOBAL authorization had no physical RBAC assignment/compiled-snapshot owner. Implementing a generic evaluator first would require invented permission versions, an implicit allow, or a parallel in-memory truth. All are rejected.

## Persistence decision

Migration `0035_platform_global_authorization_persistence.sql` adds Authorization-owned PLATFORM_GLOBAL persistence only:

- `core_authz.platform_role_assignment` — assignments for active `PLATFORM_OPERATOR` or `SERVICE` principals to active `PLATFORM` role templates only;
- `core_authz.compiled_platform_permission_subject` — one compiled Authorization subject per platform principal;
- `core_authz.compiled_platform_permission_snapshot` — immutable, monotonic, versioned snapshot with role IDs and schema-versioned `permission_set_json`.

The existing tenant tables from DD-041 remain unchanged. This avoids weakening their Tenant/Industry RLS or overloading null Tenant semantics.

## Security boundary

- All three tables use FORCE RLS and are registered in `core_authz.rls_table_registry` as PLATFORM_GLOBAL Authorization owners.
- `sbg_app_rw` is SELECT-only and can read only the current PLATFORM_GLOBAL principal through RLS.
- `sbg_control_plane_rw` owns platform role-assignment lifecycle, but does **not** receive compiled snapshot mutation rights.
- No Authorization compiler role is silently introduced. Snapshot publication remains a later explicit least-privilege compiler boundary, consistent with DD-041.
- Compiled snapshot payload is immutable after insert; pointer/version advances are exact and fail closed.
- Ordinary HUMAN principals cannot receive platform role assignments. PLATFORM_OPERATOR and SERVICE are the only accepted platform authorization subjects.

## Determinism gap intentionally not hidden

The fresh audit also confirmed that exact executable v1 shapes for `permission_set_json` and `abac_policy.expression_ast_json` are not yet fully specified. Migration 0035 does not invent evaluator semantics. The next Authorization slice must first lock one deterministic permission payload + ABAC AST grammar, then implement the PDP reader/evaluator and tests against both tenant and platform compiled snapshots.

## Acceptance

`database/verification/0035_platform_global_authorization_persistence.verify.sql` proves:

1. all three tables exist with FORCE RLS and active registry entries;
2. app runtime is read-only;
3. Control Plane can manage platform role assignments but cannot become the compiler implicitly;
4. current-snapshot pointer/version and one-CURRENT invariants exist;
5. an active PLATFORM_OPERATOR can receive a PLATFORM role and a compiled snapshot can be published by migration authority;
6. an ordinary HUMAN platform-role assignment is rejected;
7. compiled permission payload rewrite is rejected.

This checkpoint does **not** claim PDP/ABAC evaluation, compiler implementation, Commercial integration, transports, UI, production readiness or deployment.

## Next governed sequence

1. Define executable permission-set v1 and ABAC expression v1 grammar without arbitrary code/SQL/dynamic execution.
2. Implement Authorization read store for tenant + platform current snapshots and applicable ACTIVE ABAC policies.
3. Implement fail-closed `AuthorizationDecisionPort` PDP/ABAC evaluation and DD-17 AUTH-001…AUTH-008 tests.
4. Add dedicated Authorization compiler write boundary separately.
5. Continue Commercial validation integration, then DD-06 transports.
