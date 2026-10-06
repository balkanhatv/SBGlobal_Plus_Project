# HANDOFF_NOTE — SBGlobal Plus
**Current checkpoint:** `DEV-DOCUMENT-ACCESS-ACL-CURRENT-EFFECT-STORAGE-ACCESS-PATH-EVIDENCE-READER-001`
**Current executable audit basis:** `3434e0f34718141e2cf47d0b02c18759d02eb474` / tree `898c8a81b459a3f7e23b23ec5c2844f5e40f36b9`
**Updated:** 2026-10-06 · **Branch:** `docs/architecture-branch-2`

> **Current audit gate (2026-10-06):** DD-568…DD-572 Document ACL access-path evidence is implemented and exact-head verified at the basis above. This canonical promotion must independently pass before batch closure. Complete-project downstream audit remains **CLEAN / CLOSED** through VC27-111. Production readiness is **NOT CLAIMED**.

DD-568…DD-572 is the current governed backend-only Document ACL current-effect + physical StorageObject binding + pure access-path evidence composition. It invokes exact DD-567 once and performs zero additional reads: DENY → EXPLICIT_ACL_DENY, ALLOW → EXPLICIT_ACL_ALLOW, NONE → SOURCE_RESOURCE_AUTHORIZATION_REQUIRED.

Verified exact-head implementation basis `3434e0f34718141e2cf47d0b02c18759d02eb474` / tree `898c8a81b459a3f7e23b23ec5c2844f5e40f36b9`: **1468/1468 Core**, **536/536 PostgreSQL** plus full bootstrap, **48 migrations / 42 SQL verification files**, Database/Web PASS; zero failed/skipped tests.

Success preserves exact DD-567 nested evidence and adds only immutable ACL access-path classification. Explicit DENY cannot fall through to source-resource inheritance; explicit ALLOW is not final authorization; NONE only marks a still-unexecuted source-resource authorization path. Operation→ACL mapping, final authorization, permission/entitlement/RBAC/ABAC/commercial/sensitivity/residency/step-up, provider selection/decryption, signing/grants/download/share/delete/dispatch/mutation authority remain separate.

Evidence: `Registers/DEVELOPMENT_DD568_DD572_VERIFICATION_2026-10-06.md`. Source audit: `Development/DOCUMENT_ACCESS_ACL_CURRENT_EFFECT_STORAGE_ACCESS_PATH_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. Current status is bounded Development **IN PROGRESS**; production readiness is **NOT CLAIMED**.

Next: Verify this canonical promotion at its exact HEAD with Core/PostgreSQL/Database/Web. Once green, record promotion evidence and stage DD-568…DD-572 state closure before another source audit.

Invariants: **9 equal Industries / 41 canonical MS / 181 Industry tables / 2,962 preserved source requirements**; exactly `TENANT_STAFF_APP` and `TENANT_USER_APP` as logical Tenant mobile app classes. RawSource unchanged; `main` unmerged; PR #2 draft/unmerged.

Fetch the branch again before continuation and follow the single current next action above. Preserve the latest verified source-owned boundary.
