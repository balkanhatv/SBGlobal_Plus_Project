# PROJECT_STATE — SBGlobal Plus
**Current checkpoint:** `DEV-AUTOMATION-DEFINITION-VISIBLE-WORKFLOW-CONTAINMENT-EVIDENCE-READER-001`
**Current executable audit basis:** `17b3367c8ab2c113c91f970ed1fbeaa66432a2aa` / tree `553c851c671add550b0f0ee17d7faac04d2909b2`
**Updated:** 2026-10-02 · **Branch:** `docs/architecture-branch-2`

> **Current audit gate (2026-10-02):** DD-373…DD-377 AutomationDefinition visible WorkflowDefinition containment-evidence reader is implemented and exact-head verified at the basis above. This canonical promotion must independently pass before batch closure. Complete-project downstream audit remains **CLEAN / CLOSED** through VC27-111. Production readiness is **NOT CLAIMED**.

DD-373…DD-377 is the current governed backend-only AutomationDefinition visible WorkflowDefinition containment-evidence reader batch. It reads the exact AutomationDefinition first; unbound definitions skip the WorkflowDefinition read, while bound definitions follow the exact persisted WorkflowDefinition id in the same RequestContext, re-apply DD-176 and return immutable exact-reference evidence.

Verified implementation basis `17b3367c8ab2c113c91f970ed1fbeaa66432a2aa` / tree `553c851c671add550b0f0ee17d7faac04d2909b2`: **1142/1142 Core**, **529/529 PostgreSQL**, **48 migrations / 42 SQL verification files**, Database/Web PASS; zero failed/skipped tests.

A broader PLATFORM WorkflowDefinition parent hidden from a Tenant RequestContext remains hidden; no PLATFORM_GLOBAL fallback/elevation is attempted. AutomationDefinition and WorkflowDefinition lifecycle/version/effective/stateMachine/approval/rule/trigger/config/condition/operation evidence remains raw; active-version selection, dispatch, mutation and Automation/Workflow execution remain separately governed. Frontend/UI remains untouched.

Evidence: `Registers/DEVELOPMENT_DD373_DD377_VERIFICATION_2026-10-02.md`. Source audit: `Development/AUTOMATION_DEFINITION_VISIBLE_WORKFLOW_CONTAINMENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. Current status is bounded Development **IN PROGRESS**; production readiness is **NOT CLAIMED**.

Next: Verify this canonical promotion at its exact HEAD with Core/PostgreSQL/Database/Web. Once green, record promotion evidence and close DD-373…DD-377 before the next independently source-complete backend batch.

Invariants: **9 equal Industries / 41 canonical MS / 181 Industry tables / 2,962 preserved source requirements**; exactly `TENANT_STAFF_APP` and `TENANT_USER_APP` as logical Tenant mobile app classes. RawSource unchanged; `main` unmerged; PR #2 draft/unmerged.
