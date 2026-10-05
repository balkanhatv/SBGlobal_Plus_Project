# WebhookDelivery ordinary single-context current-evidence reader composition prerequisite ownership audit

**Date:** 2026-10-05  
**Baseline checkpoint:** `DEV-SYNC-CURSOR-CURRENT-INTEGRITY-EVIDENCE-READER-001`  
**Verified entry HEAD:** `c2c9f577c9d67db590161f3be5ab6d0395555b36`  
**Verified entry tree:** `18a0266cb43ca40d1bc040010004f23201d0a096`  
**Governed batch:** DD-508 through DD-512

## Entry gate

DD-503…DD-507 is fully closed at its bounded SyncCursor current-binding + parent TenantIntegration current-integrity evidence scope. State-closure HEAD `c2c9f577c9d67db590161f3be5ab6d0395555b36` / tree `18a0266cb43ca40d1bc040010004f23201d0a096` passed exact-head push gates:
- Core Service Verify run `37269085825` / job `111632039647`: **1361/1361 PASS**, fail/skip 0.
- PostgreSQL same run / job `111632039440`: **532/532 PASS**, fail/skip 0; full database bootstrap PASS.
- Database Verify run `37269085824` / job `111632039075`: PASS, **48 migrations / 42 SQL verification files**.
- Web Boundary Verify run `37269085822` / job `111632039185`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource is unchanged; `main` remains unmerged.

## Reconciled source owners

- DD-089 owns one RequestContext-visible raw `WebhookDeliveryEvidence` by delivery id and preserves exact persisted `subscriptionId`, `eventId`, attempt, endpoint snapshot, payload digest, raw status/HTTP/error/timestamps and correlation evidence.
- DD-088 owns one RequestContext-visible `WebhookSubscription` by subscription id; ACTIVE verification evidence, Tenant ownership and allowed Industry Context ids remain raw/current subscription evidence.
- DD-090 owns one RequestContext-visible raw `OutboxEventEvidence` by event id.
- DD-091 owns one exact global `EventCatalogReadPort.loadExact({eventType,eventVersion,scopeClass})` tuple read.
- DD-163 owns the ordinary single-context necessary Webhook delivery floor over one subscription, one event and one exact catalog entry. It requires ACTIVE + verified subscription evidence, same Tenant, exact catalog identity, `webhookEligible=true`, TENANT_CORE or TENANT_INDUSTRY ownership, and exact Industry allowlist membership for Tenant-Industry events.
- DD-163 deliberately rejects PLATFORM_GLOBAL and EXPLICIT_CROSS_CONTEXT and does not authorize delivery.
- Migration 0030 `validate_webhook_delivery_scope()` establishes that a persisted WebhookDelivery references one existing subscription and one existing outbox event and that the event is webhook-eligible, same-Tenant, and Industry-compatible. The persisted foreign-key identities are exactly `WebhookDelivery.subscriptionId` and `WebhookDelivery.eventId`.
- DD-07 §10 owns the same necessary relationship statement for ordinary webhook delivery: cataloged webhook eligibility, subscription Tenant equality and included Industry endpoint(s).
- The existing remaining-boundary audit still blocks event-filter execution, endpoint verification/SSRF, signing, retry/DLQ/replay, EXPLICIT_CROSS_CONTEXT dispatch and network execution. This batch must not reopen those boundaries.

## Determination

**SOURCE-COMPLETE for ordinary single-context WebhookDelivery current prerequisite evidence only.**

A successful result means only:
1. one exact WebhookDelivery is visible under the supplied RequestContext;
2. its exact persisted subscription id resolves to one visible WebhookSubscription under that same RequestContext;
3. its exact persisted event id resolves to one visible OutboxEvent under that same RequestContext;
4. the event resolves to one exact EventCatalog tuple;
5. those subscription/event/catalog facts satisfy DD-163.

It is not delivery authorization and does not establish event-filter match, endpoint safety, signature validity, retryability, dispatch readiness or network execution authority.

## Frozen decisions

### DD-508 — read exact visible WebhookDelivery first

Add `loadWebhookDeliveryCurrentEvidence(...)`.

Invoke `WebhookDeliveryReadPort.loadForContext` exactly once with:
- the exact supplied RequestContext object;
- exact supplied WebhookDelivery id.

Null returns null before Subscription/Event/Catalog reads. Dependency errors propagate unchanged.

### DD-509 — read exact persisted Subscription and Event parents

After DD-508 succeeds:

1. call `WebhookSubscriptionReadPort.loadForContext` exactly once with:
   - identical RequestContext object;
   - `subscriptionId === delivery.subscriptionId`;
2. call `OutboxEventReadPort.loadForContext` exactly once with:
   - identical RequestContext object;
   - `eventId === delivery.eventId`.

Required null evidence returns null; errors propagate unchanged.

Require exact returned identity continuity:
- `subscription.id === delivery.subscriptionId`;
- `event.id === delivery.eventId`.

Do not search by Tenant, endpoint, event type, aggregate or alternate ids.

### DD-510 — read exact EventCatalog tuple from the loaded Event

Call `EventCatalogReadPort.loadExact` exactly once with:
- `eventType === event.eventType`;
- `eventVersion === event.eventVersion`;
- `scopeClass === event.scopeClass`.

Null returns null; errors propagate unchanged. No latest-version, ACTIVE-only, alias or fallback lookup.

### DD-511 — delegate ordinary single-context prerequisites exactly to DD-163

Call `matchesWebhookDeliveryNecessaryFloors(subscription,event,catalog)` exactly once over the exact reader-returned references.

False returns null.

This intentionally means:
- TENANT_CORE and exact allowed TENANT_INDUSTRY evidence may pass;
- PLATFORM_GLOBAL and EXPLICIT_CROSS_CONTEXT remain null through DD-163;
- catalog lifecycle status, event dispatch status, filters and endpoint metadata remain uninterpreted.

### DD-512 — immutable evidence-only boundary

Success returns frozen exact-reference:
- `delivery`;
- `subscription`;
- `event`;
- `catalog`.

Inputs remain unchanged.

Do not:
- evaluate `eventFilterJson`;
- validate/connect to `endpointUrl` or endpoint snapshot;
- perform DNS/IP/redirect/SSRF checks;
- access/generate/decrypt/rotate signing secrets;
- create signatures;
- interpret Delivery/Event status, retryability, finality, available/lock timing, HTTP/error classes or DLQ/replay state;
- authorize EXPLICIT_CROSS_CONTEXT delivery;
- resolve permission profiles;
- dispatch/create/retry WebhookDelivery attempts;
- make network/provider calls;
- invoke GuardPipeline/Commercial authorization;
- mutate Delivery/Subscription/Event/Catalog state or emit events.

## Fixed acceptance before implementation

- **WH-EVID-BASE-001** exact WebhookDelivery read executes first with exact RequestContext/id.
- **WH-EVID-BASE-002** delivery null/error short-circuits or propagates before Subscription/Event/Catalog reads.
- **WH-EVID-PARENT-001** exact same-context Subscription read uses persisted delivery.subscriptionId and exact returned id continuity.
- **WH-EVID-PARENT-002** exact same-context Event read uses persisted delivery.eventId and exact returned id continuity.
- **WH-EVID-CAT-001** exact EventCatalog read uses loaded event type/version/scope with no fallback.
- **WH-EVID-DEP-001** required null parent/catalog evidence returns null and dependency errors propagate unchanged.
- **WH-EVID-FLOOR-001** exact ordinary TENANT_CORE and allowed TENANT_INDUSTRY evidence satisfying DD-163 passes.
- **WH-EVID-FLOOR-002** inactive/unverified/foreign/ineligible/mismatched/PLATFORM_GLOBAL/EXPLICIT_CROSS_CONTEXT evidence fails closed through identity/DD-163 floors.
- **WH-EVID-EVID-001** success returns frozen exact Delivery/Subscription/Event/Catalog references and leaves inputs/evidence unchanged.
- **WH-EVID-BOUND-001** output exposes no filter-match/endpoint-safe/signed/retryable/deliverable/dispatch/network/mutation/event authority.

Expected executable delta: Core **1361 → 1371**. PostgreSQL remains **532**. Database inventory remains **48 migrations / 42 verification files**. Web remains unchanged.

## Explicit exclusions

No schema, migration, SQL verification, RLS, role, grant, route, frontend, worker/scheduler, provider SDK, secret-store call or RawSource change.

This batch does **not**:
- execute event filters;
- validate endpoint challenge/SSRF/DNS/IP/redirect policy;
- sign webhook payloads or access secret material;
- classify retry/DLQ/replay;
- authorize EXPLICIT_CROSS_CONTEXT delivery;
- interpret EventCatalog lifecycle status as deliverability;
- decide OutboxEvent readiness/claim/lease/ordering;
- create/claim/send/retry WebhookDelivery attempts;
- perform network calls;
- mutate state or emit events.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-508…DD-512 and the ten fixed acceptances.
