# Development DD-093 verification — 2026-09-22

**Branch:** `docs/architecture-branch-2`  
**Verified executable HEAD/tree:** `31ff08fb962c09167b9c4e545593755a2b7111df` / `c6762fa966eba0754db56273de619af93985cf5f`  
**Checkpoint target:** `DEV-INTEGRATION-CAPABILITY-READ-001`

## Source audit and implementation

`Development/INTEGRATION_CAPABILITY_READER_PREREQUISITE_OWNERSHIP_AUDIT.md` reconciled DD-06, DD-17, migration 0025 IntegrationCapability/direction tuple, migration 0028 read privileges, DD-092 registry ownership and the fixed Integration database.

DD-093 adds `src/core/integration/integration-capability.ts`,
`src/server/integration/postgres-integration-capability-store.ts`, Core export,
INT-CAP-PG-001…004 PostgreSQL acceptance and DD/test traceability.

The reader requires the exact IntegrationDefinition id + capability code tuple,
validates UUID/direction/text/arrays, freezes event types and returns null rather than
falling back across definitions/capabilities. Raw status/classification remains
evidence only.

## Exact-head CI evidence

| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / Core | 35680045012 | 106594843238 | **311/311 PASS**, 0 fail, 0 skip |
| Core Service Verify / PostgreSQL | 35680045012 | 106594843012 | **112/112 PASS**, 0 fail, 0 skip |
| Database Verify | 35680045013 | 106594843215 | **PASS**, 47 migrations + 41 verification files |
| Web Boundary Verify | 35680045021 | 106594843115 | **PASS**, TypeScript + Next.js build |

Workflow logs assert exact executable head `31ff08fb962c09167b9c4e545593755a2b7111df` / tree `c6762fa966eba0754db56273de619af93985cf5f`.

## Acceptance and invariants

INT-CAP-PG-001…004 pass. Existing IntegrationDefinition/Event Catalog/outbox/webhook/document/core suites remain green. Invariants remain 9 Industries / 41 canonical MS / 181 Industry tables, 2,962 source requirement IDs/text, ADR-001–020 / DD-001–093, 47 migrations / 41 verification files.

Verified executable inventory: **464 blobs / 188 Markdown / 106 TypeScript source files / 68 test files**. No migration or verification SQL changed.

RawSource accepted blobs remain `a9f63a64448a347edd0f2b0c74094284ee953c1b` and `91c461de5e0d171f71d0bb89cd039953a1f1ecfd`. Main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; no merge is performed.

## Remaining boundary

DD-093 exposes capability mapping evidence only. It does not enable a Tenant capability, select/execute ProviderAdapter, dispatch OperationContract/events, apply rate/idempotency/data policy or access credentials.
