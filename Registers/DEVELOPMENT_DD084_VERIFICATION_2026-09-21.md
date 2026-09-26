# Development DD-084 verification — 2026-09-21

**Branch:** `docs/architecture-branch-2`  
**Verified executable HEAD/tree:** `176a96b28b24207b6aae8c38a82c7b03326164fd` / `6368798edb96e81e3b721d7d9bfe754f4ab60a74`  
**Checkpoint target:** `DEV-DOCUMENT-ACL-READ-001`

## Source audit and implementation

`Development/DOCUMENT_ACL_POSTGRES_READER_PREREQUISITE_OWNERSHIP_AUDIT.md` reconciled DD-08, DD-03, DD-17, migration 0006 parent-RLS ACL policy, migration 0031 ACL-subject integrity and DD-083's dedicated Document PostgreSQL boundary.

DD-084 adds `src/core/document/acl.ts`, exports it from Core, adds `src/server/document/postgres-document-acl-store.ts`, and extends the real PostgreSQL Document suite with DOC-ACL-PG-001…004.

The reader returns immutable persisted ACL evidence in deterministic order. It preserves ALLOW/DENY and validUntil exactly and intentionally does not perform subject matching, expiry effectiveness, deny precedence, source-resource inheritance or operation-to-ACL mapping.

## Exact-head CI evidence

| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / Core | 35626896940 | 106423347192 | **305/305 PASS**, 0 fail, 0 skip |
| Core Service Verify / PostgreSQL | 35626896940 | 106423346909 | **74/74 PASS**, 0 fail, 0 skip; DOC-ACL-PG-001…004 PASS |
| Database Verify | 35626897060 | 106423347666 | **PASS**, 47 migrations + 41 SQL verification files |
| Web Boundary Verify | 35626896931 | 106423347079 | **PASS**, TypeScript + Next.js production build |

Workflow logs assert exact HEAD `176a96b28b24207b6aae8c38a82c7b03326164fd` and tree `6368798edb96e81e3b721d7d9bfe754f4ab60a74`.

## Invariants

Repository invariants remain 9 Industries / 41 canonical Management Systems / 181 registered Industry tables, 2,962 preserved source requirement IDs/text, contiguous ADR-001–020 / DD-001–084, 47 migrations / 41 SQL verification files, and zero skipped Core/PostgreSQL tests.

Verified executable inventory: **427 blobs / 170 Markdown / 89 TypeScript source files / 66 test files**.

RawSource accepted blobs remain `a9f63a64448a347edd0f2b0c74094284ee953c1b` and `91c461de5e0d171f71d0bb89cd039953a1f1ecfd`. Main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; no merge is performed.

## Remaining boundary

DD-084 is a persistence-evidence reader only. Full Document ACL authorization and signed access require source-owned operation/action mapping, subject matching/fallback/deny semantics, step-up/residency policy and signer TTL/provider composition.
