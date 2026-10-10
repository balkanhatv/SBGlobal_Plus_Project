# WebhookDelivery persisted event-envelope current-evidence reader composition prerequisite ownership audit

**Date:** 2026-10-05  
**Baseline checkpoint:** `DEV-WEBHOOK-DELIVERY-CURRENT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `c84ddb241413d61c6f4551d0df3eb2aba63d2ae7`  
**Verified entry tree:** `5a8185766737796d7af8b933d45ad7dfc5c66445`  
**Governed batch:** DD-513 through DD-517

## Entry gate

DD-508…DD-512 is fully closed at its bounded ordinary single-context WebhookDelivery evidence scope. State-closure HEAD `c84ddb241413d61c6f4551d0df3eb2aba63d2ae7` / tree `5a8185766737796d7af8b933d45ad7dfc5c66445` passed exact-head push gates:
- Core Service Verify run `37270949559` / job `111637614012`: **1371/1371 PASS**, fail/skip 0.
- PostgreSQL same run / job `111637613700`: **532/532 PASS**, fail/skip 0; full database bootstrap PASS.
- Database Verify run `37270949842` / job `111637614766`: PASS, database inventory remains **48 migrations / 42 SQL verification files**.
- Web Boundary Verify run `37270949760` / job `111637614538`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource remains unchanged; `main` remains unmerged.

## Reconciled source owners

Fresh reconciliation of A-06 event/outbox architecture, DD-07 event-envelope rules, DD-081 EventEnvelopeCatalogValidator, DD-090 raw OutboxEvent evidence, DD-091 exact EventCatalog evidence, DD-163 WebhookDelivery necessary floors, DD-323…DD-327 historically verified Notification source-event envelope evidence and migration 0030 yields one new independently source-complete boundary:

- DD-512 already preserves the exact visible WebhookDelivery, exact same-context persisted Subscription and OutboxEvent, and the exact EventCatalog tuple satisfying DD-163.
- DD-321/DD-323/DD-324/DD-325 already proved reusable pure predicates for:
  - exact persisted Outbox event/catalog tuple identity;
  - persisted envelope event id/type/version/scope continuity;
  - required local envelope structure;
  - exact catalog producer-module and sensitivity metadata continuity;
  - locally re-evaluable PLATFORM_GLOBAL/TENANT_CORE/TENANT_INDUSTRY/EXPLICIT_CROSS_CONTEXT ownership shape.
- Those pure predicates are logically owned by the Integration/Event boundary, even though their current implementation resides in a Notification source-event module. Reusing them through a shared Integration-owned pure floor avoids duplicating semantics.
- DD-512 already rejects PLATFORM_GLOBAL and EXPLICIT_CROSS_CONTEXT via DD-163, so this Webhook composition may only succeed for ordinary TENANT_CORE or allowed TENANT_INDUSTRY evidence.
- Current Tenant residency equality, same-Tenant ownership for explicit cross-context endpoints and payload-schema execution require additional authoritative evidence/ports and are not source-complete from DD-512 alone.
- Webhook event-filter execution, endpoint/SSRF verification, signing/secret material, retry/DLQ/replay, dispatch/network execution and mutation remain blocked by the existing Webhook remaining-boundary audit.

## Determination

**SOURCE-COMPLETE for exact DD-512 Webhook evidence + locally re-evaluable persisted Outbox envelope/catalog coherence only.**

A successful result means only that the exact already-loaded Webhook source event still agrees with its persisted envelope and exact EventCatalog evidence on directly re-evaluable identity, producer/sensitivity and local scope-shape fields.

It is not full EventEnvelopeCatalogValidator execution, payload-schema validation, current residency proof, Webhook authorization or delivery authority.

## Frozen decisions

### DD-513 — establish exact DD-512 parent evidence first

Add `loadWebhookDeliveryEventEnvelopeCurrentEvidence(...)`.

Invoke `loadWebhookDeliveryCurrentEvidence(...)` first with:
- exact supplied RequestContext object;
- exact supplied WebhookDelivery id;
- exact reader dependencies unchanged.

Parent null returns null. Parent dependency errors propagate unchanged. No additional persistence reads are permitted after DD-512 succeeds.

### DD-514 — extract one shared Integration-owned persisted Outbox envelope floor

Add a pure Integration/Event helper module containing the already-proven DD-321/DD-323/DD-324/DD-325 semantics:
- exact OutboxEvent↔EventCatalog tuple;
- exact envelope event id/type/version/scope;
- required correlation/time/actor/source-resource/payload-schema/payload-member evidence;
- exact envelope sourceModule ↔ catalog.producerModule;
- exact envelope dataSensitivity ↔ catalog.sensitivityClass;
- local scope-shape rules.

Refactor the historical Notification wrappers to delegate to this shared helper without semantic change. Existing Notification acceptance tests must continue to pass unchanged.

Do not add current residency, endpoint ownership or payload-schema execution.

### DD-515 — apply shared local envelope evidence to exact DD-512 event/catalog

After DD-512 succeeds, evaluate the shared persisted Outbox envelope floor over:
- exact `parent.event`;
- exact `parent.catalog`.

False returns null. Because DD-512 already owns DD-163 ordinary Webhook prerequisites, only TENANT_CORE and allowed TENANT_INDUSTRY parent evidence can reach success.

No re-read, alternate catalog lookup or normalized/substituted event is permitted.

### DD-516 — immutable exact-reference envelope evidence

Success returns frozen:
- exact DD-512 `parent`;
- exact `parent.event.envelopeJson` reference as `envelopeJson`.

Do not clone, normalize, rewrite or interpret payload contents. Inputs and preserved evidence remain unchanged.

### DD-517 — local envelope evidence is not Webhook delivery authority

Do not:
- claim current Tenant residency;
- invoke EventEnvelopeCatalogValidator or EventPayloadValidatorPort;
- interpret EventCatalog ACTIVE/RETIRED;
- evaluate `eventFilterJson`;
- validate/connect to endpoint URLs or perform DNS/IP/redirect/SSRF checks;
- access/sign/rotate secret material;
- decide retry/DLQ/replay/readiness/finality;
- authorize EXPLICIT_CROSS_CONTEXT;
- dispatch/network-send;
- invoke GuardPipeline/Commercial authorization;
- mutate Delivery/Subscription/Event/Catalog state or emit events.

## Fixed acceptance before implementation

- **WH-EVTENV-BASE-001** exact DD-512 parent evidence executes first with identical RequestContext/id/dependencies and no extra reads.
- **WH-EVTENV-BASE-002** DD-512 null/error short-circuits or propagates before local envelope composition.
- **WH-EVTENV-ID-001** exact persisted event/envelope identity plus catalog producer/sensitivity evidence passes.
- **WH-EVTENV-ID-002** event id/type/version/scope or producer/sensitivity mismatch fails closed.
- **WH-EVTENV-SCOPE-001** exact ordinary TENANT_CORE and allowed TENANT_INDUSTRY local envelope scope shape passes.
- **WH-EVTENV-SCOPE-002** Tenant/Industry/selectors mismatch or malformed mandatory envelope structure fails closed.
- **WH-EVTENV-EVID-001** success preserves exact DD-512 parent and exact persisted envelope reference in an immutable result with inputs unchanged.
- **WH-EVTENV-BOUND-001** output exposes no residency-current/payload-schema-valid/filter-match/endpoint-safe/signed/retryable/deliverable/dispatch/network/mutation/event authority.

Expected executable delta: Core **1371 → 1379**. PostgreSQL remains **532**. Database inventory remains **48 migrations / 42 verification files**. Web remains unchanged.

## Explicit exclusions

No schema, migration, SQL verification, RLS, role, grant, route, frontend, worker/scheduler, provider SDK, secret-store call or RawSource change.

This batch does **not** implement:
- current Tenant residency equality;
- explicit cross-context same-Tenant endpoint ownership;
- EventPayloadValidatorPort / payload-schema execution;
- EventCatalog lifecycle authorization;
- Webhook filter evaluation;
- endpoint verification / SSRF policy;
- signing or secret access;
- Outbox/Webhook readiness, retry, DLQ or replay policy;
- network/provider delivery;
- mutation/event emission.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-513…DD-517 and the eight fixed acceptances.
