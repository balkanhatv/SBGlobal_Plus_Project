# NotificationDelivery source-event persisted-envelope evidence batch ownership audit

**Date:** 2026-09-30  
**Baseline checkpoint:** `DEV-NOTIFICATION-DELIVERY-SOURCE-EVENT-CATALOG-EVIDENCE-READER-001`  
**Verified entry HEAD:** `b59434be5f25e289ebeaef29f59e3a9366eed9b8`  
**Verified entry tree:** `0ef28c993cadadb65342fa5e34cf7a9ba63e08d9`  
**Governed batch:** DD-323 through DD-327

## Entry gate

The DD-318…DD-322 state closure is exact-head verified:
- Core Service Verify `36745244288` / `109989657352`: **1049/1049 PASS**, zero failed/skipped.
- PostgreSQL `36745244288` / `109989657718`: **525/525 PASS**, zero failed/skipped; database bootstrap PASS.
- Database Verify `36745244283` / `109989657862`: PASS.
- Web Boundary Verify `36745244257` / `109989657305`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource is unchanged; `main` remains unmerged.

## Source ownership reconciled

Fresh reconciliation of A-06 Event Catalog / transactional-outbox architecture, DD-081 EventEnvelopeCatalogValidator, DD-090 raw OutboxEvent evidence, DD-091 exact EventCatalog evidence, DD-318…DD-322 Delivery source-event catalog evidence, and migration 0030 `validate_outbox_envelope_scope()` yields one independently source-complete **local persisted-envelope evidence** boundary:

- DD-322 already establishes the exact preserved OutboxEvent and exact EventCatalog tuple for a bound NotificationDelivery source event.
- migration 0030 requires persisted envelope identity fields to match the Outbox row: eventId, eventType, eventVersion and scopeClass.
- migration 0030 requires persisted envelope sourceModule and dataSensitivity to match EventCatalog producerModule and sensitivityClass.
- migration 0030 requires non-empty actorType, sourceResourceType, sourceResourceId and payloadSchema, requires a payload member, a UUID correlationId and parseable occurredAt.
- the already-loaded OutboxEvent exposes exact persisted Tenant/Industry ownership and immutable envelope JSON, allowing local scope-shape re-evaluation for PLATFORM_GLOBAL, TENANT_CORE and TENANT_INDUSTRY, plus syntactic/distinct source/target UUID evidence for EXPLICIT_CROSS_CONTEXT.
- migration 0030 additionally compares Tenant events to authoritative Tenant residency and proves cross-context endpoints belong to the same Tenant. DD-322 evidence does not include that authoritative residency or endpoint-ownership source, so those predicates are **not** source-complete here.
- DD-081 can execute payload-schema validation only through an explicit EventPayloadValidatorPort and requires authoritative persistence binding/residency. That execution is outside this batch.
- EventCatalog ACTIVE/RETIRED, webhookEligible, consumer classes, Outbox readiness/retry state and Notification send/dispatch are not implied by persisted-envelope coherence.

## Determination

**SOURCE-COMPLETE for re-evaluating only the directly persisted/local OutboxEvent envelope identity, catalog-metadata and local scope-shape evidence available from DD-322.**

A successful result means only that the already-preserved source event envelope still agrees with its Outbox row and exact catalog evidence on the directly re-evaluable fields. It does **not** certify the complete migration-0030 trigger, current Tenant residency, cross-context endpoint ownership, payload schema, EventCatalog execution status or notification dispatchability.

## Locked DD-323…DD-327 contracts

### DD-323 — Outbox envelope row-identity floor
Add `matchesOutboxEventEnvelopeIdentityFloors(event)`.

Require:
- `envelopeJson` is a plain JSON object;
- exact envelope eventId equals `event.id`;
- exact eventType equals `event.eventType`;
- exact eventVersion equals `event.eventVersion` and is a positive safe integer;
- exact scopeClass equals `event.scopeClass`;
- correlationId is UUID-shaped;
- occurredAt is a parseable timestamp;
- actorType, sourceResourceType, sourceResourceId and payloadSchema are non-empty strings;
- own `payload` member exists.

Do not interpret payload contents.

### DD-324 — Outbox envelope EventCatalog metadata floor
Add `matchesOutboxEventEnvelopeCatalogMetadataFloors(event, catalog)`.

Require DD-323 plus:
- exact `envelopeJson.sourceModule === catalog.producerModule`;
- exact `envelopeJson.dataSensitivity === catalog.sensitivityClass`;
- exact event/catalog type/version/scope tuple continues to satisfy DD-321.

Do not interpret catalog status, webhook eligibility, consumers, compatibility, retention or payload schema.

### DD-325 — Re-evaluable local envelope scope-shape floor
Add `matchesOutboxEventEnvelopeLocalScopeFloors(event)`.

Require DD-323 and:
- PLATFORM_GLOBAL: event Tenant/Industry absent; envelope Tenant/Industry absent; no source/target Industry selectors.
- TENANT_CORE: valid event Tenant, no event Industry; envelope Tenant exactly equals event Tenant; envelope Industry/source/target selectors absent.
- TENANT_INDUSTRY: valid event Tenant + Industry; envelope Tenant/Industry exactly equal event; source/target selectors absent.
- EXPLICIT_CROSS_CONTEXT: valid event Tenant, no event Industry; envelope Tenant exactly equals event Tenant; envelope direct Industry selector absent; source/target Industry selectors are valid UUIDs and distinct.

This floor does **not** prove Tenant residency or that cross-context endpoints belong to the Tenant.

### DD-326 — Source-event persisted-envelope evidence composition
Add `matchesNotificationDeliverySourceEventEnvelopeEvidenceFloors(sourceEventCatalog)`.

Require:
- DD-321 exact event/catalog tuple;
- DD-324 envelope/catalog metadata;
- DD-325 local scope shape.

A true result remains a necessary evidence floor only.

### DD-327 — Immutable DD-322 + envelope-evidence envelope
Add `buildNotificationDeliverySourceEventEnvelopeEvidence(dd322Evidence)`.

Behavior:
- when DD-322 has no `sourceEventCatalog`, return immutable evidence preserving the exact DD-322 reference and no source-envelope member;
- when bound, require DD-326;
- on success preserve exact DD-322/event/catalog identities and expose immutable `sourceEventEnvelope` containing the exact persisted `envelopeJson` reference;
- malformed/mismatched bound evidence returns `null`;
- inputs remain unchanged.

No catalog fallback/read, Outbox re-read, payload validator invocation or external ownership lookup occurs.

## Fixed acceptance before implementation

- **NOTIF-EVTENV-ID-001** exact persisted event identity/mandatory envelope evidence passes.
- **NOTIF-EVTENV-ID-002** id/type/version/scope mismatch fails closed.
- **NOTIF-EVTENV-ID-003** invalid correlation/timestamp or missing/blank mandatory field/payload member fails closed.
- **NOTIF-EVTENV-CAT-001** exact producer/sensitivity + DD-321 tuple passes regardless of ACTIVE/RETIRED.
- **NOTIF-EVTENV-CAT-002** producer/sensitivity/tuple mismatch fails closed.
- **NOTIF-EVTENV-SCOPE-001** valid PLATFORM_GLOBAL/TENANT_CORE/TENANT_INDUSTRY local ownership shape passes.
- **NOTIF-EVTENV-SCOPE-002** Tenant/Industry/selectors mismatch fails closed.
- **NOTIF-EVTENV-SCOPE-003** EXPLICIT_CROSS_CONTEXT requires exact Tenant plus distinct UUID source/target selectors, but does not claim endpoint ownership.
- **NOTIF-EVTENV-COMP-001** exact DD-321 + DD-324 + DD-325 bound evidence passes.
- **NOTIF-EVTENV-UNBOUND-001** DD-322 unbound source-event evidence remains valid without synthesized source-envelope evidence.
- **NOTIF-EVTENV-EVID-001** bound success preserves exact DD-322/event/catalog/envelope identities in immutable evidence.
- **NOTIF-EVTENV-BOUND-001** inputs remain unchanged and output exposes no residency/currentness/payload-schema/catalog-lifecycle/webhook/dispatch/retry/provider/secret/send/mutation authority.

Expected executable delta: Core **1049 → 1061**. PostgreSQL remains **525**. Database inventory remains **48 migrations / 42 verification files**. Web remains unchanged.

## Explicit exclusions

No schema, migration, RLS, role, grant, public route, provider SDK, secret access, frontend or product-policy change.

This batch does **not** implement:
- Tenant residency lookup or equality;
- cross-context endpoint same-Tenant ownership proof;
- EventPayloadValidatorPort or payload-schema execution;
- complete DD-081 EventEnvelopeCatalogValidator execution;
- EventCatalog ACTIVE/RETIRED execution interpretation;
- webhook eligibility or consumer selection;
- Outbox PENDING/DISPATCHING/DISPATCHED/DEAD readiness;
- availableAt/lock/attempt/retry/DLQ/replay policy;
- recipient-principal currentness;
- channel→IntegrationCapability mapping;
- Integration health/fallback or ProviderAdapter selection;
- credential secret/material access;
- template rendering/sanitization;
- Notification dispatch/send/callback reconciliation;
- Delivery/Attempt/Event mutation or audit/metric append.

After DD-323…DD-327 implementation and targeted regression, run the governed Core/PostgreSQL/Database/Web batch-boundary verification before canonical promotion.
