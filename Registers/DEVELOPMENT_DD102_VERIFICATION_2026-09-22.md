# Development DD-102 verification — 2026-09-22

**Branch:** `docs/architecture-branch-2`  
**Verified executable HEAD/tree:** `1dd0f3a5e06aaadf5d51dc24928d80cce773359f` / `187524ef8bd19470ccdb5235cc6cfb1758022b14`  
**Checkpoint target:** `DEV-WORKFLOW-INSTANCE-READ-001`

## Source audit and implementation

`Development/WORKFLOW_INSTANCE_READER_PREREQUISITE_OWNERSHIP_AUDIT.md` reconciled migration 0026 WorkflowInstance schema/FORCE-RLS, migration 0027 Workflow worker privileges, migration 0031 definition/version/scope + creator integrity and the DD-101 dedicated Workflow database boundary.

DD-102 adds:
- `src/core/workflow/instance.ts`;
- Core export;
- `src/server/workflow/postgres-workflow-instance-store.ts`;
- `tests/postgres/workflow-instance-store.test.mjs`;
- DD-102 decision and WFI-PG-001…007 acceptance traceability.

The reader is exact-by-id and preserves raw persistence evidence. It does not select transitions, interpret WorkflowDefinition state-machine JSON, evaluate approval/rules, authorize task actions, mutate rowVersion or emit workflow events.

## Exact-head CI evidence

| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / Core | 35686220702 | 106613460026 | **311/311 PASS**, 0 fail, 0 skip |
| Core Service Verify / PostgreSQL | 35686220702 | 106613460297 | **162/162 PASS**, 0 fail, 0 skip |
| Database Verify | 35686220679 | 106613459833 | **PASS**, 47 migrations + 41 verification files |
| Web Boundary Verify | 35686220695 | 106613459840 | **PASS**, TypeScript + Next.js build |

Workflow logs assert exact feature head `1dd0f3a5e06aaadf5d51dc24928d80cce773359f` / tree `187524ef8bd19470ccdb5235cc6cfb1758022b14`.

## Acceptance and invariants

WFI-PG-001…007 pass:
- exact Industry instance preserves definition/resource/current/lifecycle/row-version evidence;
- sibling Industry and foreign Tenant instances are hidden by FORCE-RLS;
- Tenant Core instance is same-Tenant visible from Industry and Tenant Core contexts;
- schema-allowed empty text, non-positive rowVersion and non-monotonic created/updated timestamps remain raw evidence;
- COMPLETED/CANCELLED state remains non-executing evidence;
- malformed id/route mismatch fails closed;
- exact-by-id read does not select alternate instance/definition.

Repository decision headings are exactly **DD-001…102**, no duplicate/missing IDs. Inventory is **506 blobs / 205 Markdown / 126 TypeScript source files / 73 test files**. No migration or verification SQL changed.

RawSource blobs remain `a9f63a64448a347edd0f2b0c74094284ee953c1b` and `91c461de5e0d171f71d0bb89cd039953a1f1ecfd`. Main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; no merge is performed.

## Remaining boundary

WorkflowInstance raw state is not transition authority. WorkflowTask raw persistence is the next source-audit candidate; claim/approve/reject/complete, transition authorization, state-machine/approval/rule execution and event emission remain unimplemented.
