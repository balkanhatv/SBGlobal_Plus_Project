# SBGlobal Plus — Canonical Development Branch
**Current checkpoint:** `DEV-AI-MEDIA-REQUEST-INPUT-DOCUMENT-CURRENT-EVIDENCE-READER-001`
**Current executable audit basis:** `007aaf85103d8ccca51fa841567c3917e4bd6ced` / tree `ba3f354d4341afabff289da020755efd156b226d`
**Updated:** 2026-10-07 · **Branch:** `docs/architecture-branch-2`

> **Current audit gate (2026-10-07):** DD-603…DD-607 canonical promotion passed exact-head Core/PostgreSQL/Database/Web at the basis above. This state-closure commit must independently pass before batch closure. Complete-project downstream audit remains **CLEAN / CLOSED** through VC27-111. Production readiness is **NOT CLAIMED**.

DD-603…DD-607 is the current governed backend-only AIMediaRequest → input Document current-evidence composition. It reads the exact AIMediaRequest first; empty inputDocumentRefs performs zero Document metadata reads, otherwise each persisted ref is read exactly once under the same RequestContext in persisted order, followed only by the existing DD-189 relationship/currentness floor.

Verified canonical promotion basis `007aaf85103d8ccca51fa841567c3917e4bd6ced` / tree `ba3f354d4341afabff289da020755efd156b226d`: **1526/1526 Core**, **540/540 PostgreSQL** plus full bootstrap, **48 migrations / 42 SQL verification files**, Database/Web PASS; zero failed/skipped tests.

Success proves only exact persisted request→input-document relationship/currentness evidence under the supplied RequestContext. Document ACL/access, source-resource authorization, StorageObject/signed-url access, principal currentness/ownership authorization, prompt/capability eligibility, entitlement/policy, moderation, provider/model routing, budget/quota, media execution/publication, mutation and events remain separate.

Evidence: `Registers/DEVELOPMENT_DD603_DD607_VERIFICATION_2026-10-07.md`. Source audit: `Development/AI_MEDIA_REQUEST_INPUT_DOCUMENT_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. Current status is bounded Development **IN PROGRESS**; production readiness is **NOT CLAIMED**.

Next: Verify this state-closure commit at its exact HEAD with Core/PostgreSQL/Database/Web. Once green, DD-603…DD-607 is closed; source-audit the next independently source-complete backend batch.

Invariants: **9 equal Industries / 41 canonical MS / 181 Industry tables / 2,962 preserved source requirements**; exactly `TENANT_STAFF_APP` and `TENANT_USER_APP` as logical Tenant mobile app classes. RawSource unchanged; `main` unmerged; PR #2 draft/unmerged.
