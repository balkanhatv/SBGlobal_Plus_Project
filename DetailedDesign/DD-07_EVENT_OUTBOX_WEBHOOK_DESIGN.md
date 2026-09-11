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
`outbox_event{id uuid PK, tenant_id?, industry_context_id?, event_type, event_version, aggregate_type, aggregate_id, aggregate_version?, envelope_jsonb, status(PENDING,DISPATCHING,DISPATCHED,DEAD), attempt_count int, available_at timestamptz, locked_at?, locked_by?, dispatched_at?, last_error_code?, created_at}`.

Indexes: pending scheduler `(status,available_at)`; tenant/context; aggregate ordering. Business write + outbox + audit are one DB transaction.

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

Healthcare-only context list cannot match Retail events.

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
Unique(subscription_id,event_id,attempt_no).

## 11. Retry/DLQ/replay
Retry only transport/5xx/explicit retryable failures. Permanent 4xx/auth/filter failures do not retry except policy exceptions. Exhaustion → DLQ state. Manual replay requires permission, reason, immutable linkage to original event; payload cannot be silently changed.

## 12. Payload minimization
Webhook payload is a cataloged projection, not raw DB entity. Sensitive fields excluded unless event contract + subscription permission + legal/security policy explicitly permit them.

## 13. Acceptance
- domain write without outbox on event-emitting operation fails design;
- same event delivered twice produces one consumer effect;
- industry mismatch never reaches webhook endpoint;
- replay remains same tenant/context and event identity lineage.
