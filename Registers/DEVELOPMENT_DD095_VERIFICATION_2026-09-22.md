# Development DD-095 verification — 2026-09-22

**Branch:** `docs/architecture-branch-2`  
**Verified executable HEAD/tree:** `6f16090eb4e74bbb6142f4bbb4f3b4e16e55c0e0` / `28af11f04a35f698b5324d40dc1bacfbfd4d68e3`  
**Checkpoint target:** `DEV-TENANT-INTEGRATION-READ-001`

## Source audit and implementation

`Development/TENANT_INTEGRATION_READER_PREREQUISITE_OWNERSHIP_AUDIT.md` reconciled DD-06, migration 0025 TenantIntegration schema/FORCE-RLS, migration 0028 Integration role privileges and DD-092…094 registry readers.

DD-095 adds:
- `src/core/integration/tenant-integration.ts`;
- `src/server/integration/postgres-tenant-integration-store.ts`;
- Core export;
- INT-TENANT-PG-001…005 PostgreSQL acceptance and DD traceability.

The store reads one RLS-visible TenantIntegration id through the fixed Integration service role plus RequestScopedSql. It preserves raw status, CredentialReference identifier, config JSON, capability codes, optional permission profile, health state and version. It never joins CredentialReference secret metadata or makes provider/capability execution decisions.

## CI-discovered fixture correction

Initial exact head `27cf4b4c4cbeeebf362fc10594fe59721a00d783` failed PostgreSQL because the test fixture enabled `orders.write` without an ACTIVE IntegrationCapability row. Migration 0030 correctly enforces that every enabled capability exists and is ACTIVE under the IntegrationDefinition. The fixture was narrowed to `orders.read`; the trigger and product contract were not changed.

## Exact-head CI evidence

| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / Core | 35682222004 | 106601402371 | **311/311 PASS**, 0 fail, 0 skip |
| Core Service Verify / PostgreSQL | 35682222004 | 106601402406 | **121/121 PASS**, 0 fail, 0 skip |
| Database Verify | 35682226052 | 106601414979 | **PASS**, 47 migrations + 41 verification files |
| Web Boundary Verify | 35682226192 | 106601415341 | **PASS**, TypeScript + Next.js build |

Workflow logs assert exact executable head `6f16090eb4e74bbb6142f4bbb4f3b4e16e55c0e0` / tree `28af11f04a35f698b5324d40dc1bacfbfd4d68e3`.

## Acceptance and invariants

INT-TENANT-PG-001…005 pass. Existing INT-ADAPTER/CAP/DEF, Event/Webhook, Document and prior Core/PostgreSQL coverage remains green. Invariants remain 9 Industries / 41 canonical MS / 181 Industry tables, 2,962 source requirement IDs/text, ADR-001–020 / DD-001–095, 47 migrations / 41 verification files.

Verified executable inventory: **472 blobs / 192 Markdown / 110 TypeScript source files / 68 test files**. No migration or verification SQL changed.

RawSource blobs remain `a9f63a64448a347edd0f2b0c74094284ee953c1b` and `91c461de5e0d171f71d0bb89cd039953a1f1ecfd`. Main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; no merge is performed.

## Remaining boundary

TenantIntegration persistence does not authorize provider/capability execution. CredentialReference secret retrieval, ProviderAdapter selection/runtime and health/enablement decisions remain separate source-audited work.
