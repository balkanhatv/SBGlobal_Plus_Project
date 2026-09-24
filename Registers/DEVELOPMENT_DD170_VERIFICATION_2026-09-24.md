# DD-170 Development Verification — Definition Scope Fail-Closed Hardening

**Date:** 2026-09-24  
**Branch:** `docs/architecture-branch-2`  
**Prior checkpoint:** `DEV-NOTIFICATION-SOURCE-EVENT-CURRENT-BINDING-FLOORS-001`  
**Source audit:** `Development/DEFINITION_SCOPE_APPLICABILITY_FAIL_CLOSED_AUDIT.md`

## 1. Corrected defect

Migration 0031 declares the shared definition applicability/containment predicates fail-closed, but nullable equality could return SQL UNKNOWN/NULL for narrower-to-broader scope comparisons. Integrity callers using `NOT predicate` could therefore miss the rejection.

## 2. Bounded implementation

Migration implementation: `0286f071fc7206363469dc5837d235e5ff4808f7`.

Verified executable/inventory head: `573bed20d111c798699470553b867bfd27251d9d` / tree `f91cccf55dfda3fe6735e6af4081f433273fa82c`.

Files:
- `database/migrations/0048_definition_scope_fail_closed.sql`;
- `database/verification/0048_definition_scope_fail_closed.verify.sql`;
- `State/PROJECT_MANIFEST.json` inventory synchronized to 48 migrations / 42 verification files.

The migration changes only the two existing shared predicate bodies by coercing UNKNOWN to false. Signatures, hierarchy, IMMUTABLE classification, search path and PUBLIC revocation are retained.

## 3. Exact verified-head CI

- Core Service Verify run `35965977967`, Core job `107524521412`: **SUCCESS — 437/437**, 0 failed/skipped.
- Same run, PostgreSQL-context job `107524521263`: **SUCCESS — 497/497**, 0 failed/skipped; full database bootstrap executed migration/verification 0048.
- Database Verify run `35965978013`, job `107524521341`: **SUCCESS**; migration 0048 and verification 0048 executed.
- Web Boundary Verify run `35965977890`, job `107524520899`: **SUCCESS**.
- Current database inventory: **48 migrations / 42 verification files**.

## 4. Direct regression coverage

Verification 0048 proves:
- PLATFORM→Tenant Core/Industry remains true;
- TENANT→same-Tenant Core/Industry remains true and foreign Tenant false;
- INDUSTRY→exact Industry true and sibling Industry false;
- INDUSTRY→Tenant-Core exact false, not NULL;
- INDUSTRY-parent→TENANT-child containment exact false;
- malformed/null inputs exact false;
- trigger-style `NOT definition_applies_to_scope(INDUSTRY→Tenant-Core)` is true;
- both helpers remain IMMUTABLE and not PUBLIC-executable.

## 5. Explicitly unclaimed

DD-170 does not define template selection/rendering, delivery/provider/retry semantics, Identity/Authz changes, data rewrite, new RLS/roles/grants/routes or any machine/Webhook/Sync/Integration execution authority.

## 6. Promotion requirement

Canonical DD-170 decision/acceptance/changelog must be committed and that promotion head must pass exact-head Core/PostgreSQL, Database and Web CI before the Development checkpoint advances.
