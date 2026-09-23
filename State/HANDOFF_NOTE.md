# HANDOFF_NOTE — SBGlobal Plus
**Updated:** 2026-09-23 · **Checkpoint:** `DEV-SUBSCRIPTION-TRANSITION-READ-001`

Fresh-fetch remote branch/HEAD/tree/checks before further work.

Verified executable `39ad7e1f7fd39401811de0b6efa7f3bf0d35c3ff` / tree `f184bfc07a41c1199568f10ca45e2ddb6aa39da5`: **311/311 Core**, **427/427 PostgreSQL**, **47 migrations / 41 SQL verification files**, Next.js build and Database Verify PASS. Zero failed/skipped tests.

Promotion invariant gate `882ecc5532c81dedc3f4b3f983a7edfc12a49dd0` / tree `409ed54a8c3cacd7500c5c03aa27560147c4b25e`: Core run `35881695463` (Core job `107251481728`, PostgreSQL job `107251481464`), Database run `35881695666` (job `107251483307`), Web run `35881695790` (job `107251483129`) — SUCCESS; **141 unique DD definitions**, 9 Industries, 41 canonical MS, 181 Industry tables, 2,962 preserved requirements.

DD-141 adds an exact-by-id `core_commercial.subscription_transition` raw Tenant persistence reader through the existing `PostgresDatabase` + `RequestScopedSql` boundary. Tenant FORCE-RLS permits the owning row from same-Tenant Core or Industry contexts while foreign Tenant/PLATFORM_GLOBAL remain hidden. Raw from/to state, trigger, actor/source-event/reason, occurrence and correlation evidence remains append-only evidence only; it does not become lifecycle legality, current Subscription state, replayability or transition execution authority.

Read `Development/SUBSCRIPTION_TRANSITION_RAW_PERSISTENCE_READER_PREREQUISITE_OWNERSHIP_AUDIT.md` and `Registers/DEVELOPMENT_DD141_VERIFICATION_2026-09-23.md` before extending Subscription transition behavior.

Next: Fresh source-audit the next independent source-complete Core persistence slice. Keep Subscription transition execution, lifecycle legality/current-state selection, chain reconstruction, source-event/idempotency resolution, actor current authorization, plan-change/entitlement publication, billing/proration/payment and transition mutation outside scope unless separately source-owned.

RawSource accepted blobs remain immutable; `main` remains unmerged; PR #2 remains draft/unmerged.
