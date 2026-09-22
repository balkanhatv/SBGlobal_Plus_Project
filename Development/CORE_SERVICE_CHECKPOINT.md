# CORE SERVICE CHECKPOINT — DEV-TENANT-INTEGRATION-READ-001
**Updated:** 2026-09-22 · **Branch:** `docs/architecture-branch-2`

## Verified executable basis

Verified executable `6f16090eb4e74bbb6142f4bbb4f3b4e16e55c0e0` / tree `28af11f04a35f698b5324d40dc1bacfbfd4d68e3`: **311/311 Core**, **121/121 PostgreSQL**, **47 migrations / 41 SQL verification files bootstrap**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests. Verified executable inventory: **472 blobs / 192 Markdown / 110 source / 68 test files**.

## Implemented boundary

DD-095 adds a raw TenantIntegration PostgreSQL reader by id through the fixed Integration service role and RequestScopedSql. It preserves RLS-scoped Tenant/Industry ownership, definition id, raw status, CredentialReference id, config JSON, capability codes, optional permission profile, health evidence and version without turning those facts into enabled/executable/provider authority or reading secret-reference metadata.

INT-TENANT-PG-001…005 prove exact Industry visibility, sibling isolation, Tenant Core same-Tenant visibility, foreign-Tenant isolation, raw status/health/config/capability fidelity and malformed/route-mismatch fail-closed behavior.

The first DD-095 PostgreSQL attempt correctly exposed fixture drift against migration-0030 capability-integrity validation. The fixture was narrowed to an actually ACTIVE capability; the database trigger was not weakened.

DD-094 ProviderAdapter, DD-093 IntegrationCapability, DD-092 IntegrationDefinition and earlier Integration/Document/Core checkpoints remain covered.

## Remaining scope

TenantIntegration rows are persistence evidence, not execution authority. No secret-reference read, provider selection/runtime, health-policy decision or capability authorization is claimed.

Next: Source-audit the next independent source-complete Integration persistence slice from this checkpoint. CredentialReference secret retrieval, ProviderAdapter execution/selection, TenantIntegration enablement/health decisions, webhook network/signing/filter/retry runtime, event dispatch mutation/retry/DLQ, Document policy/signing, REST exposure, DD-076 evaluator and concrete AI Gateway remain unfinished on their named prerequisites.

Evidence: `Registers/DEVELOPMENT_DD095_VERIFICATION_2026-09-22.md`.

RawSource accepted blobs unchanged; main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; PR #2 remains draft/unmerged.
