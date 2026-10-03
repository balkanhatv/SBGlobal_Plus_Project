# NotificationDelivery known-relationship reader composition batch ownership audit

**Date:** 2026-09-30  
**Baseline checkpoint:** `DEV-NOTIFICATION-DELIVERY-ATTEMPT-HISTORY-READER-001`  
**Verified entry HEAD:** `7ac542b21695b76b7b07759e0fd226035e5977cf`  
**Verified entry tree:** `2f415990265886b822266d7fbdd41be8f23ffe5a`  
**Governed batch:** DD-298 through DD-302

## Entry gate

The DD-293…DD-297 state closure is exact-head verified:
- Core Service Verify `36677221363` / `109764684885`: **998/998 PASS**, zero failed/skipped.
- PostgreSQL `36677221363` / `109764684721`: **525/525 PASS**, zero failed/skipped; database bootstrap PASS.
- Database Verify `36677221230` / `109764683790`: PASS.
- Web Boundary Verify `36677221286` / `109764684260`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource is unchanged; `main` remains unmerged.

## Source ownership reconciled

Fresh reconciliation of DD-095 TenantIntegration reader, DD-090 OutboxEvent reader, DD-100 NotificationTemplate reader, DD-168/DD-169/DD-171 relationship floors, DD-172 known-relationship composition and the current NotificationDelivery raw contract yields one independently source-complete reader-composition boundary for an **already-loaded RequestContext-visible NotificationDelivery**:

- when `tenantIntegrationId` is absent, DD-168 requires no Integration evidence; therefore no Integration read is needed;
- when `tenantIntegrationId` is present, `TenantIntegrationReadPort.loadForContext` can read exactly that id under the supplied RequestContext;
- when `sourceEventId` is absent, DD-169 requires no Event evidence; therefore no OutboxEvent read is needed;
- when `sourceEventId` is present, `OutboxEventReadPort.loadForContext` can read exactly that id under the supplied RequestContext;
- when `templateId` is absent, DD-171 requires templateVersion and Template evidence to be absent; therefore no Template read is needed;
- when `templateId` is present, `NotificationTemplateReadPort.loadForContext` can read exactly that id under the supplied RequestContext;
- DD-172 already owns the boolean conjunction of those three current persisted relationship floors;
- a bound relationship whose exact reader returns null cannot satisfy its owning relationship floor;
- dependency/persistence errors belong to the owning reader and must propagate unchanged;
- recipient-principal currentness remains separately source-incomplete and is not reconstructed here.

The parent NotificationDelivery is an input to this batch. Parent visibility/loading remains owned by DD-098 and, for attempt-history composition, DD-293…DD-297.

## Determination

**SOURCE-COMPLETE for conditional same-RequestContext loading of the three DD-172 known NotificationDelivery relationships and immutable evidence projection only.**

A successful result means only that the supplied already-visible Delivery's bound Integration/Event/Template references resolve under the same RequestContext and DD-172 still passes.

It is not complete NotificationDelivery validity and is not send/retry/provider authorization.

## Locked DD-298…DD-302 contracts

### DD-298 — Conditional exact TenantIntegration relationship read

For a supplied Delivery:
- if `tenantIntegrationId` is absent, do not call the Integration reader and use `undefined` evidence;
- if present, call `TenantIntegrationReadPort.loadForContext` with the exact supplied RequestContext and exact `delivery.tenantIntegrationId`;
- preserve returned evidence unchanged;
- reader errors propagate unchanged.

### DD-299 — Conditional exact source OutboxEvent relationship read

For a supplied Delivery:
- if `sourceEventId` is absent, do not call the Event reader and use `undefined` evidence;
- if present, call `OutboxEventReadPort.loadForContext` with the exact supplied RequestContext and exact `delivery.sourceEventId`;
- preserve returned evidence unchanged;
- reader errors propagate unchanged.

### DD-300 — Conditional exact NotificationTemplate relationship read

For a supplied Delivery:
- if `templateId` is absent, do not call the Template reader and use `undefined` evidence;
- if present, call `NotificationTemplateReadPort.loadForContext` with the exact supplied RequestContext and exact `delivery.templateId`;
- preserve returned evidence unchanged;
- reader errors propagate unchanged.

No latest-template selection, code/locale lookup or fallback is introduced.

### DD-301 — DD-172 relationship validation after reads

Apply `matchesKnownNotificationDeliveryRelationshipFloors(delivery, integration, event, template)` to the exact supplied Delivery plus exact reader results.

If DD-172 returns false, return `null`.

A reader returning null for a bound relationship is therefore fail-closed; no substitute relationship is searched.

### DD-302 — Immutable known-relationship evidence loader

Expose:

`loadNotificationDeliveryKnownRelationshipEvidence(input, integrationReader, eventReader, templateReader)`

where input contains:
- exact supplied `requestContext`;
- already-loaded `delivery`.

Return immutable:
- exact supplied `delivery` reference;
- optional exact loaded `integration` reference;
- optional exact loaded `event` reference;
- optional exact loaded `template` reference.

Inputs remain unchanged.

## Fixed acceptance before implementation

- **NOTIF-RELREAD-INT-001** bound Integration id forwards exact RequestContext/id and preserves returned reference.
- **NOTIF-RELREAD-INT-002** unbound Integration skips reader; bound null evidence fails closed.
- **NOTIF-RELREAD-EVT-001** bound source Event id forwards exact RequestContext/id and preserves returned reference.
- **NOTIF-RELREAD-EVT-002** unbound source Event skips reader; bound null evidence fails closed.
- **NOTIF-RELREAD-TPL-001** bound Template id forwards exact RequestContext/id and preserves returned reference.
- **NOTIF-RELREAD-TPL-002** unbound Template skips reader; bound null evidence fails closed.
- **NOTIF-RELREAD-REL-001** all supplied loaded relationships satisfying DD-172 return the expected immutable evidence envelope.
- **NOTIF-RELREAD-REL-002** any DD-172 mismatch returns null with no fallback/substitute selection.
- **NOTIF-RELREAD-ERR-001** dependency/persistence error from any invoked relationship reader propagates unchanged.
- **NOTIF-RELREAD-BOUND-001** inputs remain unchanged and output exposes no recipient-validity, lifecycle, rendering, provider-selection, credential, retry, dispatch, scheduling or send authority.

Expected executable delta: Core **998 → 1008**. PostgreSQL remains **525**. Database inventory remains **48 migrations / 42 verification files**. Web remains unchanged.

## Explicit exclusions

No schema, migration, RLS, role, grant, public route, provider adapter, secret access, frontend or product-policy change.

This batch does **not**:
- read/re-read the parent NotificationDelivery;
- validate recipient-principal currentness;
- claim complete NotificationDelivery validity;
- select latest/fallback templates;
- render or sanitize template content;
- compose deeper TenantIntegration credential/definition/capability runtime integrity;
- interpret source Event readiness/retry/dispatch state;
- interpret NotificationDelivery lifecycle/finality;
- interpret NotificationDeliveryAttempt normalized status;
- select/execute a provider;
- access credentials/secrets;
- retry/send/schedule/mutate a Notification;
- mutate any relationship source.

After DD-298…DD-302 implementation and targeted regression, run the governed Core/PostgreSQL/Database/Web batch-boundary verification before canonical promotion.
