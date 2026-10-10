# Development DD-103 verification — 2026-09-22

**Branch:** `docs/architecture-branch-2`  
**Verified executable HEAD/tree:** `b2fb888477cffd20acb5eacc7c2f453824a4b44d` / `3df197ea82c2284470daeb0e0a14c35016ff4b50`  
**Checkpoint target:** `DEV-WORKFLOW-TASK-READ-001`

## Source audit and implementation

`Development/WORKFLOW_TASK_READER_PREREQUISITE_OWNERSHIP_AUDIT.md` reconciled migration 0026 WorkflowTask schema/parent-RLS, migration 0027 Workflow worker privileges, migration 0031 parent/assignee/claimant/completer integrity and the DD-102 WorkflowInstance boundary.

DD-103 adds:
- `src/core/workflow/task.ts`;
- Core export;
- `src/server/workflow/postgres-workflow-task-store.ts`;
- `tests/postgres/workflow-task-store.test.mjs`;
- DD-103 decision and WFT-PG-001…007 acceptance traceability.

The reader is exact-by-id and preserves raw persistence evidence. It does not match the current principal to the assigned subject, interpret permission code, authorize task actions, apply due/expiry policy or mutate the parent WorkflowInstance.

## CI-discovered fixture correction

Initial feature head `7782535f4162db5fc7f908eebe654950849973d6` reached the PostgreSQL fixture but failed before reader assertions. Run `35686659651`, job `106614829099`, reported `workflow assignee principal is outside tenant`.

The cause was fixture parameter binding: WorkflowInstance UUID parameter slots were reused where PRINCIPAL subject/claim/completion UUIDs were intended. Commit `b2fb888477cffd20acb5eacc7c2f453824a4b44d` separates the instance, principal, role and OrgUnit parameter slots. No production code, schema, privilege or policy changed.

## Exact-head CI evidence

| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / Core | 35686768851 | 106615160472 | **311/311 PASS**, 0 fail, 0 skip |
| Core Service Verify / PostgreSQL | 35686768851 | 106615160188 | **169/169 PASS**, 0 fail, 0 skip |
| Database Verify | 35686768854 | 106615160180 | **PASS**, 47 migrations + 41 verification files |
| Web Boundary Verify | 35686768836 | 106615160154 | **PASS**, TypeScript + Next.js build |

Push Core Service Verify `35686764698` independently passed the same exact head, including **169/169 PostgreSQL**.

## Acceptance and invariants

WFT-PG-001…007 pass:
- exact Industry PRINCIPAL task preserves raw state/due/version evidence;
- ROLE and ORG_UNIT assignment rows preserve persisted claim/completion evidence without eligibility decisions;
- sibling Industry and foreign Tenant tasks are hidden by parent FORCE-RLS;
- Tenant Core task remains same-Tenant visible from Industry and Tenant Core contexts;
- schema-allowed empty permission code, non-positive rowVersion and non-monotonic created/updated timestamps remain raw evidence;
- terminal task state does not surface task-action or parent-transition authority;
- malformed id/route mismatch fails closed.

Repository decisions are exactly **DD-001…103**, no duplicate/missing IDs. Inventory is **511 blobs / 207 Markdown / 128 TypeScript source files / 74 test files**. No migration or verification SQL changed.

RawSource blobs remain `a9f63a64448a347edd0f2b0c74094284ee953c1b` and `91c461de5e0d171f71d0bb89cd039953a1f1ecfd`. Main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; no merge is performed.

## Remaining boundary

WorkflowTask raw evidence is not action authority. WorkflowTransition append-only persistence is the next source-audit candidate; transition selection, WorkflowInstance mutation, state-machine/rule execution and task actions remain unimplemented.
