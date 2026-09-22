# CORE SERVICE CHECKPOINT — DEV-WORKFLOW-TRANSITION-READ-001
**Updated:** 2026-09-22 · **Branch:** `docs/architecture-branch-2`

## Verified executable basis

Verified executable `d02fd15421e41f4d1feee9e6725cc171f188c02a` / tree `a9f68aa0c5f3cf559319da324ec902f05c25c344`: **311/311 Core**, **176/176 PostgreSQL**, **47 migrations / 41 SQL verification files**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests. Inventory: **516 blobs / 209 Markdown / 130 source / 75 test files**.

## Implemented boundary

DD-104 adds an exact-by-id raw WorkflowTransition PostgreSQL reader through the existing dedicated `sbg_workflow_worker_rw` NOBYPASSRLS + `RequestScopedSql` boundary. It preserves raw from/action/to/reason evidence, actor/correlation/timestamp and exact bigint version evidence while revalidating `resultingInstanceVersion > expectedInstanceVersion`, without selecting or authorizing a next transition or mutating WorkflowInstance/task/event state.

WTR-PG-001…007 prove exact Industry parent-RLS isolation, Tenant Core same-Tenant visibility, foreign-Tenant isolation, raw text fidelity, large bigint version fidelity and runtime UPDATE/DELETE denial for append-only transition evidence.

DD-103 WorkflowTask, DD-102 WorkflowInstance and DD-101 WorkflowDefinition raw readers remain covered. No migration, verification SQL, role, grant or RLS policy changed in DD-104.

## Remaining scope

WorkflowTransition evidence cannot authorize execution. State-machine/approval/rule evaluation, transition selection/authorization, optimistic WorkflowInstance mutation, task action/mutation and event emission remain unimplemented.

Next: Source-audit the next independent source-complete Workflow persistence slice. Do not open workflow execution semantics unless source-owned. Notification runtime, secret retrieval, webhook/event runtime, Document signing, REST exposure, DD-076 and concrete AI Gateway remain unfinished.

Evidence: `Registers/DEVELOPMENT_DD104_VERIFICATION_2026-09-22.md`.

RawSource accepted blobs unchanged; main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; PR #2 remains draft/unmerged.
