# CORE SERVICE CHECKPOINT — DEV-INTEGRATION-DEFINITION-READ-001
**Updated:** 2026-09-22 · **Branch:** `docs/architecture-branch-2`

## Verified executable basis

Verified executable `df44b4b56164cf065cbc5d187072fb99c6cf6dd5` / tree `521ea55dfc70d4348bf2c58437e7c1d163493dd4`: **311/311 Core**, **108/108 PostgreSQL**, **47 migrations / 41 SQL verification files bootstrap**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests. Verified executable inventory: **460 blobs / 186 Markdown / 104 source / 68 test files**.

## Implemented boundary

DD-092 adds an exact primary-key IntegrationDefinition PostgreSQL reader through the fixed Integration service role. It preserves immutable registry identity/name/provider/capability metadata, adapter-contract version, PLATFORM/TENANT/INDUSTRY ownerScope, raw status/data-transfer classification, residency JSON and timestamps without inferring provider selection, Tenant enablement, health, compatibility or authorization.

INT-DEF-PG-001…004 prove exact row fidelity, immutable nested capability/residency metadata, raw RETIRED/ownerScope evidence, absent-id null behavior and malformed-id fail-closed behavior. No TenantIntegration, CredentialReference, ProviderAdapter or IntegrationCapability join is performed.

DD-091 Event Catalog, DD-090 Outbox Event and prior Integration/Document/Core checkpoints remain covered.

## Remaining scope

Registry metadata is not execution authority. No provider selection, capability enablement, health/residency fallback, credential access or registry mutation is claimed.

Next: IntegrationCapability exact definition+capability persistence is the next independent source-complete candidate for source audit. ProviderAdapter selection/execution, CredentialReference secret access, TenantIntegration enablement/health policy, webhook network/signing/filter/retry runtime, event dispatch mutation/retry/DLQ, Document policy/signing, REST exposure, DD-076 evaluator and concrete AI Gateway remain unfinished on their named prerequisites.

Evidence: `Registers/DEVELOPMENT_DD092_VERIFICATION_2026-09-22.md`.

RawSource accepted blobs unchanged; main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; PR #2 remains draft/unmerged.
