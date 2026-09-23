# HANDOFF_NOTE — SBGlobal Plus
**Updated:** 2026-09-23 · **Checkpoint:** `DEV-USAGE-METER-READ-001`

Fresh-fetch remote branch/HEAD/tree/checks before further work.

Verified executable `11f3d43bba8948f517723ac6ef0fb5051420c97f` / tree `79919d02b2e2f90cf2eb7a85b65c2d4797466056`: **311/311 Core**, **441/441 PostgreSQL**, **47 migrations / 41 SQL verification files**, Next.js build and Database Verify PASS. Zero failed/skipped tests.

Promotion invariant gate `f1bb51d262785f4eb29910111335e532e723817c` / tree `bda17f3cb3cf7d7c9b17902f0f91ec746e28127f`: Core run `35900569534` (Core job `107315391758`, PostgreSQL job `107315392022`), Database run `35900569562` (job `107315389151`), Web run `35900569541` (job `107315389208`) — SUCCESS; **143 unique DD definitions**, 9 Industries, 41 canonical MS, 181 Industry tables, 2,962 preserved requirements.

DD-143 adds an exact raw `core_commercial.usage_meter` reader through the ordinary request-scoped application database boundary. Raw finite/special numeric evidence and signed version remain lossless text. It does not select authoritative periods, bind entitlements/targets, reconcile reservations, aggregate capacity or implement DD-073 usage-impact sourcing.

Read `Development/USAGE_METER_RAW_PERSISTENCE_READER_PREREQUISITE_OWNERSHIP_AUDIT.md` and `Registers/DEVELOPMENT_DD143_VERIFICATION_2026-09-23.md` before extending UsageMeter behavior.

Next: Fresh source-audit the next independent source-complete Core persistence slice. Keep UsageMeter mutation, current/authoritative period selection, entitlement/target binding, reservation reconciliation, aggregation, available-capacity and DD-073 usage-impact authority outside scope unless separately source-owned.

RawSource accepted blobs remain immutable; `main` remains unmerged; PR #2 remains draft/unmerged.
