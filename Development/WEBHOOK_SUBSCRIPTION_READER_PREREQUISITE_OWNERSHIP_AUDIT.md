# Webhook Subscription PostgreSQL reader prerequisite ownership audit

**Date:** 2026-09-21  
**Baseline:** `3d89a1f30ea5517f5732b9f234aa4ec8cfcbc60e`  
**Scope:** next independent source-complete Integration slice after DD-087.

## Source reconciliation

DD-07 §§7–12, DD-17 webhook acceptance, migration 0008
`webhook_subscription` schema/FORCE-RLS, migration 0030 subscription integrity and
migration 0028 Integration-service privileges were reconciled with current
`RequestScopedSql` and dedicated fixed-role PostgreSQL adapter patterns.

The persistence contract is exact:

- WebhookSubscription is Tenant Core data: `tenant_id` owns the row;
- status is `PENDING_VERIFICATION | ACTIVE | PAUSED | REVOKED`;
- `secret_version > 0`;
- `event_filter_json` is an object;
- `allowed_industry_context_ids` is duplicate-free, null-free and every id belongs
  to the subscription Tenant;
- ACTIVE requires non-null `verified_at`;
- `created_by` is an active same-Tenant creator at creation time;
- FORCE-RLS exposes only rows whose `tenant_id = current_tenant_id()`;
- migration 0028 already defines the NOBYPASSRLS
  `sbg_integration_service_rw` privilege owner.

## Determination

A concrete **raw Webhook Subscription reader** is source-complete.

It may read the persisted subscription facts under Tenant RLS and expose them only to
server-side Integration code. It must not interpret endpoint safety, verification
challenge success, webhook delivery eligibility, event-filter semantics, secret
material or retry/signing policy.

A dedicated Integration PostgreSQL wrapper is also source-complete because migration
0028 already fixes the runtime role. Reusing the generic application-role database
adapter would violate the existing privilege owner just as it did for the Document
service boundary.

## Authorized implementation boundary

Implement:

1. Core typed `WebhookSubscription` / `WebhookSubscriptionReadPort`;
2. `PostgresIntegrationDatabase` using only existing
   `sbg_integration_service_rw`, `row_security=on`, safe-role verification and
   pooled-scope sanitation;
3. `PostgresWebhookSubscriptionStore` through `RequestScopedSql`;
4. one parameterized read by subscription id;
5. exact UUID/status/version/object/array/timestamp validation and immutable result;
6. null for RLS-hidden / absent subscriptions;
7. real PostgreSQL acceptance proving same-Tenant visibility from Tenant Core and
   Tenant Industry contexts, foreign-Tenant isolation, allowed-context fidelity and
   raw pending/active state preservation.

The reader may return `endpointUrl` and `secretVersion` because both are persisted
subscription metadata used by server-side Integration orchestration. It must not
return/decrypt webhook secret plaintext because no such plaintext is stored here.

No endpoint challenge, DNS/IP resolution, redirect policy, SSRF decision, signing
algorithm, secret rotation overlap, event-filter evaluator, delivery/retry worker,
public route, migration, role, grant or RLS policy is authorized.

Acceptance: WH-SUB-PG-001…005.
