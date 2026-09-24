# REVIEW_REQUIRED — Historical Gates / Current Dependency Ownership
**Updated:** 2026-09-24 · **Current checkpoint:** `DEV-NOTIFICATION-TEMPLATE-CURRENT-BINDING-FLOORS-001`

No general approval request is pending. Missing contracts are dependency blocks, not implied approvals.

DD-171 is promoted and verified only for NotificationDelivery→NotificationTemplate relationship currentness. Template selection/fallback/rendering, notification provider/send/retry, Outbox dispatch/retry, Integration execution, final machine verification, Webhook execution and SyncCursor runtime remain locked unless separately source-owned.

Next source-audit target: migration-0031 recipient-principal currentness.
