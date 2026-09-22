# HANDOFF_NOTE — SBGlobal Plus
**Updated:** 2026-09-22 · **Checkpoint:** `DEV-WORKFLOW-TASK-READ-001`

Fresh-fetch remote branch/HEAD/tree/checks before further work.

Verified executable `b2fb888477cffd20acb5eacc7c2f453824a4b44d` / tree `3df197ea82c2284470daeb0e0a14c35016ff4b50`: **311/311 Core**, **169/169 PostgreSQL**, **47 migrations / 41 SQL verification files**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests. Inventory: **511 blobs / 207 Markdown / 128 source / 74 test files**.

DD-103 adds an exact-by-id raw WorkflowTask PostgreSQL reader through the existing dedicated `sbg_workflow_worker_rw` NOBYPASSRLS + RequestScopedSql boundary. It preserves task type, PRINCIPAL/ROLE/ORG_UNIT assignment, permission code, task state, due/claim/completion evidence and row-version without deciding assignee eligibility or claim/approve/reject/complete authority.

Read `Development/WORKFLOW_TASK_READER_PREREQUISITE_OWNERSHIP_AUDIT.md` before extending task behavior. DD-103 is raw persistence only: assignment/state/due/claim/completion evidence does not authorize a task action.

Next: Source-audit WorkflowTransition raw append-only persistence as the next independent source-complete Workflow slice. Transition rows remain evidence only; expected/resulting version facts must not become transition authorization, state-machine/rule execution or WorkflowInstance mutation authority. Notification runtime, secret retrieval, webhook/event runtime, Document signing, REST exposure, DD-076 and concrete AI Gateway remain unfinished.

Evidence: `Registers/DEVELOPMENT_DD103_VERIFICATION_2026-09-22.md`.

RawSource accepted blobs unchanged; main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; PR #2 remains draft/unmerged.
