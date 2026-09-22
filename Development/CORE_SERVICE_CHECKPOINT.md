# CORE SERVICE CHECKPOINT — DEV-NOTIFICATION-DELIVERY-READ-001
**Updated:** 2026-09-22 · **Branch:** `docs/architecture-branch-2`

## Verified executable basis

Verified executable `224185ec8a0b5bce71262de70fe888c002f77d87` / tree `4ffdb6b8dab19301050ce680caa0c0be1e13b60f`: **311/311 Core**, **136/136 PostgreSQL**, **47 migrations / 41 SQL verification files bootstrap**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests. Verified executable inventory: **486 blobs / 198 Markdown / 117 source / 69 test files**.

## Implemented boundary

DD-098 adds a raw NotificationDelivery PostgreSQL reader through a dedicated `sbg_notification_worker_rw` NOBYPASSRLS database boundary plus RequestScopedSql. It preserves exact Tenant/Industry scope, recipient/channel/template/integration/event/status/time/error/version persistence evidence while deliberately withholding send, retry/finality, provider-selection and credential/secret authority.

NOTIF-DEL-PG-001…005 prove exact Industry delivery fidelity, sibling/foreign isolation, Tenant Core same-Tenant visibility, raw FAILED/error and DELIVERED timestamp evidence, and fail-closed malformed/route-mismatch handling.

The dedicated Notification database wrapper fixes the existing migration-0027 worker role, enables row security, verifies runtime/login roles are non-superuser/NOBYPASSRLS, clears request scope before reuse and sanitizes pooled state on release. Notification worker access to CredentialReference remains explicitly revoked.

DD-097 SyncCursor and earlier Integration/Document/Event slices remain covered.

## Remaining scope

Raw delivery persistence is not send/retry/finality/provider authority. No provider client, credential/secret access, failover, worker loop, delivery mutation or public route is claimed.

Next: Source-audit NotificationDeliveryAttempt raw persistence as the next independent source-complete Notification slice. Attempt evidence must remain append-only/raw; retry/finality/provider decisions, CredentialReference secret retrieval, ProviderAdapter runtime selection/execution, TenantIntegration enablement/health decisions, webhook network/signing/filter/retry runtime, event dispatch mutation/retry/DLQ, Document policy/signing, REST exposure, DD-076 evaluator and concrete AI Gateway remain unfinished on their named prerequisites.

Evidence: `Registers/DEVELOPMENT_DD098_VERIFICATION_2026-09-22.md`.

RawSource accepted blobs unchanged; main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; PR #2 remains draft/unmerged.
