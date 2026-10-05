# PROJECT_STATE — SBGlobal Plus
**Current checkpoint:** `DEV-DOCUMENT-ACCESS-ACL-SUBJECT-EVIDENCE-READER-001`
**Current executable audit basis:** `7cfec70c641eb05e5c33db3bcba324e43720140c` / tree `64f2414b6da65c6931950a6043e2bc3036d9a7a2`
**Updated:** 2026-10-05 · **Branch:** `docs/architecture-branch-2`

> **Current audit gate (2026-10-05):** DD-538…DD-542 canonical promotion passed exact-head Core/PostgreSQL/Database/Web at the basis above. This state-closure commit must independently pass before batch closure. Complete-project downstream audit remains **CLEAN / CLOSED** through VC27-111. Production readiness is **NOT CLAIMED**.

DD-538…DD-542 is the current governed backend-only Document access candidate + raw ACL subject-match evidence composition. It sequences exact DD-082 ACTIVE+CLEAN candidate evidence → one exact DD-084 raw ACL read → DD-085 subject matching for one explicit caller-supplied DocumentAclPermission.

Verified canonical promotion basis `7cfec70c641eb05e5c33db3bcba324e43720140c` / tree `64f2414b6da65c6931950a6043e2bc3036d9a7a2`: **1420/1420 Core**, **536/536 PostgreSQL** plus full bootstrap, **48 migrations / 42 SQL verification files**, Database/Web PASS; zero failed/skipped tests.

Success preserves exact candidate/raw ACL/matched evidence only. Empty matches are not deny; non-empty matches are not allow. ACL effect/expiry, DENY precedence, operation→ACL permission mapping, source/owner fallback, final authorization, sensitivity/step-up/residency composition, storage signing/TTL/provider selection and download/share/delete/dispatch/mutation authority remain raw or separately governed.

Evidence: `Registers/DEVELOPMENT_DD538_DD542_VERIFICATION_2026-10-05.md`. Source audit: `Development/DOCUMENT_ACCESS_ACL_SUBJECT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. Current status is bounded Development **IN PROGRESS**; production readiness is **NOT CLAIMED**.

Next: Verify this state-closure commit at its exact HEAD with Core/PostgreSQL/Database/Web. Once green, DD-538…DD-542 is closed; source-audit the next independently source-complete backend batch.

Invariants: **9 equal Industries / 41 canonical MS / 181 Industry tables / 2,962 preserved source requirements**; exactly `TENANT_STAFF_APP` and `TENANT_USER_APP` as logical Tenant mobile app classes. RawSource unchanged; `main` unmerged; PR #2 draft/unmerged.
