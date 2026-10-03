# Document upload-session PostgreSQL reader prerequisite ownership audit

**Date:** 2026-09-21  
**Baseline:** `1956ece9ae3672641ac11ca9dcd2c6dca10443d0`  
**Scope:** next independent source-complete Document persistence slice after DD-086.

## Source reconciliation

DD-08 §§3–4, DD-17 DOC upload/storage acceptance, migration 0006
`document_upload_session` schema/FORCE-RLS policy, migration 0031 upload-principal
integrity and migration 0028 Document service privileges were reconciled with the
current DD-083 dedicated Document PostgreSQL role boundary.

The persistence contract is exact:

- session scope is `TENANT_CORE | TENANT_INDUSTRY`;
- Tenant Industry scope requires exact Industry Context;
- read visibility is FORCE-RLS by current Tenant + exact Industry Context, while
  Tenant Core rows remain same-Tenant visible;
- persisted facts include principal id, expected media types, max size class,
  expiresAt, status, optional temporary object reference and optional expected
  checksum;
- session principal must be an active Tenant principal at creation time;
- write checks additionally require current principal ownership.

## Determination

A concrete **raw Document upload-session reader** is source-complete.

Final upload-session authorization/state progression is not source-complete here.
The repository does not yet define executable semantics for every
`max_size_class`, media-type policy source, exact expiry boundary handling, or every
state transition. Those rules must not be invented.

## Authorized implementation boundary

Implement:

1. a Core typed `DocumentUploadSession` / `DocumentUploadSessionReadPort` contract;
2. `PostgresDocumentUploadSessionStore` through the existing
   `PostgresDocumentDatabase` + `RequestScopedSql`;
3. one parameterized read by session id;
4. exact UUID/enum/array/timestamp/text validation and immutable result;
5. null for RLS-hidden / absent sessions;
6. real PostgreSQL acceptance proving exact Industry visibility, sibling isolation,
   Tenant Core visibility and persisted fact fidelity.

The reader preserves `expiresAt`, `status`, `maxSizeClass`,
`expectedMediaTypes`, `tempObjectRef` and `checksumExpected` exactly. It does not
decide whether the session is currently usable, expired, owned by the current
principal for a write, or whether an upload satisfies media/size/checksum policy.

No migration, role, grant, RLS policy, StoragePort, signer, route or product-policy
change is authorized.

Acceptance: DOC-UP-PG-001…005.
