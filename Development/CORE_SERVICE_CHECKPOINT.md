# CORE SERVICE CHECKPOINT — DEV-DOCUMENT-POSTGRES-001
**Updated:** 2026-09-21 · **Branch:** `docs/architecture-branch-2`

## Verified executable basis

Verified executable `0595b7a65f0684b15d843d80b77fda6386083c9a` / tree `b22c1be5b2ecc2904873097392436ef88557dc98`: **305/305 Core**, **70/70 PostgreSQL**, **47 migrations / 41 SQL verification files bootstrap**, **Next.js 15.5.25 build** and **Database Verify PASS**. Zero failed/skipped tests. Verified executable inventory: **423 blobs / 168 Markdown / 87 source / 66 test files**.

## Implemented boundary

DD-083 concretely binds DD-082 Document metadata reads to PostgreSQL: `PostgresDocumentAccessMetadataStore` runs one parameterized DocumentMeta lookup through `RequestScopedSql`, while dedicated `PostgresDocumentDatabase` fixes the existing `sbg_document_service_rw` NOBYPASSRLS role. Real PostgreSQL acceptance proves exact Industry visibility, sibling isolation, Tenant Core visibility and unsafe-state composition. No signer, permission/ACL policy, TTL/provider, route, migration, role, grant or RLS change was introduced.

DOC-PG-001…005 prove the concrete reader and dedicated service-role database wrapper against real FORCE-RLS. The first DD-083 PostgreSQL attempt used the generic application-role database wrapper and correctly failed with permission-to-set-role errors; the correction uses the source-owned Document role rather than widening privileges.

DD-082 pre-sign candidate, DD-081 event-envelope validation, DD-080 REST adapter floor, VC-01–04 and REPO-001–006 remain covered.

## Remaining scope

Full signed download authorization/signing is not claimed. No ACL/permission/entitlement mapping, step-up/residency policy, signed URL/token, TTL/provider, public route or sharing capability is implemented.

Next: Full DD-08 signed access still requires exact OperationContract/permission binding, policy-specific ACL/step-up/residency composition and concrete signed-grant TTL/provider signing. REST exposure, DD-076 evaluator, concrete AI Gateway, event dispatcher/retry/DLQ and webhook transport remain blocked or unimplemented on their named prerequisites. Source-audit the next independent source-complete slice before implementation.

Evidence: `Registers/DEVELOPMENT_DD083_VERIFICATION_2026-09-21.md`.

RawSource accepted blobs unchanged; main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; PR #2 remains draft/unmerged. The checkpoint/promotion commit must independently pass exact-head CI; this document names its already-verified executable basis, not a recursive self-hash.
