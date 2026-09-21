# PostgreSQL Document access-metadata reader prerequisite ownership audit

**Date:** 2026-09-21  
**Baseline:** `efb67bfb034789ddf71e2765e5d75124265fbb03`  
**Scope:** concrete persistence binding for DD-082.

## Source reconciliation

DD-08 §§1/5/10–13, DD-16 §§5/14/20, DD-17 DOC-002/003/005/006 and
DOC-PRE-001…006, migrations 0006/0028/0030/0031, `RequestScopedSql` and the
existing PostgreSQL read-adapter patterns were read against the current branch.

| Concern | Existing owner | Determination |
|---|---|---|
| DocumentMeta columns | migration 0006 / DD-08 §1 | exact physical projection is defined |
| Tenant / Industry isolation | migration 0006 | FORCE RLS filters by current Tenant and exact Industry Context; Tenant Core rows remain tenant-scoped |
| Database context | `RequestScopedSql` | transaction-local Tenant/Industry/principal context is already governed |
| Service privilege | migration 0028 | `sbg_document_service_rw` is NOBYPASSRLS and has DocumentMeta SELECT |
| Storage authority | DD-08 §§2/5 | object key/provider credentials are not authorization and need not be read for DD-082 |
| Unsafe state | DD-082 | Core candidate service, not the SQL reader, revalidates ACTIVE/CLEAN before progression |

## Determination

A concrete **PostgreSQL DocumentAccessMetadataPort** is source-complete.

The adapter may execute one parameterized DocumentMeta query by document id inside
`RequestScopedSql.withContext`, project only the fields required by DD-082, return
`null` when RLS hides/misses the row, and reject ambiguous persistence results.

It must not join or expose `storage_object.object_key`, provider references,
credentials, ACL authorization outcomes, signed URLs/tokens, signer configuration or
public-sharing state.

## Authorized implementation boundary

Implement `PostgresDocumentAccessMetadataStore` that:

1. accepts DD-082 Tenant Core / Tenant Industry RequestContext only;
2. runs through `RequestScopedSql`, preserving transaction-local RLS context;
3. selects the exact DocumentMeta fields required by `DocumentAccessMetadata`;
4. maps one row to the Core contract without interpreting authorization policy;
5. returns `null` for RLS-hidden / absent rows;
6. fails closed on ambiguous or malformed SQL result conditions;
7. is verified against real PostgreSQL FORCE-RLS with exact Industry, sibling Industry
   and Tenant Core visibility cases.

No migration, grant, role, RLS policy, signer, route, permission or storage-provider
change is authorized.

Acceptance: DOC-PG-001…005.
