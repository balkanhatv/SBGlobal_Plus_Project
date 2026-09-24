# HANDOFF_NOTE — SBGlobal Plus
**Updated:** 2026-09-24 · **Checkpoint:** `DEV-NOTIFICATION-SOURCE-EVENT-CURRENT-BINDING-FLOORS-001`

Fresh-fetch remote branch/HEAD/tree/checks before further work.

Verified canonical DD-169 promotion `19d4af6b662e6c8de7df0fc54c1a61aab09a5b3f` / tree `264cfb4d5df164ea1e1893013698cb17b811f919`: **437/437 Core**, **497/497 PostgreSQL**, **47 migrations / 41 SQL verification files**, Database/Web PASS. Exact-head runs: Core `35964991724` (Core job `107521492075`, PostgreSQL job `107521492294`), Database `35964991639` (job `107521492112`), Web `35964991529` (job `107521491443`).

DD-169 is only NotificationDelivery→OutboxEvent exact source-event relationship currentness.

Before opening NotificationTemplate relationship work, audit the SQL three-valued-logic boundary in `core_tenancy.definition_applies_to_scope()`: an Industry owner compared with a null target Industry can produce NULL, and `NOT NULL` inside PL/pgSQL integrity predicates does not become a rejection.

Do not infer event readiness/dispatch/retry, notification send/provider/secret, Integration execution, machine verification, Webhook execution or SyncCursor runtime.

PR #2 remains draft/unmerged; do not merge to `main`.
