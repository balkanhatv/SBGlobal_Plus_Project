# WebhookDelivery source-event pre-payload structural evidence batch prerequisite ownership audit

**Date:** 2026-10-05  
**Baseline checkpoint:** `DEV-WEBHOOK-DELIVERY-EVENT-CURRENT-RESIDENCY-EVIDENCE-READER-001`  
**Verified entry HEAD:** `d1bf7ec8280b5a488dda875ecdd0f40fc982d4d0`  
**Verified entry tree:** `3b6eb12dbee2d168734329c612e0bb61d5bc69ef`  
**Governed batch:** DD-523 through DD-527

## Entry gate

DD-518…DD-522 corrected canonical promotion and state closure are exact-head verified:
- Core Service Verify `37279756203` / job `111664818225`: **1387/1387 PASS**, zero failed/skipped.
- PostgreSQL same run / job `111664818489`: **536/536 PASS**, zero failed/skipped; database bootstrap PASS.
- Database Verify `37279756172` / job `111664817914`: PASS with **48 migrations / 42 SQL verification files**.
- Web Boundary Verify `37279756158` / job `111664817737`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource is unchanged; `main` remains unmerged.

## Source ownership reconciled

Fresh reconciliation of A-06 event/outbox architecture, DD-07 event-envelope validation ordering, DD-081 `EventEnvelopeCatalogValidator`, DD-163 Webhook necessary floors, DD-508…DD-522 WebhookDelivery evidence, `outbox-event-envelope-floors.ts`, `tenant-residency.ts`, and the proven Notification DD-338…DD-342 pattern yields one independently source-complete next boundary.

DD-522 already proves, for the exact bound persisted Webhook source event:
- exact Delivery → Subscription → OutboxEvent → EventCatalog relationships;
- ACTIVE/verified ordinary single-context Webhook necessary floors;
- exact persisted event/catalog tuple and envelope identity/catalog metadata/local-scope coherence;
- exact current authoritative Tenant residency equality;
- preservation of the explicit persisted envelope evidence.

DD-081 still owns three pre-payload structural checks that are locally re-evaluable without invoking or selecting an `EventPayloadValidatorPort` implementation:

1. **calendar-valid occurredAt** — the timestamp must be parseable and any leading `YYYY-MM-DD` prefix must be a real UTC calendar date rather than a permissively normalized impossible date;
2. **JSON-safe payload structure** — the exact persisted envelope payload must recursively contain only JSON-compatible null/string/boolean/finite-number/array/plain-object values;
3. **JSON-safe catalog payload-schema structure** — the exact preserved EventCatalog payload-schema evidence must satisfy the same JSON structural contract before schema interpretation.

The PostgreSQL JSONB boundary already prevents non-JSON values in genuine persisted rows. Core re-evaluation remains source-owned because DD-081 itself applies these checks before payload-schema interpretation and because evidence-only helpers must fail closed against malformed/forged in-memory evidence.

The historical Webhook remaining-boundary audit still blocks event-filter evaluation, endpoint verification/SSRF, signing, retry/DLQ/replay, EXPLICIT_CROSS_CONTEXT dispatch and network execution. This batch does not alter those conclusions.

## Determination

**SOURCE-COMPLETE for the remaining locally re-evaluable DD-081 pre-payload structure over exact DD-522 WebhookDelivery source-event current-residency evidence.**

Success means only that the exact DD-522 evidence additionally satisfies strict occurrence-time and JSON structural prerequisites that DD-081 owns before payload-schema execution.

It is **not** payload-schema validation, EventCatalog ACTIVE/RETIRED authorization, filter evaluation, endpoint authorization, signing authorization, delivery readiness, retry/finality, cross-context authorization or network delivery authority.

## Locked DD-523…DD-527 contracts

### DD-523 — strict occurredAt calendar/date-time floor

Add a Webhook-local pre-payload structural predicate mirroring DD-081:
- `occurredAt` must be a non-empty string accepted by `Date.parse`;
- when a `YYYY-MM-DD` prefix is present, month/day must describe a real UTC calendar date;
- permissively normalized impossible dates such as `2026-02-30...` fail closed.

Do not infer ordering against Outbox createdAt, Delivery createdAt, attempt times or wall clock.

### DD-524 — exact event payload JSON-structure floor

The exact persisted envelope `payload` must recursively be JSON-compatible:
- allowed: null, string, boolean, finite number, arrays, plain objects or null-prototype objects;
- rejected: undefined, non-finite numbers, bigint, symbol, function, sparse/invalid nested evidence or custom-prototype objects.

This is structural evidence only. Do not validate event-specific fields or schema semantics and do not normalize/mutate payload evidence.

### DD-525 — exact catalog payload-schema JSON-structure floor

The exact preserved EventCatalog `payloadSchema` must satisfy the same recursive JSON structural predicate.

No JSON Schema dialect, validator engine, schema-id interpretation, required-property rule or event-specific schema semantics are authorized.

### DD-526 — parent-first DD-522 pre-payload structural floor

Add a pure predicate over exact `WebhookDeliveryEventCurrentResidencyEvidence`.

Before applying DD-523…DD-525 it must re-apply the DD-520 current-residency floor to:
- exact preserved OutboxEvent;
- exact preserved EventCatalog;
- exact DD-517 persisted envelope reference;
- exact DD-522 current-residency evidence.

If the DD-522 parent/reference structure is malformed, substituted or fails the current-residency floor, return false.

### DD-527 — immutable exact-reference pre-payload evidence composition

Add a pure builder over exact DD-522 evidence:
- require DD-526;
- on success return immutable evidence preserving the exact DD-522 parent and exact persisted envelope reference;
- perform **zero new persistence reads** and **zero payload-validator calls**;
- return null on malformed/substituted/failed evidence.

Success exposes no new lifecycle/readiness/filter/endpoint/signing/retry/cross-context/network/mutation authority.

## Fixed acceptance before implementation

- **WH-EVTPRE-DATE-001** strict valid occurrence timestamp passes unchanged.
- **WH-EVTPRE-DATE-002** calendar-invalid but runtime-parseable occurrence date fails closed.
- **WH-EVTPRE-PAYLOAD-001** nested JSON-safe payload evidence passes unchanged.
- **WH-EVTPRE-PAYLOAD-002** undefined/non-finite/sparse/custom-prototype nested payload evidence fails closed.
- **WH-EVTPRE-SCHEMA-001** JSON-safe catalog payload-schema passes; malformed JSON structure fails closed.
- **WH-EVTPRE-BASE-001** malformed/substituted DD-522 parent or current-residency evidence fails closed.
- **WH-EVTPRE-EVID-001** success preserves exact DD-522/envelope identities in immutable evidence with zero reads or payload-validator invocation.
- **WH-EVTPRE-BOUND-001** output exposes no payload-schema-valid, catalog-active, filter-matched, endpoint-authorized, signed, ready/retryable, cross-context, dispatched/network or mutation authority.

Expected executable delta: Core **1387 → 1395**. PostgreSQL remains **536/536**. Database inventory remains **48 migrations / 42 verification files**. Web remains unchanged.

## Explicit exclusions

No schema, migration, SQL verification, RLS, role, grant, route, frontend, worker/scheduler, provider SDK, secret-store or RawSource change.

This batch does **not** implement:
- `EventPayloadValidatorPort` invocation or a concrete schema engine;
- EventCatalog ACTIVE/RETIRED delivery policy;
- `eventFilterJson` grammar/evaluation;
- endpoint challenge, DNS/IP/redirect or SSRF policy;
- signing/HMAC/secret retrieval/rotation;
- Outbox readiness/claim/lease/ordering;
- delivery retry/backoff/finality/DLQ/replay;
- EXPLICIT_CROSS_CONTEXT Webhook delivery authorization;
- dispatcher/network/provider execution;
- historical write-time residency reconstruction;
- Delivery/Subscription/Event mutation or event emission.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-523…DD-527 and the fixed acceptances above.
