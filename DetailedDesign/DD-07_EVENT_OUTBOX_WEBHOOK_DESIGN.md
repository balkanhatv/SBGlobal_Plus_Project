# DD-07 — EVENT / OUTBOX / WEBHOOK DESIGN
**Wave:** 1 · **Status:** DETAILED DESIGN COMPLETE  
**Traces:** A-05 §6 · A-06 §4–§5 · ADR-006/009/012 · DD-02/05/06

## 1. Event envelope
`DomainEventEnvelope` exact fields:
| Field | Type | Required |
|---|---|---:|
| eventId | uuid | Yes |
| eventType | text | Yes |
| eventVersion | int | Yes |
| scopeClass | enum | Yes |
| tenantId | uuid | tenant scopes |
| industryContextId | uuid | TENANT_INDUSTRY |
| sourceIndustryContextId | uuid | EXPLICIT_CROSS_CONTEXT |
| targetIndustryContextId | uuid | EXPLICIT_CROSS_CONTEXT |
| actorPrincipalId | uuid | where attributable |
| actorType | enum | Yes |
| sourceModule | text | Yes |
| sourceResourceType | text | Yes |
| sourceResourceId | uuid/text | Yes |
| aggregateVersion | bigint | where ordered aggregate |
| correlationId | uuid | Yes |
| causationId | uuid | Yes if caused by event/command |
| occurredAt | timestamptz | Yes |
| dataSensitivity | enum | Yes |
| residencyRegion | text | tenant data events |
| payloadSchema | text | Yes |
| payload | jsonb | Yes |

Null Industry Context is legal only for PLATFORM_GLOBAL/TENANT_CORE. Consumer validates envelope against event catalog before payload.

## 2. Outbox table
`outbox_event{id uuid PK, tenant_id?, industry_context_id?, scope_class, event_type, event_version, aggregate_type, aggregate_id, aggregate_version?, envelope_jsonb, status(PENDING,DISPATCHING,DISPATCHED,DEAD), attempt_count int, available_at timestamptz, locked_at?, locked_by?, dispatched_at?, last_error_code?, created_at}`.

The physical scope tuple, catalog `(event_type,event_version,scope_class)`, and envelope identity/scope fields must agree. Mandatory envelope metadata includes actor class, source module/resource, correlation, occurrence time, sensitivity, residency for tenant data, payload schema and payload. EXPLICIT_CROSS_CONTEXT names two distinct same-tenant endpoints; neither null Industry Context nor a tenant-only row means all industries. Indexes: pending scheduler `(status,available_at)`; tenant/context; aggregate ordering. Business write + outbox + audit are one DB transaction.

## 3. Event catalog
Each event entry defines:
eventType/version, producer module, scopeClass, payload schema, sensitivity, ordering key, consumer list/classes, retention/audit posture, webhook eligibility, backward compatibility.

Event version increments only for incompatible semantic/payload change.

## 4. Consumer contract
Consumer receives envelope, validates:
1 supported event/version;
2 scopeClass fields;
3 residency/data-home routing;
4 idempotency by eventId;
5 allowed source module;
6 consumer's target context.
Then processes. Failed context validation is non-retryable security failure and audited.

## 5. Delivery semantics
At least once. Consumers must be idempotent. Ordering is guaranteed only per declared aggregate key where required, not globally. Retry policy is symbolic class; DD-14/operations may set values.

## 6. Projection contract
Projection row includes source event ID/version and same tenant/industry ownership. Rebuild clears only the exact projection scope and replays source events/owner reads; never merges sibling industry private rows by tenant alone.

## 7. Webhook subscription entity
`id, tenant_id, name, endpoint_url, status(PENDING_VERIFICATION,ACTIVE,PAUSED,REVOKED), secret_version, event_filter_json, allowed_industry_context_ids uuid[], permission_profile_id, created_by, verified_at?, created_at, updated_at`.

`allowed_industry_context_ids` is a duplicate-free, null-free set of contexts owned by `tenant_id`; `event_filter_json` is an object and `secret_version > 0`. ACTIVE requires non-null `verified_at` and an active same-tenant creator. Healthcare-only context list cannot match Retail events.

## 8. Endpoint verification
Registration creates one-time challenge with expiration. Endpoint proves control before ACTIVE. Redirect behavior follows allowlist/security policy; private/internal network destinations are denied by SSRF protection policy.

## 9. Signing contract
Headers:
- webhook event ID
- timestamp
- signature version
- HMAC signature over canonical bytes: timestamp + eventId + payload digest/body.
Secrets are high-entropy platform-generated, encrypted at rest, shown only at creation/rotation. Rotation supports current+previous overlap for bounded period.

## 10. Webhook delivery
`webhook_delivery{id, subscription_id, event_id, attempt_no, endpoint_snapshot, payload_digest, status, http_status?, started_at, completed_at?, next_attempt_at?, error_class?, correlation_id}`.
Unique(subscription_id,event_id,attempt_no). The partition row must match its immutable identity row on `(id,created_at,subscription_id,event_id,attempt_no)`. Delivery is permitted only when the event is cataloged webhook-eligible, belongs to the subscription tenant and its one/both Industry endpoints are included by the subscription.

## 11. Retry/DLQ/replay
Retry only transport/5xx/explicit retryable failures. Permanent 4xx/auth/filter failures do not retry except policy exceptions. Exhaustion → DLQ state. Manual replay requires permission, reason, immutable linkage to original event; payload cannot be silently changed.

## 12. Payload minimization
Webhook payload is a cataloged projection, not raw DB entity. Sensitive fields excluded unless event contract + subscription permission + legal/security policy explicitly permit them.

## 13. Acceptance
- domain write without outbox on event-emitting operation fails design;
- same event delivered twice produces one consumer effect;
- industry mismatch never reaches webhook endpoint;
- replay remains same tenant/context and event identity lineage;
- an incomplete/mismatched envelope, unverified ACTIVE endpoint, foreign allowlist context or identity/detail tuple mismatch is rejected before dispatch.


## 14. Commercial event catalog v1 [DD-063]

Two internal TENANT_CORE events are now the canonical first Commercial event contracts. Both are `INTERNAL`, `webhook_eligible=false`, version 1, and additive-only within v1. External/webhook projections require a separate minimized contract.

### 14.1 `subscription.transitioned` v1

**Producer:** Commercial.  
**Ordering key:** `subscriptionId`.  
**Consumers:** Entitlement + Notification classes.

Required payload:
- `transitionId: uuid`
- `subscriptionId: uuid`
- `fromState`: canonical subscription state
- `toState`: canonical subscription state
- `fromPlanVersionId: uuid`
- `toPlanVersionId: uuid`
- `subscriptionVersion: positive integer`
- `triggerCode: non-empty string`
- `effectiveAt: RFC3339 date-time`

Optional payload:
- `planChangeRequestId: uuid`
- `reasonCode: non-empty string`

Tenant identity, actor, correlation, occurrence time, residency, causation and source resource remain in the DD-07 envelope rather than being duplicated as client-controlled payload authority.

This event contains no amount, price, card/payment token, provider secret, approval payload or entitlement facts. A plan migration may keep the same subscription state while changing PlanVersion; the event still records both state and PlanVersion before/after values.

### 14.2 `entitlement.recompiled` v1

**Producer:** Commercial.  
**Ordering key:** Tenant from envelope.  
**Consumers:** Authorization + Experience classes.

Required payload:
- `snapshotId: uuid`
- `snapshotVersion: positive integer`
- `sourceSubscriptionId: uuid`
- `sourcePlanVersionId: uuid`
- `validFrom: RFC3339 date-time`

Optional payload:
- `previousSnapshotVersion: positive integer`

The payload intentionally excludes entitlement facts, deny-set contents, licenses, principal assignments, pricing and payment/approval evidence. Consumers use the event as a version-invalidation signal and must re-read authorized state through module-owned read contracts.

### 14.3 Catalog / outbox rules

- `subscription.transitioned` and `entitlement.recompiled` are cataloged before any runtime may insert them into `outbox_event`.
- physical outbox Tenant/Industry scope, catalog scope and envelope scope must agree; these two v1 events have null Industry Context because they are TENANT_CORE.
- aggregate ordering uses the Subscription/version or Tenant snapshot version respectively.
- business mutation, immutable evidence, outbox identity/detail and required audit append remain one authoritative DB transaction.
- ordinary application runtime may SELECT catalog rows but may not mutate the catalog.


## 15. Commercial atomic publication evidence [DD-065]

The DD-065 transaction emits exactly two DD-063 events at successful apply:
- `subscription.transitioned` aggregate = Subscription, aggregateVersion = new Subscription version;
- `entitlement.recompiled` aggregate = EntitlementSnapshot, aggregateVersion = new snapshot version.

Both envelopes use the canonical DD-07 fields including SERVICE actor, Commercial source module, TENANT_CORE scope, authoritative Tenant residency, correlation id, optional plan-change causation id, INTERNAL sensitivity, versioned payload schema and bounded payload.

Outbox identity row + partitioned event row are inserted in the same business transaction. The same transaction appends one Commercial/TENANT_CORE audit record referencing transition/source-target PlanVersion/subscription/snapshot versions. No payment/pricing/approval secret or raw entitlement compiler source is copied into the outbox/audit payloads.


## 16. Runtime envelope/catalog validation boundary [DD-081]

Before a producer, dispatcher or consumer interprets an event payload, the reusable
Core validator binds the envelope to the authoritative persistence and catalog
facts. It validates JSON compatibility, event id/type/version/scope, mandatory
actor/source/correlation/time metadata, producer module, sensitivity, Tenant /
Industry Context ownership and Tenant residency. PLATFORM_GLOBAL, TENANT_CORE and
TENANT_INDUSTRY follow the exact DD-07/migration-0030 ownership shapes.

EXPLICIT_CROSS_CONTEXT requires distinct source/target Industry Context identifiers
and an injected authoritative verifier that confirms both belong to the envelope
Tenant. No free-text selector or event payload supplies this authority.

Payload interpretation is a separate injected catalog-schema validator and runs
only after metadata/catalog/scope validation succeeds. This boundary does not
select a JSON-schema engine, add an event catalog entry, poll the outbox, schedule
retry/DLQ work, sign a webhook, resolve endpoint networks or expose a route.


## 17. Raw Webhook Subscription persistence reader [DD-088]

The persisted `webhook_subscription` relation is exposed to server-side Integration
code through a typed raw read port. `WebhookSubscription` preserves Tenant owner,
name, endpoint URL, status, secret version, event-filter JSON, allowed Industry
Context ids, optional permission profile, creator and verification/audit timestamps.

`PostgresWebhookSubscriptionStore` reads one subscription through
`RequestScopedSql` under dedicated `PostgresIntegrationDatabase`, which fixes the
existing migration-0028 `sbg_integration_service_rw` NOBYPASSRLS role.
WebhookSubscription FORCE-RLS remains Tenant-only: foreign Tenant rows are invisible,
while a same-Tenant subscription remains visible from Tenant Core or Tenant Industry
request context.

The reader validates the persisted shape and the already-owned integrity floor:
positive secret version, object event filter, unique UUID context list, valid status,
and non-null verification evidence for ACTIVE. It does **not** execute or trust the
endpoint, decide whether the endpoint is safe, evaluate event filters, access secret
plaintext, or decide whether delivery may occur.

**Boundary:** no verification challenge, DNS/IP resolution, redirects, SSRF policy,
secret generation/decryption/rotation overlap, signature algorithm, delivery worker,
retry/DLQ behavior, public route, migration, role, grant or RLS policy is introduced.


## 17. Raw Webhook Delivery persistence reader [DD-089]

The persisted `webhook_delivery` attempt row is exposed to server-side Integration
code through a raw typed read port only. `WebhookDeliveryEvidence` preserves
subscription/event identity, attempt number, endpoint snapshot, payload digest, raw
status, optional HTTP status, start/completion timestamps, optional next-attempt time,
optional error class, correlation id and createdAt.

`PostgresWebhookDeliveryStore` reads one attempt by delivery id through the existing
DD-088 dedicated Integration PostgreSQL role + `RequestScopedSql`. Parent-RLS remains
the physical visibility authority: the delivery is visible only when both its
WebhookSubscription and its OutboxEvent are visible in the current RequestContext.

This reader deliberately does **not** classify the raw status/error/HTTP evidence as
success, retryable, permanent failure, DLQ, replayable or deliverable. It does not
connect to the endpoint, interpret event filters or decide whether another attempt
should be scheduled.

**Boundary:** no endpoint challenge/network access, DNS/IP/redirect SSRF logic,
secret/signature handling, retry scheduler, DLQ transition, replay, route, migration,
role, grant or RLS policy is introduced.


## 18. Raw Outbox Event persistence reader [DD-090]

The persisted `outbox_event` row is exposed to server-side Integration code through
a raw typed read port only. `OutboxEventEvidence` preserves physical scope,
event/catalog identity, aggregate identity/version, immutable envelope JSON, raw
outbox status, attempt count, availability, optional lock/dispatch/error evidence and
createdAt.

`PostgresOutboxEventStore` reads one event by id through the existing DD-088
Integration PostgreSQL role + `RequestScopedSql`. Migration 0030's final
`outbox_row_visible` FORCE-RLS predicate remains the physical visibility authority:
Tenant Core is same-Tenant visible, Tenant Industry is exact-context visible,
Platform Global requires Platform Global scope, and explicit cross-context access
continues to require its dedicated governed repository rather than this generic path.

This reader deliberately does **not** claim/lock rows, decide readiness, increment
attempts, choose workers, dispatch, retry, dead-letter, replay or interpret the event
payload/schema. DD-081 remains the reusable envelope-validation boundary when a
producer/consumer interprets an event.

**Boundary:** no dispatcher scheduler, lease/claim algorithm, retry/DLQ/replay
transition, payload-schema engine, webhook action, route, migration, role, grant or
RLS policy is introduced.


## 19. Exact Event Catalog persistence reader [DD-091]

The global `event_catalog` is exposed through an exact typed tuple reader.
`PersistedEventCatalogEntry` is a structural superset of DD-081
`EventCatalogContract`: event type/version, producer, scope, payload-schema JSON and
sensitivity are accompanied by ordering key, consumer classes, retention/audit
posture, webhook eligibility, backward-compatibility declaration, ACTIVE/RETIRED
status and createdAt.

`PostgresEventCatalogStore` requires the exact
`(eventType,eventVersion,scopeClass)` tuple and executes through a governed
read-capable Integration database role. Event Catalog is global metadata, not
Tenant-owned RLS data; no RequestContext selector is needed to read an exact tuple.

The reader deliberately does **not** execute payload schemas, decide whether RETIRED
entries may be produced/consumed, register/retire events, select consumers or
authorize webhook delivery. DD-081 remains the envelope/catalog validation boundary,
with a separate injected payload-schema validator.

**Boundary:** no schema engine, catalog writer, producer registration, consumer
scheduler, route, migration, role, grant or RLS policy is introduced.
