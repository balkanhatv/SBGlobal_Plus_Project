# PROJECT_STATE — SBGlobal Plus
**Current checkpoint:** `DEV-NOTIFICATION-DELIVERY-INTEGRATION-CURRENT-INTEGRITY-EVIDENCE-READER-001`
**Current executable audit basis:** `af4f941c1499ad845301034bbdf3b44a35df95c0` / tree `8946fa4a9bb742eade0567c494dcf00b9525e3c6`
**Updated:** 2026-09-30 · **Branch:** `docs/architecture-branch-2`

> **Current audit gate (2026-09-28):** DD-313…DD-317 canonical promotion is exact-head verified at the basis above; this state-closure commit must independently pass before the next governed backend batch opens. Complete-project downstream audit remains **CLEAN / CLOSED** through VC27-111 with open current-scope P0/P1 = 0. Production readiness is **NOT CLAIMED**.

DD-313…DD-317 is the current governed backend-only NotificationDelivery TenantIntegration current-integrity evidence reader batch. It establishes DD-312 composed Delivery evidence first, conditionally follows the exact preserved TenantIntegration binding, reads exact CredentialReference metadata / IntegrationDefinition / enabled IntegrationCapability evidence, delegates current-integrity semantics to DD-167, and returns immutable nested evidence only.

Verified canonical promotion basis `af4f941c1499ad845301034bbdf3b44a35df95c0` / tree `8946fa4a9bb742eade0567c494dcf00b9525e3c6`: **1038/1038 Core**, **525/525 PostgreSQL**, **48 migrations / 42 SQL verification files**, Database/Web PASS; zero failed/skipped tests. Exact-head runs: Core `36729086627` (jobs `109933570580`, `109933570272`), Database `36729086684` (job `109933582313`), Web `36729086652` (job `109933565700`).

Frontend/UI remains untouched. Recipient-principal currentness, complete NotificationDelivery validity, Delivery/attempt lifecycle/finality, retry/backoff/exhaustion, channel→IntegrationCapability mapping, Integration health/fallback, ProviderAdapter/provider selection, credential secret/material access, provider SDK/network execution, rendering/sanitization, dispatch/scheduling/send/callback reconciliation and mutation remain separately governed.

Evidence: `Registers/DEVELOPMENT_DD313_DD317_VERIFICATION_2026-09-30.md`. Source audit: `Development/NOTIFICATION_DELIVERY_INTEGRATION_CURRENT_INTEGRITY_EVIDENCE_READER_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. Current status is bounded Development **IN PROGRESS**; production readiness is **NOT CLAIMED**.

Next: this state-closure commit must independently pass exact-head Core/PostgreSQL/Database/Web. Once green, DD-313…DD-317 is closed and the next independently source-complete governed backend batch may be source-audited.

Invariants: **9 equal Industries / 41 canonical MS / 181 Industry tables / 2,962 preserved source requirements**; exactly `TENANT_STAFF_APP` and `TENANT_USER_APP` as logical Tenant mobile app classes. RawSource unchanged; `main` unmerged; PR #2 draft/unmerged.











