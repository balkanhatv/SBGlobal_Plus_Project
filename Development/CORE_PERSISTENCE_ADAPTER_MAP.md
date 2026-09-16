# CORE PERSISTENCE ADAPTER MAP
**ID:** DEV-CORE-MAP-001 · **Version:** 1.2 · **Owner:** Core Development
**Date:** 2026-09-16 · **Scope:** DD-02/DD-03/DD-04 read-side dependencies and DD-05 SQL boundary
**Baseline:** `ea24fa631835c6b65d5ee2b4d8dcc656a2f0cee5` · **Decision:** DD-040

## Fresh repository consistency check

The authenticated GitHub ref, complete recursive tree and commit were fetched again after the owner's consistency instruction. All 221 file blobs, including both immutable RawSource files, matched the imported working tree. No repository AGENTS.md exists. Remote main remained `3911590ff2020993ce51b32d7b091efd6f5f466f`. Baseline Core/Database runs `34804164618` / `34804164458` succeeded; baseline local Core suite passed 29/29. The old Core PR workflow used a merge checkout; its green status is not an exact-branch execution assertion. The corrected workflow now asserts the selected head explicitly; current execution evidence is in CORE_SERVICE_CHECKPOINT.md.

Authority checked: Governing MASTER_INSTRUCTION v2.5 §§13–14, 20, 22–26, 33A; Foundation F-01/F-03/F-04/F-11; Architecture A-01/A-02/A-03/A-05/A-09; DetailedDesign DD-01/DD-02/DD-03/DD-04/DD-05/DD-06/DD-13/DD-26; migrations 0001/0003/0005/0009/0029–0033; current src/core, src/server/database, tests and state/index files. Active UD-TECH-01 remains unchanged. SQL-first PostgreSQL adapters fit the existing TypeScript/Node boundary; no new ORM/backend or industry core is introduced.

## Exact field ownership and binding disposition

| Runtime requirement | Existing physical owner | Binding disposition |
|---|---|---|
| Tenant ID/display/status | `core_tenancy.tenant`: `id`, `tenant_code`, `display_name`, `status` | Tenancy-owned read. Runtime status union corrected to DD-05/0001; no invented CLOSED state. |
| Active membership/version/default org | `core_identity.tenant_membership`: `id`, `tenant_id`, `principal_id`, `status`, validity dates, `membership_version`, `default_org_unit_id` | Identity-owned contract; validate active status, validity dates and exact principal/tenant. Do not cross-module join from a Tenancy repository (A-05 §3). |
| Industry activation | `core_tenancy.industry_context`: `id`, `tenant_id`, `industry_code`, `status` | Tenancy-owned activation. Runtime status union corrected to all four physical states. |
| Industry displayKey/displayName | `core_master.current_supported_industry` (DD-042 / migration 0033) | **BOUND / TESTED.** `PostgresIndustryPresentationCatalogAdapter` reads ACTIVE canonical presentation only. Tenant activation remains `core_tenancy.industry_context`; Future Industry promotion remains DD-035 gated. `sbg_app_rw` is SELECT-only. |
| Org unit/path | `core_tenancy.org_unit`: `id`, `tenant_id`, `parent_id`, `path_key`, `status` | Tenancy owns traversal. `path_key` is text, not a UUID array; derive/validate the ancestor chain in the adapter. Runtime enum corrected; foreign/inactive/default-org evidence denied. |
| Data home/region/version | `platform_directory.data_home` plus tenant routing metadata | Tenancy/directory contract; ordinary `sbg_app_rw` has no directory read grant. Route resolution is a trusted directory dependency, not an application grant escalation. |
| Role IDs | `core_authz.role_assignment` / `role_template` | Authorization-owned effective read; scope, membership, org and validity must all be enforced. |
| Compiled permissionVersion | `core_authz.compiled_permission_subject` + immutable `compiled_permission_snapshot` (DD-041 / migration 0033) | **BOUND / TESTED.** Authorization context/effective-role adapters read exact CURRENT pointer/version under forced Tenant/Industry RLS. MAX(role.version), auth_epoch, constants and unrelated AI versions remain prohibited substitutes. Runtime app role is SELECT-only; compiler writer remains a future governed boundary. |
| Current commercial snapshot | `core_commercial.entitlement_snapshot` / facts plus current subscription/license state | Commercial-owned contract. Snapshot alone cannot replace DD-04 §5 current subscription/license validation. |
| SQL transaction/RLS boundary | `src/server/database/contracts.ts`, `request-scoped-sql.ts`; existing runtime role `sbg_app_rw` | Concrete-driver prerequisite implemented/tested at DEV-CORE-POSTGRES-001. No new business tables/permissions. DD-040 specifies route binding, cleanup and real PostgreSQL acceptance before query repositories consume it. |

## Corrections required before adapter continuation

- Stale README, D-INDEX, HANDOFF_NOTE and PHASE_SUMMARY pointers now route to the current Core checkpoint and preserve historical audits.
- Runtime lifecycle enums now match exact DD-05/SQL vocabulary.
- Membership/OrgUnit evidence is checked against resolved Tenant and principal; workspace projection revalidates current membership.
- Generic DB scope rejects unknown runtime values, wrong Data Home/region/dedicated Tenant before checkout; public/cross-context paths remain excluded.
- Tenant Core guards cannot resolve Industry-owned resources; overlapping opaque RESTRICT keys fail closed instead of overwriting an earlier restriction.
- Core CI now runs and asserts the exact branch SHA, including dependency lockfile changes.

## Scope gate and continuation

The consistency gate is scoped: the corrected kernel, concrete SQL driver and both previously-unbound read-side bindings now pass at `DEV-CORE-READS-001`. DD-041 owns compiled Authorization snapshots; DD-042 owns Current Supported Industry presentation. This does not claim provider/security/PDP/commercial integration, broader repositories, transports or UI.

Completed: corrected kernel → pooled PostgreSQL driver → DD-041/042 physical contracts → module-owned Authorization/Industry-presentation read adapters. **Next sequence:** provider/session-security → PDP/ABAC → Commercial validation integration → DD-06 transports. UI remains later work.

## Change history

- 1.0: Fresh target/authority/physical-owner check; isolated missing bindings and corrected continuation order. Current executable results belong to CORE_SERVICE_CHECKPOINT.md.

- 1.1: Driver prerequisite passed at DEV-CORE-POSTGRES-001; retained both unbound read-side contracts and aligned continuation pointers with observed CI.

- 1.2: DD-041/DD-042 specified; migration/verification 0033 and module-owned read adapters passed exact-commit Core/PostgreSQL/Database CI at DEV-CORE-READS-001.
