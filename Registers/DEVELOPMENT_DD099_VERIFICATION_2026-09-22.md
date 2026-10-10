# Development DD-099 verification — 2026-09-22

**Branch:** `docs/architecture-branch-2`  
**Verified executable HEAD/tree:** `7b2e4c960b0ba4e6244c83750a7796c2565a39a1` / `9cf348abc38f90b381eafb4c408ffc594c889904`  
**Checkpoint target:** `DEV-NOTIFICATION-ATTEMPT-READ-001`

## Source audit and implementation

`Development/NOTIFICATION_DELIVERY_ATTEMPT_READER_PREREQUISITE_OWNERSHIP_AUDIT.md`
reconciled A-06/DD-06/DD-15, migration 0026 attempt schema/parent FORCE-RLS and
migration 0027 Notification-worker append-only privileges.

DD-099 adds:
- `src/core/notification/delivery-attempt.ts`;
- `src/server/notification/postgres-notification-delivery-attempt-store.ts`;
- Core export;
- `tests/postgres/notification-delivery-attempt-store.test.mjs`;
- DD-099 decision + NOTIF-ATT-PG-001…006 acceptance traceability.

The reader returns immutable ordered raw attempt evidence only. It does not infer
retryability/finality/backoff, select a provider/credential, retrieve secrets, send
a notification or mutate delivery state.

## Exact-head CI evidence

| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / Core | 35684469671 | 106608242039 | **311/311 PASS**, 0 fail, 0 skip |
| Core Service Verify / PostgreSQL | 35684469671 | 106608242140 | **142/142 PASS**, 0 fail, 0 skip |
| Database Verify | 35684469744 | 106608242009 | **PASS**, 47 migrations + 41 verification files |
| Web Boundary Verify | 35684469691 | 106608242434 | **PASS**, TypeScript + Next.js build |

Workflow logs assert exact executable head `7b2e4c960b0ba4e6244c83750a7796c2565a39a1` / tree `9cf348abc38f90b381eafb4c408ffc594c889904`.

## Acceptance and invariants

NOTIF-ATT-PG-001…006 pass, including parent-RLS sibling/foreign isolation and
Notification-worker UPDATE/DELETE denial. Existing NOTIF-DEL-PG and all prior
Core/PostgreSQL acceptance remain green.

Invariants remain 9 Industries / 41 canonical MS / 181 Industry tables,
2,962 source requirement IDs/text, ADR-001–020 / DD-001–099, 47 migrations /
41 verification files.

Verified executable inventory: **491 blobs / 200 Markdown / 119 TypeScript source
files / 70 test files**. No migration or verification SQL changed.

RawSource accepted blobs remain `a9f63a64448a347edd0f2b0c74094284ee953c1b`
and `91c461de5e0d171f71d0bb89cd039953a1f1ecfd`. Main remains
`3911590ff2020993ce51b32d7b091efd6f5f466f`; no merge is performed.

## Remaining boundary

NotificationDeliveryAttempt evidence is non-authorizing. Retry/finality/backoff,
provider/credential/secret runtime and network execution remain unfinished.
