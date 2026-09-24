# HANDOFF_NOTE — SBGlobal Plus
**Updated:** 2026-09-24 · **Checkpoint:** `DEV-NOTIFICATION-TEMPLATE-CURRENT-BINDING-FLOORS-001`

Fresh-fetch remote branch/HEAD/tree/checks before further work.

Verified canonical DD-171 promotion `0bc47ea75d5405dd29bf35562b1245f0b7d3842a` / tree `5e47ae874cc88cabcbc1de11dfaa803851d601af`: **444/444 Core**, **497/497 PostgreSQL**, **48 migrations / 42 SQL verification files**, Database/Web PASS. Exact-head runs: Core `35967907330` (Core job `107530583772`, PostgreSQL job `107530583559`), Database `35967907358` (job `107530584175`), Web `35967907245` (job `107530583512`).

DD-171 is only NotificationDelivery→NotificationTemplate current binding. Do not infer template selection/fallback/rendering, creator/approver send authority, provider routing, secret access or send/retry/network execution.

Next: audit recipient-principal relationship currentness from migration 0031 and existing identity evidence sources.

PR #2 remains draft/unmerged; do not merge to `main`.
