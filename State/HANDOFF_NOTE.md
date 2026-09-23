# HANDOFF_NOTE — SBGlobal Plus
**Updated:** 2026-09-23 · **Checkpoint:** `DEV-FORM-FIELD-DEFINITION-READ-001`

Fresh-fetch remote branch/HEAD/tree/checks before further work.

Verified executable `9a679117f07da46e61709519f7ed0a9b0b86ab4b` / tree `7bfe5afa3a751817e438b4b4d1e5dbf35c543af8`: **311/311 Core**, **392/392 PostgreSQL**, **47 migrations / 41 SQL verification files**, Next.js build and Database Verify PASS. Zero failed/skipped tests.

Promotion invariant gate `7ea2ff44e999a9422f61e598340fc39a09683ced` / tree `f189919723ff9667f221024da50204f879a7cf79`: Core run `35863943108` (Core job `107190697712`, PostgreSQL job `107190698052`), Database run `35863942902` (job `107190697121`), Web run `35863942830` (job `107190696746`) — SUCCESS; **136 unique DD definitions**, 9 Industries, 41 canonical MS, 181 Industry tables, 2,962 preserved requirements.

DD-136 adds an exact-by-id `core_config.form_field_definition` raw child persistence reader through the existing `PostgresDatabase` + `RequestScopedSql` application boundary. Visibility remains parent-FormDefinition-derived FORCE-RLS: Tenant parent is same-Tenant visible, Industry parent requires exact Industry Context, and PLATFORM parent requires trusted PLATFORM_GLOBAL context; parent lifecycle status is not promoted into visibility. Raw field key/type/label/required/read-only/visibility/validation/reference/sort/sensitivity evidence remains non-enforcing, non-rendering, non-validating, non-authorizing and non-submitting. Existing table privileges and the migration-0032 PLATFORM-parent child write floor remain schema-owned; the DD-136 port is read-only.

Read `Development/FORM_FIELD_DEFINITION_RAW_PERSISTENCE_READER_PREREQUISITE_OWNERSHIP_AUDIT.md` and `Registers/DEVELOPMENT_DD136_VERIFICATION_2026-09-23.md` before extending field behavior.

Next: Fresh source-audit the next independent source-complete Core persistence slice. Keep FormDefinition current/effective selection, sibling field listing/ordering, field enforcement/rendering, visibility/validation rule execution, catalog resolution, sensitivity policy, layout composition, submit-operation invocation and form/field mutation outside scope unless separately source-owned.

RawSource accepted blobs remain immutable; `main` remains unmerged; PR #2 remains draft/unmerged.
