# NotificationDelivery NotificationTemplate current-binding floors prerequisite ownership audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-DEFINITION-SCOPE-FAIL-CLOSED-001`  
**Verified synchronized basis:** `f5a193100f07b69ee4d047a5f1604c25de44bfdc`  
**Scope:** next independent source-complete Notification relationship after DD-170.

## Source reconciliation

DD-098 raw NotificationDelivery reader, DD-100 raw NotificationTemplate reader, migration 0026 Notification persistence, migration 0031 `validate_notification_relationships()`, and DD-170 migration 0048 fail-closed definition applicability were reconciled.

Migration 0031 owns one exact deterministic relationship predicate when a NotificationDelivery carries `template_id`:

- the referenced NotificationTemplate must exist;
- `template_version` must be present and exactly equal the referenced template version;
- template raw status must be exactly `ACTIVE`;
- template channel must exactly equal NotificationDelivery channel;
- template definition ownership must apply to the delivery scope under the canonical hierarchy:
  - PLATFORM template: applies to Tenant-Core or Tenant-Industry;
  - TENANT template: same Tenant, owner Industry absent, applies to Tenant-Core or Tenant-Industry of that Tenant;
  - INDUSTRY template: same Tenant and exact Industry Context only.

When `template_id` is absent, migration 0031 requires `template_version` to be absent.

DD-170 is a prerequisite because it makes `definition_applies_to_scope()` a total fail-closed boolean. The hierarchy itself is unchanged.

DD-100 exposes exactly the immutable template evidence required to re-evaluate this relationship. Its reader explicitly does not choose active versions, perform locale/scope fallback, render variables, evaluate approval-to-send semantics, sanitize content or select providers.

## Determination

One pure **NotificationDelivery→NotificationTemplate current-binding necessary floor** is source-complete:

> Given one already-loaded NotificationDelivery and optional already-loaded NotificationTemplate evidence, determine only whether migration-0031's optional template id/version/status/channel/scope relationship still matches.

A true result is **not rendering or notification delivery authorization**.

## Authorized DD-171 boundary

Implement:

`matchesNotificationDeliveryTemplateBindingFloors(delivery, template)`.

It must:

1. require valid NotificationDelivery id/Tenant identity and valid TENANT_CORE/TENANT_INDUSTRY ownership shape;
2. when `delivery.templateId` is absent:
   - require `delivery.templateVersion === undefined`;
   - require `template === undefined`;
   - return true after delivery ownership-shape validation;
3. when `delivery.templateId` is present:
   - require valid template id and exact `template.id === delivery.templateId`;
   - require `delivery.templateVersion` to be a positive safe integer;
   - require exact `template.version === delivery.templateVersion`;
   - require raw `template.status === 'ACTIVE'`;
   - require exact `template.channel === delivery.channel`;
   - require a valid template owner shape and canonical applicability:
     - PLATFORM => no Tenant/Industry owner;
     - TENANT => valid same Tenant, no owner Industry;
     - INDUSTRY => valid same Tenant and exact valid delivery Industry Context;
4. fail closed if extra template evidence is supplied when the delivery is unbound;
5. leave all inputs unchanged.

The helper mirrors migration 0031 and the corrected DD-170 hierarchy only. It must not select another template/version if the supplied relationship does not match.

## Acceptance target

- **NOTIF-TPL-CUR-001** — no template id/version and no template evidence -> true.
- **NOTIF-TPL-CUR-002** — exact ACTIVE PLATFORM template with matching version/channel applies to Tenant-Core and Tenant-Industry -> true.
- **NOTIF-TPL-CUR-003** — exact ACTIVE same-Tenant TENANT template applies to Tenant-Core and Tenant-Industry; foreign Tenant -> false.
- **NOTIF-TPL-CUR-004** — exact ACTIVE INDUSTRY template applies only to exact same-Tenant Industry; sibling Industry and Tenant-Core -> false.
- **NOTIF-TPL-CUR-005** — missing/mismatched version, wrong id, non-ACTIVE status or channel mismatch -> false.
- **NOTIF-TPL-CUR-006** — malformed delivery/template ownership or unexpected template evidence for unbound delivery -> false.
- **NOTIF-TPL-CUR-007** — code/locale/subject/body/safe-preview/variable-schema/creator/approver/timestamps plus delivery recipient/status/integration/source-event/timestamps remain uninterpreted; inputs unchanged.

Expected Core delta: +7 tests, from 437 to 444. PostgreSQL acceptance remains 497; database inventory remains 48 migrations / 42 verification files.

## Explicitly unclaimed

DD-171 does **not**:

- choose the latest/active template by code;
- define PLATFORM/TENANT/INDUSTRY fallback precedence;
- define locale fallback;
- render/substitute/escape template variables;
- evaluate creator/approver as send authorization;
- sanitize channel content;
- select TenantIntegration/provider/adapter;
- access credentials/secrets;
- send/retry/finalize a notification;
- validate recipient/source-event/integration relationships beyond their existing independent floors;
- mutate template/delivery state;
- change SQL/RLS/roles/grants/routes;
- widen machine-auth, Webhook, SyncCursor or Integration execution boundaries.

## Next dependency boundary

After DD-171, migration-0031 template relationship currentness is re-evaluable. Recipient principal currentness remains another independent migration-owned relationship predicate and may be audited separately if its current evidence source is complete.
