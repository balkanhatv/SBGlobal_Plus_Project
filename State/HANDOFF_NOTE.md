# HANDOFF_NOTE — SBGlobal Plus
**Current checkpoint:** `DEV-DOCUMENT-ACCESS-ACL-STORAGE-BINDING-EVIDENCE-READER-001`
**Current executable audit basis:** `7212643715d725abd7d934cee2843f5c8317c1ef` / tree `6ac3e236fd8faee65f76af2a86a57eb14f9d6b86`
**Updated:** 2026-10-05 · **Branch:** `docs/architecture-branch-2`

> **Current audit gate (2026-10-05):** DD-548…DD-552 Document ACL-subject + physical StorageObject binding evidence is implemented and exact-head verified at the basis above. This canonical promotion must independently pass before batch closure. Complete-project downstream audit remains **CLEAN / CLOSED** through VC27-111. Production readiness is **NOT CLAIMED**.

DD-548…DD-552 is the current governed backend-only Document ACL-subject + physical StorageObject binding evidence composition. It reuses exact DD-542 candidate/raw-ACL/subject-match evidence and performs one exact DD-086 binding read using only parent.candidate.documentId + parent.candidate.storageObjectId under the supplied RequestContext.

Verified exact-head implementation basis `7212643715d725abd7d934cee2843f5c8317c1ef` / tree `6ac3e236fd8faee65f76af2a86a57eb14f9d6b86`: **1436/1436 Core**, **536/536 PostgreSQL** plus full bootstrap, **48 migrations / 42 SQL verification files**, Database/Web PASS; zero failed/skipped tests.

Success preserves exact DD-542 parent and DD-086 binding references only. ACL effect/expiry and final authorization, operation→ACL mapping, permission/entitlement/RBAC/ABAC/sensitivity/step-up/residency exceptions, provider selection/decryption, signing/TTL, download/share/delete, StoragePort dispatch and mutation authority remain separate.

Evidence: `Registers/DEVELOPMENT_DD548_DD552_VERIFICATION_2026-10-05.md`. Source audit: `Development/DOCUMENT_ACCESS_ACL_STORAGE_BINDING_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. Current status is bounded Development **IN PROGRESS**; production readiness is **NOT CLAIMED**.

Next: Verify this canonical promotion at its exact HEAD with Core/PostgreSQL/Database/Web. Once green, record promotion evidence and stage DD-548…DD-552 state closure before another source audit.

Invariants: **9 equal Industries / 41 canonical MS / 181 Industry tables / 2,962 preserved source requirements**; exactly `TENANT_STAFF_APP` and `TENANT_USER_APP` as logical Tenant mobile app classes. RawSource unchanged; `main` unmerged; PR #2 draft/unmerged.

Fetch the branch again before continuation and follow the single current next action above. Preserve the latest verified source-owned boundary.
