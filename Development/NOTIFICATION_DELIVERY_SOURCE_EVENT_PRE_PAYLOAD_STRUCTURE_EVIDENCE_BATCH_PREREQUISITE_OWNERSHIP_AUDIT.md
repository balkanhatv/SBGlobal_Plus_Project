# NotificationDelivery source-event pre-payload structural evidence batch prerequisite ownership audit

**Date:** 2026-10-01  
**Baseline checkpoint:** `DEV-NOTIFICATION-DELIVERY-SOURCE-EVENT-CONSUMER-METADATA-EVIDENCE-001`  
**Verified entry HEAD:** `9d3ab2200187f59aa0c3673926068d522d82a084`  
**Verified entry tree:** `bf468b176d9a85a130c58de8c948a3283347fc18`  
**Governed batch:** DD-338 through DD-342

## Entry gate

The corrected DD-333…DD-337 state closure is exact-head verified:
- Core Service Verify `36889613497` / `110461599457`: **1077/1077 PASS**, zero failed/skipped.
- PostgreSQL `36889613497` / `110461600081`: **529/529 PASS**, zero failed/skipped; database bootstrap PASS.
- Database Verify `36889613491`: PASS.
- Web Boundary Verify `36889613510`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource is unchanged; `main` remains unmerged.

## Source ownership reconciled

Fresh reconciliation of A-06 event/outbox architecture, DD-07 event-envelope validation ordering, DD-081 `EventEnvelopeCatalogValidator`, DD-090 raw Outbox evidence, DD-323…DD-337 NotificationDelivery source-event evidence and the persisted JSONB EventCatalog/Outbox surfaces yields one additional independently source-complete **pre-payload structural evidence** boundary.

DD-337 already proves, for the exact bound persisted source event:
- persisted event/catalog identity and mandatory envelope fields;
- local TENANT_CORE/TENANT_INDUSTRY ownership shape;
- exact current Tenant residency equality;
- optional actorPrincipalId UUID shape;
- optional causationId UUID shape;
- optional aggregateVersion integer structure;
- exact persisted envelope reference identity.

DD-081 still owns three pre-payload structural checks that are locally re-evaluable without implementing `EventPayloadValidatorPort`:

1. **calendar-valid occurredAt** — a timestamp must be parseable and a YYYY-MM-DD prefix, when present, must describe a real calendar date rather than relying on permissive runtime normalization;
2. **JSON-safe payload structure** — payload must recursively contain only JSON-compatible null/string/boolean/finite-number/array/plain-object values; undefined, non-finite numbers, functions, symbols, bigint and custom-prototype objects are not valid event payload evidence;
3. **JSON-safe catalog payload-schema structure** — the persisted catalog payload-schema evidence must satisfy the same JSON structural contract before any schema engine is invoked.

The PostgreSQL JSONB boundary already prevents non-JSON values in genuine persisted rows. Re-evaluating these rules in Core is still source-owned because the DD-081 validator itself owns them before payload-schema interpretation and because the evidence helpers are fail-closed against malformed/forged in-memory evidence.

NotificationDelivery source-event binding remains limited by DD-169 to TENANT_CORE/TENANT_INDUSTRY. EXPLICIT_CROSS_CONTEXT ownership execution remains outside this composition.

## Determination

**SOURCE-COMPLETE for the remaining locally re-evaluable DD-081 pre-payload structure on exact DD-337 NotificationDelivery source-event evidence.**

A successful result means only that exact DD-337 evidence also satisfies strict occurrence-time and JSON structural prerequisites before payload-schema execution.

It is **not** payload-schema validation, EventCatalog lifecycle authorization, consumer selection, webhook authorization, Outbox readiness or Notification send authority.

## Locked DD-338…DD-342 contracts

### DD-338 — Strict occurredAt calendar/date-time floor

Add a local predicate mirroring DD-081 date-time structure:
- value must be a non-empty string accepted by `Date.parse`;
- when it starts with a `YYYY-MM-DD` calendar prefix, month/day must describe a real UTC calendar date;
- permissive normalization such as `2026-02-30...` must fail closed.

No ordering against Outbox `createdAt`, Delivery timestamps or wall clock may be invented.

### DD-339 — Event payload JSON-structure floor

The exact persisted envelope `payload` must recursively be JSON-compatible:
- allowed: null, string, boolean, finite number, arrays, plain objects or null-prototype objects;
- rejected: undefined, non-finite number, bigint, symbol, function or custom-prototype object at any depth.

This is structural evidence only. Do not validate event-specific fields or schema semantics and do not normalize/mutate the payload.

### DD-340 — Catalog payload-schema JSON-structure floor

The exact preserved EventCatalog `payloadSchema` must satisfy the same JSON structural predicate.

No JSON Schema dialect, validator engine, schema id, required-property or event-specific interpretation is authorized.

### DD-341 — Parent-first pre-payload structure floor

Add `matchesNotificationDeliverySourceEventPrePayloadStructureFloors(sourceEventEnvelope, residency)`.

Require:
1. DD-336 consumer-metadata floors remain valid;
2. DD-338 strict occurredAt structure;
3. DD-339 exact payload JSON structure;
4. DD-340 exact catalog payload-schema JSON structure.

Catalog lifecycle, consumer classes, webhook eligibility, payload-schema execution, event readiness and Notification delivery state remain uninterpreted.

### DD-342 — Immutable DD-337 + pre-payload structure evidence composition

Add `buildNotificationDeliverySourceEventPrePayloadStructureEvidence(consumerMetadataEvidence)`.

Behavior:
1. require a structurally valid DD-337 evidence object and rebuild/check its exact DD-337 parent evidence without reads;
2. if no source event is bound, return immutable evidence preserving the exact DD-337 reference and no synthesized source-event member;
3. if a source event is bound, require the exact DD-337 source-event reference, exact current-residency evidence and DD-341;
4. on success preserve the exact DD-337 and source-event references;
5. return `null` on malformed/incomplete/failed bound evidence;
6. do not perform any new read, payload-schema validation, catalog lifecycle decision or mutation.

## Fixed acceptance before implementation

- **NOTIF-EVTPRE-DATE-001** strict valid occurrence timestamp passes.
- **NOTIF-EVTPRE-DATE-002** calendar-invalid but runtime-parseable occurrence date fails closed.
- **NOTIF-EVTPRE-PAYLOAD-001** nested JSON-safe payload evidence passes unchanged.
- **NOTIF-EVTPRE-PAYLOAD-002** undefined/non-finite/custom-prototype nested payload evidence fails closed.
- **NOTIF-EVTPRE-SCHEMA-001** JSON-safe catalog payload-schema passes; malformed JSON structure fails closed.
- **NOTIF-EVTPRE-BASE-001** invalid DD-336 parent evidence or substituted source-event reference fails closed.
- **NOTIF-EVTPRE-UNBOUND-001** unbound DD-337 evidence preserves exact parent identity with no synthesized source-event member.
- **NOTIF-EVTPRE-EVID-001** bound success preserves exact DD-337/source-event identities, immutable output and no payload/catalog-lifecycle/readiness/provider/send/mutation authority.

Expected executable delta: Core **1077 → 1085**. PostgreSQL remains **529/529**. Database inventory remains **48 migrations / 42 verification files**. Web remains unchanged.

## Explicit exclusions

No schema, migration, RLS, role, grant, public route, provider SDK, secret access, frontend or product-policy change.

This batch does **not** implement:
- `EventPayloadValidatorPort` or event-specific payload-schema execution;
- JSON Schema dialect/engine selection;
- EventCatalog ACTIVE/RETIRED consumption policy;
- EventCatalog consumer selection or webhook authorization;
- Outbox readiness/claim/lease/ordering/retry/DLQ/replay;
- recipient-principal currentness;
- Notification template selection/rendering/sanitization;
- Integration/provider/credential resolution;
- Notification dispatch/send/callback reconciliation;
- Delivery/Attempt/Event mutation;
- historical write-time residency reconstruction;
- EXPLICIT_CROSS_CONTEXT execution.

After DD-338…DD-342 implementation and targeted Core regression, run the governed Core/PostgreSQL/Database/Web batch-boundary verification before canonical promotion.
