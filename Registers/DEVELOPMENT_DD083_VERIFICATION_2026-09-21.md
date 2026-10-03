# Development DD-083 verification — 2026-09-21

**Branch:** `docs/architecture-branch-2`  
**Verified executable HEAD/tree:** `0595b7a65f0684b15d843d80b77fda6386083c9a` / `b22c1be5b2ecc2904873097392436ef88557dc98`  
**Checkpoint target:** `DEV-DOCUMENT-POSTGRES-001`

## Source audit and implementation

`Development/DOCUMENT_POSTGRES_METADATA_READER_PREREQUISITE_OWNERSHIP_AUDIT.md` reconciled DD-08/DD-16/DD-17, migrations 0006/0028/0030/0031, `RequestScopedSql` and existing dedicated PostgreSQL adapter patterns.

DD-083 adds:
- `src/server/document/postgres-document-access-metadata-store.ts`;
- `src/server/database/postgres-document-database.ts`;
- `tests/postgres/document-access-metadata-store.test.mjs`.

The store selects only DD-082 DocumentMeta fields by UUID inside transaction-local request context. The database wrapper fixes `sbg_document_service_rw`, enables row security, verifies runtime/login roles are non-superuser/NOBYPASSRLS, clears scope before use and sanitizes pooled state on release.

## CI-discovered correction

Initial feature head `a3609fc7a9834f5fac02b64b08da46619e7b543e` compiled and passed Database/Web, but its PostgreSQL tests failed because the fixture composed the Document store with generic `PostgresDatabase`, whose intentional runtime role is `sbg_app_rw`. PostgreSQL reported permission denied to set that role for the Document-only login.

Migration 0028 already owns the correct role. The correction introduced the dedicated Document database wrapper; no grant, role, RLS policy or business rule was widened.

## Exact-head CI evidence

| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / Core | 35626044307 | 106420545737 | **305/305 PASS**, 0 fail, 0 skip |
| Core Service Verify / PostgreSQL | 35626044307 | 106420545577 | **70/70 PASS**, 0 fail, 0 skip |
| Database Verify | 35626044434 | 106420545456 | **PASS**, 47 migrations + 41 SQL verification files |
| Web Boundary Verify | 35626044352 | 106420545679 | **PASS**, TypeScript + Next.js production build |

The workflow logs assert exact executable head `0595b7a65f0684b15d843d80b77fda6386083c9a` and tree `b22c1be5b2ecc2904873097392436ef88557dc98`.

## Acceptance and invariants

DOC-PG-001…005 pass:
- exact Tenant Industry metadata maps without object-key/provider leakage;
- sibling Industry DocumentMeta is hidden by FORCE-RLS;
- Tenant Core metadata remains same-Tenant visible in Tenant Industry and Tenant Core contexts;
- QUARANTINED/non-CLEAN real PostgreSQL metadata is rejected by DD-082 before signing;
- route/context mismatch fails closed.

Existing DOC-PRE, EVT-CAT, REST, VC and REPO acceptance remains green. Invariants remain 9 Industries / 41 canonical MS / 181 Industry tables, 2,962 source requirement IDs/text, ADR-001–020 / DD-001–083, 47 migrations / 41 verification files.

Verified executable inventory: **423 blobs / 168 Markdown / 87 TypeScript source files / 66 test files**. No migration or verification SQL changed.

RawSource blobs remain `a9f63a64448a347edd0f2b0c74094284ee953c1b` and `91c461de5e0d171f71d0bb89cd039953a1f1ecfd`. Main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; no merge is performed.

## Remaining boundary

DD-083 is only the concrete metadata persistence binding. Signed-download authorization, ACL/permission/entitlement mapping, sensitivity step-up/residency policy, signed-grant TTL/provider implementation and public route remain unimplemented.
