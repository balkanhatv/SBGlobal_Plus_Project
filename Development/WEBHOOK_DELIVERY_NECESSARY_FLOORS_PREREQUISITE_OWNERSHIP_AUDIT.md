# Webhook delivery necessary-floors prerequisite ownership audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-API-CREDENTIAL-CORE-NECESSARY-FLOORS-001`  
**Verified synchronized basis:** `30999346b1dab4c6ecebc02158df1dcf5a333ca0` / tree `99038ea448b97fb35ac06842052562747cb1fb9c`  
**Scope:** first independent source-complete runtime prerequisite after the post-DD-162 machine-verifier boundary audit.

## Source reconciliation

DD-07 §§7, 10, 16–19, DD-081, DD-088, DD-090 and DD-091 were reconciled with migrations 0008/0030 and the current typed readers.

The repository already owns these exact facts:

- WebhookSubscription is Tenant-owned; ACTIVE requires verification evidence.
- OutboxEvent physical scope is PLATFORM_GLOBAL, TENANT_CORE, TENANT_INDUSTRY or EXPLICIT_CROSS_CONTEXT.
- EventCatalog exact identity is event type + version + scope, and it persists `webhookEligible`.
- DD-07 §10 permits delivery only when the event is webhook-eligible, belongs to the subscription Tenant, and any Industry endpoint required by the event is included by the subscription.
- DD-088/090/091 expose the required raw evidence without endpoint execution, filter evaluation, secret access or dispatcher authority.

## Determination

One pure **necessary delivery floor** is source-complete for the ordinary single-context path:

> Given one persisted WebhookSubscription, one persisted OutboxEvent and one exact EventCatalog entry, determine only whether the already-owned ACTIVE/verified, same-Tenant, exact catalog identity/webhook-eligibility and TENANT_INDUSTRY allowlist prerequisites match.

A true result is not webhook delivery authorization.

EXPLICIT_CROSS_CONTEXT is deliberately not accepted by this helper because raw OutboxEvent evidence does not expose authoritative source/target Industry endpoints; those live inside the envelope and require DD-081 validation plus a separately governed cross-context composition. PLATFORM_GLOBAL cannot belong to a Tenant-owned subscription.

## Authorized DD-163 boundary

Implement pure Core helper:

`matchesWebhookDeliveryNecessaryFloors(subscription, event, catalog)`.

It must:

1. require subscription status ACTIVE plus valid verification evidence;
2. require an event Tenant equal to subscription Tenant;
3. require exact event type/version/scope agreement with the supplied catalog;
4. require `catalog.webhookEligible === true`;
5. allow TENANT_CORE without inventing an Industry selector;
6. allow TENANT_INDUSTRY only when the exact event Industry Context is in the subscription allowlist;
7. deny PLATFORM_GLOBAL and EXPLICIT_CROSS_CONTEXT in this bounded helper;
8. remain deterministic, side-effect free and non-mutating.

## Acceptance target

- **WH-FLOOR-001** — ACTIVE verified same-Tenant TENANT_CORE + exact webhook-eligible catalog -> true.
- **WH-FLOOR-002** — non-ACTIVE, missing or malformed verification evidence -> false.
- **WH-FLOOR-003** — foreign Tenant or PLATFORM_GLOBAL event -> false.
- **WH-FLOOR-004** — TENANT_INDUSTRY requires the exact Industry Context in the subscription allowlist.
- **WH-FLOOR-005** — catalog event type/version/scope mismatch or webhookEligible=false -> false.
- **WH-FLOOR-006** — EXPLICIT_CROSS_CONTEXT remains false pending separately governed validated endpoint evidence.
- **WH-FLOOR-007** — endpoint URL, eventFilterJson, permission profile, secret version, outbox readiness/status, catalog lifecycle status and retry evidence remain uninterpreted; inputs are not mutated.

Expected Core test delta: +7, from 388 to 395. PostgreSQL inventory remains unchanged.

## Explicitly unclaimed

DD-163 does **not**:

- interpret `eventFilterJson`;
- validate or connect to endpoint URLs;
- perform DNS/IP/redirect SSRF enforcement;
- access/generate/decrypt/rotate signing secrets;
- create HMAC signatures;
- decide Outbox readiness, claim/lease, ordering, retries, DLQ or replay;
- authorize EXPLICIT_CROSS_CONTEXT delivery;
- interpret EventCatalog ACTIVE/RETIRED lifecycle beyond exact identity + webhook eligibility;
- interpret `permissionProfileId`;
- create WebhookDelivery rows or make network calls;
- change migrations, RLS, roles, grants, routes or product policy.

## Next dependency boundary

After DD-163, the ordinary single-context webhook delivery prerequisites can be composed without widening into delivery execution. Event-filter grammar/evaluation, endpoint security, secret/signature handling, cross-context validated endpoint composition and dispatcher/retry state remain separate source-owned prerequisites.
