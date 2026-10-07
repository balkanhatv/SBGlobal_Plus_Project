# D-INDEX — Current Canonical / Development Index
**Current checkpoint:** `DEV-AI-MEDIA-REQUEST-CAPABILITY-CURRENT-EVIDENCE-READER-001`
**Current executable audit basis:** `d385fbc2faefe28da212a9a77feba1776efbdec9` / tree `367d575ecb4251c10fda3e4c99aa8e03714f9a5a`
**Updated:** 2026-10-07 · **Branch:** `docs/architecture-branch-2`

> **Current audit gate (2026-10-07):** DD-598…DD-602 state closure passed exact-head Core/PostgreSQL/Database/Web at the basis above. DD-603…DD-607 AIMediaRequest input-document current-evidence source audit is staged and must independently pass before implementation. Complete-project downstream audit remains **CLEAN / CLOSED** through VC27-111. Production readiness is **NOT CLAIMED**.

DD-598…DD-602 is the current governed backend-only AIMediaRequest → AICapability exact current-evidence composition. It reads the exact AIMediaRequest first, then exactly one global capability row by persisted capabilityCode and applies only the existing DD-202 exact code-binding floor.

Verified state-closure basis `d385fbc2faefe28da212a9a77feba1776efbdec9` / tree `367d575ecb4251c10fda3e4c99aa8e03714f9a5a`: **1517/1517 Core**, **540/540 PostgreSQL** plus full bootstrap, **48 migrations / 42 SQL verification files**, Database/Web PASS; zero failed/skipped tests.

Success proves only exact persisted AIMediaRequest→AICapability code-binding evidence. Capability status/category/requiredEntitlement/defaultPolicyClass/schemaVersion remain raw; no eligibility/currentness, entitlement/policy/allowlist decision, prompt/document authorization, moderation/provisioning/provider/model routing, budget/quota, media execution/publication, mutation or event authority is introduced.

Evidence: `Registers/DEVELOPMENT_DD598_DD602_VERIFICATION_2026-10-06.md`. Source audit: `Development/AI_MEDIA_REQUEST_CAPABILITY_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. Current status is bounded Development **IN PROGRESS**; production readiness is **NOT CLAIMED**.

Next: Verify DD-603…DD-607 source-audit commit at its exact HEAD with Core/PostgreSQL/Database/Web. Only if green, implement only the frozen DD-603…DD-607 scope.

Invariants: **9 equal Industries / 41 canonical MS / 181 Industry tables / 2,962 preserved source requirements**; exactly `TENANT_STAFF_APP` and `TENANT_USER_APP` as logical Tenant mobile app classes. RawSource unchanged; `main` unmerged; PR #2 draft/unmerged.
