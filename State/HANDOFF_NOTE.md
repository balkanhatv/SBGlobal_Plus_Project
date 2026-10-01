# HANDOFF_NOTE — SBGlobal Plus
**Current checkpoint:** `DEV-WORKFLOW-INSTANCE-VISIBLE-DEFINITION-CURRENT-EVIDENCE-READER-001`
**Current executable audit basis:** `981eba90e72106a68dcfb70d658f7b5ebb530dc6` / tree `02a545cd982a980c13de86116b7569579c894c92`
**Updated:** 2026-10-01 · **Branch:** `docs/architecture-branch-2`

> **Current audit gate (2026-10-01):** DD-353…DD-357 WorkflowInstance visible WorkflowDefinition current-evidence reader is implemented and exact-head verified at the basis above. This canonical promotion must independently pass before batch closure. Complete-project downstream audit remains **CLEAN / CLOSED** through VC27-111 with open current-scope P0/P1 = 0. Production readiness is **NOT CLAIMED**.

DD-353…DD-357 is the current governed backend-only WorkflowInstance visible-definition current-evidence reader batch. It reads the visible WorkflowInstance first, follows only its persisted WorkflowDefinition id under the exact same RequestContext, re-applies DD-173 and returns immutable exact-reference evidence.

Verified implementation basis `981eba90e72106a68dcfb70d658f7b5ebb530dc6` / tree `02a545cd982a980c13de86116b7569579c894c92`: **1109/1109 Core**, **529/529 PostgreSQL**, **48 migrations / 42 SQL verification files**, Database/Web PASS; zero failed/skipped tests.

Frontend/UI remains untouched. PLATFORM_GLOBAL fallback resolution, active-version selection, creator currentness, currentState/stateMachine validation, approval/rule evaluation, WorkflowTask/WorkflowTransition authorization, state mutation, event emission and worker execution remain separately governed.

Evidence: `Registers/DEVELOPMENT_DD353_DD357_VERIFICATION_2026-10-01.md`. Source audit: `Development/WORKFLOW_INSTANCE_VISIBLE_DEFINITION_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. Current status is bounded Development **IN PROGRESS**; production readiness is **NOT CLAIMED**.

Next: this canonical promotion must independently pass exact-head Core/PostgreSQL/Database/Web. Once green, record promotion evidence and close DD-353…DD-357 before opening the next independently source-complete governed backend batch.

Invariants: **9 equal Industries / 41 canonical MS / 181 Industry tables / 2,962 preserved source requirements**; exactly `TENANT_STAFF_APP` and `TENANT_USER_APP` as logical Tenant mobile app classes. RawSource unchanged; `main` unmerged; PR #2 draft/unmerged.










Fetch the branch again before continuation. Re-bind to the latest HEAD; the DD-225…DD-230 canonical promotion must pass exact-head Core/PostgreSQL/Database/Web and then close batch state before another independently source-complete governed batch opens. Do not infer live AI authorization, routing or execution semantics.


