# AIToolDefinition AICapability binding prerequisite ownership audit

**Date:** 2026-09-26
**Baseline checkpoint:** `DEV-AI-MEDIA-REQUEST-CAPABILITY-BINDING-FLOORS-001`
**Verified closure HEAD:** `e77d1f57f044c1524d17cfc0069616179f0dd2f7`
**Verified tree:** `d9c5842400221c440864609a7653c47d6881db81`

## Entry gate

DD-202 state closure is exact-head verified. Core Service Verify run `36233987448` passed Core job `108382310355` at **657/657** and PostgreSQL job `108382310097` at **504/504** plus database bootstrap PASS. Database Verify run `36233987463` / job `108382310309` passed. Web Boundary Verify run `36233987437` / job `108382310062` passed. REPO-007 and REPO-008 pass. All logs assert the exact HEAD/tree above. RawSource is unchanged; `main` is unmerged; PR #2 remains draft/unmerged.

## Source ownership reconciled

Migration 0013 persists `core_ai.ai_tool_definition.capability_code text NOT NULL REFERENCES core_ai.ai_capability(code)`.

DD-110 exposes AIToolDefinition raw `id` and `capabilityCode`. DD-109 exposes AICapability raw `id`, `code` and catalog metadata. No existing Core helper owns this direct foreign-key continuity; ToolSetMember/ToolDefinition and AgentStep tool-binding helpers validate different relationships.

The persisted foreign key requires only exact capability-code continuity. It does not require capability `status='ACTIVE'`, category, entitlement, default policy or schema version; nor ToolDefinition permission, entitlement, OperationContract, scope, side effects, approval, idempotency, audit, lifecycle/version or execution eligibility.

## Determination and locked DD-203 detailed contract

**SOURCE-COMPLETE for AIToolDefinition → AICapability exact code foreign-key continuity only.**

Authorize pure helper:

`matchesAIToolDefinitionCapabilityBindingFloors(toolDefinition, capability?)`

It accepts one DD-110 `AIToolDefinitionCatalogMetadata` and optional DD-109 `AICapabilityCatalogMetadata`, returns boolean and never mutates inputs.

1. Validate relevant ToolDefinition id and raw capability-code shape.
2. Require supplied capability evidence with valid capability id and raw code shape.
3. Require exact `capability.code === toolDefinition.capabilityCode`.
4. Equality is byte-for-byte; no trimming, case-folding, aliasing or fallback is authorized.
5. Empty raw string equality remains valid if such persisted evidence exists; no stronger non-empty rule is invented.
6. Capability lifecycle/category/entitlement/default-policy/schema semantics remain uninterpreted.
7. ToolDefinition tool/OperationContract/scope/permission/entitlement/schema/side-effect/approval/idempotency/audit/status/version/timestamps remain uninterpreted.

## Fixed acceptance before implementation

- **AITOOL-CAP-CUR-001**: exact ToolDefinition/capability code binding passes.
- **AITOOL-CAP-CUR-002**: missing capability evidence or mismatched code fails closed.
- **AITOOL-CAP-CUR-003**: code equality is exact without normalization; equal empty raw strings remain valid evidence.
- **AITOOL-CAP-CUR-004**: malformed ToolDefinition id or capability-code type fails closed.
- **AITOOL-CAP-CUR-005**: malformed capability id or code type fails closed.
- **AITOOL-CAP-CUR-006**: capability lifecycle/category/entitlement/default-policy/schema semantics are not FK inputs.
- **AITOOL-CAP-CUR-007**: unrelated ToolDefinition semantics are uninterpreted and inputs remain unchanged.

Expected executable delta: Core **657 → 664**. PostgreSQL remains **504**. Database inventory remains **48 migrations / 42 SQL verification files**.

## Explicit exclusions / continuation

A true result is not capability ACTIVE/current/eligible state, entitlement/policy satisfaction, Tenant/Industry allowlisting, ToolDefinition permission/entitlement/approval/OperationContract eligibility, ToolSet membership, AgentStep authorization, idempotency/audit satisfaction, provider/model routing, tool invocation or AI execution authority. It changes no schema/RLS/role/grant/route/product policy.

After DD-203 is implemented and exact-head verified, source-audit the next independent persisted AI relationship. Principal currentness and complete AI/tool execution remain separately governed.
