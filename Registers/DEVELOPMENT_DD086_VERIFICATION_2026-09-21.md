# Development DD-086 verification — 2026-09-21

**Branch:** `docs/architecture-branch-2`  
**Verified executable HEAD/tree:** `c5f827f0981af33e21427a1148c1c50845fc2ba9` / `0ed27e344392db885e3ef24fff8fab2b0febe212`  
**Checkpoint target:** `DEV-DOCUMENT-STORAGE-BINDING-001`

## Source audit and implementation

`Development/DOCUMENT_STORAGE_BINDING_PREREQUISITE_OWNERSHIP_AUDIT.md` reconciled DD-08 storage rules, DD-16 residency, DD-082 candidate semantics, DD-083 dedicated Document PostgreSQL role and migrations 0006/0028/0031.

DD-086 adds `src/server/document/postgres-document-storage-binding-store.ts` and extends `tests/postgres/document-access-metadata-store.test.mjs` with DOC-STO-PG-001…006.

The reader never performs arbitrary StorageObject lookup. It joins one exact RLS-visible DocumentMeta row to its exact storageObjectId, requires Document ACTIVE/CLEAN, object ACTIVE and object Data Home equal to resolved RequestContext Data Home, then returns immutable server-internal physical locator metadata.

It does not decrypt provider references, select a provider, sign URLs, choose TTL, evaluate final ACL/permission/step-up/residency policy or expose a transport route.

## Exact-head CI evidence

| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / Core | 35628533493 | 106428759315 | **311/311 PASS**, 0 fail, 0 skip |
| Core Service Verify / PostgreSQL | 35628533493 | 106428759726 | **80/80 PASS**, 0 fail, 0 skip; DOC-STO-PG-001…006 PASS |
| Database Verify | 35628533519 | 106428759342 | **PASS**, 47 migrations + 41 SQL verification files |
| Web Boundary Verify | 35628533615 | 106428759750 | **PASS**, TypeScript + Next.js production build |

Workflow logs assert exact HEAD `c5f827f0981af33e21427a1148c1c50845fc2ba9` and tree `0ed27e344392db885e3ef24fff8fab2b0febe212`.

## Invariants

Repository invariants remain 9 Industries / 41 canonical Management Systems / 181 registered Industry tables, 2,962 preserved source requirement IDs/text, contiguous ADR-001–020 / DD-001–086, 47 migrations / 41 SQL verification files and zero skipped Core/PostgreSQL tests.

Verified executable inventory: **434 blobs / 174 Markdown / 91 TypeScript source files / 67 test files**.

RawSource accepted blobs remain `a9f63a64448a347edd0f2b0c74094284ee953c1b` and `91c461de5e0d171f71d0bb89cd039953a1f1ecfd`. Main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; no merge is performed.

## Remaining boundary

DD-086 is the final database-side physical binding floor before a future StoragePort. It is not authorization or signed access. Final ACL/security policy and signer composition remain source-prerequisite work.
