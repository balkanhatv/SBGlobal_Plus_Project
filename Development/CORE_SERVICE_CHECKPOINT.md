# CORE SERVICE CHECKPOINT — DEV-FORM-DEFINITION-READ-001
**Updated:** 2026-09-23 · **Branch:** `docs/architecture-branch-2`

Verified executable `25acd95e67b3af83066027eed8fbae5b2c2b8b65` / tree `3b5b35ec691376b4396d97660113c8153dbcf711`: **311/311 Core**, **385/385 PostgreSQL**, **47 migrations / 41 SQL verification files**, Next.js build and Database Verify PASS. Zero failed/skipped tests.

Promotion invariant gate `3c15f21fe991c69f770da8cca6d66a0144caa307` / tree `35aa579d111ac7b7127148debcd517d0412b2724`: Core run `35862282150` (Core job `107185140792`, PostgreSQL job `107185140646`), Database run `35862282115` (job `107185140616`), Web run `35862282331` (job `107185141532`) — SUCCESS; **135 unique DD definitions**, 9 Industries, 41 canonical MS, 181 Industry tables, 2,962 preserved requirements.

DD-135 adds an exact-by-id scoped `core_config.form_definition` raw parent persistence reader through the existing `PostgresDatabase` + `RequestScopedSql` application boundary. PLATFORM/TENANT/INDUSTRY FORCE-RLS visibility, raw code/version/status/schema version, purpose/submit references, immutable layout JSON, raw frozen validation-rule/surface arrays, localization evidence, creator/approver references and optional effective/audit timestamps remain persisted evidence only. ACTIVE/layout/rule/surface/submit evidence does not mean selected/current/effective/expanded/rendered/validated/submitted form. Existing table privileges plus migration 0029/0032 write hardening remain schema-owned; the DD-135 port is read-only.

`FORMDEF-PG-001`…`FORMDEF-PG-007` prove exact raw parent definition read, sibling-Industry/foreign-Tenant isolation, same-Tenant visibility, PLATFORM_GLOBAL-only PLATFORM visibility, immutable layout JSON, raw duplicate/null text-array preservation, schema-valid empty/effective evidence preservation, fail-closed malformed/route behavior, and a read-only application port without turning parent evidence into field/render/validation/submit authority.

## Remaining scope

ACTIVE/current/latest FormDefinition selection; code/version fallback/inheritance/override precedence; publish/activate/retire/rollback mutation; FormFieldDefinition listing/resolution; field semantics; layout validation/rendering/compilation; RuleDefinition resolution/evaluation and validation-chain execution; submit OperationContract binding/invocation; surface eligibility enforcement; localization resolution; metadata/dynamic-field compilation; permission/entitlement evaluation; and public-route exposure remain unimplemented unless separately source-owned.

Next: Fresh source-audit the next independent source-complete Core persistence slice. Keep FormFieldDefinition expansion, field semantics, current/effective FormDefinition selection, rendering/layout compilation, RuleDefinition resolution/validation-chain execution, submit-operation binding/invocation and definition mutation outside scope unless separately source-owned.

Evidence: `Registers/DEVELOPMENT_DD135_VERIFICATION_2026-09-23.md`.
