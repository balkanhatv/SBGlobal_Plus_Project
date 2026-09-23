# Post-DD-145 Core persistence remainder audit

**Date:** 2026-09-23  
**Baseline checkpoint:** `DEV-API-CREDENTIAL-METADATA-READ-001`  
**Verified synchronized basis:** `25e7311935ea1ace23fab853f4a47fc5f8c6d2c3` / tree `6c13098cf3079b7111f830197330a86d54e0458a`  
**Scope:** determine whether a source-complete DD-146 raw Core persistence reader remains after DD-145.

## Result

No new independent source-complete **raw application persistence reader** is authorized from the remaining physical Core tables.

The post-DD-145 remainder separates into three classes:

1. tables already consumed by existing governed adapters/runtime stores;
2. database-governance or partition/identity support tables that are not independent application-domain read models;
3. `core_authz.operator_elevation`, which is domain-significant but requires a separate interactive elevation-resolution/authorization path before its RLS-protected row can be safely consumed.

Therefore DD-146 must **not** be opened merely to keep the exact-id raw-reader sequence moving.

## Reconciled covered families

### Bootstrap / Tenancy / Config

- `platform_directory.data_home`, `core_tenancy.tenant`, `industry_context` and `org_unit` are already consumed by the governed context-bootstrap/Tenancy adapters.
- `core_tenancy.org_unit_industry` is covered by DD-142.
- `core_config.metadata_definition` through `data_export_request` are covered by DD-133…DD-140.

### Identity / Authorization

- Platform principal/provider/session/device state is consumed by the existing Identity-service store.
- Tenant membership is consumed by context/Tenancy resolution.
- Permission/role source tables are consumed by the Authorization compiler source.
- Compiled Tenant/Platform permission subjects/snapshots and ABAC policy are consumed by the Authorization read/compiler boundaries.
- `core_identity.api_credential` non-secret metadata is covered by DD-145; machine verification remains explicitly unclaimed.
- `core_authz.operator_elevation` remains unresolved for the reasons below.

### Commercial

The migration-0004/0045 Commercial family is already consumed by current-state, adjustment-source, publication, plan-change evidence/apply-evidence, SubscriptionTransition and UsageMeter boundaries. DD-141 and DD-143 close the remaining independent raw evidence readers.

### Document / Storage

- `document_meta` is consumed by the Document access metadata reader.
- `storage_object` is consumed by the governed Document storage-binding path.
- `document_upload_session` and `document_acl` have dedicated PostgreSQL readers.

No independent raw Document table remains.

### Audit / Integration / Events / Webhooks

- `event_catalog`, `outbox_event`, `webhook_subscription`, `webhook_delivery` and `audit_event` have governed readers.
- `audit_event_identity`, `outbox_event_identity` and `webhook_delivery_identity` are uniqueness/partition identity support for their parent evidence, not standalone product read models. Creating public/internal domain readers for them would duplicate parent identity facts without a source-owned use case.

### Workflow / Notification / Automation

Migration-0026 WorkflowDefinition/Instance/Task/Transition, AutomationDefinition/Run and Notification Template/Delivery/Attempt are already covered by DD-099…DD-106.

### AI

The physical `core_ai` table inventory is already exhausted by DD-107…DD-132. Existing unclaimed AI routing/RAG/agent execution semantics are runtime prerequisites, not missing raw table readers.

### Runtime infrastructure

- `core_integration.rate_limit_bucket` and `rate_limit_concurrency_lease` are already consumed by the distributed rate-limit runtime.
- Idempotency runtime persistence is already consumed.
- Compiled Authorization publication and Commercial plan-change evidence tables are already consumed.

## Governance/support tables are not DD-146 raw-reader candidates

### `core_authz.rls_table_registry`

This is database-governance metadata used to assert RLS coverage/ownership. Migration 0029 revokes ordinary app/worker/monitor access and grants Control Plane SELECT. It is not an application/business persistence entity and does not justify a generic Core read port.

### `platform_directory.migration_ledger`

This is migration/governance evidence owned by database bootstrap/verification. It is not an application read model and must not be surfaced merely to extend the DD sequence.

### Partition identity tables

`core_audit.audit_event_identity`, `core_integration.outbox_event_identity` and `core_integration.webhook_delivery_identity` support globally unique identities across partitioned evidence. Their domain data belongs to the parent event/delivery records. No standalone reader is source-owned.

## OperatorElevation — why it is not a raw-reader continuation

Migration 0029 persists `core_authz.operator_elevation` and DD-05/DD-16 define the time-bounded elevation concept. Its final current-read RLS requires all of:

- exact `app.operator_elevation_id`;
- exact current platform-operator principal;
- exact Tenant;
- optional exact Industry Context;
- `status='ACTIVE'`;
- `starts_at <= now() < expires_at`.

But the current ordinary `RequestScopedSql` deliberately sets `app.operator_elevation_id` to an empty value. The current tenant-resolution path also resolves human/service Tenant access through membership or machine binding and does not provide a pre-context platform-operator elevation bootstrap. `PostgresIdentityDatabase` is an Identity-service boundary and is not granted an OperatorElevation control-plane read contract.

Consequently, a DD-146 `PostgresOperatorElevationStore` bolted onto existing request SQL would either always be hidden by RLS or would require widening context/session settings without first proving the interactive elevation selection, approval, Tenant target, optional Industry target and audit/authorization flow.

That would be a semantic/security boundary change, not a raw persistence reader.

## Required source ownership before OperatorElevation implementation

A future operator-elevation slice must first establish, from governing source rather than invention:

1. who supplies/selects the elevation id and through which trusted transport/control-plane flow;
2. the pre-context database role/path that can resolve the candidate elevation without bypassing RLS;
3. binding to interactive PLATFORM_OPERATOR identity only;
4. Tenant and optional Industry target resolution order;
5. purpose/ticket/approval and permission-profile interpretation;
6. revocation/expiry race handling;
7. how the verified elevation id enters immutable RequestContext and transaction-local SQL scope;
8. mandatory audit-before/after semantics and failure behavior;
9. separation from persistent Tenant membership/roles and from API credentials;
10. public/app transport non-exposure.

Until those are source-complete, `operator_elevation` remains a blocked runtime prerequisite.

## DD-146 selection rule

Do not create DD-146 from a governance/helper table or by weakening OperatorElevation's security boundary.

The next decision must come from a **fresh source-owned runtime prerequisite audit** (for example an already documented pending runtime seam) and must prove deterministic behavior, role/transport ownership and executable acceptance before implementation.

No schema, role, grant, RLS, product policy or current checkpoint is changed by this audit.
