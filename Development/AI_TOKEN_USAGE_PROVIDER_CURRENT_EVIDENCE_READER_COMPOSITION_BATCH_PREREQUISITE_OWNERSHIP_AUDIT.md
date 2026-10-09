# DD-708…DD-712 — scoped TokenUsage → global AIProvider persisted direct-FK evidence: source/prerequisite ownership audit

**Date:** 2026-10-09
**Entry HEAD:** `8bdb0a86130fb0ca44cf93ef6f5d6c67b28754a8` / tree `49f874f6bd6acb87005dd3036906ffe10d120ea1`.
**Entry checkpoint:** DD-703…DD-707 separately verified state closure, `DEV-AI-TOKEN-USAGE-MODEL-PAIR-CURRENT-EVIDENCE-READER-001`.
**Status:** SOURCE AUDIT ONLY; implementation and canonical promotion are NOT authorized until this audit HEAD independently passes Core/PostgreSQL/Database/Web.

## Exact-HEAD entry evidence

At entry HEAD the push-triggered CI gates independently succeeded:
- [Core Service Verify 37957977307](https://github.com/balkanhatv/SBGlobal_Plus_Project/actions/runs/37957977307), Core job `113913241172`: **1703/1703 PASS**, fail/skipped 0; PostgreSQL job `113913240495`: **540/540 PASS**, fail/skipped 0; full database bootstrap PASS.
- [Database Verify 37957977289](https://github.com/balkanhatv/SBGlobal_Plus_Project/actions/runs/37957977289), job `113913240426`: **PASS**, 48 migrations / 42 SQL verification files, full bootstrap.
- [Web Boundary Verify 37957977308](https://github.com/balkanhatv/SBGlobal_Plus_Project/actions/runs/37957977308), job `113913239945`: **PASS**.

All four jobs assert exact tested entry HEAD and tree. PR #2 remains open/draft/unmerged. This evidence closes DD-707 but does not certify the next audit or implementation commit.

## Source owners and no-authority boundary

1. DD-09 §§1/6/18 own AI usage observability/catalog metadata, not re-execution or billing authority.
2. Migration `0012_ai_rag_memory_usage.sql` owns non-null `core_ai.token_usage.provider_id` referencing `core_ai.ai_provider(id)`. This is a **direct independent FK**: not the DD-196 TokenUsage→AIModel composite pair or DD-200 AIModel→AIProvider FK.
3. DD-122 / `src/core/ai/token-usage.ts` own `AITokenUsageReadPort.loadForContext({requestContext,tokenUsageId})`, exact original RequestContext, Tenant/Industry FORCE-RLS and persisted raw TokenUsage; principal is usage attribution, not current principal authorization. High-precision usage units remain strings.
4. DD-107 / `src/core/ai/provider-catalog-metadata.ts` own `AIProviderCatalogMetadataReadPort.loadById(id)`: exact global SELECT-only Provider metadata through its existing dedicated database boundary, **without** an invented Tenant/Industry RequestContext or provider secret retrieval.
5. DD-201 / `src/core/ai/token-usage-provider-binding-floors.ts` already own `matchesAITokenUsageProviderBindingFloors(usage,provider?)`. The existing predicate validates usage id/Tenant/optional Industry/provider UUID, Provider id UUID and case-sensitive equality `provider.id === usage.providerId`; it does not inspect Provider currentness, health, credential, lifecycle or eligible capabilities.

**Determination:** SOURCE-COMPLETE for one internal, read-only composition of the existing scoped usage read, global Provider metadata read and existing DD-201 pure direct-FK predicate. No new policy, owner semantics, SQL, table, RLS, role, grant, adapter or API permission is needed. Separate port reads are not an atomic snapshot.

## Frozen decisions to be promoted only after audited implementation verification

**DD-708 — scoped child first.** Introduce `loadAITokenUsageProviderCurrentEvidence({requestContext,tokenUsageId},usageReader,providerReader)`. Read TokenUsage once under the identical input RequestContext. Null stops before global read; dependency error identity propagates.

**DD-709 — validate necessary linkage before global access.** Require object-shaped TokenUsage and existing DD-201 UUID shapes for usage id, Tenant id, optional Industry id and persisted provider id. Only exactly `undefined` denotes absent Industry. Reject malformed necessary fields before global read. Do not require or interpret unrelated model/capability/principal/usage/time fields in this composition.

**DD-710 — read exact persisted Provider id.** After valid scoped child, call Provider `loadById(usage.providerId)` precisely once; no RequestContext addition, code lookup, list search, alternate id, privilege elevation or retry. Missing returns null; thrown error propagates unchanged.

**DD-711 — existing DD-201 FK and raw frozen evidence.** Apply `matchesAITokenUsageProviderBindingFloors` unchanged, fail closed on wrong/malformed/missing Provider and unequal casing, return frozen `{usage,provider}` retaining exact original references and raw decimal-string usage, Provider array/JSON/status/version/timestamps.

**DD-712 — narrow non-authorizing meaning.** Success is evidence of the persisted direct FK relationship only; it is not Provider currentness/ACTIVE/health, credential or secret access, capability/routing/allowlist or residency/sensitivity suitability, principal currentness, entitlement/budget/quota/billing, AI execution, public API/UI permission, mutation, event or atomic snapshot.

## Fixed executable acceptance IDs

- **AIUSAGE-PROVREAD-BASE-001:** child first, once, original tokenUsageId and RequestContext reference.
- **AIUSAGE-PROVREAD-BASE-002:** null child and original child-reader error stop global access.
- **AIUSAGE-PROVREAD-CHILD-001:** malformed/nonobject child and invalid necessary UUID linkage stop before Provider; undefined optional Industry passes.
- **AIUSAGE-PROVREAD-READ-001:** Provider global `loadById` called once only with persisted providerId.
- **AIUSAGE-PROVREAD-READ-002:** absent Provider and original provider-reader errors produce null/identity propagation with no retry.
- **AIUSAGE-PROVREAD-FLOOR-001:** DD-201 exact id matching; missing, malformed, wrong id and different casing fail closed.
- **AIUSAGE-PROVREAD-EVID-001:** frozen raw `{usage,provider}` preserves reference identity, decimal precision and all opaque catalog metadata without mutation.
- **AIUSAGE-PROVREAD-BOUND-001:** same scoped read for Tenant-Core/Industry, unattributed/current principal independence and opaque Provider statuses; no eligibility, secrets, billing, route or execution fields.

Expected Core acceptance delta **1703 → 1711** (+8, target only). PostgreSQL **540**, Database **48 migrations / 42 verification files**, Web unchanged; counts remain projections until individually tested.

## Mandatory ordered next gates

1. Commit **only this source audit**; verify its exact HEAD with independent Core/PostgreSQL/Database/Web CI, including repository invariants.
2. Only after all four pass, add the bounded reader, Core export and the eight frozen acceptance tests; verify the implementation commit's exact HEAD independently.
3. Only after that pass, atomically promote DD-17 acceptance, DD-18 decisions, DD-19 traceability, manifest and all current projections, with coherent exact implementation CI evidence; verify the promotion HEAD.
4. Finally publish a separate state-closure note and independently verify its exact HEAD before proceeding to DD-713.

Any real failure stops forward work for smallest forward-only correction and independently verified new HEAD; never certify a failed or merely staged commit.

**Explicitly excluded:** source requirement invention; mutable source tables/schema/RLS/grants; secrets; provider SDK/inference/tool/agent calls; cross-Tenant/Industry read widening; default Provider fallback; pricing/billing; API/UI; eligibility; test weakening; RawSource/main changes, merge, force-push, PR ready-for-review or deployment. The platform invariants remain **9 equal Industries, 41 MS, 181 Industry tables, 2,962 source requirement IDs, exactly TENANT_STAFF_APP and TENANT_USER_APP**. Production readiness is NOT CLAIMED.
