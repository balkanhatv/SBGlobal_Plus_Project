# DEVELOPMENT STATE — SBGlobal Plus
**Updated:** 2026-09-21 · **Checkpoint:** `DEV-DOCUMENT-ACL-MATCH-001`

Branch: `docs/architecture-branch-2`. Development remains **IN PROGRESS**.

Verified executable `e074dadb571dd35565b9d61040ef25c640a1e385` / tree `fccb480853e4f8ab0cfbff0975f701639faf12b3`: **311/311 Core**, **74/74 PostgreSQL**, **47 migrations / 41 SQL verification files bootstrap**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests. Verified executable inventory: **431 blobs / 172 Markdown / 90 source / 67 test files**.

DD-085 adds a non-authorizing Document ACL subject-match evidence layer: for one explicit ACL permission and one document, PRINCIPAL matches resolved principalId, ROLE matches resolved roleIds, and ORG_UNIT matches the server-resolved current/ancestor orgUnitPath. Effect and validUntil evidence are preserved without expiry or ALLOW/DENY interpretation.

Invariants remain **9 Industries / 41 canonical MS / 181 registered Industry tables**, **2,962 unchanged source requirement IDs/text**, and contiguous **ADR-001–020 / DD-001–085**.

No database schema, verification SQL, role, grant or RLS policy changed in DD-085.

Next: Full Document ACL authorization remains blocked on source-owned operation→ACL permission mapping, validUntil effectiveness semantics, no-explicit-ALLOW/source-resource fallback behavior and final DENY reducer/audit semantics. Full signed access additionally requires step-up/residency policy and signed-grant TTL/provider composition. REST exposure, DD-076 evaluator, concrete AI Gateway and event/webhook runtime remain separate unfinished governed scopes.

Evidence: `Registers/DEVELOPMENT_DD085_VERIFICATION_2026-09-21.md`.

RawSource accepted blobs unchanged; main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; PR #2 remains draft/unmerged.
