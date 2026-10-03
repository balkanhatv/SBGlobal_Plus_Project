# NotificationDelivery attempt-history reader composition batch ownership audit

**Date:** 2026-09-30  
**Baseline checkpoint:** `DEV-NOTIFICATION-DELIVERY-ATTEMPT-HISTORY-EVIDENCE-001`  
**Verified entry HEAD:** `9f305e3ae06105dc7fd3a9ef7135b2ad8e482af4`  
**Verified entry tree:** `f3b6df9057c66d3d306ab96571e89f17e6ce1c41`  
**Governed batch:** DD-293 through DD-297

## Entry gate

The corrected DD-288…DD-292 state closure is exact-head verified:
- Core Service Verify `36674839574` / `109757451032`: PASS.
- PostgreSQL `36674839574` / `109757451270`: PASS; database bootstrap PASS.
- Database Verify `36674839488` / `109757450377`: PASS.
- Web Boundary Verify `36674839508` / `109757450684`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource is unchanged; `main` remains unmerged.

## Source ownership reconciled

Fresh reconciliation of the existing NotificationDelivery and NotificationDeliveryAttempt Core read ports, their concrete PostgreSQL stores, FORCE-RLS behavior, DD-288…DD-292 raw history evidence, migration 0026 and prior reader audits yields one independently source-complete composition boundary:

- `NotificationDeliveryReadPort.loadForContext(...)` owns one RequestContext-scoped visible Delivery read and returns `null` for absent/RLS-hidden parent evidence;
- `NotificationDeliveryAttemptReadPort.loadForDelivery(...)` owns one RequestContext-scoped raw attempt read for an exact Delivery id and returns immutable ordered attempt rows;
- the attempt reader alone cannot distinguish “no attempts for a visible Delivery” from “parent not visible”, therefore the parent Delivery must be established first for a combined evidence envelope;
- DD-292 already owns exact parent/attempt relationship validation, canonical immutable ordering, valid-empty history and optional latest raw evidence;
- dependency errors already have concrete meanings at their owning reader boundaries and must not be normalized into absence;
- no source-owned contract defines retryability, terminality, provider dispatch, backoff, worker scheduling or Delivery mutation.

## Determination

**SOURCE-COMPLETE for parent-first RequestContext-scoped Delivery + Attempt read composition into DD-292 raw history evidence only.**

A successful result means only that one visible supplied Delivery and its visible raw attempt rows were loaded under the exact same resolved RequestContext and composed into the existing DD-292 evidence envelope.

## Locked DD-293…DD-297 contracts

### DD-293 — Exact Delivery reader forwarding / parent-first floor
Add a Core composition service that forwards the exact supplied `requestContext` and `notificationDeliveryId` to `NotificationDeliveryReadPort.loadForContext(...)` before attempt evidence is requested.

No context normalization, id substitution, authorization inference or Delivery lifecycle interpretation is allowed.

### DD-294 — Parent absence and Delivery-reader error semantics
If the Delivery reader returns `null`, return `null` and do **not** call the attempt reader.

If the Delivery reader throws/rejects, propagate that exact error unchanged and do **not** call the attempt reader.

### DD-295 — Exact Attempt reader forwarding after visible parent
Only after a non-null Delivery is loaded, forward the exact same `requestContext` and exact same `notificationDeliveryId` to `NotificationDeliveryAttemptReadPort.loadForDelivery(...)`.

Attempt-reader dependency/persistence errors propagate unchanged.

### DD-296 — DD-292 evidence composition
Pass the exact loaded Delivery reference plus the exact loaded attempt evidence into `buildNotificationDeliveryAttemptHistoryEvidence(...)`.

Preserve its semantics:
- malformed relationship/evidence => `null`;
- valid empty attempt set => non-null envelope with immutable empty history and no `latest`;
- valid non-empty evidence => canonical immutable history + optional latest raw evidence.

No retry/finality/status semantics are added.

### DD-297 — Combined RequestContext-scoped attempt-history reader
Expose one Core boundary:
`loadNotificationDeliveryAttemptHistoryEvidence(input, deliveryReader, attemptReader)`.

The result is only DD-292 raw evidence loaded under the same RequestContext. Inputs remain unchanged and the result adds no retry, finality, backoff, provider, credential, dispatch, worker or scheduling fields.

## Fixed acceptance before implementation

- **NOTIF-ATTHIST-READ-001** Delivery reader receives exact RequestContext/id before attempt access.
- **NOTIF-ATTHIST-READ-002** null/hidden Delivery returns null and attempt reader is not called.
- **NOTIF-ATTHIST-READ-003** Delivery-reader error propagates unchanged and attempt reader is not called.
- **NOTIF-ATTHIST-ATT-001** visible parent causes attempt reader to receive exact same RequestContext/id.
- **NOTIF-ATTHIST-ATT-002** attempt-reader error propagates unchanged.
- **NOTIF-ATTHIST-EVID-001** valid attempt rows compose to expected canonical DD-292 history/latest evidence.
- **NOTIF-ATTHIST-EVID-002** valid empty attempt rows return non-null immutable empty-history envelope without latest.
- **NOTIF-ATTHIST-EVID-003** malformed/cross-parent attempt evidence returned by a supplied port fails closed as null.
- **NOTIF-ATTHIST-BOUND-001** inputs remain unchanged and output exposes no retry/finality/backoff/provider/credential/dispatch/worker/scheduling authority.

Expected executable delta: Core **989 → 998**. PostgreSQL remains **525**. Database inventory remains **48 migrations / 42 verification files**. Web remains unchanged.

## Explicit exclusions

No schema, migration, RLS, role, grant, public route, provider adapter, secret access, frontend or product-policy change.

This batch does **not** implement:
- normalized-status vocabulary/terminality interpretation;
- retryability/failure-class mapping;
- next-attempt allocation;
- retry/backoff/exhaustion policy;
- provider selection or ProviderAdapter execution;
- credential/secret resolution;
- worker claim/lease/scheduling;
- Delivery lifecycle mutation;
- DeliveryAttempt insertion;
- provider callback reconciliation;
- audit/metric append;
- final Notification send authorization.

After DD-293…DD-297 implementation and targeted regression, run the governed Core/PostgreSQL/Database/Web batch-boundary verification before canonical promotion.
