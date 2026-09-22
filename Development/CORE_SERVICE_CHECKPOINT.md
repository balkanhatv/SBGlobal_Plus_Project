# CORE SERVICE CHECKPOINT — DEV-AUTOMATION-RUN-READ-001
**Updated:** 2026-09-22 · **Branch:** `docs/architecture-branch-2`

## Verified executable basis

Verified executable `0bd4cb33d07836f797d434b21d5e24fcee0a3641` / tree `e6630c0dc1d01b238e9299c6281cb3ce86ed76e6`: **311/311 Core**, **190/190 PostgreSQL**, **47 migrations / 41 SQL verification files**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests. Inventory: **526 blobs / 213 Markdown / 134 source / 77 test files**.

## Implemented boundary

DD-106 adds an exact-by-id raw AutomationRun PostgreSQL reader through the existing dedicated `sbg_workflow_worker_rw` NOBYPASSRLS + `RequestScopedSql` boundary. It preserves immutable persisted definition/scope/status/timing plus raw trigger reference, idempotency hash, correlation and optional last-error evidence without selecting/creating a run or deciding automation execution.

WFA-RUN-PG-001…007 prove exact Industry RLS isolation, same-Tenant Tenant-Core visibility, foreign-Tenant isolation, raw run evidence fidelity, fail-closed malformed/route mismatch handling, no trigger/retry/finality/next-state authority, and that the schema-owned Workflow worker AutomationRun UPDATE privilege remains while the DD-106 read port exposes no mutation method.

DD-105 AutomationDefinition, DD-104 WorkflowTransition, DD-103 WorkflowTask, DD-102 WorkflowInstance and DD-101 WorkflowDefinition raw readers remain covered. No migration, verification SQL, role, grant or RLS policy changed in DD-106.

## Remaining scope

AutomationRun persistence cannot authorize execution. Active/effective AutomationDefinition selection, trigger interpretation/execution, idempotency/replay authorization, retry/backoff/finality, AutomationRun status-transition authorization/runtime mutation, condition evaluation, OperationContract dispatch and WorkflowDefinition execution remain unimplemented.

Next: Source-audit the next independent source-complete Workflow/Automation persistence slice. Do not open automation runtime execution semantics unless source-owned. Notification runtime, secret retrieval, webhook/event runtime, Document signing, REST exposure, DD-076 and concrete AI Gateway remain unfinished.

Evidence: `Registers/DEVELOPMENT_DD106_VERIFICATION_2026-09-22.md`.

RawSource accepted blobs unchanged; main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; PR #2 remains draft/unmerged.
