# SBGlobal Plus — Canonical Development Branch
**Current checkpoint:** `DEV-DOCUMENT-DERIVATIVE-PARENT-RAW-ACL-EVIDENCE-READER-001`
**Current executable audit basis:** `64da5e29121ee3541fb0eac3ffcb1287e2207150` / tree `c5225e4b1223d896ef9f3c0f8119fb77ea677af7`
**Updated:** 2026-10-06 · **Branch:** `docs/architecture-branch-2`

> **Current audit gate (2026-10-06):** DD-583…DD-587 canonical promotion passed exact-head Core/PostgreSQL/Database/Web at the basis above. This state-closure commit must independently pass before batch closure. Complete-project downstream audit remains **CLEAN / CLOSED** through VC27-111. Production readiness is **NOT CLAIMED**.

DD-583…DD-587 is the current governed backend-only Document derivative-parent raw paired ACL evidence composition. It reuses exact DD-582 derivative-parent current evidence, then performs one exact same-RequestContext DD-084 raw ACL read for the derivative and one for the parent, requiring only exact returned-row document binding.

Verified canonical promotion basis `64da5e29121ee3541fb0eac3ffcb1287e2207150` / tree `c5225e4b1223d896ef9f3c0f8119fb77ea677af7`: **1491/1491 Core**, **540/540 PostgreSQL** plus full bootstrap, **48 migrations / 42 SQL verification files**, Database/Web PASS; zero failed/skipped tests.

Success preserves the exact DD-582 parent plus exact derivative/parent ACL array and entry references. The arrays remain raw evidence only: no ACL comparison, inheritance, merge, reduction, expiry/effect interpretation, subject matching or derivative ACL non-widening decision is introduced; no final authorization, signing/grant/download/share/delete/StoragePort dispatch, mutation or event authority is added.

Evidence: `Registers/DEVELOPMENT_DD583_DD587_VERIFICATION_2026-10-06.md`. Source audit: `Development/DOCUMENT_DERIVATIVE_PARENT_RAW_ACL_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. Current status is bounded Development **IN PROGRESS**; production readiness is **NOT CLAIMED**.

Next: Verify this state-closure commit at its exact HEAD with Core/PostgreSQL/Database/Web. Once green, DD-583…DD-587 is closed; source-audit the next independently source-complete backend batch.

Invariants: **9 equal Industries / 41 canonical MS / 181 Industry tables / 2,962 preserved source requirements**; exactly `TENANT_STAFF_APP` and `TENANT_USER_APP` as logical Tenant mobile app classes. RawSource unchanged; `main` unmerged; PR #2 draft/unmerged.
