# Outbox Event PostgreSQL reader prerequisite ownership audit

**Date:** 2026-09-21  
**Baseline:** `9d31003fa242f2a91c013ae64734b548d99daf7c`  
**Scope:** next independent source-complete Integration slice after DD-089.

## Source reconciliation

DD-07 §§2–5/14.3, DD-17 Events/Webhooks acceptance, migration 0008
`outbox_event` schema/FORCE-RLS, migration 0030 envelope/scope integrity and
migration 0028 Integration-service privileges were reconciled with the current
DD-088/089 dedicated Integration PostgreSQL role boundary.

The persistence contract is exact:

- outbox identity is immutable by `id + created_at`;
- row carries `scope_class`, Tenant/Industry ownership, event type/version,
  aggregate identity/version, envelope JSON, status, attempt count, availability,
  optional lock/dispatch/error evidence and createdAt;
- status is `PENDING | DISPATCHING | DISPATCHED | DEAD`;
- event type/version/scope must match the Event Catalog;
- envelope identity/type/version/scope, source module, sensitivity, correlation,
  occurrence time, Tenant/Industry ownership and residency are database-validated;
- TENANT_CORE is same-Tenant visible, TENANT_INDUSTRY is exact-context visible,
  EXPLICIT_CROSS_CONTEXT is visible only to one of its explicit endpoints, and
  PLATFORM_GLOBAL is visible only in Platform Global database scope;
- migration 0028 already grants `sbg_integration_service_rw` SELECT/INSERT/UPDATE
  on outbox identity/detail.

## Determination

A concrete **raw Outbox Event reader** is source-complete.

It may expose immutable persisted event/envelope state to server-side Integration
code under the existing RLS boundary. It must not claim/lock an event, choose a
worker, decide readiness, increment attempts, dispatch, retry, dead-letter, replay or
interpret the payload schema.

The raw reader is not a substitute for DD-081 envelope validation at producer /
consumer interpretation boundaries. It only maps persistence truth.

## Authorized implementation boundary

Implement:

1. Core typed `OutboxEventEvidence` / `OutboxEventReadPort`;
2. `PostgresOutboxEventStore` through existing
   `PostgresIntegrationDatabase` + `RequestScopedSql`;
3. one parameterized read by event id;
4. exact UUID/scope/status/version/count/timestamp/text/JSON validation and immutable
   result;
5. null for RLS-hidden / absent events;
6. real PostgreSQL acceptance proving exact Industry visibility, sibling isolation,
   Tenant-Core same-Tenant visibility, foreign-Tenant isolation and raw dispatcher
   state evidence preservation.

The reader preserves `status`, `attemptCount`, `availableAt`, optional
`lockedAt`, `lockedBy`, `dispatchedAt` and `lastErrorCode` exactly. It does not
turn them into a dispatch/retry decision.

No claim/lease algorithm, worker scheduler, retry/DLQ/replay transition, payload
schema engine, webhook delivery action, route, migration, role, grant or RLS policy
is authorized.

Acceptance: EVT-OUT-PG-001…005.
