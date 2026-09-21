# HANDOFF_NOTE — SBGlobal Plus
**Updated:** 2026-09-21 · **Checkpoint:** `DEV-DOCUMENT-ACL-READ-001`

Fresh-fetch remote branch/HEAD/tree/checks before further work.

Verified executable `176a96b28b24207b6aae8c38a82c7b03326164fd` / tree `6368798edb96e81e3b721d7d9bfe754f4ab60a74`: **305/305 Core**, **74/74 PostgreSQL**, **47 migrations / 41 SQL verification files bootstrap**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests. Verified executable inventory: **427 blobs / 170 Markdown / 89 source / 66 test files**.

DD-084 adds a raw Document ACL persistence boundary: typed ACL entries are read through the existing dedicated Document PostgreSQL/FORCE-RLS path in deterministic order, preserving persisted subject/permission/effect/expiry evidence without deciding authorization. No deny reducer, subject matcher, operation→ACL mapping, signer, route, SQL or privilege change was invented.

Read `Development/DOCUMENT_ACL_POSTGRES_READER_PREREQUISITE_OWNERSHIP_AUDIT.md` before extending ACL behavior. The raw reader deliberately does not match subjects, filter expiry, apply DENY precedence or decide access. DD-082/DD-083 remain the metadata/state and persistence prerequisites.

Next: Full Document signed access remains blocked on exact operation→Document permission/ACL mapping, final ACL fallback/deny evaluation semantics, policy-specific step-up/residency composition and concrete signed-grant TTL/provider signing. REST exposure, DD-076 evaluator, concrete AI Gateway, event dispatcher/retry/DLQ and webhook transport remain separate unfinished governed scopes. Source-audit the next independent source-complete slice before implementation.

Evidence: `Registers/DEVELOPMENT_DD084_VERIFICATION_2026-09-21.md`.

RawSource accepted blobs unchanged; main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; PR #2 remains draft/unmerged.
