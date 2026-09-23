# CORE SERVICE CHECKPOINT — DEV-USAGE-METER-READ-001
**Updated:** 2026-09-23 · **Branch:** `docs/architecture-branch-2`

Verified executable `11f3d43bba8948f517723ac6ef0fb5051420c97f` / tree `79919d02b2e2f90cf2eb7a85b65c2d4797466056`: **311/311 Core**, **441/441 PostgreSQL**, **47 migrations / 41 SQL verification files**, Next.js build and Database Verify PASS. Zero failed/skipped tests.

Promotion invariant gate `f1bb51d262785f4eb29910111335e532e723817c` / tree `bda17f3cb3cf7d7c9b17902f0f91ec746e28127f`: Core run `35900569534` (Core job `107315391758`, PostgreSQL job `107315392022`), Database run `35900569562` (job `107315389151`), Web run `35900569541` (job `107315389208`) — SUCCESS; **143 unique DD definitions**, 9 Industries, 41 canonical MS, 181 Industry tables, 2,962 preserved requirements.

DD-143 adds one exact raw UsageMeter persistence reader. FORCE-RLS keeps Tenant/Industry visibility authoritative; the application port is exact-id and read-only. Raw meter/period text, exact numeric text including `Infinity` / `NaN`, signed bigint version and timestamp remain non-semantic persistence evidence.

`USAGEMETER-PG-001`…`USAGEMETER-PG-007` prove exact Tenant-Core evidence, same-Tenant Industry visibility for null-Industry rows, exact Industry isolation, foreign-Tenant/PLATFORM_GLOBAL fail-closed behavior, raw/special-numeric/non-positive-version preservation, missing/malformed/route handling, and SELECT-only application/compiler privilege with no selector/mutation/usage-impact authority.

## Remaining scope

UsageMeter create/increment/reserve/release/reset/update; current/authoritative period selection; entitlement-code/target-limit binding; aggregation; reservation reconciliation; available-capacity calculation; downgrade/usage-impact evaluation; billing/proration/charge semantics; and `CommercialUsageImpactSourcePort` binding remain unimplemented unless separately source-owned.

Next: Fresh source-audit the next independent source-complete Core persistence slice. Keep those UsageMeter semantics outside scope unless separately source-owned.

Evidence: `Registers/DEVELOPMENT_DD143_VERIFICATION_2026-09-23.md`.
