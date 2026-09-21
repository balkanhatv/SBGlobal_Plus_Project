# CORE SERVICE CHECKPOINT — DEV-DOCUMENT-STORAGE-BINDING-001
**Updated:** 2026-09-21 · **Branch:** `docs/architecture-branch-2`

## Verified executable basis

Verified executable `c5f827f0981af33e21427a1148c1c50845fc2ba9` / tree `0ed27e344392db885e3ef24fff8fab2b0febe212`: **311/311 Core**, **80/80 PostgreSQL**, **47 migrations / 41 SQL verification files bootstrap**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests. Verified executable inventory: **434 blobs / 174 Markdown / 91 source / 67 test files**.

## Implemented boundary

DD-086 adds the server-internal linked physical StorageObject binding reader. It can resolve private locator metadata only through the exact RLS-visible ACTIVE/CLEAN DocumentMeta row, exact storageObjectId and resolved Data Home, under the dedicated Document service role. Arbitrary StorageObject lookup, signing, provider choice and transport exposure remain prohibited.

DOC-STO-PG-001…006 prove exact linked-object resolution, no unlinked-object bypass, sibling Industry isolation, Tenant Core visibility, unsafe/non-active rejection and Data Home route fail-closed behavior.

DD-085 ACL subject matching, DD-084 raw ACL persistence, DD-083 metadata PostgreSQL binding, DD-082 candidate, DD-081 event validation, DD-080 REST floor, VC-01–04 and REPO-001–006 remain covered.

## Remaining scope

The storage binding is private server evidence only. It cannot authorize or sign access and must never be exposed directly through transport.

Next: Full Document signed access still requires final source-owned ACL authorization semantics (operation→ACL mapping, validUntil effectiveness, fallback/DENY reducer), step-up/residency policy and concrete StoragePort signer TTL/provider composition. REST exposure, DD-076 evaluator, concrete AI Gateway and event/webhook runtime remain separate unfinished governed scopes.

Evidence: `Registers/DEVELOPMENT_DD086_VERIFICATION_2026-09-21.md`.

RawSource accepted blobs unchanged; main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; PR #2 remains draft/unmerged.
