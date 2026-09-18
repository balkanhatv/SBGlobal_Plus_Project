# CORE SERVICE CHECKPOINT — DEV-COMMERCIAL-CURRENT-001
**Updated:** 2026-09-18  
**Branch:** `docs/architecture-branch-2`  
**Status:** IMPLEMENTED / TESTED — exact Commercial current-state runtime integration; resource/workflow rule integration not yet claimed

## Verified executable snapshot
- Commit: `e050dc5f52c3e1925c5ea2bce38e886e997be7c1`.
- Tree: `6d1269d1e71eff340922d149b5f2da66c2fad8a2`.
- Prior executable checkpoint: `2c9157e3a1ed30f18f8014e1b04aa799f2d73d15` (`DEV-AUTHZ-COMPILER-001`).
- Database remains **37 migrations / 31 verification files**.
- Industry SQL scope remains **9 Current Supported Industries / 41 canonical MS / 181 canonical Industry tables**.
- Core/server acceptance inventory: **103 tests**; real PostgreSQL inventory: **21 tests**.

## Current Commercial runtime boundary
`DEV-COMMERCIAL-CURRENT-001` integrates existing Commercial-owned truth without moving it into Authorization:
- RequestContext bootstrap resolves one valid CURRENT EntitlementSnapshot tied to the Tenant's exact `current_subscription_id`, source Subscription and pinned PlanVersion, then stamps snapshot id/version;
- runtime Commercial guard re-reads current state and requires exact RequestContext snapshot id/version equality;
- missing, ambiguous, expired or stale current state fails closed;
- TENANT_INDUSTRY reads stay behind exact Tenant/Industry FORCE RLS and explicit tenant ownership;
- sibling Industry licenses/facts do not cross-fallback;
- generic protected operations treat TRIAL/ACTIVE/GRACE as usable; PENDING/SUSPENDED/EXPIRED/CANCELLED fail closed until dedicated restricted/recovery operation contracts exist;
- exact Industry license is required; matching MS license state is revalidated when present; assigned human seat licensing is revalidated when present;
- snapshot deny-set wins; entitlement requirements are satisfied only by current effective non-denied facts;
- server-owned Authorization supplemental facts now expose subscription state, canonical effective license tokens and canonical enabled entitlement codes;
- PLATFORM_GLOBAL receives no tenant Commercial facts;
- Commercial dependency/state errors are normalized by GuardPipeline without exposing private state.

This checkpoint does **not** claim dedicated suspended read-only/billing/export paths, UPGRADE_CTA policy completion, SURFACE/API_SERVICE applicability mapping, resource/workflow business-rule completion, enforceable ABAC RESTRICT payload/reducer, transport wiring, UI/mobile/desktop, or production certification.

## Exact executable evidence
| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / core-service-verify | 35309426651 | 105488183277 | **PASS — 103/103** |
| Core Service Verify / postgres-context-verify | 35309426651 | 105488183105 | **PASS — 21/21** |
| Database Verify / postgres-verify | 35309426724 | 105488183403 | **PASS — 37 migrations / 31 verification files** |

All jobs asserted exact tested HEAD `e050dc5f52c3e1925c5ea2bce38e886e997be7c1` and tree `6d1269d1e71eff340922d149b5f2da66c2fad8a2`.

## Scope limits / next governed work
Next governed unfinished slice: **resource/workflow authorization integration only (AUTH-004/AUTH-005)** — resolve module-owned resource ownership/org/workflow-state rules behind server-owned ports and fail closed without widening the existing RBAC/ABAC/Commercial chain. If the existing DD contract is insufficient, record a targeted DD decision before implementation.

Do not start DD-06 transports yet. True enforceable ABAC RESTRICT, dedicated Commercial restricted-mode/UPGRADE_CTA flows, broader transports/UI/deployment and production readiness remain unfinished. RawSourceCorpus remains immutable. `main` remains unmerged; PR #2 stays review-only/draft.
