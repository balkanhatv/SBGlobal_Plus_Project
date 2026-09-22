# Development DD-104 verification — 2026-09-22

**Branch:** `docs/architecture-branch-2`  
**Verified executable HEAD/tree:** `d02fd15421e41f4d1feee9e6725cc171f188c02a` / `a9f68aa0c5f3cf559319da324ec902f05c25c344`  
**Checkpoint target:** `DEV-WORKFLOW-TRANSITION-READ-001`

## Source audit and implementation

`Development/WORKFLOW_TRANSITION_READER_PREREQUISITE_OWNERSHIP_AUDIT.md` reconciled migration 0026 WorkflowTransition schema/parent FORCE-RLS, migration 0027 append-only Workflow worker privileges, migration 0031 parent-scope/actor integrity, DD-102 WorkflowInstance persistence and the dedicated Workflow PostgreSQL boundary.

DD-104 adds:
- `src/core/workflow/transition.ts`;
- Core export;
- `src/server/workflow/postgres-workflow-transition-store.ts`;
- `tests/postgres/workflow-transition-store.test.mjs`;
- DD-104 decision and WTR-PG-001…007 acceptance traceability.

The reader is exact-by-id and preserves raw append-only transition evidence. It revalidates positive decimal expected/resulting versions and `resulting > expected` without JS-number coercion. It does not select or authorize a transition, evaluate WorkflowDefinition state-machine/approval/rule JSON, mutate WorkflowInstance or WorkflowTask, or emit downstream events.

## Exact-head CI evidence

| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / Core | 35687267334 | 106616658164 | **311/311 PASS**, 0 fail, 0 skip |
| Core Service Verify / PostgreSQL | 35687267334 | 106616658240 | **176/176 PASS**, 0 fail, 0 skip |
| Database Verify | 35687267384 | 106616658762 | **PASS**, 47 migrations + 41 verification files |
| Web Boundary Verify | 35687267353 | 106616658102 | **PASS**, TypeScript + Next.js build |

Workflow logs assert exact executable head `d02fd15421e41f4d1feee9e6725cc171f188c02a` and tree `a9f68aa0c5f3cf559319da324ec902f05c25c344`.

## Acceptance and invariants

WTR-PG-001…007 pass:
- exact Tenant Industry transition preserves raw from/action/to/actor/reason/correlation/time evidence;
- sibling Industry and foreign Tenant rows are hidden by parent FORCE-RLS;
- Tenant Core transition remains same-Tenant visible from Industry and Tenant Core contexts;
- large bigint expected/resulting versions are preserved losslessly as decimal text;
- schema-permitted raw text remains evidence only;
- Workflow worker UPDATE/DELETE attempts are denied, preserving append-only runtime evidence;
- malformed id/route mismatch fails closed.

Repository decisions are contiguous through **DD-104** and the exact feature tree contains **516 blobs / 209 Markdown / 130 TypeScript source files / 75 test files**, plus **47 migrations / 41 verification files**. No migration or verification SQL changed.

RawSource blobs remain `a9f63a64448a347edd0f2b0c74094284ee953c1b` and `91c461de5e0d171f71d0bb89cd039953a1f1ecfd`. Main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; no merge is performed.

## Remaining boundary

WorkflowTransition persistence is not transition authority. State-machine/approval/rule evaluation, transition selection/authorization, optimistic WorkflowInstance mutation, task action/mutation and downstream event emission remain unimplemented. Further work must source-audit the next independent Workflow slice before implementation.
