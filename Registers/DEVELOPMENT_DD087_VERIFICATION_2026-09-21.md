# Development DD-087 verification — 2026-09-21

**Branch:** `docs/architecture-branch-2`  
**Verified executable HEAD/tree:** `d2038d13f3950b58f7cbafe99ce93fd1f4f5d115` / `dc3d7f16ff13f98b5a376095e3d2ca4a506f8ac3`  
**Checkpoint target:** `DEV-DOCUMENT-UPLOAD-SESSION-READ-001`

## Source audit and implementation

`Development/DOCUMENT_UPLOAD_SESSION_READER_PREREQUISITE_OWNERSHIP_AUDIT.md` reconciled DD-08 upload-session fields/lifecycle, migration 0006 FORCE-RLS, migration 0031 principal integrity, migration 0028 Document-service privileges and the DD-083 dedicated database boundary.

DD-087 adds the typed Core upload-session read contract, `PostgresDocumentUploadSessionStore`, Core export and DOC-UP-PG-001…005 real PostgreSQL acceptance. The reader preserves persisted scope/principal/media/max-size/expiry/status/temp/checksum facts without interpreting usability or mutation authority.

## Targeted duplicate cleanup

Concurrent edits temporarily produced duplicate DD-087 documentation and duplicate upload-session fixture/test blocks. The first corrected docs-only head `124e6a5a277f20ee7b0bc8d53052960638212558` still contained a duplicate test import and failed PostgreSQL at Node parse time with `Identifier 'PostgresDocumentUploadSessionStore' has already been declared`.

The subsequent cleanup through `d2038d13f3950b58f7cbafe99ce93fd1f4f5d115` leaves exactly one DD-087 design block, one DD-087 decision, one acceptance table, one upload-store import and five DOC-UP-PG tests. No product, SQL or RLS semantics were changed by that cleanup.

## Exact-head CI evidence

| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / Core | 35629762518 | 106432822016 | **311/311 PASS**, 0 fail, 0 skip |
| Core Service Verify / PostgreSQL | 35629762518 | 106432821645 | **85/85 PASS**, 0 fail, 0 skip |
| Database Verify | 35629762246 | 106432820435 | **PASS**, 47 migrations + 41 verification files |
| Web Boundary Verify | 35629762120 | 106432820284 | **PASS**, TypeScript + Next.js build |

The push Core run `35629756690` independently passed the same exact head, including PostgreSQL 85/85. Workflow logs assert `d2038d13f3950b58f7cbafe99ce93fd1f4f5d115` / tree `dc3d7f16ff13f98b5a376095e3d2ca4a506f8ac3`.

## Acceptance and invariants

DOC-UP-PG-001…005 pass:
- exact Tenant Industry session facts map immutably;
- sibling Industry session is hidden by FORCE-RLS;
- Tenant Core session is same-Tenant visible;
- EXPIRED/past-expiry evidence remains raw and non-authorizing;
- malformed id / route-context mismatch fails closed.

Existing Document, event, REST, VC and repository suites remain green. Invariants remain 9 Industries / 41 canonical MS / 181 Industry tables, 2,962 source requirement IDs/text, ADR-001–020 / DD-001–087, 47 migrations / 41 verification files.

Verified executable inventory: **438 blobs / 176 Markdown / 93 TypeScript source files / 67 test files**. No migration or verification SQL changed.

RawSource accepted blobs remain `a9f63a64448a347edd0f2b0c74094284ee953c1b` and `91c461de5e0d171f71d0bb89cd039953a1f1ecfd`. Main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; no merge is performed.

## Remaining boundary

Raw upload-session facts are not a usability or mutation decision. Expiry/state/media/size/checksum policy and full transition orchestration remain source-owned future work.
