# CredentialReference metadata reader prerequisite ownership audit

**Date:** 2026-09-22  
**Baseline checkpoint:** `DEV-TENANT-INTEGRATION-READ-001`  
**Verified executable basis:** `6f16090eb4e74bbb6142f4bbb4f3b4e16e55c0e0`  
**Scope:** next independent Integration persistence slice after DD-095.

## Source reconciliation

DD-06 §§15–18, migration 0025 `credential_reference` schema/FORCE-RLS,
migration 0028 Integration-service privileges and migration 0030 TenantIntegration
credential integrity were reconciled.

The repository distinguishes two concerns:

1. **Credential reference metadata** — scope, secret-store provider, credential type,
   key version, status, rotation/expiry timestamps and creation metadata.
2. **Secret locator/material access** — `secret_reference` ultimately identifies
   secret-store material. DD-06 §17 requires secret-material access to be
   service-principal-only, purpose-bound and audited; UI gets only masked
   metadata/status.

## Determination

A concrete **CredentialReference metadata-only reader** is source-complete.

A generic reader that returns `secret_reference` is **not** authorized by this
slice because it would create a reusable secret-locator disclosure path without the
purpose/audit contract required by DD-06 §17.

## Authorized implementation boundary

Implement:

1. immutable typed `CredentialReferenceMetadata`;
2. `CredentialReferenceMetadataReadPort.loadForContext(requestContext,id)`;
3. `PostgresCredentialReferenceMetadataStore` through the fixed Integration
   service role + `RequestScopedSql`;
4. one parameterized read by id;
5. exact Tenant/Industry/platform scope handling already enforced by FORCE-RLS;
6. metadata projection containing:
   - id;
   - Tenant id / optional Industry Context id;
   - secret-store provider;
   - credential type;
   - positive key version;
   - raw status;
   - optional rotatedAt / expiresAt;
   - createdAt;
7. **no `secret_reference` column in the SELECT or returned contract**;
8. PostgreSQL acceptance proving same-context visibility, sibling/foreign isolation,
   Tenant Core visibility, raw expiry/status preservation and malformed input
   fail-closed behavior.

The metadata reader does not decide whether a credential is usable, current,
authorized for a provider, or eligible for rotation overlap. It never calls a
secret store and never returns a secret locator or plaintext.

No migration, role, grant, secret-store call, provider SDK, route or product-policy
change is authorized.

Acceptance: INT-CRED-META-PG-001…005.
