# NotificationDeliveryAttempt history-evidence batch ownership audit

**Date:** 2026-09-30  
**Baseline checkpoint:** `DEV-AI-INDUSTRY-GATEWAY-RESIDENCY-POLICY-EVIDENCE-PRE-ROUTING-001`  
**Verified entry HEAD:** `d9b353897c76247b55ccf3440d3458ea3ab39e99`  
**Verified entry tree:** `8c714f56296a4a7bfa84bfd833581707afe24c51`  
**Governed batch:** DD-288 through DD-292

## Entry gate

The corrected DD-283…DD-287 state closure is exact-head verified:
- Core Service Verify `36669902903` / `109742474381`: **977/977 PASS**, zero failed/skipped.
- PostgreSQL `36669902903` / `109742474327`: **525/525 PASS**, zero failed/skipped; database bootstrap PASS.
- Database Verify `36669902948` / `109742474274`: PASS.
- Web Boundary Verify `36669902989` / `109742474863`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource is unchanged; `main` remains unmerged.

## Source ownership reconciled

Fresh reconciliation of migration 0026, DD-099 raw NotificationDeliveryAttempt persistence, the current PostgreSQL attempt reader and NotificationDelivery raw contract yields one independently source-complete relationship/evidence boundary:

- every NotificationDeliveryAttempt has one non-null `delivery_id` FK to NotificationDelivery;
- `attempt_no` is a positive integer and is unique per Delivery;
- the PostgreSQL reader reads one supplied Delivery id and orders rows by `attempt_no ASC, id ASC`;
- provider message reference, normalized status/error and timestamps are raw evidence only;
- `completed_at`, when present, cannot precede `started_at`;
- FORCE-RLS visibility is inherited through the visible parent NotificationDelivery;
- no source-owned runtime contract defines normalized-status terminality, retryability, next-attempt scheduling, backoff, provider selection or dispatch.

DD-099 already owns row-shape parsing and the concrete PostgreSQL ordering. This batch therefore does not duplicate timestamp/status validation. It composes already-loaded typed attempt evidence with one already-loaded parent Delivery.

## Determination

**SOURCE-COMPLETE for deterministic raw NotificationDeliveryAttempt history relationship evidence only.**

A true result means only that supplied typed attempt rows form one coherent history for the supplied NotificationDelivery. It is not delivery success/failure/retry authority.

## Locked DD-288…DD-292 contracts

### DD-288 — Exact attempt → Delivery parent binding floor
Add `matchesNotificationDeliveryAttemptParentFloor(attempt, delivery)`.

Require:
- valid UUID-shaped attempt id and delivery id;
- valid UUID-shaped Delivery id;
- exact `attempt.deliveryId === delivery.id`;
- positive safe-integer `attemptNo`.

All provider/status/error/timestamp and Delivery lifecycle/channel/template/integration fields remain uninterpreted.

### DD-289 — Supplied attempt-history evidence-set floor
Add `matchesNotificationDeliveryAttemptHistoryEvidenceFloor(delivery, attempts)`.

Require:
- valid Delivery id;
- dense finite attempt array;
- every attempt passes DD-288 against that Delivery;
- unique attempt ids;
- unique `attemptNo` values for the Delivery.

Empty evidence is valid. No contiguity requirement is invented: the source owns uniqueness and positivity, not gap-free historical retention.

### DD-290 — Immutable canonical raw attempt history projection
Add `projectNotificationDeliveryAttemptHistory(delivery, attempts)`.

Malformed evidence returns `null`. Valid evidence returns immutable cloned attempt evidence canonically ordered by `attemptNo`, then id. Raw provider/status/error/timestamps are preserved exactly. Ordering is evidence serialization only, not retry/finality precedence.

### DD-291 — Raw latest-attempt evidence projection
Add `projectLatestNotificationDeliveryAttemptEvidence(delivery, attempts)`.

Build DD-290 first. Valid empty history returns `undefined`. Non-empty valid history returns the exact immutable final item of the canonical attempt-number ordering. “Latest” means highest supplied persisted attempt number only; normalized status is not interpreted.

### DD-292 — Combined Delivery attempt-history evidence envelope
Add `buildNotificationDeliveryAttemptHistoryEvidence(delivery, attempts)`.

Return immutable:
- exact supplied Delivery reference;
- DD-290 canonical immutable history;
- optional DD-291 latest raw attempt evidence.

Malformed supplied history returns `null`. Inputs remain unchanged. The envelope adds no provider/runtime decision fields.

## Fixed acceptance before implementation

- **NOTIF-ATT-PARENT-001** exact parent id and positive attempt number pass.
- **NOTIF-ATT-PARENT-002** wrong/malformed parent or non-positive/non-integer attempt number fails.
- **NOTIF-ATT-SET-001** valid same-Delivery unique attempt ids/numbers pass.
- **NOTIF-ATT-SET-002** duplicate attempt id or duplicate attempt number fails closed.
- **NOTIF-ATT-SET-003** cross-Delivery, sparse or malformed evidence fails closed.
- **NOTIF-ATT-SET-004** valid empty history passes.
- **NOTIF-ATT-HIST-001** unsorted valid evidence projects immutable canonical attemptNo/id order.
- **NOTIF-ATT-HIST-002** raw provider/status/error/timestamp evidence is preserved without interpretation.
- **NOTIF-ATT-LATEST-001** non-empty history returns highest attempt-number raw evidence.
- **NOTIF-ATT-LATEST-002** valid empty history returns undefined; malformed history is distinguishable through the combined builder returning null.
- **NOTIF-ATT-ENV-001** combined envelope preserves exact Delivery identity plus immutable history/latest evidence.
- **NOTIF-ATT-BOUND-001** inputs remain unchanged and output exposes no retry, finality, backoff, provider-selection, credential, dispatch or scheduling authority.

Expected executable delta: Core **977 → 989**. PostgreSQL remains **525**. Database inventory remains **48 migrations / 42 verification files**. Web remains unchanged.

## Explicit exclusions

No schema, migration, RLS, role, grant, public route, provider adapter, secret access, frontend or product-policy change.

This batch does **not** implement:
- normalized-status vocabulary/terminality interpretation;
- retryability or failure-class mapping;
- next-attempt number allocation;
- retry/backoff/exhaustion policy;
- provider selection or ProviderAdapter execution;
- credential/secret resolution;
- worker claim/lease/scheduling;
- Delivery lifecycle mutation;
- DeliveryAttempt insertion;
- provider callback reconciliation;
- audit/metric append;
- Notification recipient-principal replay;
- final Notification send authorization.

After DD-288…DD-292 implementation and targeted regression, run the governed Core/PostgreSQL/Database/Web batch-boundary verification before canonical promotion.
