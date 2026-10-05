# D-INDEX — Current Canonical / Development Index
**Current checkpoint:** `DEV-DOCUMENT-ACCESS-ACL-CURRENT-EFFECT-EVIDENCE-READER-001`
**Current executable audit basis:** `ebc1738ac8ffc63cc545f69e9638c326904a22b1` / tree `c0c77d73b43d95fb85d3e5dfde3734d6e6e588e5`
**Updated:** 2026-10-05 · **Branch:** `docs/architecture-branch-2`

> **Current audit gate (2026-10-05):** DD-558…DD-562 canonical promotion passed exact-head Core/PostgreSQL/Database/Web at the basis above. This state-closure commit must independently pass before batch closure. Complete-project downstream audit remains **CLEAN / CLOSED** through VC27-111. Production readiness is **NOT CLAIMED**.

DD-558…DD-562 is the current governed backend-only Document ACL subject-match + current-time/effect evidence composition. It invokes exact DD-542 once, partitions matched ACL entries by optional validUntil against one explicit trusted currentTimeIso, and applies explicit-DENY-wins only within current matched ACL evidence.

Verified canonical promotion basis `ebc1738ac8ffc63cc545f69e9638c326904a22b1` / tree `c0c77d73b43d95fb85d3e5dfde3734d6e6e588e5`: **1453/1453 Core**, **536/536 PostgreSQL** plus full bootstrap, **48 migrations / 42 SQL verification files**, Database/Web PASS; zero failed/skipped tests.

Success preserves the exact DD-542 parent and exact matched-entry references. effectEvidence DENY/ALLOW/NONE is ACL-layer evidence only; source-resource fallback, permission/entitlement/RBAC/ABAC, sensitivity/residency/step-up, storage binding/signing/grants/download/share/delete/mutation authority remain separate.

Evidence: `Registers/DEVELOPMENT_DD558_DD562_VERIFICATION_2026-10-05.md`. Source audit: `Development/DOCUMENT_ACCESS_ACL_CURRENT_EFFECT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. Current status is bounded Development **IN PROGRESS**; production readiness is **NOT CLAIMED**.

Next: Verify this state-closure commit at its exact HEAD with Core/PostgreSQL/Database/Web. Once green, DD-558…DD-562 is closed; source-audit the next independently source-complete backend batch.

Invariants: **9 equal Industries / 41 canonical MS / 181 Industry tables / 2,962 preserved source requirements**; exactly `TENANT_STAFF_APP` and `TENANT_USER_APP` as logical Tenant mobile app classes. RawSource unchanged; `main` unmerged; PR #2 draft/unmerged.
