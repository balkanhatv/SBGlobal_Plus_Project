# DD-143 Development Verification — UsageMeter Raw Persistence Reader

**Date:** 2026-09-23  
**Branch:** `docs/architecture-branch-2`  
**Prior promoted checkpoint:** `DEV-ORG-UNIT-INDUSTRY-READ-001`  
**Prior DD-142 synchronized state basis:** `16e11b2fbc1ba037841ace472a2a973dfacd815f`

## 1. Source-first ownership audit

Fresh Commercial source reconciliation selected `core_commercial.usage_meter` as the next independent source-complete uncovered persistence slice.

Audit commit: `1f318722b8abe5b9202fbb5501f6fa542749f7a8`.  
Audit artifact: `Development/USAGE_METER_RAW_PERSISTENCE_READER_PREREQUISITE_OWNERSHIP_AUDIT.md`.

The audit reconciled migration 0004 physical shape/FORCE-RLS, migration 0007 MIXED_SCOPED Commercial ownership, migration 0009 baseline application privileges, migration 0029 immutable Tenant/Industry ownership, migration 0043 final read-only app/compiler privilege boundary, later migrations for absence of a stronger UsageMeter lifecycle/period contract, and DD-073's deliberately unbound Commercial usage-impact source.

## 2. Bounded implementation and correction provenance

Initial implementation: `610e357326f533962b65eae06ae54119ec678b50`.

Forward-only corrections:
- `5b281648ca8bcae157eb034d01d134a9787adfd2` — normalized the Core export line;
- `155f199dfffad16ca030f6d28fd55b2fee368702` — compacted PostgreSQL fixture parameter numbering;
- `d7279d617c4954fef66882127801fcee611dd1b4` — preserved schema-valid PostgreSQL special numeric evidence;
- `11f3d43bba8948f517723ac6ef0fb5051420c97f` — aligned the numeric-evidence validator symbol/audit wording.

Corrected implementation head: `11f3d43bba8948f517723ac6ef0fb5051420c97f` / tree `79919d02b2e2f90cf2eb7a85b65c2d4797466056`.

Implementation surface:
- `src/core/commercial/usage-meter.ts`;
- `src/server/commercial/postgres-usage-meter-store.ts`;
- `tests/postgres/usage-meter-store.test.mjs`;
- `src/core/index.ts` export.

No migration, schema, SQL verification file, role/grant/RLS policy, Commercial writer path, DD-073 source binding, public route or product policy changed.

## 3. Read/security boundary

The reader accepts TENANT_CORE or TENANT_INDUSTRY private RequestContext plus one UsageMeter UUID and uses the ordinary `RequestScopedSql` application role.

Tenant ownership is mandatory. Null-Industry rows are visible from same-Tenant Core and Industry contexts under the physical FORCE-RLS; non-null Industry rows require the exact current Industry Context. Foreign Tenant and PLATFORM_GLOBAL access fail closed.

Raw `meter_code`, `period_key`, exact PostgreSQL numeric used/reserved values, signed bigint version and timestamp remain persistence evidence. Finite decimals are not coerced to JavaScript numbers; schema-admitted `NaN` / `Infinity` text is preserved. The physical schema does not require non-empty meter/period text or positive version.

Migration 0043 leaves both ordinary application and dedicated Commercial transition/compiler roles SELECT-only on UsageMeter. The DD-143 reader does not reuse the compiler's broader same-Tenant policy to widen ordinary application visibility.

## 4. Exact corrected implementation-head CI

Exact tested implementation head: `11f3d43bba8948f517723ac6ef0fb5051420c97f` / tree `79919d02b2e2f90cf2eb7a85b65c2d4797466056`.

- Core Service Verify run `35887001395`, Core job `107314383306`: **SUCCESS**, **311/311 Core**.
- Same run, PostgreSQL/RLS job `107314383428`: **SUCCESS**, **441/441 PostgreSQL**, including `USAGEMETER-PG-001…007`.
- Database Verify run `35887001403`, job `107314383505`: **SUCCESS**.
- Web Boundary Verify run `35887001281`, job `107314413058`: **SUCCESS**.

Earlier attempts on the same implementation lineage failed before runner allocation with blank runner names and zero executed steps. Those attempts are infrastructure/pre-execution evidence only and are not counted as repository test failures or green evidence.

## 5. Canonical DD / acceptance traceability

Canonical DD/acceptance commit: `f1bb51d262785f4eb29910111335e532e723817c` / tree `bda17f3cb3cf7d7c9b17902f0f91ec746e28127f`.

It adds exactly one DD-143 decision, one DD-143 acceptance block and one DD-143 changelog entry, while preserving the DD-073 non-binding boundary.

## 6. Promotion invariant gate

- Core run `35900569534`, Core job `107315391758`: **SUCCESS**, **311/311 Core**.
- Same run, PostgreSQL job `107315392022`: **SUCCESS**, **441/441 PostgreSQL**, including `USAGEMETER-PG-001…007`.
- Database run `35900569562`, job `107315389151`: **SUCCESS**.
- Web run `35900569541`, job `107315389208`: **SUCCESS**.
- Direct DD-18 recount: **143 definitions / 143 unique / DD-001…DD-143 / no gaps / no duplicates**.
- Stable product invariants: **9 Industries / 41 canonical MS / 181 registered Industry tables / 2,962 preserved requirement IDs/text**.
- Database inventory remains **47 migrations / 41 SQL verification files**.

This gate authorizes `DEV-USAGE-METER-READ-001`; it does not expand DD-143 semantics.

## 7. Explicitly unclaimed

DD-143 does not implement `CommercialUsageImpactSourcePort`; select current/authoritative periods; bind entitlement codes or target limits; aggregate meters/periods/Industries; reconcile reservations; calculate available capacity; evaluate downgrade blockers/usage impact; create/increment/reserve/release/reset/update UsageMeters; define writer idempotency/concurrency; calculate billing/proration/charges; mutate Subscription/PlanVersion/EntitlementSnapshot; evaluate permission/entitlement authorization; or expose a public route.

## 8. Safety

- Forward-only repository mutation; no force-push.
- `main` remains unmerged.
- RawSourceCorpus remains untouched.
- PR #2 remains draft/review-only unless explicitly authorized.
