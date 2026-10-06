# SBGlobal Plus — Canonical Development Branch
**Current checkpoint:** `DEV-DOCUMENT-DERIVATIVE-PARENT-ACL-CURRENT-EFFECT-EVIDENCE-READER-001`
**Current executable audit basis:** `06c99d9b5b48b522b7788dac6a0a260d51a8c48b` / tree `f463c2608eca4a85c557e5f3f5db177d9c00cefb`
**Updated:** 2026-10-06 · **Branch:** `docs/architecture-branch-2`

> **Current audit gate (2026-10-06):** DD-588…DD-592 canonical promotion passed exact-head Core/PostgreSQL/Database/Web at the basis above. This state-closure commit must independently pass before batch closure. Complete-project downstream audit remains **CLEAN / CLOSED** through VC27-111. Production readiness is **NOT CLAIMED**.

DD-588…DD-592 is the current governed backend-only Document derivative-parent paired ACL subject/current-effect evidence composition. It reuses exact DD-587 paired raw ACL evidence, applies the same exact RequestContext + explicit ACL permission through DD-085 independently to derivative and parent, then applies the same exact trusted currentTimeIso through the shared DD-558…DD-561 reducer independently to each side.

Verified canonical promotion basis `06c99d9b5b48b522b7788dac6a0a260d51a8c48b` / tree `f463c2608eca4a85c557e5f3f5db177d9c00cefb`: **1500/1500 Core**, **540/540 PostgreSQL** plus full bootstrap, **48 migrations / 42 SQL verification files**, Database/Web PASS; zero failed/skipped tests.

Success preserves the exact DD-587 parent/raw ACL evidence plus exact matcher-returned arrays and immutable derivative/parent current/expired/effect evidence. The two sides are never compared: no broader/equal/narrower or ACL non-widening verdict, source-resource fallback, final authorization, signing/grant/download/share/delete/StoragePort dispatch, mutation or event authority is introduced.

Evidence: `Registers/DEVELOPMENT_DD588_DD592_VERIFICATION_2026-10-06.md`. Source audit: `Development/DOCUMENT_DERIVATIVE_PARENT_ACL_CURRENT_EFFECT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. Current status is bounded Development **IN PROGRESS**; production readiness is **NOT CLAIMED**.

Next: Verify this state-closure commit at its exact HEAD with Core/PostgreSQL/Database/Web. Once green, DD-588…DD-592 is closed; source-audit the next independently source-complete backend batch.

Invariants: **9 equal Industries / 41 canonical MS / 181 Industry tables / 2,962 preserved source requirements**; exactly `TENANT_STAFF_APP` and `TENANT_USER_APP` as logical Tenant mobile app classes. RawSource unchanged; `main` unmerged; PR #2 draft/unmerged.
