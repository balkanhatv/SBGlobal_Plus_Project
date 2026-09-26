# AIMediaRequest capability binding prerequisite ownership audit

**Date:** 2026-09-26
**Baseline checkpoint:** `DEV-AI-TOKEN-USAGE-PROVIDER-BINDING-FLOORS-001`
**Verified closure HEAD:** `d0e9fcad58dd1cd3c538e2d1f2f080f76dee21b1`
**Verified tree:** `e770defcddbdda2201fe71d4c5dad14e721365bc`

## Entry gate

DD-201 state closure is exact-head verified. Core Service Verify run `36233011874` passed Core job `108379588037` at **650/650** and PostgreSQL job `108379588132` at **504/504** plus database bootstrap PASS. Database Verify run `36233011862` / job `108379587955` passed. Web Boundary Verify run `36233011930` / job `108379588280` passed. REPO-007 and REPO-008 pass. All four logs assert the exact HEAD/tree above. RawSource is unchanged; `main` is unmerged; PR #2 remains draft/unmerged.

## Source ownership reconciled

Migration 0011 persists:

`core_ai.ai_media_request.capability_code text NOT NULL REFERENCES core_ai.ai_capability(code)`.

DD-125 exposes AIMediaRequest persisted `id`, Tenant/optional Industry, exact `capabilityCode` and other request evidence. DD-109 exposes AICapability raw catalog `id`, exact `code` and other capability metadata. Therefore direct AIMediaRequest → AICapability code continuity is source-complete without a new reader, schema, RLS policy, role or grant.

Migration 0031 adds MediaRequest principal/input-document/prompt relationship integrity but does **not** re-check capability status, entitlement, policy, model/provider compatibility or runtime routing. Therefore this direct FK remains an independent persisted relationship.

DD-197 already mirrors a different table relationship: TokenUsage → AICapability exact code. Reusing the same capability catalog evidence does not make AIMediaRequest's independent FK redundant.

## Determination and locked DD-202 detailed contract

**SOURCE-COMPLETE for AIMediaRequest → AICapability exact code foreign-key continuity only.**

Authorize pure helper:

`matchesAIMediaRequestCapabilityBindingFloors(request, capability?)`

It accepts one already-loaded DD-125 `PersistedAIMediaRequest` and optional already-loaded DD-109 `AICapabilityCatalogMetadata`, returns boolean and never mutates inputs.

1. Validate relevant MediaRequest `id`, Tenant, optional Industry and `capabilityCode` shape.
2. Require supplied capability evidence with valid capability UUID id and raw string code.
3. Require exact `capability.code === request.capabilityCode`, with no trim/case normalization/fallback.
4. Request principal/media/prompt/brand/localization/document/security/residency/moderation/status/time evidence remains uninterpreted.
5. Capability category/status/entitlement/default-policy/schema-version evidence remains uninterpreted.
6. A true result grants no capability currentness/eligibility, entitlement/policy satisfaction, provider/model routing, moderation or AI execution authority.

## Fixed acceptance before implementation

- **AIMEDIA-CAP-CUR-001**: exact MediaRequest and capability code binding passes.
- **AIMEDIA-CAP-CUR-002**: missing capability evidence or mismatched code fails closed.
- **AIMEDIA-CAP-CUR-003**: code equality is exact without normalization; empty-to-empty is preserved as raw FK equality.
- **AIMEDIA-CAP-CUR-004**: malformed MediaRequest id/Tenant/optional Industry/capabilityCode fails closed.
- **AIMEDIA-CAP-CUR-005**: malformed capability id/code evidence fails closed.
- **AIMEDIA-CAP-CUR-006**: capability lifecycle/category/entitlement/policy/schema semantics are uninterpreted.
- **AIMEDIA-CAP-CUR-007**: unrelated MediaRequest evidence is uninterpreted and inputs remain unchanged.

Expected executable delta: Core **650 → 657**. PostgreSQL remains **504**. Database inventory remains **48 migrations / 42 SQL verification files**.

## Explicit exclusions / continuation

A true result is not capability ACTIVE/current/eligible state, entitlement or policy satisfaction, Tenant/Industry allowlisting, principal currentness, PromptTemplate currentness, input-document authorization, provider/model compatibility, budget/quota, moderation, routing/fallback/retry, provider SDK dispatch or media/AI execution authority. It changes no schema/RLS/role/grant/route/product policy.

After DD-202 is implemented and exact-head verified, source-audit the next independent persisted AI relationship. Principal currentness remains blocked unless governing provenance changes.
