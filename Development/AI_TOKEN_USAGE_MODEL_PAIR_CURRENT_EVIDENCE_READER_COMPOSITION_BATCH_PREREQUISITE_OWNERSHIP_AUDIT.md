# TokenUsage → AIModel model/provider pair evidence — source/prerequisite ownership audit

**Date:** 2026-10-09
**Entry checkpoint:** DD-698…DD-702 closed at `522f61f5d2898f6291ee87ec36836391429ded0c` / tree `fed0a3f0f5cf2735b0f62313f55bc0fa48feed07`.
**Entry evidence:** Core run `37942242582` / job `113859302143`: 1695/1695; PostgreSQL same run / job `113859301864`: 540/540 plus full bootstrap; Database run `37942242787` / job `113859303535`: 48 migrations / 42 SQL verification files; Web run `37942243042` / job `113859304555`: PASS. All exact-head gates passed, zero failed/skipped tests. PR #2 remains open/draft/unmerged.
**Frozen candidate:** DD-703…DD-707
**Status:** SOURCE AUDIT ONLY. Implementation requires this audit commit's independent exact-head Core/PostgreSQL/Database/Web PASS.

## Source and dependency ownership

- DD-09 §§1, 6 and 18 own AIModel registry metadata and TokenUsage usage/observability evidence. Persisted usage identity does not authorize another AI request.
- DD-122 / `database/migrations/0012_ai_rag_memory_usage.sql` own `AITokenUsageReadPort.loadForContext({requestContext,tokenUsageId})`. The port returns one exact immutable usage row under existing Tenant/Industry FORCE-RLS. Tenant-Core rows are visible from same-Tenant Core/Industry contexts; exact Industry rows require that Industry. The optional principal is attribution, not a principal-private read predicate. Numeric fields remain exact PostgreSQL numeric text.
- DD-108 / migrations 0011 and 0014 own `AIModelCatalogMetadataReadPort.loadById(modelId)`. This is a global exact-id catalog read through the dedicated AI database boundary, with SELECT-only catalog privileges. It does not accept a Tenant/Industry RequestContext. No fake scope, context switch or privileged fallback is introduced by using that existing global metadata port.
- Migration `0031_document_workflow_ai_integrity.sql` owns `token_usage_model_provider_fk`: `(model_id,provider_id) REFERENCES core_ai.ai_model(id,provider_id)`.
- DD-196 / `Development/AI_TOKEN_USAGE_MODEL_PROVIDER_PAIR_BINDING_PREREQUISITE_OWNERSHIP_AUDIT.md` own `matchesAITokenUsageModelProviderBindingFloors(usage,model?)`: valid usage id/Tenant/optional Industry/model/provider UUID shape, valid model id/provider UUID shape, and exact equality of both model id and provider id. Its existing UUID and case-sensitive equality semantics remain unchanged.
- DD-196 explicitly requires no separate Provider record. DD-201's direct usage→Provider relation, DD-197's capability relation, catalog eligibility/routing and the write-time principal-at-occurredAt predicate remain separately owned. Missing principal/elevation provenance is not repaired or inferred here.

**Determination:** SOURCE-COMPLETE for an internal read-only composition of DD-122, DD-108 and DD-196. The composition preserves scoped usage visibility and exact global metadata ownership. It grants no provider/model currentness, eligibility, billing or execution authority. Separate read ports do not establish an atomic cross-record snapshot or authority after later changes.

## Frozen decisions

**DD-703 — exact scoped TokenUsage first.** Add `loadAITokenUsageModelPairCurrentEvidence({requestContext,tokenUsageId},usageReader,modelReader)`. Read usage once with the original input id and identical RequestContext reference. Null usage short-circuits the catalog read; dependency exceptions propagate unchanged.

**DD-704 — validate necessary usage linkage before catalog access.** Require an object and DD-196's usage id, tenantId, optional industryContextId, modelId and providerId UUID shape. Optional Industry is absent only when exactly undefined. Malformed relevant linkage fails closed before the next read. No principal, capability, units, timestamp or correlation interpretation; existing port RLS remains authoritative.

**DD-705 — one exact global model metadata read.** For valid usage, call `modelReader.loadById(usage.modelId)` once using only the persisted model id. Null model returns null; dependency errors propagate unchanged. No search/list, code/version selection, scope rebinding, retry, alternate model or Provider lookup.

**DD-706 — reuse DD-196 pair equality and immutable raw evidence.** Apply the existing DD-196 predicate to both returned objects. Wrong or malformed model id/provider id fails closed, including correct model id with a different provider. Success returns frozen `{usage,model}` with the exact source references, preserving numeric text, optional fields, raw catalog status/version/arrays/metadata and all other non-predicate fields without normalization, rounding or arithmetic.

**DD-707 — no current eligibility or execution escalation.** Success means only the scoped usage and referenced global model agree on the persisted model/provider pair. A RETIRED, inactive or otherwise opaque model status is still raw evidence; this reader does not require ACTIVE. It grants no Provider health/credentials/currentness, model/capability/modality/residency/sensitivity eligibility, principal authorization, Tenant/Industry allowlisting, entitlement, budget/quota, cost/billing, routing/fallback, inference/embedding/media/RAG/tool/agent execution, API/UI, write or event authority.

## Frozen executable acceptance

- **AIUSAGE-MODELREAD-BASE-001:** usage read occurs first and once with original tokenUsageId and identical RequestContext.
- **AIUSAGE-MODELREAD-BASE-002:** null usage or usage-reader error prevents model access; exception identity is preserved.
- **AIUSAGE-MODELREAD-CHILD-001:** malformed/non-object usage or invalid id/Tenant/optional Industry/model/provider linkage rejects before model read; undefined Industry remains valid.
- **AIUSAGE-MODELREAD-READ-001:** valid usage triggers one global loadById with only the exact persisted modelId, without context or alternative selectors.
- **AIUSAGE-MODELREAD-READ-002:** absent model and model-reader errors return null/propagate with no retry or fallback.
- **AIUSAGE-MODELREAD-FLOOR-001:** DD-196 exact model/provider pair passes; malformed/missing/wrong model or provider identity and unequal UUID casing fail closed.
- **AIUSAGE-MODELREAD-EVID-001:** frozen envelope retains exact usage/model references, high-precision numeric text, optional fields and raw nullable catalog arrays/metadata without mutation.
- **AIUSAGE-MODELREAD-BOUND-001:** Tenant-Core/Industry contexts pass unchanged; different principal attribution and raw model status are not authorization or eligibility decisions; result contains no Provider row, currentness, billing, routing, execution or atomic-snapshot authority.

Expected Core **1695 → 1703** (+8 fixed acceptance tests). PostgreSQL **540**, Database **48 migrations / 42 SQL verification files**, Web unchanged; these are targets until exact implementation evidence is obtained.

## Ordered gates and exclusions

After this audit HEAD independently passes Core/PostgreSQL/Database/Web, implement only its frozen reader/tests/export and verify that exact implementation commit. Then promote canonical DD-17/18/19, manifest, all active projections and registers together, verify that promotion separately, and finally publish an independently verified state closure. Stop forward work on any real defect and apply the smallest forward-only correction. Preserve the structured current-CI consistency guard and separate historical feature proof.

No migration/schema/SQL-verification/RLS/role/grant/adapter/context-resolution/policy/route/UI/RawSource change, test weakening or invented requirement. Preserve 9 equal Industries / 41 MS / 181 Industry tables / 2,962 requirement IDs / exactly TENANT_STAFF_APP and TENANT_USER_APP. PR #2 stays open/draft/unmerged, main unchanged, no force-push. Production readiness is not claimed.
