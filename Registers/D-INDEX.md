# D-INDEX — Current Canonical / Development Index
**Current checkpoint:** `DEV-WORKFLOW-TASK-ACTING-RBAC-CURRENT-EVIDENCE-READER-001`
**Current executable audit basis:** `8b1c99e13a92c770f045b009196b78b4f61898b5` / tree `f8759ac3b89949495854abbaab11ca555c27433d`
**Updated:** 2026-10-04 · **Branch:** `docs/architecture-branch-2`

> **Current audit gate (2026-10-04):** DD-473…DD-477 canonical promotion passed exact-head Core/PostgreSQL/Database/Web at the basis above. This state-closure commit must independently pass before batch closure. Complete-project downstream audit remains **CLEAN / CLOSED** through VC27-111. Production readiness is **NOT CLAIMED**.

DD-473…DD-477 is the current governed backend-only WorkflowTask acting-principal current-RBAC necessary-evidence composition. It reuses exact DD-362 WorkflowTask→WorkflowInstance evidence, performs exactly one Authorization read with the unchanged RequestContext and exact persisted WorkflowTask.permissionCode, and requires the Authorization-owned generic protected-Tenant current compiled RBAC ALLOW floor.

Verified canonical promotion basis `8b1c99e13a92c770f045b009196b78b4f61898b5` / tree `f8759ac3b89949495854abbaab11ca555c27433d`: **1310/1310 Core**, **532/532 PostgreSQL** plus full bootstrap, **48 migrations / 42 SQL verification files**, Database/Web PASS; zero failed/skipped tests.

Applicable ABAC policies and WorkflowTask/WorkflowInstance assignment/state/lifecycle evidence remain raw. RBAC ALLOW is necessary permission evidence only; it does not resolve assignee/claimant/completer currentness, due/expiry, task actions, full AuthorizationDecision/GuardPipeline, WorkflowTransition, mutation/event, worker dispatch or workflow execution.

Evidence: `Registers/DEVELOPMENT_DD473_DD477_VERIFICATION_2026-10-04.md`. Source audit: `Development/WORKFLOW_TASK_ACTING_RBAC_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. Current status is bounded Development **IN PROGRESS**; production readiness is **NOT CLAIMED**.

Next: Verify this state-closure commit at its exact HEAD with Core/PostgreSQL/Database/Web. Once green, DD-473…DD-477 is closed; source-audit the next independently source-complete backend batch.

Invariants: **9 equal Industries / 41 canonical MS / 181 Industry tables / 2,962 preserved source requirements**; exactly `TENANT_STAFF_APP` and `TENANT_USER_APP` as logical Tenant mobile app classes. RawSource unchanged; `main` unmerged; PR #2 draft/unmerged.
