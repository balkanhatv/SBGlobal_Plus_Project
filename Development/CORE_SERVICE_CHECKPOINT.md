# CORE SERVICE CHECKPOINT — DEV-WORKFLOW-TASK-READ-001
**Updated:** 2026-09-22 · **Branch:** `docs/architecture-branch-2`

## Verified executable basis

Verified executable `b2fb888477cffd20acb5eacc7c2f453824a4b44d` / tree `3df197ea82c2284470daeb0e0a14c35016ff4b50`: **311/311 Core**, **169/169 PostgreSQL**, **47 migrations / 41 SQL verification files**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests. Inventory: **511 blobs / 207 Markdown / 128 source / 74 test files**.

## Implemented boundary

DD-103 adds an exact-by-id raw WorkflowTask PostgreSQL reader through the existing dedicated `sbg_workflow_worker_rw` NOBYPASSRLS + RequestScopedSql boundary. It preserves task type, PRINCIPAL/ROLE/ORG_UNIT assignment, permission code, task state, due/claim/completion evidence and row-version without deciding assignee eligibility or claim/approve/reject/complete authority.

WFT-PG-001…007 prove PRINCIPAL/ROLE/ORG_UNIT raw assignment fidelity, parent FORCE-RLS isolation, Tenant Core same-Tenant visibility, foreign-Tenant isolation and non-authorizing task state/due/claim/completion evidence.

The first DD-103 PostgreSQL attempt failed before reader assertions because the fixture reused WorkflowInstance UUID parameter slots as principal IDs. Commit `b2fb888477cffd20acb5eacc7c2f453824a4b44d` corrects only those fixture bindings; production code/schema/RLS semantics are unchanged.

DD-102 WorkflowInstance and DD-101 WorkflowDefinition raw readers remain covered. No migration, verification SQL, role, grant or RLS policy changed in DD-103.

## Remaining scope

WorkflowTask evidence cannot grant task actions. Assignee eligibility, permission interpretation, claim/approve/reject/complete authorization and parent transition mutation are not claimed.

Next: Source-audit WorkflowTransition raw append-only persistence as the next independent source-complete Workflow slice. Transition rows remain evidence only; expected/resulting version facts must not become transition authorization, state-machine/rule execution or WorkflowInstance mutation authority. Notification runtime, secret retrieval, webhook/event runtime, Document signing, REST exposure, DD-076 and concrete AI Gateway remain unfinished.

Evidence: `Registers/DEVELOPMENT_DD103_VERIFICATION_2026-09-22.md`.

RawSource accepted blobs unchanged; main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; PR #2 remains draft/unmerged.
