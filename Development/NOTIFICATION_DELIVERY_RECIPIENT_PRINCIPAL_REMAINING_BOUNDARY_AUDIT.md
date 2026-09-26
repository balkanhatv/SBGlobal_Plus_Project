# NotificationDelivery recipient-principal remaining boundary audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-NOTIFICATION-TEMPLATE-CURRENT-BINDING-FLOORS-001`  
**Verified synchronized basis:** `ac421f21acb7bf08cc47bf96bed99ed8949868d4`

## Reconciled source

Migration 0031 validates optional `recipient_principal_id` through:

`core_identity.principal_is_active_for_tenant(tenant_id, recipient_principal_id, queued_at)`.

That authoritative predicate is broader than raw PlatformPrincipal status:

- principal must be ACTIVE;
- SERVICE is admitted directly;
- other principals may require an ACTIVE TenantMembership whose validity window contains `queued_at`;
- PLATFORM_OPERATOR may alternatively require the request-local `app.operator_elevation_id`, current principal, current Tenant, exact optional Industry compatibility, ACTIVE elevation status and a time window containing `queued_at`.

DD-159 exposes raw principal metadata but no TenantMembership/elevation provenance for a stored NotificationDelivery. NotificationDelivery itself does not persist the operator elevation id or original request-local Identity settings used by the write-time predicate.

## Determination

A general pure recipient-principal **current-binding re-evaluation is not source-complete** from the presently persisted NotificationDelivery plus available raw principal metadata.

Reconstructing it by:
- treating ACTIVE principal status alone as sufficient;
- assuming HUMAN membership;
- ignoring PLATFORM_OPERATOR elevation;
- using a later request's elevation;
- or excluding one principal type

would change the canonical predicate rather than re-evaluate it.

## Locked boundary

Do not create a DD for recipient-principal currentness until a governing source owns one of:

1. persisted provenance sufficient to re-evaluate the original predicate; or
2. an explicit later-time recipient validity rule that differs from write-time validation; or
3. a server-owned authoritative query contract whose required context/provenance is fully specified.

This block does not weaken migration 0031's write-time integrity enforcement.

## Next valid prerequisite

DD-168, DD-169 and DD-171 are already independently source-complete migration-0031 relationship floors. Their boolean conjunction can be composed as one **known NotificationDelivery persisted-relationship necessary floor** without adding primitive semantics. Recipient-principal validity remains explicitly outside that composition.
