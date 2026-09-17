# DATABASE CHECKPOINT — DEV-DB-CURRENT-STATE-AUDITED-001
**Date:** 2026-09-18  
**Branch:** `docs/architecture-branch-2`

**Scope:** Historical SQL persistence checkpoint. Current Development scope and continuation are owned by [DEV-AUTHZ-COMPILER-001](CORE_SERVICE_CHECKPOINT.md).

## Current persistence result
Shared Core persistence now includes the existing Tenant/Industry/Identity/Commercial/Document/Audit/Integration/Workflow/Notification/AI layers plus PLATFORM_GLOBAL Authorization persistence, ABAC write-boundary hardening, and the dedicated Authorization compiler publication role/policy boundary.

Industry SQL remains **9/9 Current Supported Industries / 41/41 canonical Management Systems / 181 canonical Industry tables**, verified by `database/verification/0099_all_industries.verify.sql`.

## Compiler persistence boundary — migration 0037
- `sbg_authorization_compiler_rw`: NOLOGIN / NOSUPERUSER / NOBYPASSRLS / NOINHERIT.
- DML surface: SELECT/INSERT/UPDATE only on tenant/platform compiled subject/snapshot tables.
- DELETE is absent.
- Role assignment, role template, role permission and ABAC source/policy mutation are absent.
- Tenant publication uses existing exact Tenant/Industry FORCE-RLS policies.
- PLATFORM_GLOBAL publication has dedicated compiler policies and remains separate from runtime principal-bound read policies.
- `sbg_app_rw` and `sbg_control_plane_rw` remain non-compiler writers.

## Exact regression evidence — DEV-AUTHZ-COMPILER-001
Verified executable `2c9157e3a1ed30f18f8014e1b04aa799f2d73d15` (tree `a1cc883564516222ed6095e692ba6bd1ec33baac`) passed:
- Database Verify `35282382162` / job `105407032144`: migrations `0001`–`0037` + all **31 verification files** including 0099;
- Core Service Verify postgres-context `35282382158` / job `105407032426`: **18/18 real PostgreSQL tests**, including tenant/platform compiler publication/invalidation and source-truth write denial.

Current SQL inventory: **37 migrations / 31 verification files**. Industry scope remains **9/41/181**.

## Current gate / next database-facing work
**DATABASE PERSISTENCE CHECKPOINT: VERIFIED FOR CURRENT BOUNDED SCOPE.**

Next governed database-facing work is Commercial current-state read integration against existing persistence. No new schema or privilege expansion is justified unless fresh evidence proves a missing Commercial physical contract.
