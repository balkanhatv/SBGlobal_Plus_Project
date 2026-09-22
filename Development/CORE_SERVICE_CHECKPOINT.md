# CORE SERVICE CHECKPOINT — DEV-AUTOMATION-DEFINITION-READ-001
**Updated:** 2026-09-22 · **Branch:** `docs/architecture-branch-2`

## Verified executable basis

Verified executable `d654a5e8d969d880a0d9a5ebc064c924f6c25e8c` / tree `1a5a94a4c435b756e623a9cf4328cf04047d4409`: **311/311 Core**, **183/183 PostgreSQL**, **47 migrations / 41 SQL verification files**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests. Inventory: **521 blobs / 211 Markdown / 132 source / 76 test files**.

## Implemented boundary

DD-105 adds an exact-by-id raw AutomationDefinition PostgreSQL reader through the existing dedicated `sbg_workflow_worker_rw` NOBYPASSRLS + `RequestScopedSql` boundary. It preserves immutable trigger/config JSON plus raw condition-rule / OperationContract / WorkflowDefinition references, owner/lifecycle/effective evidence, without selecting or authorizing an automation or dispatching runtime work.

WFA-DEF-PG-001…007 prove exact Industry owner-RLS isolation, Tenant same-Tenant visibility, PLATFORM_GLOBAL-only platform visibility, foreign-Tenant isolation, raw evidence fidelity, fail-closed malformed/route mismatch handling and Workflow worker UPDATE denial.

DD-104 WorkflowTransition, DD-103 WorkflowTask, DD-102 WorkflowInstance and DD-101 WorkflowDefinition raw readers remain covered. No migration, verification SQL, role, grant or RLS policy changed in DD-105.

## Remaining scope

AutomationDefinition persistence cannot authorize execution. Active/effective selection, EVENT/SCHEDULE/MANUAL trigger interpretation, schedule/event selector parsing, condition evaluation, OperationContract dispatch, WorkflowDefinition execution and AutomationRun creation/mutation remain unimplemented.

Next: Source-audit the next independent source-complete Workflow/Automation persistence slice. Do not open automation runtime execution semantics unless source-owned. Notification runtime, secret retrieval, webhook/event runtime, Document signing, REST exposure, DD-076 and concrete AI Gateway remain unfinished.

Evidence: `Registers/DEVELOPMENT_DD105_VERIFICATION_2026-09-22.md`.

RawSource accepted blobs unchanged; main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; PR #2 remains draft/unmerged.
