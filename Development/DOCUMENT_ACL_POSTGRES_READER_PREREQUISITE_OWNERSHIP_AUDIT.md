# Document ACL PostgreSQL reader prerequisite ownership audit

**Date:** 2026-09-21  
**Baseline:** `191cff658d304fe4d6bf0f2233bfacb1d9a9a714`  
**Scope:** next independent source-complete Document persistence slice after DD-083.

## Source reconciliation

DD-08 §5–§6/§10–§11, DD-03 §7/§16, DD-17 document acceptance,
migration 0006 `document_acl` / parent FORCE-RLS policy, migration 0031 ACL-subject
integrity and the DD-083 dedicated Document database boundary were read together.

The persistence contract is exact:

- subject type: `PRINCIPAL | ROLE | ORG_UNIT`;
- permission: `VIEW | DOWNLOAD | SHARE | DELETE_VERSION`;
- effect: `ALLOW | DENY`;
- optional `valid_until`;
- one row per document + subject type + subject id + permission;
- ACL rows are visible only when their parent DocumentMeta is visible in the current
  Tenant/Industry RLS context;
- migration 0031 rejects foreign/out-of-scope principal, role and org-unit subjects.

## Determination

A concrete **raw Document ACL entry reader** is source-complete.

A final ACL evaluator is **not** source-complete here. DD-08 says Document access may
inherit source-resource authorization or use explicit ACL entries and that explicit
deny wins, but the repository still does not own the complete operation→Document ACL
permission mapping or the exact fallback rule for every operation when explicit ALLOW
is absent. Those semantics must not be invented.

Therefore this slice may read and type persisted ACL entries but may not return an
authorization decision.

## Authorized implementation boundary

Implement:

1. a Core `DocumentAclEntry` / `DocumentAclReadPort` persistence contract;
2. `PostgresDocumentAclStore` using the existing `PostgresDocumentDatabase` and
   `RequestScopedSql`;
3. one parameterized read by document id, ordered deterministically;
4. exact enum/UUID/timestamp shape validation and immutable results;
5. real PostgreSQL acceptance proving exact-context visibility, sibling isolation,
   Tenant Core visibility and preservation of ALLOW/DENY/validUntil data.

The reader may return expired rows with their `validUntil`; it does not interpret
current effectiveness. It may not inspect RequestContext roles/org-unit/principal to
decide matches, may not apply deny precedence, and may not authorize access.

No migration, role, grant, RLS policy, permission catalog, signer, route, TTL/provider
or public sharing change is authorized.

Acceptance: DOC-ACL-PG-001…004.
