# TokenUsage AI Capability binding prerequisite ownership audit

**Date:** 2026-09-25
**Baseline checkpoint:** `DEV-AI-TOKEN-USAGE-MODEL-PROVIDER-PAIR-FLOORS-001`
**Verified closure HEAD:** `983256dfa32a76f3df4b6f31f431356f53abb0a4`
**Verified tree:** `c2fc6b69323804c371dc624ad2b7e80dec46d17d`

## Entry gate

DD-196 state closure is exact-head verified. Core Service Verify run `36158501991` passed Core job `108148883675` at **619/619** and PostgreSQL job `108148883642` at **504/504** plus database bootstrap PASS. Database Verify run `36158502045` / job `108148884855` passed. Web Boundary Verify run `36158501915` / job `108148883267` passed. REPO-007 and REPO-008 pass. All four logs assert the exact HEAD/tree above. RawSource is unchanged; `main` is unmerged; PR #2 remains draft/unmerged.

## Source ownership reconciled

Migration 0012 persists non-null `core_ai.token_usage.capability_code` with a direct foreign key to `core_ai.ai_capability(code)`.

DD-122 exposes TokenUsage `capabilityCode`. DD-109 exposes AI Capability catalog `id`, raw `code`, raw `status`, category, entitlement/policy metadata and schema version.

Migration 0031's TokenUsage relationship trigger re-checks only optional principal currentness. It does **not** require the referenced capability to be ACTIVE and does not interpret entitlement, default policy, category or model/provider compatibility for the persisted TokenUsage capability-code FK.

Therefore the independently persisted capability relationship is exact code existence/continuity only.

## Determination and locked DD-197 detailed contract

**SOURCE-COMPLETE for TokenUsage → AICapability exact code binding only.**

Authorize pure helper:

`matchesAITokenUsageCapabilityBindingFloors(usage, capability?)`

It accepts one DD-122 `PersistedAITokenUsage` and optional DD-109 `AICapabilityCatalogMetadata`, returns boolean and never mutates inputs.

1. Validate relevant TokenUsage id/Tenant/optional Industry identity shape and that `capabilityCode` is a string exactly as persisted.
2. Require supplied capability evidence with valid catalog id and string `code`.
3. Require exact `capability.code === usage.capabilityCode`; no trimming, case-folding, aliasing or fallback.
4. Capability `status`, category, required entitlement, default policy class and schema version are not inputs to this FK predicate.
5. TokenUsage principal/model/provider/units/time/correlation evidence is not interpreted.
6. Malformed relevant evidence fails closed.

## Fixed acceptance before implementation

- **AIUSAGE-CAP-CUR-001**: exact TokenUsage capability code and catalog capability code pass.
- **AIUSAGE-CAP-CUR-002**: missing capability evidence or mismatched code fails closed.
- **AIUSAGE-CAP-CUR-003**: code equality is exact; case/whitespace variants fail.
- **AIUSAGE-CAP-CUR-004**: malformed relevant TokenUsage identity/Industry/code shape fails closed.
- **AIUSAGE-CAP-CUR-005**: malformed capability id/code evidence fails closed.
- **AIUSAGE-CAP-CUR-006**: capability status/category/entitlement/default-policy/schema-version are uninterpreted, including non-ACTIVE status.
- **AIUSAGE-CAP-CUR-007**: TokenUsage principal/model/provider/usage/time/correlation fields are uninterpreted; inputs remain unchanged and true grants no authorization/billing/execution authority.

Expected executable delta: Core **619 → 626**. PostgreSQL remains **504**. Database inventory remains **48 migrations / 42 SQL verification files**.

## Explicit exclusions / continuation

A true result is not capability ACTIVE/current/eligible state, entitlement or policy satisfaction, Tenant/Industry allowlisting, model/provider capability compatibility, routing/fallback, principal currentness, quota/budget, cost/billing, provider credentials/health or AI execution authority. It changes no schema/RLS/role/grant/route/product policy.

After DD-197 is implemented and exact-head verified, source-audit the next independent TokenUsage/AI persistence relationship. Principal currentness remains separately blocked unless governing provenance semantics change.
