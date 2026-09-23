# HANDOFF_NOTE — SBGlobal Plus
**Updated:** 2026-09-23 · **Checkpoint:** `DEV-METADATA-DEFINITION-READ-001`

Fresh-fetch remote branch/HEAD/tree/checks before further work.

Verified executable `a1ca7fd78a1d099c74f11d3c71a8f7be3418e032` / tree `0f68a014750d91e90bedceaa6059b921c2fa65f5`: **311/311 Core**, **371/371 PostgreSQL**, **47 migrations / 41 SQL verification files**, Next.js build and Database Verify PASS. Zero failed/skipped tests.

Promotion invariant gate `de4a44c8944180ee1f18ce42b61a312b807b952e` / tree `b14d96fd38b9dd49545695a8766530b83e6dc93b`: Core run `35858660793` (Core job `107173187619`, PostgreSQL job `107173187435`), Database run `35858660746` (job `107173187544`), Web run `35858660771` (job `107173187119`) — SUCCESS; **133 unique DD definitions**, 9 Industries, 41 canonical MS, 181 Industry tables, 2,962 preserved requirements.

DD-133 adds an exact-by-id scoped `core_config.metadata_definition` raw persistence reader through the existing `PostgresDatabase` + `RequestScopedSql` application boundary. PLATFORM/TENANT/INDUSTRY FORCE-RLS visibility, raw code/kind, positive version/schema version, constrained lifecycle status, immutable schema JSON, creator/approver references and optional effective timestamps remain persisted evidence only. ACTIVE/effective timestamps do not mean selected/current/effective/validated/compiled metadata. Existing `sbg_app_rw` DML authority remains schema-owned; the DD-133 port is read-only.

Read `Development/METADATA_DEFINITION_RAW_PERSISTENCE_READER_PREREQUISITE_OWNERSHIP_AUDIT.md` and `Registers/DEVELOPMENT_DD133_VERIFICATION_2026-09-23.md` before extending metadata behavior.

Next: Fresh source-audit the next independent source-complete Core persistence slice. Keep effective metadata selection/merge, schema validation, dynamic compilation and definition mutation outside scope unless separately source-owned.

RawSource accepted blobs remain immutable; `main` remains unmerged; PR #2 remains draft/unmerged.
