# HANDOFF_NOTE — SBGlobal Plus
**Updated:** 2026-09-23 · **Checkpoint:** `DEV-FORM-DEFINITION-READ-001`

Fresh-fetch remote branch/HEAD/tree/checks before further work.

Verified executable `25acd95e67b3af83066027eed8fbae5b2c2b8b65` / tree `3b5b35ec691376b4396d97660113c8153dbcf711`: **311/311 Core**, **385/385 PostgreSQL**, **47 migrations / 41 SQL verification files**, Next.js build and Database Verify PASS. Zero failed/skipped tests.

Promotion invariant gate `3c15f21fe991c69f770da8cca6d66a0144caa307` / tree `35aa579d111ac7b7127148debcd517d0412b2724`: Core run `35862282150` (Core job `107185140792`, PostgreSQL job `107185140646`), Database run `35862282115` (job `107185140616`), Web run `35862282331` (job `107185141532`) — SUCCESS; **135 unique DD definitions**, 9 Industries, 41 canonical MS, 181 Industry tables, 2,962 preserved requirements.

DD-135 adds an exact-by-id scoped `core_config.form_definition` raw parent persistence reader through the existing `PostgresDatabase` + `RequestScopedSql` application boundary. PLATFORM/TENANT/INDUSTRY FORCE-RLS visibility, raw code/version/status/schema version, purpose/submit references, immutable layout JSON, raw frozen validation-rule/surface arrays, localization evidence, creator/approver references and optional effective/audit timestamps remain persisted evidence only. ACTIVE/layout/rule/surface/submit evidence does not mean selected/current/effective/expanded/rendered/validated/submitted form. Existing table privileges plus migration 0029/0032 write hardening remain schema-owned; the DD-135 port is read-only.

Read `Development/FORM_DEFINITION_RAW_PERSISTENCE_READER_PREREQUISITE_OWNERSHIP_AUDIT.md` and `Registers/DEVELOPMENT_DD135_VERIFICATION_2026-09-23.md` before extending form behavior.

Next: Fresh source-audit the next independent source-complete Core persistence slice. Keep FormFieldDefinition expansion, field semantics, current/effective FormDefinition selection, rendering/layout compilation, RuleDefinition resolution/validation-chain execution, submit-operation binding/invocation and definition mutation outside scope unless separately source-owned.

RawSource accepted blobs remain immutable; `main` remains unmerged; PR #2 remains draft/unmerged.
