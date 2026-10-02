# D-INDEX — Current Canonical / Development Index
**Current checkpoint:** `DEV-AUTOMATION-RUN-VISIBLE-DEFINITION-WORKFLOW-CURRENT-EVIDENCE-READER-001`
**Current executable audit basis:** `11153944df9ccae7bcb57cda80140765f20693d5` / tree `03309620b36aaa22ed35825176dfeb1827acb42e`
**Updated:** 2026-10-02 · **Branch:** `docs/architecture-branch-2`

> **Current audit gate (2026-10-02):** DD-378…DD-382 canonical promotion passed exact-head Core/PostgreSQL/Database/Web at the basis above. This state-closure commit must independently pass before batch closure. Complete-project downstream audit remains **CLEAN / CLOSED** through VC27-111. Production readiness is **NOT CLAIMED**.

DD-378…DD-382 is the current governed backend-only AutomationRun→AutomationDefinition→optional WorkflowDefinition current-evidence composition. It reuses DD-372 parent evidence first, avoids a duplicate AutomationDefinition read, follows only the exact optional WorkflowDefinition id in the same RequestContext, re-applies DD-176 and returns immutable layered exact-reference evidence.

Verified canonical promotion basis `11153944df9ccae7bcb57cda80140765f20693d5` / tree `03309620b36aaa22ed35825176dfeb1827acb42e`: **1150/1150 Core**, **529/529 PostgreSQL**, **48 migrations / 42 SQL verification files**, Database/Web PASS; zero failed/skipped tests.

The DD-372 AutomationRun/AutomationDefinition parent envelope is preserved exactly and AutomationDefinition is not re-read. A broader PLATFORM WorkflowDefinition hidden from a Tenant RequestContext remains hidden; no PLATFORM_GLOBAL fallback/elevation is attempted. Definition selection, trigger/condition/state-machine interpretation, retry/transition authorization, dispatch, mutation and execution remain separately governed. Frontend/UI remains untouched.

Evidence: `Registers/DEVELOPMENT_DD378_DD382_VERIFICATION_2026-10-02.md`. Source audit: `Development/AUTOMATION_RUN_VISIBLE_DEFINITION_WORKFLOW_CONTAINMENT_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. Current status is bounded Development **IN PROGRESS**; production readiness is **NOT CLAIMED**.

Next: Verify this state-closure commit at its exact HEAD with Core/PostgreSQL/Database/Web. Once green, DD-378…DD-382 is closed; source-audit the next independently source-complete backend batch.

Invariants: **9 equal Industries / 41 canonical MS / 181 Industry tables / 2,962 preserved source requirements**; exactly `TENANT_STAFF_APP` and `TENANT_USER_APP` as logical Tenant mobile app classes. RawSource unchanged; `main` unmerged; PR #2 draft/unmerged.
