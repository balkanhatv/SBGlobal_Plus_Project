# Development DD-097 verification — 2026-09-22

**Branch:** `docs/architecture-branch-2`  
**Verified executable HEAD/tree:** `9271010240d06eac21dbf750172b4a987a9dddb7` / `f4b0375255740ca3a94243d120beac4e94d21f6f`  
**Checkpoint target:** `DEV-SYNC-CURSOR-READ-001`

## Source audit and implementation

`Development/SYNC_CURSOR_READER_PREREQUISITE_OWNERSHIP_AUDIT.md` reconciled DD-06 SyncCursor, migration 0025 parent-RLS/schema, migration 0028 nullable-scope uniqueness/service privileges and migration 0030 active-integration/capability write integrity.

DD-097 adds:
- `src/core/integration/sync-cursor.ts`;
- `src/server/integration/postgres-sync-cursor-store.ts`;
- Core export;
- INT-CURSOR-PG-001…005 in `tests/postgres/webhook-subscription-store.test.mjs`;
- DD/test traceability.

The reader uses one exact TenantIntegration + capability + nullable Industry Context tuple and preserves `cursorEncryptedOrOpaque`, optional watermark/sourceVersion and updatedAt without decode/decrypt or execution semantics.

## CI-discovered cleanup

Initial composed heads exposed two repository-composition defects:
1. DD-097 owner/decision text was appended twice, causing REPO-004 uniqueness failure. Later duplicate DD-06/DD-18 blocks were removed.
2. Concurrent test wiring left duplicate `PostgresSyncCursorStore` import and `syncCursorStore` declaration. Both duplicates were removed.

No product policy, schema, role, grant or RLS rule changed.

## Exact-head CI evidence

| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / Core | 35683220886 | 106604474928 | **311/311 PASS**, 0 fail, 0 skip |
| Core Service Verify / PostgreSQL | 35683220886 | 106604475047 | **131/131 PASS**, 0 fail, 0 skip |
| Database Verify | 35683220915 | 106604474988 | **PASS**, 47 migrations + 41 verification files |
| Web Boundary Verify | 35683220861 | 106604476333 | **PASS**, TypeScript + Next.js build |

Push PostgreSQL job `106604459772` independently passed the same **131/131** suite at the exact head/tree.

## Acceptance and invariants

INT-CURSOR-PG-001…005 pass. The cursor reader preserves exact opaque persistence evidence, sibling/foreign parent-RLS isolation, Tenant Core same-Tenant visibility and exact no-fallback tuple behavior. A parent later becoming PAUSED does not transform raw evidence into resume authority.

Existing Integration and prior suites remain green. Invariants remain 9 Industries / 41 canonical MS / 181 Industry tables, 2,962 source requirement IDs/text, ADR-001–020 / DD-001–097, 47 migrations / 41 verification files.

Verified executable inventory: **480 blobs / 196 Markdown / 114 TypeScript source files / 68 test files**. No migration or verification SQL changed.

RawSource accepted blobs remain `a9f63a64448a347edd0f2b0c74094284ee953c1b` and `91c461de5e0d171f71d0bb89cd039953a1f1ecfd`. Main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; no merge is performed.

## Remaining boundary

Cursor persistence is not sync execution authority. Generic cursor codec/decryption, watermark reconciliation, provider resume/replay behavior and cursor mutation remain unimplemented.
