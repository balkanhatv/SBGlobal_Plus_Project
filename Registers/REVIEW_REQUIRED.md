# REVIEW_REQUIRED — Historical Gates / Current Dependency Ownership
**Updated:** 2026-09-24 · **Current checkpoint:** `DEV-DEFINITION-SCOPE-FAIL-CLOSED-001`

No general approval request is pending. Missing contracts are dependency blocks, not implied approvals.

DD-170 resolved the shared `definition_applies_to_scope()` / `definition_contains_definition()` NULL fail-open gap through migration 0048 and direct verification.

Still locked: final machine credential verification, Webhook execution, SyncCursor runtime, Integration provider/secret/network execution, Outbox dispatch/retry and Notification rendering/provider/send/retry semantics.

Next independently source-complete relationship candidate: NotificationDelivery→NotificationTemplate exact version/status/channel/scope currentness.
