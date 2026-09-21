# Document physical StorageObject binding prerequisite ownership audit

**Date:** 2026-09-21  
**Baseline:** `14ad724c7f936ebccabb1b56930d808a28c33146`  
**Scope:** next independent source-complete Document slice after DD-085.

## Source reconciliation

DD-08 §§1–5/11–12, DD-16 residency controls, DD-17 P2-STO-001…003,
migrations 0006/0028/0031, DD-082 candidate semantics and DD-083's dedicated
Document PostgreSQL role boundary were reconciled.

The repository already owns these physical invariants:

- DocumentMeta is the authorization owner; StorageObject identifiers/keys are never
  authorization;
- DocumentMeta is FORCE-RLS scoped by Tenant/Industry context;
- an ACTIVE DocumentMeta row must point to an ACTIVE StorageObject with matching
  Data Home, size and checksum at integrity validation time;
- tenant Document residency must match the tenant's authoritative Data Home/region;
- StorageObject access is restricted to the dedicated Document service role;
- a known object key must not bypass DocumentMeta authorization;
- quarantined/unsafe objects must not progress to signed access.

## Determination

A server-internal **physical StorageObject binding reader** is source-complete.

It must not perform an arbitrary `storage_object.id` lookup. The physical row may be
resolved only through an RLS-visible DocumentMeta join using the exact document id
and exact storageObjectId already carried by the DD-082 candidate, and the current
RequestContext Data Home.

Because this is the last database boundary before a future StoragePort, it may return
private physical locator metadata to server-side Document code, but it is not an
authorization result and must not expose anything through a transport.

## Authorized implementation boundary

Implement `PostgresDocumentStorageBindingStore` that:

1. accepts only resolved Tenant Core / Tenant Industry RequestContext with dataHomeId;
2. accepts exact document id + storageObjectId;
3. executes inside `PostgresDocumentDatabase` / `RequestScopedSql`;
4. joins `document_meta` to `storage_object` rather than reading StorageObject
   independently;
5. requires the joined DocumentMeta to be ACTIVE/CLEAN and the StorageObject ACTIVE;
6. requires StorageObject data_home_id = resolved RequestContext dataHomeId;
7. returns immutable server-internal physical metadata only for one exact linked row;
8. returns null for missing, sibling, mismatched, unsafe or non-active bindings;
9. fails closed on malformed/ambiguous persisted shape.

The slice may expose internally: object id, Data Home id, provider reference ciphertext,
bucket class, object key/version, exact size as decimal text, checksum, encryption key
reference and object status. It must not decrypt secrets, sign URLs, choose a provider,
select TTL, evaluate ACL/permission/entitlement/step-up/residency exceptions or expose
a route.

No migration, role, grant, RLS policy, public sharing or product-policy change is
authorized.

Acceptance: DOC-STO-PG-001…006.
