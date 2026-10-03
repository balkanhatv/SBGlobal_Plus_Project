# DD-134 Development Verification — RuleDefinition Raw Persistence Reader

**Date:** 2026-09-23  
**Branch:** `docs/architecture-branch-2`  
**Prior promoted checkpoint:** `DEV-METADATA-DEFINITION-READ-001`  
**Prior DD-133 promoted state basis:** `cb92b9d0f9e93423459c349a15fc414ef67604b2`

## 1. Source-first ownership audit

Fresh source reconciliation selected one exact `core_config.rule_definition` row as the next independent source-complete Core persistence slice after DD-133.

Audit commit: `df1755361dc942284ed9f00db482d822526b6ce0`.  
Audit artifact: `Development/RULE_DEFINITION_RAW_PERSISTENCE_READER_PREREQUISITE_OWNERSHIP_AUDIT.md`.

Reconciled sources include migration 0001 physical schema/FORCE-RLS, migration 0009 application-role table privileges, later scope/write hardening through migration 0032 where applicable, A-01 Rules/Policy ownership, DD-030 declarative/safe-expression boundary, and the existing `PostgresDatabase` + `RequestScopedSql` boundary.

## 2. Bounded implementation

Implementation commit: `2fa1f6d6f3f8be92ea9f3cca6970bcf72f3398a3`.  
Implementation tree: `1d1fb8a4f7abc3184e8796db6d8225075683f4a7`.

Changed implementation/test surface:

- `src/core/config/rule-definition.ts`;
- `src/server/config/postgres-rule-definition-store.ts`;
- `tests/postgres/rule-definition-store.test.mjs`;
- `src/core/index.ts` export only.

No migration, schema, verification SQL, role, grant, RLS policy, product policy, public/API route or rule evaluator was added.

## 3. Read contract

The reader returns only exact persisted evidence: owner scope, optional Tenant/Industry ownership, raw code, positive version/schema version, constrained lifecycle status, recursively normalized/frozen input-schema/condition-AST/decision JSON, any safe-integer priority, constrained safety class, optional raw required-permission text, creator/optional approver UUIDs, optional effective timestamps and audit timestamps.

Schema-valid empty text, negative priority and non-ordered effective/audit timestamps are preserved. ACTIVE/status/priority/safety/permission/condition/decision evidence is not interpreted as current/effective selection, evaluation, authorization or application authority.

## 4. Exact implementation-head CI

Exact tested implementation head: `2fa1f6d6f3f8be92ea9f3cca6970bcf72f3398a3`.

- Core Service Verify run `35860230502`, Core job `107178360701`: **SUCCESS**, **311/311 Core**.
- Same run, PostgreSQL/RLS job `107178361062`: **SUCCESS**, **378/378 PostgreSQL**, including `RULEDEF-PG-001…007`.
- Database Verify run `35860230486`, job `107178359670`: **SUCCESS**.
- Web Boundary Verify run `35860230491`, job `107178359690`: **SUCCESS**.

## 5. Canonical DD / acceptance traceability

Canonical DD/acceptance commit: `7aa5d4026dcd5321d450cf2181cdeda8408847d8` / tree `b3ca9b7bfe98bc2826f43bf2b7e3b074bb318932`.

It adds exactly one DD-134 definition, one DD-134 acceptance block, and one DD-134 changelog entry.

## 6. Promotion invariant gate

- Core run `35860587616`: Core job `107179547972` **SUCCESS**; PostgreSQL job `107179547675` **SUCCESS**.
- Database run `35860587705`, job `107179547851`: **SUCCESS**.
- Web run `35860587681`, job `107179547939`: **SUCCESS**.
- Counts: **311/311 Core**, **378/378 PostgreSQL**, **47 migrations / 41 SQL verification files**.
- Invariants: **134 unique contiguous DD definitions / 9 Industries / 41 canonical MS / 181 registered Industry tables / 2,962 preserved requirement IDs/text**.

This gate authorizes promotion to `DEV-RULE-DEFINITION-READ-001`; it does not expand DD-134 semantics.

## 7. Explicitly unclaimed

DD-134 does not select current/effective rules; resolve code/version fallback/inheritance/overrides; mutate definition lifecycle; validate runtime input schemas or safe-expression publication; parse/evaluate condition ASTs; interpret/apply decision JSON; order/resolve rule conflicts by priority; enforce safety class; evaluate required permissions; execute business/configuration/validation rules; perform Authorization PDP behavior; bind FormDefinitions/validation chains; compile caches/search/projections; or expose a public route.

## 8. Safety

- All repository mutations are forward-only; no force-push.
- `main` remains unmerged.
- RawSourceCorpus is untouched.
- PR #2 remains review-only/draft unless explicitly authorized.
