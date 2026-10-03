# AICost TokenUsage binding prerequisite ownership audit

**Date:** 2026-09-25
**Baseline checkpoint:** `DEV-AI-TOKEN-USAGE-CAPABILITY-BINDING-FLOORS-001`
**Verified closure HEAD:** `aa1aa0685c0efabcb8f276c130e071834c942152`
**Verified tree:** `99db4509392fc1bfa947fc6fa679f9e166ca6021`

## Entry gate

DD-197 state closure is exact-head verified. Core Service Verify run `36161135098` passed Core job `108157704268` at **626/626** and PostgreSQL job `108157704590` at **504/504** plus database bootstrap PASS. Database Verify run `36161135109` / job `108157704170` passed. Web Boundary Verify run `36161135102` / job `108157704426` passed. REPO-007 and REPO-008 pass. All four logs assert the exact HEAD/tree above. RawSource is unchanged; `main` is unmerged; PR #2 remains draft/unmerged.

## Source ownership reconciled

Migration 0012 defines `core_ai.ai_cost.usage_id uuid PRIMARY KEY REFERENCES core_ai.token_usage(id)`. This creates exactly one optional cost row per TokenUsage row and requires every persisted cost row to reference an existing TokenUsage id.

DD-123 exposes AICost `usageId`. DD-122 exposes TokenUsage `id`.

No migration-0031 relationship trigger adds a stronger AICost → TokenUsage business predicate. AICost FORCE-RLS visibility derives from the referenced TokenUsage parent, but that visibility rule is already enforced by persistence and is not additional relationship data to be reinterpreted by a pure helper.

Currency, estimated minor units, provider-rate version, billable class and finalized timestamp are AICost evidence only. Tenant/Industry/principal/capability/model/provider/usage-unit/time/correlation fields are TokenUsage evidence only. None participates in the direct foreign-key equality predicate.

## Determination and locked DD-198 detailed contract

**SOURCE-COMPLETE for AICost → TokenUsage exact usage-id binding only.**

Authorize pure helper:

`matchesAICostTokenUsageBindingFloors(cost, usage?)`

It accepts one DD-123 `PersistedAICost` and optional DD-122 `PersistedAITokenUsage`, returns boolean and never mutates inputs.

1. Validate AICost `usageId` as UUID.
2. Require supplied TokenUsage evidence with valid `id` UUID.
3. Require exact `usage.id === cost.usageId`.
4. Cost currency, estimated minor units, provider-rate version, billable class and finalized timestamp are not evaluated.
5. TokenUsage Tenant/Industry/principal/capability/model/provider/units/time/correlation evidence is not evaluated.
6. Malformed relevant ids fail closed.

## Fixed acceptance before implementation

- **AICOST-USAGE-CUR-001**: exact cost usage id and TokenUsage id pass.
- **AICOST-USAGE-CUR-002**: missing TokenUsage evidence or mismatched usage id fails closed.
- **AICOST-USAGE-CUR-003**: malformed cost usage id or TokenUsage id fails closed.
- **AICOST-USAGE-CUR-004**: AICost currency/amount/rate/billable/finalization evidence is uninterpreted.
- **AICOST-USAGE-CUR-005**: TokenUsage Tenant/Industry/principal/capability/model/provider/units/time/correlation evidence is uninterpreted.
- **AICOST-USAGE-CUR-006**: inputs remain unchanged and true grants no pricing, billing, finalization, authorization or AI execution authority.

Expected executable delta: Core **626 → 632**. PostgreSQL remains **504**. Database inventory remains **48 migrations / 42 SQL verification files**.

## Explicit exclusions / continuation

A true result is not pricing correctness, provider-rate applicability/currentness, currency conversion, billability, cost finalization, invoice/tax/payment/ledger authority, TokenUsage principal currentness, capability/model/provider eligibility, quota/budget or AI execution authority. It changes no schema/RLS/role/grant/route/product policy.

After DD-198 is implemented and exact-head verified, source-audit the next independent AI persistence relationship. Principal currentness remains separately blocked unless governing provenance semantics change.
