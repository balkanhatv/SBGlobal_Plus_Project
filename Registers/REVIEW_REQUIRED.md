# REVIEW_REQUIRED — Historical Gates / Current Dependency Ownership
**Updated:** 2026-09-24 · **Current checkpoint:** `DEV-NOTIFICATION-SOURCE-EVENT-CURRENT-BINDING-FLOORS-001`

No general approval request is pending. Missing contracts are dependency blocks, not implied approvals.

Current locked boundaries include final machine verification, Webhook execution, SyncCursor runtime, Integration provider/secret/network execution, Outbox dispatch/retry and Notification delivery/provider/secret execution.

**New audit-required correctness boundary:** `core_tenancy.definition_applies_to_scope()` may return NULL for nullable mismatch inputs; integrity callers using `NOT function(...)` can therefore fail to reject. NotificationTemplate relationship continuation is blocked until this predicate is made explicitly fail-closed or the audit disproves the issue.

DD-169 is canonically promoted and exact-head verified at `19d4af6b662e6c8de7df0fc54c1a61aab09a5b3f`.
