# CORE SERVICE CHECKPOINT — DEV-FORM-FIELD-DEFINITION-READ-001
**Updated:** 2026-09-23 · **Branch:** `docs/architecture-branch-2`

Verified executable `9a679117f07da46e61709519f7ed0a9b0b86ab4b` / tree `7bfe5afa3a751817e438b4b4d1e5dbf35c543af8`: **311/311 Core**, **392/392 PostgreSQL**, **47 migrations / 41 SQL verification files**, Next.js build and Database Verify PASS. Zero failed/skipped tests.

Promotion invariant gate `7ea2ff44e999a9422f61e598340fc39a09683ced` / tree `f189919723ff9667f221024da50204f879a7cf79`: Core run `35863943108` (Core job `107190697712`, PostgreSQL job `107190698052`), Database run `35863942902` (job `107190697121`), Web run `35863942830` (job `107190696746`) — SUCCESS; **136 unique DD definitions**, 9 Industries, 41 canonical MS, 181 Industry tables, 2,962 preserved requirements.

DD-136 adds an exact-by-id `core_config.form_field_definition` raw child persistence reader through the existing `PostgresDatabase` + `RequestScopedSql` application boundary. Visibility remains parent-FormDefinition-derived FORCE-RLS: Tenant parent is same-Tenant visible, Industry parent requires exact Industry Context, and PLATFORM parent requires trusted PLATFORM_GLOBAL context; parent lifecycle status is not promoted into visibility. Raw field key/type/label/required/read-only/visibility/validation/reference/sort/sensitivity evidence remains non-enforcing, non-rendering, non-validating, non-authorizing and non-submitting. Existing table privileges and the migration-0032 PLATFORM-parent child write floor remain schema-owned; the DD-136 port is read-only.

`FORMFIELD-PG-001`…`FORMFIELD-PG-007` prove exact child read, sibling-Industry/foreign-Tenant isolation through parent-derived FORCE-RLS, same-Tenant visibility even under a non-ACTIVE parent, PLATFORM_GLOBAL-only PLATFORM-parent visibility, immutable validation JSON, schema-valid empty/nullable/negative-sort evidence preservation, fail-closed malformed/route behavior, and a read-only application port without converting field metadata into runtime behavior.

## Remaining scope

ACTIVE/current/effective FormDefinition selection; sibling field listing/ordering; required/read-only enforcement; field-type parsing/coercion/rendering; label/localization resolution; visibility RuleDefinition evaluation; validation schema/chain execution; reference-catalog resolution; sensitivity masking/redaction/access policy; layout composition; submit OperationContract binding/invocation; permission/entitlement evaluation; form/field mutation; caches/search/projections; and public-route exposure remain unimplemented unless separately source-owned.

Next: Fresh source-audit the next independent source-complete Core persistence slice. Keep FormDefinition current/effective selection, sibling field listing/ordering, field enforcement/rendering, visibility/validation rule execution, catalog resolution, sensitivity policy, layout composition, submit-operation invocation and form/field mutation outside scope unless separately source-owned.

Evidence: `Registers/DEVELOPMENT_DD136_VERIFICATION_2026-09-23.md`.
