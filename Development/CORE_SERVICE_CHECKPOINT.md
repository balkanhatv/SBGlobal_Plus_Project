# CORE SERVICE CHECKPOINT — DEV-CORE-POSTGRES-001
**Updated:** 2026-09-14  
**Branch:** `docs/architecture-branch-2`  
**Status:** IMPLEMENTED / TESTED — current Core kernel and pooled PostgreSQL slice

## Verified executable snapshot
- Commit: `0ada4283959ea4abe39a0980574e2dfdcb62e508`.
- Tree: `29b3c4e2b7bded7fec03787c22a1de3ee74b6908`.
- Continuation baseline: `ea24fa631835c6b65d5ee2b4d8dcc656a2f0cee5`.
- Prior checkpoint: `DEV-CORE-CONTEXT-GUARDS-002`, executable `d078f6937a1de8580a8fac39ffb03881aeea4bc4` (29 tests).
- The documentation closure commit is resolved from Git after publication; the code evidence below belongs to the explicit immutable snapshot above.

## Governing consistency and corrections
The fresh baseline and exact physical-owner review are recorded in [DEV-CORE-MAP-001](CORE_PERSISTENCE_ADAPTER_MAP.md). Governing v2.5, Foundation, Architecture, DD-02/03/04/05/06 and surrounding implementation/SQL contracts were cross-checked before advancing. DD-040 / DEV-CORE-AC-001 owns the independent SQL driver prerequisite.

- Lifecycle unions now match DD-05/migration 0001; no invented Tenant/Industry/OrgUnit states.
- Context resolution rejects foreign membership, mismatched principal, and missing/foreign/inactive organization evidence. Workspace projection revalidates current membership.
- Tenant Core resource resolution cannot expose Industry-owned records. Overlapping opaque base/resource restrictions deny until a defined intersection is available.
- SQL scope validates a trusted Data Home/region and optional dedicated Tenant before checkout. Unknown, PUBLIC and generic EXPLICIT_CROSS_CONTEXT scopes fail closed. Context and route inputs are copied before asynchronous pool access.
- Current README/index/state pointers now distinguish implemented Core services from pending repository/provider/transport/UI work.

## Implemented scope
### Core kernel retained and revalidated
- DD-02 immutable RequestContext, WorkerContext and sanitized ClientWorkspaceContext; no default/all-Industries interpretation of null.
- DD-03 provider-neutral IdentityPort and verified human/machine evidence; effective-role query boundary.
- DD-04 typed commercial/access decisions.
- DD-06 canonical OperationContract/registry; commercial and base PDP before scoped resource resolution, then resource PDP.
- Membership-derived workspace and `core.identity.roles.listEffective` with canonical `core.identity.role.view`.

### Concrete PostgreSQL transaction boundary
`src/server/database/postgres-database.ts` implements SqlDatabase with one checked-out node-postgres client per transaction. It uses the existing `sbg_app_rw` role, enables row_security, and rejects superuser/BYPASSRLS login or runtime identities. It does not provide Identity/Control Plane bootstrap authority.

RequestScopedSql sets transaction-local `app.tenant_id`, `app.industry_context_id`, `app.scope_class`, `app.principal_id`, and clears `app.operator_elevation_id` before business queries. Tenant Core clears Industry Context. All five values are cleared at transaction entry and reset before pool release.

COMMIT/ROLLBACK, safe database errors, parameter binding and expired query handles are enforced. Failed rollback/cleanup destroys the connection. A swallowed SQL error followed by PostgreSQL's ROLLBACK result cannot report success. Committed writes are not automatically retried after cleanup failure.

Dependencies are locked: pg 8.16.3, TypeScript 5.9.3, @types/pg 8.15.6 and @types/node 22.20.2. CI runs Node 22 and PostgreSQL 16 with pgvector, consistent with UD-TECH-01.

## Executable evidence
All three PR jobs below logged the exact tested commit and tree above; this is not an inferred result from a PR merge checkout.

| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / core-service-verify | [34823407649](https://github.com/yadavjalsingh192/SBGlobal_Plus_Project/actions/runs/34823407649) | 103909904253 | 40 tests / 40 PASS / 0 FAIL / 0 SKIP |
| Core Service Verify / postgres-context-verify | [34823407649](https://github.com/yadavjalsingh192/SBGlobal_Plus_Project/actions/runs/34823407649) | 103909904031 | 7 real PostgreSQL tests / 7 PASS / 0 FAIL / 0 SKIP |
| Database Verify / postgres-verify | [34823407538](https://github.com/yadavjalsingh192/SBGlobal_Plus_Project/actions/runs/34823407538) | 103909903763 | 32 migrations + 26 verification files, including 0099; bootstrap PASS |

Core push run `34823403619` also succeeded. Both PostgreSQL jobs executed the full clean-database bootstrap. The existing SQL scope remains 9 Industries / 41 canonical MS / 181 canonical Industry tables.

The real adapter tests use a nonprivileged LOGIN and a max-one-client pool. They verify Tenant and sibling-Industry RLS, Tenant Core/null semantics, the same backend reused across alternating contexts, no residual scope/elevation, no-context denial, rollback after SQL/domain errors, privileged-login rejection, forbidden catalog writes, parameter values remaining data, and expired handles. Unit tests cover failed rollback/cleanup, safe errors and delayed checkout/input mutation.

### Failed attempts and fixes
- `456d3bf567547483471110917e71f7337a70f707`: Core run `34822993178`, PostgreSQL job `103908589862` failed fixture setup with 42P08 (a reused parameter inferred as both UUID and text). Commit `4810f48c7b1011e21d6dfaa7c09b80b6d51882f0` made the casts explicit.
- `4810f48c7b1011e21d6dfaa7c09b80b6d51882f0`: Core run `34823183910`, PostgreSQL job `103909200042` exposed the deferred primary-Industry invariant (23514). The verified commit makes fixture setup/cleanup atomic on one admin client and supplies one primary Industry per active Tenant. No migration constraint was weakened.
- Earlier failed runs are retained as history. The successful evidence above supersedes them for this slice.

## Scope limits and next governed work
Specify the exact Authorization compiled-permission snapshot/version persistence contract and the Current Supported Industry presentation catalog contract, then implement their module-owned read adapters. Do not infer missing fields, broaden database grants, or join across module ownership.

Both read-side bindings remain **UNBOUND** in DEV-CORE-MAP-001. Trusted directory routing also requires its owner contract; the app role must not gain directory/identity privileges as a shortcut.

Not yet implemented/certified: full PostgreSQL query repositories, concrete Clerk/Auth.js adapters, integrated production PDP/commercial/security adapters, tRPC/REST transports, rate limiter/idempotency runtime, UI/mobile/desktop, provider calls, deployment or production readiness. This checkpoint does not extend the historical all-stages audit to those scopes.

## Repository and recovery boundaries
RawSource S1/S2 blobs match [SOURCE_REGISTRY](../Registers/SOURCE_REGISTRY.md); the continuation deleted or renamed no files and changed no migration or verification SQL. One Unified Core, nine equal Industries, 41 MS, exactly two Tenant mobile app classes and RBAC-primary policy are preserved.

After code publication, remote main was re-fetched at `3911590ff2020993ce51b32d7b091efd6f5f466f`; PR #2 was OPEN DRAFT / review only. No main merge was performed. UD-BACKUP-01 remains active: no physical ZIP creation is claimed.

Resume by fresh-fetching this branch and checking its actual HEAD, tree, CI and current checkpoint before editing. Select an available model suited to authorization/data-contract reasoning and TypeScript/PostgreSQL implementation; no model switch or delegated execution is claimed.
