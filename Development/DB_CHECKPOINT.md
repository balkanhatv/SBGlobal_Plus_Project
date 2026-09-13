# DATABASE CHECKPOINT — DEV-DB-SHARED-CORE-SPINE-001
**Date:** 2026-09-13  
**Branch:** `docs/architecture-branch-2`

## Implemented shared-Core database scope
- canonical platform/Core + 9 Industry schemas;
- Tenant / Industry Context / org-unit ownership;
- shared Metadata / Rules / Forms / Country Pack / Branding / Export storage;
- Identity / Membership / Permission / Role / ABAC / API credential / Device / SessionVersion;
- Commercial plans / subscriptions / transitions / licenses / add-ons / overrides / usage / entitlement snapshots;
- DocumentMeta / private StorageObject / upload session / ACL;
- RLS registry + migration ledger;
- Audit / Outbox / Webhook partitioned evidence with global identity registries;
- least-privilege database role classes;
- AI catalog / models / capabilities / config / policies / prompts / provisioning;
- AI RAG / conversations / memory / usage / cost;
- AI assistants / agents / tools / approvals;
- dedicated AI Gateway runtime DB role.

## Migration range
`0001` … `0014`

## Security invariants implemented
- runtime roles are NOBYPASSRLS;
- Tenant rows require Tenant Context;
- Industry rows require Tenant + Industry Context;
- physical storage metadata is not directly available to ordinary app/worker roles;
- general application role has no direct `core_ai` access;
- AI Gateway uses a dedicated NOBYPASSRLS role;
- role/persona/context data never uses schema names as authorization;
- PAST_DUE does not exist in canonical subscription state;
- partitioned audit/outbox/webhook evidence preserves globally unique identity through registries.

## Verification
Repository/static contract review: **PASS for implemented shared-Core slice**.  
SQL verification files exist for current invariants.  
Live PostgreSQL apply-and-verify execution: **NOT YET PERFORMED in this session**.

## Open database scope
- Industry transactional tables for 9 suites / 41 Management Systems;
- Workflow/Automation physical schema requires an exact storage contract completion before implementation;
- Notification shared schema;
- database runtime execution/CI against a real PostgreSQL instance;
- later migration/rollback operational evidence.

**Shared-Core database spine: IMPLEMENTED / NOT YET RUNTIME-VERIFIED.**
