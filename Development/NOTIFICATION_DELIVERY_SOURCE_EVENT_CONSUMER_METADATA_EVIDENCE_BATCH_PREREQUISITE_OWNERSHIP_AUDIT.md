# NotificationDelivery source-event consumer-metadata evidence batch prerequisite ownership audit

**Date:** 2026-10-01  
**Baseline checkpoint:** `DEV-NOTIFICATION-DELIVERY-SOURCE-EVENT-CURRENT-RESIDENCY-EVIDENCE-001`  
**Verified entry HEAD:** `3f17c00ff4333e32ef340d63dcaf52d787db6093`  
**Verified entry tree:** `109522899fe170c973490fc4aae497b500ffc5ce`  
**Governed batch:** DD-333 through DD-337

## Entry gate

The DD-328…DD-332 state closure is exact-head verified:
- Core Service Verify `36755208378`: **PASS**.
- Database Verify `36755208387`: **PASS**.
- Web Boundary Verify `36755208384`: **PASS**.

The immediately prior promoted executable basis remains **1069/1069 Core**, **529/529 PostgreSQL**, **48 migrations / 42 SQL verification files**, Web PASS, with zero failed/skipped tests. PR #2 remains OPEN + DRAFT + UNMERGED. RawSource is unchanged; `main` remains unmerged.

## Source ownership reconciled

Fresh reconciliation of DD-07 §§1–4/16, DD-081 `EventEnvelopeCatalogValidator`, DD-090 raw `OutboxEventEvidence`, DD-318…DD-332 NotificationDelivery source-event evidence, migration 0030 `validate_outbox_envelope_scope()`, and `PostgresOutboxEventStore` yields one additional independently source-complete **consumer-metadata structural evidence** boundary:

- DD-327 already proves persisted event identity, mandatory envelope fields, catalog producer/sensitivity agreement and local Tenant-Core/Tenant-Industry ownership shape.
- DD-330…DD-332 already prove exact current Tenant residency equality for the same bound source event.
- DD-081 additionally owns exact structural parsing rules for optional `actorPrincipalId`, optional `causationId`, and optional `aggregateVersion` before payload interpretation:
  - actor/causation identifiers, when present, are UUIDs;
  - aggregateVersion, when present, is either a JavaScript-safe integer number or a canonical signed decimal integer string accepted by DD-081's structural parser.
- `PostgresOutboxEventStore` already normalizes persisted `envelope_jsonb` as immutable JSON evidence, so this batch does not need a new database reader, schema, role or grant.
- NotificationDelivery source-event binding is limited by DD-169 to `TENANT_CORE | TENANT_INDUSTRY`; EXPLICIT_CROSS_CONTEXT remains unreachable through this composition.
- DD-081's payload-schema execution remains a separate injected `EventPayloadValidatorPort`; no concrete implementation is source-owned. This batch therefore stops strictly before payload interpretation.

This batch does **not** infer that current structural validity authorizes consumption, dispatch, notification sending, retry or any provider action.

## Determination

**SOURCE-COMPLETE for exact DD-081 pre-payload optional consumer-metadata structure on an already DD-332-valid NotificationDelivery source event.**

A successful result means only that the exact persisted source-event evidence continues to satisfy the remaining locally re-evaluable DD-081 optional metadata shape before payload-schema execution.

## Locked DD-333…DD-337 contracts

### DD-333 — Optional actor-principal structural floor

For a bound source-event envelope:
- absent/null `actorPrincipalId` remains allowed;
- when present, `actorPrincipalId` must be an exact UUID;
- no principal currentness, membership, role, permission or attribution semantics are evaluated.

### DD-334 — Optional causation structural floor

For a bound source-event envelope:
- absent/null `causationId` remains allowed;
- when present, `causationId` must be an exact UUID;
- no causation graph lookup or source-event traversal is authorized.

### DD-335 — Optional aggregate-version structural floor

For a bound source-event envelope:
- absent/null `aggregateVersion` remains allowed;
- when present it must match DD-081 structural integer semantics:
  - a JavaScript-safe integer number; or
  - a signed decimal integer string matching `^-?\\d+$`.
- no positivity, ordering, equality-to-Outbox-row aggregateVersion, aggregate lookup or concurrency semantics may be invented because the governing DD-081 parser does not own them.

### DD-336 — Parent-first consumer-metadata floor

Add `matchesNotificationDeliverySourceEventConsumerMetadataFloors(sourceEventEnvelope, residency)`.

Require:
1. DD-326 persisted-envelope/catalog/local-scope evidence remains valid;
2. DD-330 exact current Tenant residency equality remains valid;
3. DD-333 actor-principal structure;
4. DD-334 causation structure;
5. DD-335 aggregate-version structure.

Catalog lifecycle, consumer classes, webhook eligibility, payload schema execution, event readiness and Notification delivery state remain uninterpreted.

### DD-337 — Immutable DD-332 + consumer-metadata evidence composition

Add `buildNotificationDeliverySourceEventConsumerMetadataEvidence(currentResidencyEvidence)`.

Behavior:
1. require a valid DD-332 evidence object;
2. if no source event is bound, return immutable evidence preserving the exact DD-332 reference and no synthesized source-event member;
3. if a source event is bound, require the exact current-residency evidence member and DD-336;
4. on success preserve the exact DD-332 evidence reference and exact source-event envelope reference;
5. return `null` on malformed/incomplete/failed bound evidence;
6. do not perform any new read, payload validation, catalog lifecycle decision or mutation.

## Fixed acceptance before implementation

Core:
- **NOTIF-EVTMETA-FLOOR-001** valid optional actor/causation UUIDs and absent optional values pass.
- **NOTIF-EVTMETA-FLOOR-002** malformed actorPrincipalId fails closed.
- **NOTIF-EVTMETA-FLOOR-003** malformed causationId fails closed.
- **NOTIF-EVTMETA-FLOOR-004** safe-integer numeric and signed-decimal-string aggregateVersion pass; fractional/non-integer/non-decimal/object values fail closed.
- **NOTIF-EVTMETA-BASE-001** invalid DD-326 or DD-330 parent evidence fails closed.
- **NOTIF-EVTMETA-UNBOUND-001** unbound source event preserves exact DD-332 evidence and exposes no synthesized source-event metadata.
- **NOTIF-EVTMETA-EVID-001** bound success preserves exact DD-332/source-event identities and returns immutable evidence.
- **NOTIF-EVTMETA-BOUNDARY-001** catalog ACTIVE/RETIRED lifecycle, consumerClassesJson, webhookEligible, payloadSchema JSON and payload contents remain uninterpreted; inputs remain unchanged.

Expected executable delta: Core **1069 → 1077**. PostgreSQL remains **529/529**. Database inventory remains **48 migrations / 42 verification files**. Web remains unchanged.

## Explicit exclusions

No schema, migration, RLS, role, grant, public route, provider SDK, secret access, frontend or product-policy change.

This batch does **not** implement:
- EventPayloadValidatorPort or payload-schema execution;
- Event Catalog ACTIVE/RETIRED consumption policy;
- Event Catalog consumer selection or webhook authorization;
- Outbox readiness/claim/lease/ordering/retry/DLQ/replay;
- recipient-principal currentness;
- Notification template selection/rendering/sanitization;
- Integration/provider/credential resolution;
- Notification dispatch/send/callback reconciliation;
- Delivery/Attempt/Event mutation;
- historical write-time residency reconstruction;
- EXPLICIT_CROSS_CONTEXT execution.

After implementation and targeted Core regression, run the governed Core/PostgreSQL/Database/Web batch-boundary verification before canonical promotion.
