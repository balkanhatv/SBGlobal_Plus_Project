# DD-713…DD-717 — TokenUsage → global AICapability exact code evidence: source/prerequisite ownership audit

**Date:** 2026-10-09.
**Entry checkpoint:** DD-708…DD-712 independently closed at `0144382643016a4b0a14284d8b208054658b594f` / tree `3dc245d2ee2cd6ee4baf06f6fbffba45869a47cb`.
**Status:** SOURCE AUDIT ONLY. Implementation/canonical promotion must not precede this audit commit's separate exact-HEAD Core/PostgreSQL/Database/Web gates.

## Exact entry gates

- [Core Service Verify 37962446967](https://github.com/balkanhatv/SBGlobal_Plus_Project/actions/runs/37962446967), Core job `113928419344`: **1711/1711 PASS** (0 failed/skipped), PostgreSQL job `113928419171`: **540/540 PASS** (0 failed/skipped), full PostgreSQL database bootstrap PASS.
- [Database Verify 37962446846](https://github.com/balkanhatv/SBGlobal_Plus_Project/actions/runs/37962446846), job `113928418823`: **48 migrations / 42 SQL verification files PASS**.
- [Web Boundary Verify 37962447170](https://github.com/balkanhatv/SBGlobal_Plus_Project/actions/runs/37962447170), job `113928419467`: **PASS**.

All four logs assert the exact entry HEAD/tree. DD-712 closure therefore passed its own gates. No new product or authorization authority is inferred.

## Source and dependency ownership

1. DD-09 §§1/6/18 govern AI usage and catalog metadata, not a new usage/billing/execution transaction.
2. `database/migrations/0012_ai_rag_memory_usage.sql` persists `core_ai.token_usage.capability_code text NOT NULL REFERENCES core_ai.ai_capability(code)`, a distinct direct code FK. Tenant/Industry RLS uses ENABLE and FORCE. DD-122 `AITokenUsageReadPort.loadForContext({requestContext,tokenUsageId})` loads exactly one raw scoped persisted TokenUsage under original RequestContext. Principal is attribution, not fresh principal authorization.
3. DD-109 exposes `AICapabilityCatalogMetadataByCodeReadPort.loadByCode(code)` for one exact globally cataloged Capability code; `src/server/ai/postgres-ai-capability-catalog-metadata-store.ts` physically implements `WHERE code=$1`. It does not consume Tenant/Industry RequestContext and must not be scope-widened or called by alternate code/ID.
4. DD-197 / `Development/AI_TOKEN_USAGE_CAPABILITY_BINDING_PREREQUISITE_OWNERSHIP_AUDIT.md` / `src/core/ai/token-usage-capability-binding-floors.ts` already own `matchesAITokenUsageCapabilityBindingFloors(usage,capability?)`: required usage UUIDs/Tenant/optional Industry and string capabilityCode, catalog UUID id/string code, exact case-sensitive code equality. Status, entitlement, schemaVersion and policy class remain opaque.
5. DD-598…DD-602 `src/core/ai/media-request-capability-current-evidence-reader.ts` prove `ByCodeReadPort` can be composed, but MediaRequest is a **different child** with different DD-202 binding rules. This batch neither copies those rules nor accesses MediaRequest.

**Determination:** SOURCE-COMPLETE only for internal read-only composition of DD-122 scoped TokenUsage, DD-109 exact global Capability-by-code port and DD-197 direct code-FK predicate. No schema, new RLS/grants, policy, billing or execution ownership changes are authorized. Separate reads provide no atomic snapshot.

## Frozen detailed decisions

**DD-713 — read scoped TokenUsage first.** `loadAITokenUsageCapabilityCurrentEvidence({requestContext,tokenUsageId},usageReader,capabilityReader)` loads exact usage once with same RequestContext reference and input ID. Null halts; original error identity propagates without fallback/retry.

**DD-714 — validate necessary persisted child identity before global access.** Require one object with DD-197 usage.id, tenantId and optional industryContextId valid UUID shapes, and `typeof usage.capabilityCode === "string"`. Only exactly undefined denotes absent Industry. Exact string content—including case/whitespace—is not trimmed/normalized or interpreted. Model/Provider/principal/usage/timing/correlation fields are outside this predicate.

**DD-715 — global exact persisted capability-code read.** After validated child, call `capabilityReader.loadByCode(usage.capabilityCode)` exactly once; only the persisted raw string, no Tenant context invention or code alias/fallback, search/list, retry or elevation. Missing returns null, original exception propagates.

**DD-716 — existing DD-197 predicate + immutable source references.** Fail closed on missing/malformed/unequal `capability.code`, including case or whitespace differences; apply existing pure `matchesAITokenUsageCapabilityBindingFloors` without modifying it. Return frozen `{usage,capability}` preserving source object references, exact usage numeric text, catalog entitlement/category/default-policy/status/schema-version and optional opaque fields.

**DD-717 — relationship evidence is not execution authority.** True proves only the stored TokenUsage capability_code → AICapability(code) direct-FK relationship under existing scoped usage visibility; it grants no Capability ACTIVE/currentness/eligibility, required entitlement/policy satisfaction, Tenant/Industry allowlisting, provider/model capability compatibility, principal authorization, quota/budget, price/billing, routing/inference/RAG/media/tool/agent, API/UI, mutation, event or atomic cross-record snapshot.

## Frozen executable acceptance IDs

- **AIUSAGE-CAPREAD-BASE-001:** read exact scoped TokenUsage once first with original ID and identical RequestContext.
- **AIUSAGE-CAPREAD-BASE-002:** null child/error short-circuits global read, propagates original exception.
- **AIUSAGE-CAPREAD-CHILD-001:** reject malformed child ID/Tenant/optional Industry/code types before global read, retain undefined Industry and exact code string.
- **AIUSAGE-CAPREAD-READ-001:** one exact global `loadByCode(usage.capabilityCode)` call with raw persisted string only.
- **AIUSAGE-CAPREAD-READ-002:** null catalog/errors return null/propagate without fallback or retry.
- **AIUSAGE-CAPREAD-FLOOR-001:** reuse DD-197 strict code equality; missing/malformed/wrong/case/whitespace variants deny.
- **AIUSAGE-CAPREAD-EVID-001:** frozen envelope preserves raw references, exact numeric text and opaque catalog fields; no mutation.
- **AIUSAGE-CAPREAD-BOUND-001:** Tenant-Core and exact Industry reads remain original port-authorized; opaque status/entitlement and principal attribution do not create eligibility, billing or AI execution authority.

Expected Core delta **1711 → 1719** (+8 fixed tests, target only). PostgreSQL **540**; database **48 migrations / 42 SQL verification files**; Web unchanged.

## Mandatory ordered CI and exclusions

After this **source-audit commit** passes its own exact-HEAD Core/PostgreSQL/Database/Web, implement only this reader, its Core export and eight frozen acceptance tests. Independently verify that implementation commit. Then atomically promote eight DD-17 acceptance entries, five DD-18 decisions, DD-19 traceability, verification register, manifest and all 57 current projections with correct implementation CI pointers; independently verify that promotion. Finally publish and independently verify a separate state-closure commit. Any genuine defect requires STOP and smallest forward-only correction with new independent CI.

No RawSource/main change, PR merge, force-push, test weakening, schema/RLS/role/grant change, Provider/Model read, billing or credentials, client API/UI or inference. Preserve **9 equal Industries / 41 canonical MS / 181 Industry tables / 2,962 source requirement IDs / exactly TENANT_STAFF_APP and TENANT_USER_APP**. PR #2 remains OPEN/DRAFT/UNMERGED. Production readiness NOT CLAIMED.
