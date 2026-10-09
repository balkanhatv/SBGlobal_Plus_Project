# AICost → TokenUsage current direct-binding evidence — source/prerequisite ownership audit

**Date:** 2026-10-09
**Completed entry batch:** DD-683…DD-687 state closure at `6c3ae8229c879d85421ca7aa860be616f2dadf0b`, tree `af352fe9c42e24fa75255c140b745d5c5e65fdf6`.
**Entry verification:** Core run `37872614809` / job `113633880741` passed 1667/1667; PostgreSQL job `113633880847` passed 540/540 with full bootstrap; Database run `37872614683` / job `113633880300` passed 48 migrations / 42 SQL verification files; Web run `37872614756` / job `113633880821` passed. Zero failed/skipped tests. PR #2 is open/draft/unmerged; main and RawSource unchanged.
**Frozen candidate:** DD-688…DD-692
**Status:** Source-audit only; implementation requires this audit commit's own exact-head Core/PostgreSQL/Database/Web gates.

## Source ownership and explicit limitation

- DD-09 §§6 and 18 define TokenUsage/AICost as financial-adjacent usage/cost and observability evidence. They do not supply a rate-application formula, billing-posting rule or finalization workflow for this composition.
- Migration `database/migrations/0012_ai_rag_memory_usage.sql` owns `core_ai.ai_cost.usage_id uuid PRIMARY KEY REFERENCES core_ai.token_usage(id)`: each cost row has one exact usage parent, while a usage row may have no cost row. AICost FORCE-RLS visibility derives from the visible TokenUsage parent. TokenUsage FORCE-RLS requires the exact Tenant and either its unscoped Tenant-Core row or exact Industry Context. Principal attribution is not principal-private read ownership. No scope rule is reconstructed by the composition.
- DD-123 owns `AICostReadPort.loadForContext({requestContext,usageId})` and the exact immutable AICost projection. Its PostgreSQL adapter preserves `estimated_minor_units::text`, raw currency/rate-version/billable-class and optional finalized timestamp.
- DD-122 owns `AITokenUsageReadPort.loadForContext({requestContext,tokenUsageId})` and the exact immutable usage projection. Its adapter preserves numeric usage text, optional principal/media fields and raw persisted catalog/scope/time/correlation evidence.
- DD-198 owns `matchesAICostTokenUsageBindingFloors(cost,usage?)`: validate cost usageId and parent id UUIDs, then require exact `usage.id === cost.usageId`. No other field participates in the direct relationship predicate. The existing source audit is `Development/AI_COST_TOKEN_USAGE_BINDING_PREREQUISITE_OWNERSHIP_AUDIT.md`.
- Migration 0031 adds no AICost→TokenUsage relationship trigger. Its TokenUsage principal-at-occurredAt check and model/provider pair constraint remain separately owned. The persisted row does not establish current principal membership/elevation provenance, catalog eligibility, or authority to issue a new AI request. Those semantics are not inferred here.

**Determination:** SOURCE-COMPLETE for internal read-only composition of DD-123, DD-122 and DD-198. This creates an exact raw relationship envelope; it does not evaluate amounts, rates, billability, finalization or authorization. Each existing port retains its own scoped database transaction; no atomic cross-read snapshot or protection against later changes is claimed.

## Frozen decisions

**DD-688 — exact scoped AICost first.** Add `loadAICostTokenUsageCurrentEvidence({requestContext,usageId},costReader,usageReader)`. Invoke the existing cost port once with the original input usageId and identical RequestContext reference. Null cost returns null before usage access. Dependency errors propagate unchanged.

**DD-689 — validate cost linkage before the parent read.** Require a cost object and valid UUID cost.usageId using DD-198's existing UUID semantics. Null/undefined/malformed linkage fails closed without accessing TokenUsage. Do not interpret currency, amount, rate-version, billable-class or finalizedAt.

**DD-690 — exact same-context TokenUsage read.** For a valid cost, invoke `usageReader.loadForContext` once with identical RequestContext and persisted cost.usageId as tokenUsageId. Null/invisible parent returns null; errors propagate unchanged. No context widening, elevated fallback, catalog lookup, list, aggregation, retry or alternative parent search.

**DD-691 — reuse DD-198 and preserve raw references.** Apply existing `matchesAICostTokenUsageBindingFloors` to the two returned records. Missing/malformed/wrong parent id fails closed; exact equality succeeds. Return frozen `{cost,usage}` preserving exact source object references, bigint/numeric text and all optional/raw fields. No cloning, rounding, normalization, arithmetic or extra scope/catalog/principal predicate.

**DD-692 — relationship evidence grants no financial or execution authority.** The reader adds no pricing correctness, provider-rate applicability/currentness, currency conversion, billability, cost finalization, invoice/tax/payment/ledger posting, metering/quota/budget/entitlement decision, principal currentness, provider/model/capability eligibility, AI execution, public/API route, write or event. Read-port RLS remains authoritative; success and finalizedAt are evidence only.

## Frozen executable acceptance

- **AICOST-USAGEREAD-BASE-001:** cost is read first and once with original usageId and identical RequestContext.
- **AICOST-USAGEREAD-BASE-002:** absent cost or cost-reader error prevents TokenUsage access; errors propagate by identity.
- **AICOST-USAGEREAD-CHILD-001:** malformed/missing/null/non-object cost linkage rejects before the parent read.
- **AICOST-USAGEREAD-READ-001:** valid cost loads exactly its persisted usageId once through the existing parent port under identical RequestContext.
- **AICOST-USAGEREAD-READ-002:** invisible/missing usage and parent-reader errors deny/propagate without fallback or scope changes.
- **AICOST-USAGEREAD-FLOOR-001:** DD-198 exact UUID/FK equality passes; malformed/missing/wrong parent identity and unequal casing reject without normalization.
- **AICOST-USAGEREAD-EVID-001:** frozen envelope preserves exact cost/usage references, bigint/numeric text beyond JavaScript safe precision, raw metadata and optional fields without mutation or arithmetic.
- **AICOST-USAGEREAD-BOUND-001:** raw principal/catalog/scope/finalization evidence is not reinterpreted as financial, authorization, currentness or AI execution authority; both Tenant-Core and Industry contexts pass through unchanged.

Expected Core count **1667 → 1675** (8 fixed contract tests); PostgreSQL **540**, Database **48 migrations / 42 SQL verification files**, Web unchanged.

## Explicit exclusions and next gate

No schema, migration, SQL verification, FORCE-RLS policy, role/grant, adapter, RequestContext resolution, IAM/Commercial policy, tRPC/REST endpoint, web/mobile/desktop UI, RawSource or requirement inventory change. No new product vocabulary or business formula. Principal currentness remains blocked by the separately documented provenance limitation.

Source-audit exact HEAD must independently pass Core/PostgreSQL/Database/Web before implementation. Then implement only frozen acceptance and verify exact implementation HEAD; canonical DD-17/18/19/manifest/register promotion and separately verified state closure must follow. Keep PR #2 open/draft/unmerged, main and RawSource unchanged, no force-push or test weakening. Preserve 9 equal Industries / 41 MS / 181 Industry tables / 2,962 requirement IDs / exactly TENANT_STAFF_APP and TENANT_USER_APP.
