# SBGlobal Plus — Canonical Development Branch
**Current checkpoint:** `DEV-WORKFLOW-TASK-VISIBLE-DEFINITION-CURRENT-EVIDENCE-READER-001`
**Current executable audit basis:** `8f254a4f4ec72ae65149ac3143cbd3cdea754f0b` / tree `5fff5727e6c478490c0e017bbab1627425347d0f`
**Updated:** 2026-10-05 · **Branch:** `docs/architecture-branch-2`

> **Current audit gate (2026-10-05):** DD-478…DD-482 canonical promotion passed exact-head Core/PostgreSQL/Database/Web at the basis above. This state-closure commit must independently pass before batch closure. Complete-project downstream audit remains **CLEAN / CLOSED** through VC27-111. Production readiness is **NOT CLAIMED**.

DD-478…DD-482 is the current governed backend-only WorkflowTask→WorkflowInstance→visible current WorkflowDefinition evidence composition. It reuses exact DD-362 task/instance evidence, performs one same-RequestContext read for the exact persisted WorkflowDefinition id, and re-applies only DD-173 id/version/ACTIVE/owner-scope applicability with no PLATFORM_GLOBAL fallback.

Verified canonical promotion basis `8f254a4f4ec72ae65149ac3143cbd3cdea754f0b` / tree `5fff5727e6c478490c0e017bbab1627425347d0f`: **1318/1318 Core**, **532/532 PostgreSQL** plus full bootstrap, **48 migrations / 42 SQL verification files**, Database/Web PASS; zero failed/skipped tests.

WorkflowTask assignment/current claimant/completer, permissionCode, due/expiry/action semantics, WorkflowInstance currentState/lifecycle, and WorkflowDefinition effectiveFrom/effectiveTo/stateMachine/approvalPolicy/ruleRefs remain raw/uninterpreted. This evidence adds no task-action, transition, mutation/event, worker dispatch or workflow execution authority.

Evidence: `Registers/DEVELOPMENT_DD478_DD482_VERIFICATION_2026-10-05.md`. Source audit: `Development/WORKFLOW_TASK_VISIBLE_DEFINITION_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. Current status is bounded Development **IN PROGRESS**; production readiness is **NOT CLAIMED**.

Next: Verify this state-closure commit at its exact HEAD with Core/PostgreSQL/Database/Web. Once green, DD-478…DD-482 is closed; source-audit the next independently source-complete backend batch.

Invariants: **9 equal Industries / 41 canonical MS / 181 Industry tables / 2,962 preserved source requirements**; exactly `TENANT_STAFF_APP` and `TENANT_USER_APP` as logical Tenant mobile app classes. RawSource unchanged; `main` unmerged; PR #2 draft/unmerged.
