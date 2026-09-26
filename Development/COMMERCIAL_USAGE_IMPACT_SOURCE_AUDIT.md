# COMMERCIAL USAGE-METER TARGET-IMPACT SOURCE AUDIT

**Date:** 2026-09-21  
**Baseline:** `069e7640fccf30321c1fedc4b8c21fc00dc591c5` / `c248f2a88a9ca9b9dba98b455fff99770f10c30d`  
**Scope:** next independent Commercial target-preview prerequisite after DD-072.

## Governing evidence

- F-01 BR-SUB-04 requires remediation before a downgrade takes effect when **current usage exceeds target-plan limits**, with no silent deletion.
- F-14 §6 requires a downgrade impact assessment before remediation/effective date.
- DD-04 persists `usage_meter{tenant_id,industry_context_id,meter_code,period_key,used_value,reserved_value,version}`, places Usage/limit state before compliance/security in compilation precedence, and defines reservation-based runtime limit strategies.
- DD-064/migration 0043 already grants the dedicated NOBYPASSRLS Commercial compiler role same-Tenant SELECT on `usage_meter` while denying mutation.

## Source gaps that must not be guessed

The governing text does **not** define:
1. how the authoritative current `period_key` is selected for each meter during plan-change impact assessment;
2. whether outstanding `reserved_value` is added to, replaces, or is otherwise reconciled with `used_value` for BR-SUB-04 downgrade comparison.

Therefore DD-073 does not create a PostgreSQL period-selection query and does not add `reserved_value` to `used_value`.

## Safe bounded continuation

A server-owned `CommercialUsageImpactSourcePort` selects authoritative period measurements and returns versioned selection/evidence. The pure evaluator then:
- binds every measurement to an exact existing DD-071 target limit;
- requires exactly one selected measurement for every bounded target (FINITE / NOT_INCLUDED / unresolved ADD_ON_ONLY);
- compares only persisted `used_value`, the unambiguous usage quantity, against the target;
- treats DD-071 NOT_INCLUDED and still-ADD_ON_ONLY limits as zero included capacity;
- treats UNLIMITED as non-blocking and measurement-independent;
- fails closed when a bounded target has no measurement, when multiple periods are selected, when the source targets a missing limit, or when any relevant `reserved_value > 0` because downgrade reservation semantics are not governed.

This produces deterministic **usage impact only**. It does not choose remediation, generate plan-change evidence, apply compliance/security restrictions, calculate money/proration, or authorize publication/changePlan.

## Production binding still required

A concrete usage source adapter may use the existing least-privilege `usage_meter` read boundary only after a governed current-period selection rule is established. Outstanding reservation handling also requires an explicit rule before the evaluator can proceed through non-zero reservations.
