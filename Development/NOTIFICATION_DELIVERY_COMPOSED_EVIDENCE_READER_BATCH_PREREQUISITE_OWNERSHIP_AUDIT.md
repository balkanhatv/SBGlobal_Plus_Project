# NotificationDelivery composed known-relationship + attempt-history evidence reader prerequisite ownership audit

**Date:** 2026-09-30  
**Baseline checkpoint:** `DEV-NOTIFICATION-DELIVERY-VISIBLE-KNOWN-RELATIONSHIP-READER-001`  
**Verified entry HEAD:** `8d5fb09881baf9cd160e59807cb9db7f57e36fc2`  
**Verified entry tree:** `f0a87e619d7266cd5b364fe7af993c18c07268c5`  
**Governed batch:** DD-308 through DD-312

## Entry gate

The DD-303…DD-307 state closure is exact-head verified:
- Core Service Verify `36707373002` / `109860715098`: **1017/1017 PASS**, zero failed/skipped.
- PostgreSQL `36707373002` / `109860714866`: **525/525 PASS**, zero failed/skipped; database bootstrap PASS.
- Database Verify `36707373038` / `109860714778`: PASS.
- Web Boundary Verify `36707373219` / `109860715690`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource is unchanged; `main` remains unmerged.

## Source ownership reconciled

Fresh reconciliation of DD-288…DD-292 raw NotificationDeliveryAttempt history evidence, DD-293…DD-297 parent-first attempt-history reader composition, DD-298…DD-302 known-relationship reader composition and DD-303…DD-307 visible-parent known-relationship reader composition yields one independently source-complete no-new-semantics aggregate evidence boundary:

- DD-307 already establishes one RequestContext-visible NotificationDelivery and valid DD-172 Integration/Event/Template relationship evidence without adding send/runtime authority;
- its evidence envelope preserves the exact visible Delivery reference;
- `NotificationDeliveryAttemptReadPort.loadForDelivery` can load exact raw attempt rows for that same Delivery id under the same supplied RequestContext;
- DD-292 already owns exact attempt parent validation, unique attempt ids/numbers, immutable canonical ordering, valid-empty history and optional highest-attempt-number raw evidence;
- therefore DD-307 evidence and DD-292 attempt-history evidence can be conjoined without re-reading the parent and without inventing Delivery lifecycle or retry semantics;
- recipient-principal currentness remains explicitly source-incomplete and is still excluded.

## Determination

**SOURCE-COMPLETE for visible-parent known-relationship evidence + raw attempt-history evidence composition only.**

A successful result means only:
1. the Delivery was visible under the supplied RequestContext;
2. its known Integration/Event/Template relationships satisfied DD-172 through DD-302/DD-307;
3. its supplied raw attempt rows satisfied DD-292.

It is not complete NotificationDelivery validity and does not authorize send/retry/provider execution.

## Locked DD-308…DD-312 contracts

### DD-308 — Establish DD-307 relationship-valid visible parent before attempt access
Add a new bounded composition that first invokes the DD-307 visible-parent known-relationship loader with the exact supplied RequestContext/id and supplied Delivery/Integration/Event/Template readers.

If DD-307 returns `null`, return `null` and do not call the attempt reader.

Any DD-307 dependency/persistence error propagates unchanged and attempt evidence is not requested.

### DD-309 — Exact attempt-reader forwarding after DD-307 success
Only after DD-307 returns non-null evidence, call `NotificationDeliveryAttemptReadPort.loadForDelivery` with:
- the exact same RequestContext object;
- the exact same NotificationDelivery id.

Attempt-reader errors propagate unchanged.

### DD-310 — Compose exact DD-307 Delivery reference with DD-292
Pass:
- the exact `relationships.delivery` reference from DD-307;
- the exact attempt evidence returned by the attempt reader

to `buildNotificationDeliveryAttemptHistoryEvidence`.

Preserve DD-292 semantics:
- malformed/cross-parent/duplicate attempt evidence => `null`;
- valid empty attempts => non-null immutable empty history with no `latest`;
- valid non-empty attempts => canonical immutable history plus optional latest raw evidence.

No normalized-status/retry/finality interpretation is added.

### DD-311 — Immutable combined Delivery evidence envelope
On success return immutable:
- exact DD-307 `relationships` envelope reference;
- exact DD-292 `attemptHistory` envelope reference.

Do not flatten or rewrite child evidence and do not synthesize a combined validity flag.

### DD-312 — Bounded evidence-only read boundary
Export one composition for RequestContext-scoped NotificationDelivery evidence.

No recipient-currentness, Delivery lifecycle/finality, retryability, rendering, provider/credential, dispatch, scheduling, send or mutation authority may be projected.

## Fixed acceptance before implementation

- **NOTIF-COMPEVID-REL-001** DD-307 path executes before attempt access and receives exact RequestContext/id.
- **NOTIF-COMPEVID-REL-002** hidden/absent/mismatched relationship evidence returns null and attempt reader is not called.
- **NOTIF-COMPEVID-REL-003** DD-307 dependency error propagates unchanged and attempt reader is not called.
- **NOTIF-COMPEVID-ATT-001** after DD-307 success, attempt reader receives exact same RequestContext/id.
- **NOTIF-COMPEVID-ATT-002** attempt-reader dependency error propagates unchanged.
- **NOTIF-COMPEVID-HIST-001** valid attempt evidence composes to expected canonical DD-292 history/latest evidence under the exact DD-307 Delivery.
- **NOTIF-COMPEVID-HIST-002** valid empty attempts produce immutable empty attempt-history success.
- **NOTIF-COMPEVID-HIST-003** malformed/cross-parent/duplicate attempt evidence remains null.
- **NOTIF-COMPEVID-BOUND-001** combined envelope is immutable, preserves exact child evidence identities, leaves inputs unchanged and exposes no runtime/send/mutation authority.

Expected executable delta: Core **1017 → 1026**. PostgreSQL remains **525**. Database inventory remains **48 migrations / 42 verification files**.

## Explicit exclusions

No schema, migration, RLS, role, grant, public route, provider SDK, frontend or product-policy change.

This batch does **not**:
- re-evaluate recipient principal currentness;
- claim complete NotificationDelivery validity;
- interpret Delivery or attempt status/finality/retryability;
- allocate next attempt numbers;
- define retry/backoff/exhaustion;
- select latest/fallback NotificationTemplate or locale;
- render/sanitize content;
- deepen TenantIntegration definition/capability/credential/provider runtime integrity;
- interpret source-event readiness/lock/retry/dispatch state;
- select provider/adapter or access secrets;
- schedule, claim, send, retry, callback-reconcile or mutate Notification state.

After DD-308…DD-312 implementation and targeted regression, perform the governed batch-boundary Core/PostgreSQL/Database/Web verification. Canonical synchronization occurs only after the full five-step subsystem milestone.
