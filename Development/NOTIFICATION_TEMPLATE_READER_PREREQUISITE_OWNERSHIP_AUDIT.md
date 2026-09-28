# NotificationTemplate PostgreSQL reader prerequisite ownership audit

**Date:** 2026-09-22  
**Baseline:** `6129833447e1f5b5dd32e6b75e1faf8456193dcb`  
**Scope:** next independent source-complete Notification persistence slice after DD-099.

## Source reconciliation

Migration 0026 `notification_template` schema/FORCE-RLS owner-scope policy,
migration 0027 Notification-worker SELECT privilege, migration 0031
creator/approver integrity, DD-06 provider/runtime separation and current
Notification persistence boundaries were reconciled.

The raw persistence contract is exact:

- owner scope is `PLATFORM | TENANT | INDUSTRY`;
- owner shape is enforced by tenant/industry nullability;
- identity is code + channel + locale + positive version within owner scope;
- status is the persisted definition lifecycle
  `DRAFT | REVIEW | PUBLISHED | ACTIVE | RETIRED`;
- subject template is optional, body template required, safe preview optional;
- variable schema is persisted JSON evidence;
- creator is required, approver optional, with scope-integrity triggers;
- RLS uses `row_visible_to_current_context`: PLATFORM rows are visible only in
  PLATFORM_GLOBAL context; Tenant rows to that Tenant; Industry rows only to the
  exact active request Industry Context.

## Determination

A concrete **exact-by-id raw NotificationTemplate reader** is source-complete.

Template selection/rendering is not source-complete in this slice. The repository
does not define a runtime fallback order across PLATFORM/TENANT/INDUSTRY templates,
locale fallback, variable substitution/render engine, escaping policy per channel,
approval-to-send semantics, or provider routing from template content. Those rules
must not be invented.

## Authorized implementation boundary

Implement:

1. a Core typed `PersistedNotificationTemplate` /
   `NotificationTemplateReadPort` contract;
2. `PostgresNotificationTemplateStore` using the existing DD-098
   `PostgresNotificationDatabase` + `RequestScopedSql`;
3. one exact read by template UUID;
4. owner-scope/UUID/channel/status/version/text/JSON/timestamp validation and
   immutable result;
5. null for RLS-hidden or absent templates;
6. real PostgreSQL acceptance proving exact Industry isolation, Tenant same-Tenant
   visibility, PLATFORM_GLOBAL-only visibility and raw lifecycle/content fidelity.

The reader does not choose the active version, fall back by locale/scope, render
variables, evaluate approval/send eligibility, sanitize per provider, select an
integration/provider, retrieve credentials or send a notification.

No migration, role, grant, RLS policy, rendering engine, provider runtime, secret
access, route or product-policy change is authorized.

Acceptance: NOTIF-TPL-PG-001…006.
