# CORE SERVICE CHECKPOINT — DEV-METADATA-DEFINITION-READ-001
**Updated:** 2026-09-23 · **Branch:** `docs/architecture-branch-2`

Verified executable `a1ca7fd78a1d099c74f11d3c71a8f7be3418e032` / tree `0f68a014750d91e90bedceaa6059b921c2fa65f5`: **311/311 Core**, **371/371 PostgreSQL**, **47 migrations / 41 SQL verification files**, Next.js build and Database Verify PASS. Zero failed/skipped tests.

Promotion invariant gate `de4a44c8944180ee1f18ce42b61a312b807b952e` / tree `b14d96fd38b9dd49545695a8766530b83e6dc93b`: Core run `35858660793` (Core job `107173187619`, PostgreSQL job `107173187435`), Database run `35858660746` (job `107173187544`), Web run `35858660771` (job `107173187119`) — SUCCESS; **133 unique DD definitions**, 9 Industries, 41 canonical MS, 181 Industry tables, 2,962 preserved requirements.

DD-133 adds an exact-by-id scoped `core_config.metadata_definition` raw persistence reader through the existing `PostgresDatabase` + `RequestScopedSql` application boundary. PLATFORM/TENANT/INDUSTRY FORCE-RLS visibility, raw code/kind, positive version/schema version, constrained lifecycle status, immutable schema JSON, creator/approver references and optional effective timestamps remain persisted evidence only. ACTIVE/effective timestamps do not mean selected/current/effective/validated/compiled metadata. Existing `sbg_app_rw` DML authority remains schema-owned; the DD-133 port is read-only.

`METADATADEF-PG-001`…`METADATADEF-PG-007` prove exact raw definition read, sibling-Industry/foreign-Tenant isolation, same-Tenant visibility, PLATFORM_GLOBAL-only PLATFORM visibility, immutable schema JSON, schema-valid empty/effective evidence preservation, fail-closed malformed/route behavior, and a read-only application port without relabeling existing database DML authority.

## Remaining scope

ACTIVE/current/latest MetadataDefinition selection, code/version fallback/inheritance/override precedence, publish/activate/retire/rollback mutation, JSON Schema/runtime payload validation, dynamic-field/FormDefinition/RuleDefinition compilation, effective metadata merge, cache/search/projection compilation, permission/entitlement evaluation and public-route exposure remain unimplemented unless separately source-owned.

Next: Fresh source-audit the next independent source-complete Core persistence slice. Keep effective metadata selection/merge, schema validation, dynamic compilation and definition mutation outside scope unless separately source-owned.

Evidence: `Registers/DEVELOPMENT_DD133_VERIFICATION_2026-09-23.md`.
