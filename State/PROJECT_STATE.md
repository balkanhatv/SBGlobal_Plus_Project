# PROJECT_STATE — SBGlobal Plus
**Current checkpoint:** `DEV-WORKFLOW-TASK-ACTING-RBAC-CURRENT-EVIDENCE-READER-001`
**Current executable audit basis:** `3e3f18723e6caec609077f618b447e9df9ba23a3` / tree `362ec8fcf7b1906b3cff88ac3ae15ec4240f300d`
**Updated:** 2026-10-04 · **Branch:** `docs/architecture-branch-2`

> **Current audit gate (2026-10-04):** DD-473…DD-477 WorkflowTask acting-principal current RBAC necessary evidence is implemented and exact-head verified at the basis above. This canonical promotion must independently pass before batch closure. Complete-project downstream audit remains **CLEAN / CLOSED** through VC27-111. Production readiness is **NOT CLAIMED**.

DD-473…DD-477 is the current governed backend-only WorkflowTask acting-principal current-RBAC necessary-evidence composition. It reuses exact DD-362 WorkflowTask→WorkflowInstance evidence, performs exactly one Authorization read with the unchanged RequestContext and exact persisted WorkflowTask.permissionCode, and requires the Authorization-owned generic protected-Tenant current compiled RBAC ALLOW floor.

Verified exact-head implementation basis `3e3f18723e6caec609077f618b447e9df9ba23a3` / tree `362ec8fcf7b1906b3cff88ac3ae15ec4240f300d`: **1310/1310 Core**, **532/532 PostgreSQL** plus full bootstrap, **48 migrations / 42 SQL verification files**, Database/Web PASS; zero failed/skipped tests.

Applicable ABAC policies and WorkflowTask/WorkflowInstance assignment/state/lifecycle evidence remain raw. RBAC ALLOW is necessary permission evidence only; it does not resolve assignee/claimant/completer currentness, due/expiry, task actions, full AuthorizationDecision/GuardPipeline, WorkflowTransition, mutation/event, worker dispatch or workflow execution.

Evidence: `Registers/DEVELOPMENT_DD473_DD477_VERIFICATION_2026-10-04.md`. Source audit: `Development/WORKFLOW_TASK_ACTING_RBAC_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. Current status is bounded Development **IN PROGRESS**; production readiness is **NOT CLAIMED**.

Next: Verify this canonical promotion at its exact HEAD with Core/PostgreSQL/Database/Web. Once green, record promotion evidence and stage DD-473…DD-477 state closure before another source audit.

Invariants: **9 equal Industries / 41 canonical MS / 181 Industry tables / 2,962 preserved source requirements**; exactly `TENANT_STAFF_APP` and `TENANT_USER_APP` as logical Tenant mobile app classes. RawSource unchanged; `main` unmerged; PR #2 draft/unmerged.
