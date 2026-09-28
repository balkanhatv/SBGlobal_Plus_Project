# Development DD-085 verification — 2026-09-21

**Branch:** `docs/architecture-branch-2`  
**Verified executable HEAD/tree:** `e074dadb571dd35565b9d61040ef25c640a1e385` / `fccb480853e4f8ab0cfbff0975f701639faf12b3`  
**Checkpoint target:** `DEV-DOCUMENT-ACL-MATCH-001`

## Source audit and implementation

`Development/DOCUMENT_ACL_SUBJECT_MATCH_PREREQUISITE_OWNERSHIP_AUDIT.md` reconciled DD-08 ACL subjects, DD-03 RequestContext/resource authorization, DD-084 raw ACL evidence, migration 0006 ACL grammar and the concrete PostgreSQL TenantContext resolver.

DD-085 adds `src/core/document/acl-subject-match.ts`, exports it from Core, and adds `tests/core/document-acl-subject-match.test.mjs`.

The matcher accepts one explicit ACL permission and one document id. PRINCIPAL compares only to resolved principalId; ROLE only to resolved roleIds; ORG_UNIT only to resolved orgUnitPath, which the PostgreSQL resolver constructs from selected OrgUnit plus ancestor UUIDs. It returns immutable matched rows in input order.

It intentionally does not interpret validUntil, reduce ALLOW/DENY, decide source-resource fallback, map an OperationContract to ACL permission or return an authorization decision.

## Exact-head CI evidence

| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / Core | 35627740043 | 106426134500 | **311/311 PASS**, 0 fail, 0 skip; DOC-ACL-MATCH-001…006 PASS |
| Core Service Verify / PostgreSQL | 35627740043 | 106426134637 | **74/74 PASS**, 0 fail, 0 skip |
| Database Verify | 35627740018 | 106426134141 | **PASS**, 47 migrations + 41 SQL verification files |
| Web Boundary Verify | 35627740105 | 106426134811 | **PASS**, TypeScript + Next.js production build |

Workflow logs assert exact HEAD `e074dadb571dd35565b9d61040ef25c640a1e385` and tree `fccb480853e4f8ab0cfbff0975f701639faf12b3`.

## Invariants

Repository invariants remain 9 Industries / 41 canonical Management Systems / 181 registered Industry tables, 2,962 preserved source requirement IDs/text, contiguous ADR-001–020 / DD-001–085, 47 migrations / 41 SQL verification files, and zero skipped Core/PostgreSQL tests.

Verified executable inventory: **431 blobs / 172 Markdown / 90 TypeScript source files / 67 test files**.

RawSource accepted blobs remain `a9f63a64448a347edd0f2b0c74094284ee953c1b` and `91c461de5e0d171f71d0bb89cd039953a1f1ecfd`. Main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; no merge is performed.

## Remaining boundary

DD-085 is matching evidence only. Final Document ACL authorization remains blocked on operation→permission mapping, expiry semantics, fallback/inheritance and deny-reducer semantics; signed access additionally requires the governed security/signer composition.
