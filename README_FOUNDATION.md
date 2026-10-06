# SBGlobal Plus — Canonical Development Branch
**Current checkpoint:** `DEV-AI-MEDIA-REQUEST-CAPABILITY-CURRENT-EVIDENCE-READER-001`
**Current executable audit basis:** `8ab7f7ee6ab6e439e17f75d674a06948d09afe8f` / tree `49e4febadfbdce76e0f6f9baeb9db12c033ce888`
**Updated:** 2026-10-06 · **Branch:** `docs/architecture-branch-2`

> **Current audit gate (2026-10-06):** DD-598…DD-602 AIMediaRequest exact AICapability code-binding evidence is implemented and exact-head verified at the basis above. This canonical promotion must independently pass before batch closure. Complete-project downstream audit remains **CLEAN / CLOSED** through VC27-111. Production readiness is **NOT CLAIMED**.

DD-598…DD-602 is the current governed backend-only AIMediaRequest → AICapability exact current-evidence composition. It reads the exact AIMediaRequest first, then exactly one global capability row by persisted capabilityCode and applies only the existing DD-202 exact code-binding floor.

Verified canonical promotion basis `33e1abccdcdbf7394d0838f86a09de06e43ebf9f` / tree `7e8115c18128b108976910356b7e7de446e6cc47`: **1509/1509 Core**, **540/540 PostgreSQL** plus full bootstrap, **48 migrations / 42 SQL verification files**, Database/Web PASS; zero failed/skipped tests.

Success proves only exact persisted AIMediaRequest→AICapability code-binding evidence. Capability status/category/requiredEntitlement/defaultPolicyClass/schemaVersion remain raw; no eligibility/currentness, entitlement/policy/allowlist decision, prompt/document authorization, moderation/provisioning/provider/model routing, budget/quota, media execution/publication, mutation or event authority is introduced.

Evidence: `Registers/DEVELOPMENT_DD598_DD602_VERIFICATION_2026-10-06.md`. Source audit: `Development/AI_MEDIA_REQUEST_CAPABILITY_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. Current status is bounded Development **IN PROGRESS**; production readiness is **NOT CLAIMED**.

Next: Verify this canonical promotion at its exact HEAD with Core/PostgreSQL/Database/Web. Once green, record promotion evidence and stage DD-598…DD-602 state closure before another source audit.

Invariants: **9 equal Industries / 41 canonical MS / 181 Industry tables / 2,962 preserved source requirements**; exactly `TENANT_STAFF_APP` and `TENANT_USER_APP` as logical Tenant mobile app classes. RawSource unchanged; `main` unmerged; PR #2 draft/unmerged.
