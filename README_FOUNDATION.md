# SBGlobal Plus — Canonical Development Branch
**Current checkpoint:** `DEV-AUTOMATION-RUN-VISIBLE-DEFINITION-CURRENT-EVIDENCE-READER-001`
**Current executable audit basis:** `1835994b2e5238390365e4e2ca12702eb02289c4` / tree `7c2acda6ac22fe334601eee0401d6f34253298ef`
**Updated:** 2026-10-02 · **Branch:** `docs/architecture-branch-2`

> **Current audit gate (2026-10-02):** DD-368…DD-372 canonical promotion passed exact-head Core/PostgreSQL/Database/Web at the basis above. This state-closure commit must independently pass before batch closure. Complete-project downstream audit remains **CLEAN / CLOSED** through VC27-111. Production readiness is **NOT CLAIMED**.

DD-368…DD-372 is the current governed backend-only AutomationRun visible AutomationDefinition current-evidence reader batch. It reads the exact AutomationRun first, follows its persisted AutomationDefinition id in the same RequestContext, re-applies DD-175 and returns immutable exact-reference evidence.

Verified canonical promotion basis `1835994b2e5238390365e4e2ca12702eb02289c4` / tree `7c2acda6ac22fe334601eee0401d6f34253298ef`: **1134/1134 Core**, **529/529 PostgreSQL**, **48 migrations / 42 SQL verification files**, Database/Web PASS; zero failed/skipped tests.

PLATFORM AutomationDefinition evidence remains hidden in Tenant contexts when the raw reader cannot see it; no PLATFORM_GLOBAL fallback/elevation is attempted. Trigger/idempotency/run-state/error and definition trigger/config/condition/operation/workflow/version/effective evidence remain raw; retry, state-transition, dispatch, mutation and execution remain separately governed. Frontend/UI remains untouched.

Evidence: `Registers/DEVELOPMENT_DD368_DD372_VERIFICATION_2026-10-02.md`. Source audit: `Development/AUTOMATION_RUN_VISIBLE_DEFINITION_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. Current status is bounded Development **IN PROGRESS**; production readiness is **NOT CLAIMED**.

Next: Verify this state-closure commit at its exact HEAD with Core/PostgreSQL/Database/Web. Once green, DD-368…DD-372 is closed; source-audit the next independently source-complete backend batch.

Invariants: **9 equal Industries / 41 canonical MS / 181 Industry tables / 2,962 preserved source requirements**; exactly `TENANT_STAFF_APP` and `TENANT_USER_APP` as logical Tenant mobile app classes. RawSource unchanged; `main` unmerged; PR #2 draft/unmerged.
