# CORE SERVICE CHECKPOINT — DEV-RULE-DEFINITION-READ-001
**Updated:** 2026-09-23 · **Branch:** `docs/architecture-branch-2`

Verified executable `2fa1f6d6f3f8be92ea9f3cca6970bcf72f3398a3` / tree `1d1fb8a4f7abc3184e8796db6d8225075683f4a7`: **311/311 Core**, **378/378 PostgreSQL**, **47 migrations / 41 SQL verification files**, Next.js build and Database Verify PASS. Zero failed/skipped tests.

Promotion invariant gate `7aa5d4026dcd5321d450cf2181cdeda8408847d8` / tree `b3ca9b7bfe98bc2826f43bf2b7e3b074bb318932`: Core run `35860587616` (Core job `107179547972`, PostgreSQL job `107179547675`), Database run `35860587705` (job `107179547851`), Web run `35860587681` (job `107179547939`) — SUCCESS; **134 unique DD definitions**, 9 Industries, 41 canonical MS, 181 Industry tables, 2,962 preserved requirements.

DD-134 adds an exact-by-id scoped `core_config.rule_definition` raw persistence reader through the existing `PostgresDatabase` + `RequestScopedSql` application boundary. PLATFORM/TENANT/INDUSTRY FORCE-RLS visibility, raw code/version/status/schema version, immutable input-schema/condition-AST/decision JSON, signed safe-integer priority, safety class, optional required permission, creator/approver references and optional effective/audit timestamps remain persisted evidence only. ACTIVE/priority/safety/permission/condition/decision evidence does not mean selected/current/effective/evaluated/authorized/applied rule. Existing table privileges and later write floors remain schema-owned; the DD-134 port is read-only.

`RULEDEF-PG-001`…`RULEDEF-PG-007` prove exact raw rule-definition read, sibling-Industry/foreign-Tenant isolation, same-Tenant visibility, PLATFORM_GLOBAL-only PLATFORM visibility, immutable input-schema/condition-AST/decision JSON, schema-valid empty/negative-priority/effective evidence preservation, fail-closed malformed/route behavior, and a read-only application port without turning priority/safety/permission JSON into evaluation or authorization authority.

## Remaining scope

ACTIVE/current/latest RuleDefinition selection; code/version fallback/inheritance/override precedence; publish/activate/retire/rollback mutation; input-schema/runtime safe-expression validation; condition-AST evaluation; decision application; priority ordering/conflict resolution; safety-class runtime enforcement; required-permission evaluation; business/configuration/validation rule execution; FormDefinition binding/validation-chain composition; metadata/rule compilation; and public-route exposure remain unimplemented unless separately source-owned.

Next: Fresh source-audit the next independent source-complete Core persistence slice. Keep current/effective rule selection, runtime schema/safe-expression validation, rule evaluation/application, priority/conflict resolution, required-permission evaluation, FormDefinition binding/validation-chain composition and definition mutation outside scope unless separately source-owned.

Evidence: `Registers/DEVELOPMENT_DD134_VERIFICATION_2026-09-23.md`.
