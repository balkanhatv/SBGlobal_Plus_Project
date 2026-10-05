# HANDOFF_NOTE — SBGlobal Plus
**Current checkpoint:** `DEV-DOCUMENT-ACCESS-ACL-SUBJECT-EVIDENCE-READER-001`
**Current executable audit basis:** `85c4ac385fad6b6900fd08c1c4c8f3f5034e1f30` / tree `d38598c36e1b384984516f59b3a5a7e07fca90d1`
**Updated:** 2026-10-05 · **Branch:** `docs/architecture-branch-2`

> **Current audit gate (2026-10-05):** DD-538…DD-542 Document access candidate + raw ACL subject-match evidence is implemented and exact-head verified at the basis above. This canonical promotion must independently pass before batch closure. Complete-project downstream audit remains **CLEAN / CLOSED** through VC27-111. Production readiness is **NOT CLAIMED**.

DD-538…DD-542 is the current governed backend-only Document access candidate + raw ACL subject-match evidence composition. It sequences exact DD-082 ACTIVE+CLEAN candidate evidence → one exact DD-084 raw ACL read → DD-085 subject matching for one explicit caller-supplied DocumentAclPermission.

Verified exact-head implementation basis `85c4ac385fad6b6900fd08c1c4c8f3f5034e1f30` / tree `d38598c36e1b384984516f59b3a5a7e07fca90d1`: **1420/1420 Core**, **536/536 PostgreSQL** plus full bootstrap, **48 migrations / 42 SQL verification files**, Database/Web PASS; zero failed/skipped tests.

Success preserves exact candidate/raw ACL/matched evidence only. Empty matches are not deny; non-empty matches are not allow. ACL effect/expiry, DENY precedence, operation→ACL permission mapping, source/owner fallback, final authorization, sensitivity/step-up/residency composition, storage signing/TTL/provider selection and download/share/delete/dispatch/mutation authority remain raw or separately governed.

Evidence: `Registers/DEVELOPMENT_DD538_DD542_VERIFICATION_2026-10-05.md`. Source audit: `Development/DOCUMENT_ACCESS_ACL_SUBJECT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. Current status is bounded Development **IN PROGRESS**; production readiness is **NOT CLAIMED**.

Next: Verify this canonical promotion at its exact HEAD with Core/PostgreSQL/Database/Web. Once green, record promotion evidence and stage DD-538…DD-542 state closure before another source audit.

Invariants: **9 equal Industries / 41 canonical MS / 181 Industry tables / 2,962 preserved source requirements**; exactly `TENANT_STAFF_APP` and `TENANT_USER_APP` as logical Tenant mobile app classes. RawSource unchanged; `main` unmerged; PR #2 draft/unmerged.

Fetch the branch again before continuation and follow the single current next action above. Preserve the latest verified source-owned boundary.
