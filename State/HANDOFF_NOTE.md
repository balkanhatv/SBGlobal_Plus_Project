# HANDOFF_NOTE — SBGlobal Plus
**Updated:** 2026-09-18 · **Branch:** `docs/architecture-branch-2` · **Checkpoint:** `DEV-COMMERCIAL-CURRENT-001`

Fresh-fetch remote branch and verify actual HEAD/tree/CI before continuation. Verified executable: `e050dc5f52c3e1925c5ea2bce38e886e997be7c1`, tree `6d1269d1e71eff340922d149b5f2da66c2fad8a2`. Core Service Verify `35309426651`: **103/103 Core + 21/21 PostgreSQL** PASS. Database Verify `35309426724`: **37 migrations / 31 verification files** PASS.

Current bounded scope includes the fail-closed Authorization evaluator/compiler chain and the exact Commercial current-state runtime integration. RequestContext is stamped from the exact CURRENT EntitlementSnapshot tied to the Tenant current-subscription pointer; guard-time Commercial reads revalidate the snapshot id/version plus current subscription/license/entitlement state. Sibling Industry facts/licenses are excluded by exact context + FORCE RLS. Authorization receives only server-owned normalized Commercial facts.

Generic SUSPENDED/EXPIRED/CANCELLED/PENDING operations currently fail closed. Do not claim the eventual billing/renewal/export read-only restricted mode until dedicated operation/restriction contracts are implemented and tested.

Next governed task: **resource/workflow authorization integration only (AUTH-004/AUTH-005)**. Resolve owner/org/workflow business rules through module-owned server ports; preserve opaque resource behavior and fail closed. If DD-03/DD-17 do not define enough payload/reducer semantics, add a targeted DD decision before code.

Do not enable true RESTRICT until a separate governed restriction payload/reducer exists. Do not start DD-06 transports yet.

One Unified Core, nine equal Industries, 41 canonical MS, exactly two Tenant mobile app classes, RBAC primary, ABAC narrowing-only, and Tenant + Industry isolation remain active. RawSourceCorpus is immutable; `main` remains unmerged; PR #2 stays draft/review-only.
