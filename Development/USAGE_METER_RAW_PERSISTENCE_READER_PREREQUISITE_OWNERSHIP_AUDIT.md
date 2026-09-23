# UsageMeter raw persistence reader prerequisite ownership audit

**Date:** 2026-09-23  
**Baseline checkpoint:** `DEV-ORG-UNIT-INDUSTRY-READ-001`  
**Baseline branch head:** `16e11b2fbc1ba037841ace472a2a973dfacd815f`  
**Scope:** next independent governed continuation after DD-142.

## Current CI execution note

DD-142's canonical invariant gate and authoritative promotion basis were fully green. The later projection-sync head `16e11b2f…` triggered GitHub Actions jobs that failed **before any workflow step ran** (`runner_id=0`, empty step lists) on repeated attempts. That pre-run runner/provisioning condition is not treated as repository test evidence, green or red. DD-143 implementation/canonicalization must not advance unless exact-head jobs actually execute and complete successfully.

## Source reconciliation

Freshly reconciled:

- `database/migrations/0004_commercial_entitlement.sql`;
- `database/migrations/0007_database_governance.sql`;
- migration 0009 baseline application/worker table privileges;
- migration 0029 immutable Tenant/Industry scope hardening;
- migration 0043 Commercial transition/compiler least-privilege boundary;
- migrations 0044–0047 for absence of a later UsageMeter lifecycle/current-period contract;
- `Development/COMMERCIAL_USAGE_IMPACT_SOURCE_AUDIT.md`;
- `src/core/commercial/usage-impact.ts`;
- DD-073 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md`;
- existing `PostgresDatabase` + `RequestScopedSql` application boundary;
- DD-142 promoted/synchronized state.

## Candidate determination

The next independently source-complete uncovered Commercial persistence slice is one exact `core_commercial.usage_meter` row.

Migration 0004 owns:

- `id uuid PRIMARY KEY`;
- `tenant_id uuid NOT NULL`;
- nullable `industry_context_id uuid`;
- raw `meter_code text NOT NULL`;
- raw `period_key text NOT NULL`;
- `used_value numeric NOT NULL DEFAULT 0 CHECK (used_value >= 0)`;
- `reserved_value numeric NOT NULL DEFAULT 0 CHECK (reserved_value >= 0)`;
- `version bigint NOT NULL DEFAULT 1`;
- `updated_at timestamptz NOT NULL`;
- same-Tenant optional Industry foreign key;
- uniqueness over Tenant + nullable Industry + meter code + period key.

The physical schema does **not**:

- prohibit empty `meter_code` or `period_key`;
- constrain `version` to be positive;
- identify a current/authoritative period;
- carry an `entitlement_code`;
- define how `reserved_value` participates in downgrade impact;
- select one row for a target limit.

For lossless raw persistence evidence, PostgreSQL `numeric` and `bigint` values must remain canonical decimal text rather than being coerced to JavaScript numbers.

## Final RLS / privilege boundary

Migration 0004 FORCE-RLS policy is:

- same Tenant required;
- a row with null `industry_context_id` is Tenant-Core evidence and is visible from both same-Tenant Core and same-Tenant Industry request contexts;
- a non-null Industry row is visible only from its exact Industry Context;
- sibling Industry, foreign Tenant and PLATFORM_GLOBAL contexts do not gain visibility.

Migration 0007 registers `usage_meter` as MIXED_SCOPED / Commercial-owned.

Migration 0029 makes `tenant_id` and `industry_context_id` immutable after insert. It does not make meter code, period, values, version or update timestamp immutable.

Migration 0043 changes runtime mutation ownership:

- `sbg_app_rw` and `sbg_worker_rw` lose INSERT/UPDATE/DELETE on `usage_meter`;
- their prior SELECT remains available;
- `sbg_commercial_transition_compiler_rw` receives SELECT, including a same-Tenant compiler policy that can read all same-Tenant Industry-scoped usage evidence from a Tenant-Core compiler context;
- the compiler role is explicitly denied INSERT/UPDATE/DELETE on `usage_meter`.

DD-143's ordinary application reader must use the existing request-scoped application boundary. It must not reuse the compiler's broader same-Tenant policy to widen request visibility.

## DD-073 non-binding boundary

The Commercial usage-impact audit and DD-073 explicitly leave the concrete PostgreSQL usage source unbound because governing source does not define:

1. how the authoritative current `period_key` is selected for each target meter;
2. how non-zero `reserved_value` participates in downgrade comparison.

Additionally, physical `usage_meter` contains no entitlement-code column, while `CommercialUsageImpactSourcePort` returns measurements bound to an entitlement + meter target.

Therefore an exact raw UsageMeter reader is source-complete, but it **must not** implement, masquerade as, or be adapted into `CommercialUsageImpactSourcePort` without a later governed period-selection/target-binding/reservation decision.

## Authorized implementation boundary

DD-143 may implement only an exact-by-id immutable UsageMeter persistence reader through existing `PostgresDatabase` + `RequestScopedSql`.

Authorized returned evidence:

- `id`;
- `tenantId`;
- optional `industryContextId`;
- raw `meterCode`;
- raw `periodKey`;
- exact non-negative PostgreSQL numeric `usedValue` as decimal text;
- exact non-negative PostgreSQL numeric `reservedValue` as decimal text;
- exact PostgreSQL bigint `version` as decimal text, including zero/negative values if physically persisted;
- `updatedAt`.

Validation remains schema-aligned only:

- UUID validation for identifiers;
- exact persisted ownership shape;
- canonical decimal-text validation for numeric/bigint fields without precision loss;
- `usedValue` / `reservedValue` must be non-negative because the database enforces that;
- `version` must be valid bigint decimal text but is not strengthened to positive;
- raw text remains raw, including schema-valid empty strings;
- timestamp must be valid persisted evidence;
- no current-period, entitlement binding, limit binding, reservation reconciliation, consumption availability or billing semantics are invented.

## Explicitly unclaimed semantics

This slice does **not** implement or authorize:

- `CommercialUsageImpactSourcePort`;
- current/authoritative period selection;
- entitlement-code or target-limit binding;
- aggregation across periods/meters/Industries;
- reservation reconciliation or available-capacity calculation;
- downgrade blocker evaluation;
- UsageMeter creation/increment/reservation/release/reset/update;
- idempotency/concurrency/write producer semantics;
- Billing/proration/charge calculation;
- Subscription/PlanVersion/EntitlementSnapshot mutation;
- cross-Industry fallback for Industry-scoped rows;
- permission/entitlement authorization;
- public/API routes;
- migration/schema/verification SQL/role/grant/RLS/product-policy changes.

## Acceptance expectations

1. exact Tenant-Core UsageMeter returns complete immutable raw decimal/text/timestamp evidence and remains same-Tenant visible from Core and Industry contexts;
2. exact Industry UsageMeter is visible only in its Industry Context and hidden from sibling Industry;
3. foreign Tenant and PLATFORM_GLOBAL cannot read a Tenant UsageMeter;
4. raw empty meter/period text, exact high-precision numeric values and non-positive bigint version evidence are preserved without JavaScript-number coercion or semantic strengthening;
5. status/current-period/entitlement/target/reservation/available-capacity fields are not invented and the port cannot satisfy `CommercialUsageImpactSourcePort`;
6. missing well-formed id returns `null`; malformed id and route/context mismatch fail closed;
7. ordinary application role is SELECT-only after migration 0043, while the port exposes no create/update/delete/list/selectCurrent/aggregate/reserve/release/usage-impact method.

Acceptance IDs: `USAGEMETER-PG-001` through `USAGEMETER-PG-007`.

Exact implementation-head Core/PostgreSQL/Database/Web CI must **actually execute** and pass before DD-143 canonicalization or state promotion. Pre-run runner/provisioning failures with zero executed steps do not satisfy this gate.
