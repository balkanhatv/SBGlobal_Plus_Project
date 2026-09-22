# PROJECT_STATE — SBGlobal Plus
**Updated:** 2026-09-22 · **Checkpoint:** `DEV-TENANT-INTEGRATION-READ-001`

Branch: `docs/architecture-branch-2`. Development remains **IN PROGRESS**.

Verified executable `6f16090eb4e74bbb6142f4bbb4f3b4e16e55c0e0` / tree `28af11f04a35f698b5324d40dc1bacfbfd4d68e3`: **311/311 Core**, **121/121 PostgreSQL**, **47 migrations / 41 SQL verification files bootstrap**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests. Verified executable inventory: **472 blobs / 192 Markdown / 110 source / 68 test files**.

DD-095 adds a raw TenantIntegration PostgreSQL reader by id through the fixed Integration service role and RequestScopedSql. It preserves RLS-scoped Tenant/Industry ownership, definition id, raw status, CredentialReference id, config JSON, capability codes, optional permission profile, health evidence and version without turning those facts into enabled/executable/provider authority or reading secret-reference metadata.

Invariants remain **9 Industries / 41 canonical MS / 181 registered Industry tables**, **2,962 unchanged source requirement IDs/text**, and contiguous **ADR-001–020 / DD-001–095**.

Provider execution, secrets, enablement/health decisions and other documented unfinished runtime scopes remain unclaimed.

Next: Source-audit the next independent source-complete Integration persistence slice from this checkpoint. CredentialReference secret retrieval, ProviderAdapter execution/selection, TenantIntegration enablement/health decisions, webhook network/signing/filter/retry runtime, event dispatch mutation/retry/DLQ, Document policy/signing, REST exposure, DD-076 evaluator and concrete AI Gateway remain unfinished on their named prerequisites.

Evidence: `Registers/DEVELOPMENT_DD095_VERIFICATION_2026-09-22.md`.

RawSource accepted blobs unchanged; main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; PR #2 remains draft/unmerged.
