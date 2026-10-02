# D-INDEX — Current Canonical / Development Index
**Current checkpoint:** `DEV-AUTOMATION-RUN-VISIBLE-DEFINITION-WORKFLOW-CURRENT-EVIDENCE-READER-001`
**Current executable audit basis:** `cda146975415a8024bb54512e53bdca57a8913a1` / tree `bfa3a468991c02c0a9f45e8ca70d025b66dc68d1`
**Updated:** 2026-10-02 · **Branch:** `docs/architecture-branch-2`

> **Current audit gate (2026-10-02):** DD-378…DD-382 AutomationRun→AutomationDefinition→optional WorkflowDefinition current-evidence composition is implemented and exact-head verified at the basis above. This canonical promotion must independently pass before batch closure. Complete-project downstream audit remains **CLEAN / CLOSED** through VC27-111. Production readiness is **NOT CLAIMED**.

DD-378…DD-382 is the current governed backend-only AutomationRun→AutomationDefinition→optional WorkflowDefinition current-evidence composition. It reuses DD-372 parent evidence first, avoids a duplicate AutomationDefinition read, follows only the exact optional WorkflowDefinition id in the same RequestContext, re-applies DD-176 and returns immutable layered exact-reference evidence.

Verified implementation basis `cda146975415a8024bb54512e53bdca57a8913a1` / tree `bfa3a468991c02c0a9f45e8ca70d025b66dc68d1`: **1150/1150 Core**, **529/529 PostgreSQL**, **48 migrations / 42 SQL verification files**, Database/Web PASS; zero failed/skipped tests.

The DD-372 AutomationRun/AutomationDefinition parent envelope is preserved exactly and AutomationDefinition is not re-read. A broader PLATFORM WorkflowDefinition hidden from a Tenant RequestContext remains hidden; no PLATFORM_GLOBAL fallback/elevation is attempted. Definition selection, trigger/condition/state-machine interpretation, retry/transition authorization, dispatch, mutation and execution remain separately governed. Frontend/UI remains untouched.

Evidence: `Registers/DEVELOPMENT_DD378_DD382_VERIFICATION_2026-10-02.md`. Source audit: `Development/AUTOMATION_RUN_VISIBLE_DEFINITION_WORKFLOW_CONTAINMENT_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. Current status is bounded Development **IN PROGRESS**; production readiness is **NOT CLAIMED**.

Next: Verify this canonical promotion at its exact HEAD with Core/PostgreSQL/Database/Web. Once green, record promotion evidence and close DD-378…DD-382 before the next independently source-complete backend batch.

Invariants: **9 equal Industries / 41 canonical MS / 181 Industry tables / 2,962 preserved source requirements**; exactly `TENANT_STAFF_APP` and `TENANT_USER_APP` as logical Tenant mobile app classes. RawSource unchanged; `main` unmerged; PR #2 draft/unmerged.
