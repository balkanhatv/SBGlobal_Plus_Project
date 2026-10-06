# PROJECT_STATE — SBGlobal Plus
**Current checkpoint:** `DEV-DOCUMENT-ACCESS-ACL-CURRENT-EFFECT-STORAGE-BINDING-EVIDENCE-READER-001`
**Current executable audit basis:** `66d6a0b6bbbd0aa694768a03ec05af8c28ac4926` / tree `b0eafbc82217c76999c09e07c66f90498fa3ce9c`
**Updated:** 2026-10-06 · **Branch:** `docs/architecture-branch-2`

> **Current audit gate (2026-10-06):** DD-563…DD-567 Document ACL current-effect + physical StorageObject binding evidence is exact-head verified at the basis above. This canonical promotion must independently pass before batch closure. Complete-project downstream audit remains **CLEAN / CLOSED** through VC27-111. Production readiness is **NOT CLAIMED**.

DD-563…DD-567 is the current governed backend-only Document ACL current-effect + physical StorageObject binding evidence composition. It invokes exact DD-562 once, then performs exactly one DD-086 physical binding read using only the preserved candidate documentId/storageObjectId linkage.

Verified exact-head implementation-evidence basis `66d6a0b6bbbd0aa694768a03ec05af8c28ac4926` / tree `b0eafbc82217c76999c09e07c66f90498fa3ce9c`: **1461/1461 Core**, **536/536 PostgreSQL** plus full bootstrap, **48 migrations / 42 SQL verification files**, Database/Web PASS; zero failed/skipped tests.

Success preserves the exact DD-562 parent and exact DD-086 binding references. current/expired ACL partitions, effectEvidence and private provider/bucket/key/version/integrity facts remain bounded evidence only; source-resource fallback, final authorization, permission/entitlement/RBAC/ABAC, sensitivity/residency/step-up, provider selection/decryption, signing/grants/download/share/delete/dispatch/mutation authority remain separate.

Evidence: `Registers/DEVELOPMENT_DD563_DD567_VERIFICATION_2026-10-06.md`. Source audit: `Development/DOCUMENT_ACCESS_ACL_CURRENT_EFFECT_STORAGE_BINDING_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. Current status is bounded Development **IN PROGRESS**; production readiness is **NOT CLAIMED**.

Next: Verify this canonical promotion at its exact HEAD with Core/PostgreSQL/Database/Web. Once green, record promotion evidence and stage DD-563…DD-567 state closure before another source audit.

Invariants: **9 equal Industries / 41 canonical MS / 181 Industry tables / 2,962 preserved source requirements**; exactly `TENANT_STAFF_APP` and `TENANT_USER_APP` as logical Tenant mobile app classes. RawSource unchanged; `main` unmerged; PR #2 draft/unmerged.
