# CORE SERVICE CHECKPOINT — DEV-DOCUMENT-UPLOAD-SESSION-READ-001
**Updated:** 2026-09-21 · **Branch:** `docs/architecture-branch-2`

## Verified executable basis

Verified executable `d2038d13f3950b58f7cbafe99ce93fd1f4f5d115` / tree `dc3d7f16ff13f98b5a376095e3d2ca4a506f8ac3`: **311/311 Core**, **85/85 PostgreSQL**, **47 migrations / 41 SQL verification files bootstrap**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests. Verified executable inventory: **438 blobs / 176 Markdown / 93 source / 67 test files**.

## Implemented boundary

DD-087 adds a raw typed Document upload-session persistence reader. It reads one FORCE-RLS-visible session through the dedicated Document PostgreSQL role and preserves scope, principal, media types, max-size class, expiry, lifecycle status, temporary-object reference and expected checksum exactly as stored. It deliberately does not decide usability, expiry effectiveness, media/size/checksum policy or mutation authority.

DOC-UP-PG-001…005 prove exact Industry visibility, sibling isolation, Tenant Core same-Tenant visibility, expired-session evidence preservation and fail-closed malformed/route-mismatched context. DD-087 is raw persistence only.

DD-086 linked StorageObject binding, DD-085 ACL subject matching, DD-084 raw ACL persistence, DD-083 metadata PostgreSQL binding, DD-082 pre-sign candidate, DD-081 event validation and prior repository invariants remain covered.

## Correction evidence

A pre-promotion PostgreSQL run on `124e6a5a277f20ee7b0bc8d53052960638212558` failed at Node parse time because concurrent edits duplicated the upload-session import/fixture/tests. Commits through `d2038d13f3950b58f7cbafe99ce93fd1f4f5d115` removed duplicate DD/test blocks without changing product semantics. The corrected exact-head suite is 85/85.

## Remaining scope

No upload usability decision, expiry reducer, media/size/checksum evaluator, state-transition engine, StoragePort action or mutation authorization is claimed.

Next: Document upload orchestration still requires source-owned session usability/expiry semantics, max-size/media/checksum policy and governed state transitions. Full signed access still requires final ACL authorization semantics, step-up/residency policy and concrete StoragePort signer TTL/provider composition. REST exposure, DD-076 evaluator, concrete AI Gateway and event/webhook runtime remain separate unfinished governed scopes. Source-audit the next independent source-complete slice before implementation.

Evidence: `Registers/DEVELOPMENT_DD087_VERIFICATION_2026-09-21.md`.

RawSource accepted blobs unchanged; main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; PR #2 remains draft/unmerged.
