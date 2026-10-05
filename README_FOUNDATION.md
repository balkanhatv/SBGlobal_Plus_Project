# SBGlobal Plus — Canonical Development Branch
**Current checkpoint:** `DEV-WORKFLOW-TASK-VISIBLE-DEFINITION-ACTING-RBAC-CURRENT-EVIDENCE-READER-001`
**Current executable audit basis:** `8f52a253c65553124adcc7301ae8f2cfe84f0277` / tree `79d5769f28d9f89017bdef9da10c9336d9edc66b`
**Updated:** 2026-10-05 · **Branch:** `docs/architecture-branch-2`

> **Current audit gate (2026-10-05):** DD-483…DD-487 canonical promotion passed exact-head Core/PostgreSQL/Database/Web at the basis above. This state-closure commit must independently pass before batch closure. Complete-project downstream audit remains **CLEAN / CLOSED** through VC27-111. Production readiness is **NOT CLAIMED**.

DD-483…DD-487 is the current governed backend-only WorkflowTask visible WorkflowDefinition + acting-principal current compiled-RBAC necessary-evidence composition. It reuses exact DD-482 task/instance/definition evidence, performs exactly one Authorization read for persisted WorkflowTask.permissionCode, and reuses the DD-475 protected-Tenant RBAC ALLOW floor.

Verified canonical promotion basis `8f52a253c65553124adcc7301ae8f2cfe84f0277` / tree `79d5769f28d9f89017bdef9da10c9336d9edc66b`: **1326/1326 Core**, **532/532 PostgreSQL** plus full bootstrap, **48 migrations / 42 SQL verification files**, Database/Web PASS; zero failed/skipped tests.

WorkflowTask assignment/current claimant/completer, due/expiry/task-action semantics, WorkflowInstance lifecycle/state, WorkflowDefinition effectiveFrom/effectiveTo/stateMachine/approvalPolicy/ruleRefs and applicable ABAC remain raw/uninterpreted. This evidence adds no full AuthorizationDecision, GuardPipeline, task-action, transition, mutation/event, worker dispatch or workflow execution authority.

Evidence: `Registers/DEVELOPMENT_DD483_DD487_VERIFICATION_2026-10-05.md`. Source audit: `Development/WORKFLOW_TASK_VISIBLE_DEFINITION_ACTING_RBAC_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. Current status is bounded Development **IN PROGRESS**; production readiness is **NOT CLAIMED**.

Next: Verify this state-closure commit at its exact HEAD with Core/PostgreSQL/Database/Web. Once green, DD-483…DD-487 is closed; source-audit the next independently source-complete backend batch.

Invariants: **9 equal Industries / 41 canonical MS / 181 Industry tables / 2,962 preserved source requirements**; exactly `TENANT_STAFF_APP` and `TENANT_USER_APP` as logical Tenant mobile app classes. RawSource unchanged; `main` unmerged; PR #2 draft/unmerged.
