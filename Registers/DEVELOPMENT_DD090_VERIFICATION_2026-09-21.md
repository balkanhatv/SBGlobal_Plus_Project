# Development DD-090 verification — 2026-09-21

**Branch:** `docs/architecture-branch-2`  
**Verified executable HEAD/tree:** `9ff139d442158b4fadfa27becc358edade1ccf1f` / `d45e327c713391eb35cca147e2ea8da937cf1e9a`  
**Checkpoint target:** `DEV-OUTBOX-EVENT-READ-001`

## Source audit and implementation

`Development/OUTBOX_EVENT_READER_PREREQUISITE_OWNERSHIP_AUDIT.md` reconciled DD-07, DD-17, migrations 0008/0028/0030 and the dedicated Integration PostgreSQL boundary.

DD-090 adds:
- `src/core/integration/outbox-event.ts`;
- `src/server/integration/postgres-outbox-event-store.ts`;
- Core export;
- EVT-OUT-PG-001…005 in the real PostgreSQL Integration fixture;
- DD/test traceability.

The reader maps immutable raw outbox persistence. It does not claim/lock, decide dispatchability/retryability, mutate attempts/status, execute delivery, DLQ/replay or interpret payload schemas.

## Exact-head CI evidence

| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / Core | 35632751638 | 106442666672 | **311/311 PASS**, 0 fail, 0 skip |
| Core Service Verify / PostgreSQL | 35632751638 | 106442666943 | **100/100 PASS**, 0 fail, 0 skip |
| Database Verify | 35632750408 | 106442663497 | **PASS**, 47 migrations + 41 verification files |
| Web Boundary Verify | 35632750334 | 106442662730 | **PASS**, TypeScript + Next.js build |

Workflow logs assert exact executable head `9ff139d442158b4fadfa27becc358edade1ccf1f` / tree `d45e327c713391eb35cca147e2ea8da937cf1e9a`.

## Acceptance and invariants

EVT-OUT-PG-001…005 pass. Existing Webhook Subscription/Delivery, Document and prior Core/PostgreSQL coverage remains green. Invariants remain 9 Industries / 41 canonical MS / 181 Industry tables, 2,962 source requirement IDs/text, ADR-001–020 / DD-001–090, 47 migrations / 41 verification files.

Verified executable inventory: **452 blobs / 182 Markdown / 100 TypeScript source files / 68 test files**. No migration or verification SQL changed.

RawSource accepted blobs remain `a9f63a64448a347edd0f2b0c74094284ee953c1b` and `91c461de5e0d171f71d0bb89cd039953a1f1ecfd`. Main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; no merge is performed.

## Remaining boundary

DD-090 is persistence evidence only. Dispatcher claim/lease/scheduling, retry/DLQ/replay execution and payload-schema interpretation remain separately governed runtime work. EXPLICIT_CROSS_CONTEXT generic RequestScopedSql remains intentionally forbidden.
