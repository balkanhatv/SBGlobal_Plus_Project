# Development DD-092 verification — 2026-09-22

**Branch:** `docs/architecture-branch-2`  
**Verified executable HEAD/tree:** `df44b4b56164cf065cbc5d187072fb99c6cf6dd5` / `521ea55dfc70d4348bf2c58437e7c1d163493dd4`  
**Checkpoint target:** `DEV-INTEGRATION-DEFINITION-READ-001`

## Source audit and implementation

`Development/INTEGRATION_DEFINITION_READER_PREREQUISITE_OWNERSHIP_AUDIT.md` reconciled DD-06 Integration registry design, DD-17 Integration acceptance, migrations 0001/0025/0028 and the existing fixed-role Integration database.

DD-092 adds `src/core/integration/integration-definition.ts`,
`src/server/integration/postgres-integration-definition-store.ts`, the Core export,
INT-DEF-PG-001…004 PostgreSQL acceptance and DD/test traceability.

The reader performs one parameterized primary-key read, validates the persisted UUID,
PLATFORM/TENANT/INDUSTRY ownerScope, text, timestamps, arrays and JSON, freezes nested
data and returns null for absence. Raw registry status/classification is preserved
without provider-selection or enablement authority.

## Exact-head CI evidence

| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / Core | 35679648521 | 106593621870 | **311/311 PASS**, 0 fail, 0 skip |
| Core Service Verify / PostgreSQL | 35679648521 | 106593621739 | **108/108 PASS**, 0 fail, 0 skip |
| Database Verify | 35679648520 | 106593621782 | **PASS**, 47 migrations + 41 verification files |
| Web Boundary Verify | 35679648505 | 106593621539 | **PASS**, TypeScript + Next.js build |

Workflow logs assert exact executable head `df44b4b56164cf065cbc5d187072fb99c6cf6dd5` / tree `521ea55dfc70d4348bf2c58437e7c1d163493dd4`.

## Acceptance and invariants

INT-DEF-PG-001…004 pass. Existing Event Catalog/outbox/webhook/document/core suites remain green. Invariants remain 9 Industries / 41 canonical MS / 181 Industry tables, 2,962 source requirement IDs/text, ADR-001–020 / DD-001–092, 47 migrations / 41 verification files.

Verified executable inventory: **460 blobs / 186 Markdown / 104 TypeScript source files / 68 test files**. No migration or verification SQL changed.

RawSource accepted blobs remain `a9f63a64448a347edd0f2b0c74094284ee953c1b` and `91c461de5e0d171f71d0bb89cd039953a1f1ecfd`. Main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; no merge is performed.

## Remaining boundary

DD-092 exposes registry metadata only. It does not access credentials, join TenantIntegration, select a provider/adapter/capability, decide health/residency fallback, execute callbacks or mutate registry state.
