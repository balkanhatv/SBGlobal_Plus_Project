# NotificationDelivery visible-parent known-relationship reader composition prerequisite ownership audit

**Date:** 2026-09-30  
**Baseline checkpoint:** `DEV-NOTIFICATION-DELIVERY-KNOWN-RELATIONSHIP-READER-001`  
**Verified entry HEAD:** `b8fb622089008d16833b66385ab43e2476477c6d`  
**Verified entry tree:** `82a7151ac6f85c2e82cbaed095c99faae1b03a46`  
**Governed batch:** DD-303 through DD-307

## Entry gate

The DD-298…DD-302 state closure is exact-head verified:
- Core Service Verify `36679166206` / `109770628353`: **1008/1008 PASS**, zero failed/skipped.
- PostgreSQL `36679166206` / `109770628609`: **525/525 PASS**, zero failed/skipped; database bootstrap PASS.
- Database Verify `36679166283` / `109770628153`: PASS.
- Web Boundary Verify `36679166198` / `109770627770`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource is unchanged; `main` remains unmerged.

## Source ownership reconciled

Fresh reconciliation of F-01/A-01 Notification ownership, DD-098 raw NotificationDelivery reader, DD-168/DD-169/DD-171 known relationship floors, DD-172 known-relationship composition, DD-293…DD-297 parent-first attempt-history reader composition, DD-298…DD-302 known-relationship reader composition, migration 0026 FORCE-RLS delivery persistence and migration 0031 relationship integrity yields one independent no-new-semantics composition boundary:

- DD-098 `NotificationDeliveryReadPort.loadForContext` is the existing RequestContext-scoped parent visibility boundary. Hidden/absent Delivery returns `null`; reader dependency/persistence errors propagate from the reader.
- DD-302 intentionally assumes the supplied NotificationDelivery is already RequestContext-visible. It conditionally reads only the exact bound TenantIntegration, source OutboxEvent and NotificationTemplate, re-applies DD-172 and returns immutable exact-reference evidence.
- DD-293…DD-297 already establish the safe parent-first pattern for NotificationDelivery child evidence: load the parent first using the exact supplied RequestContext/id, stop on `null`, then delegate downstream without inventing lifecycle semantics.
- The recipient-principal later-time/current-binding rule remains explicitly **source-incomplete** under `Development/NOTIFICATION_DELIVERY_RECIPIENT_PRINCIPAL_REMAINING_BOUNDARY_AUDIT.md` and must stay outside this batch.

## Determination

**SOURCE-COMPLETE for parent-visible NotificationDelivery → DD-302 known-relationship reader composition only.**

This batch may:
1. load the exact NotificationDelivery id using the exact supplied RequestContext through DD-098;
2. stop with `null` if the parent is absent/RLS-hidden;
3. after a visible parent only, delegate that exact Delivery reference and exact RequestContext to DD-302;
4. preserve DD-302's exact relationship-reader forwarding, dependency-error, malformed/null and immutable-evidence semantics;
5. expose one bounded RequestContext-scoped visible-parent known-relationship loader.

It must not add recipient-principal currentness, complete Delivery validity, provider/send/retry authority, template selection/rendering or any mutation.

## Locked DD-303…DD-307 contracts

### DD-303 — Parent-first exact NotificationDelivery reader forwarding
Add `loadVisibleNotificationDeliveryKnownRelationshipEvidence(...)`.

Call `NotificationDeliveryReadPort.loadForContext` first with:
- the exact supplied RequestContext object;
- the exact supplied NotificationDelivery id.

Do not normalize, substitute or derive either value.

### DD-304 — Preserve parent absence and reader error semantics
When the Delivery reader returns `null`:
- return `null`;
- do not access Integration/Event/Template readers.

When the Delivery reader rejects/throws:
- propagate the exact same error unchanged;
- do not access relationship readers.

### DD-305 — Delegate exact visible parent to DD-302
After a non-null parent:
- call `loadNotificationDeliveryKnownRelationshipEvidence`;
- pass the exact same RequestContext object;
- pass the exact Delivery object returned by DD-098;
- pass the supplied Integration/Event/Template reader ports unchanged.

No parent re-read or alternative/fallback relationship lookup is allowed.

### DD-306 — Preserve DD-302 result and dependency semantics
- a valid DD-302 evidence envelope is returned as the exact same envelope reference;
- DD-302 `null` remains `null`;
- invoked Integration/Event/Template reader errors propagate unchanged;
- unbound relationships continue to skip their reader through DD-302;
- bound missing/mismatched relationship evidence continues to fail closed through DD-302/DD-172.

### DD-307 — One bounded visible-parent known-relationship read boundary
Export one composition that remains evidence-only.

Output may contain only DD-302 evidence:
- Delivery;
- optional TenantIntegration;
- optional source OutboxEvent;
- optional NotificationTemplate.

No recipient validity, Delivery lifecycle/finality, rendering, provider/credential, retry, dispatch, scheduling, send authorization or mutation authority is projected.

## Fixed acceptance before implementation

- **NOTIF-VRELREAD-PARENT-001** exact RequestContext/id reach the Delivery reader first.
- **NOTIF-VRELREAD-PARENT-002** hidden/absent Delivery returns null and no relationship reader is called.
- **NOTIF-VRELREAD-PARENT-003** Delivery-reader dependency error propagates unchanged and no relationship reader is called.
- **NOTIF-VRELREAD-DELEG-001** visible parent delegates the exact same RequestContext and exact returned Delivery reference into DD-302.
- **NOTIF-VRELREAD-DELEG-002** supplied Integration/Event/Template ports are used only through DD-302; no parent re-read/fallback is introduced.
- **NOTIF-VRELREAD-EVID-001** valid known relationships return the exact DD-302 immutable evidence envelope/reference graph.
- **NOTIF-VRELREAD-EVID-002** DD-302 relationship mismatch/missing bound evidence remains null.
- **NOTIF-VRELREAD-ERR-001** invoked DD-302 relationship-reader dependency error propagates unchanged.
- **NOTIF-VRELREAD-BOUND-001** inputs remain unchanged and output exposes no recipient-currentness/send/runtime/mutation authority.

Expected executable delta: Core **1008 → 1017**. PostgreSQL remains **525**. Database inventory remains **48 migrations / 42 verification files**.

## Explicit exclusions

No schema, migration, RLS, role, grant, public route, provider SDK, frontend or product-policy change.

This batch does **not**:
- re-evaluate recipient principal currentness or invent a later-time recipient rule;
- decide complete NotificationDelivery validity;
- interpret Delivery status/finality/retryability;
- normalize NotificationDeliveryAttempt status;
- select latest/fallback NotificationTemplate or locale;
- render, substitute, sanitize or approve notification content;
- deepen TenantIntegration definition/capability/credential/provider runtime integrity;
- interpret source-event readiness, retry, lock or dispatch state;
- select provider/adapter;
- dereference secrets/credentials;
- send, retry, schedule, lease, dispatch or mutate notification state.

After DD-303…DD-307 implementation and targeted regression, perform the governed batch-boundary Core/PostgreSQL/Database/Web verification. Canonical synchronization occurs only after the full five-step subsystem milestone.
