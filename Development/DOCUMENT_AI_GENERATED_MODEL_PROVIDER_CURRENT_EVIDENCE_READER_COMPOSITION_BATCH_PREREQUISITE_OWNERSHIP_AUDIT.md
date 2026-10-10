# Generated Document + AIMediaRequest + AIModel/provider-pair current-evidence reader prerequisite ownership audit

**Date:** 2026-10-07  
**Baseline checkpoint:** `DEV-DOCUMENT-AI-GENERATED-MEDIA-REQUEST-CURRENT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `bede045a59b65b4cac69ded0f66be36186ccbd45`  
**Verified entry tree:** `fed260a407e6cda879fa18b30074ef292f065752`  
**Governed batch:** DD-613 through DD-617

## Entry gate

DD-608…DD-612 state closure `bede045a59b65b4cac69ded0f66be36186ccbd45` / tree `fed260a407e6cda879fa18b30074ef292f065752` is exact-head verified. Core Service Verify run `37565345468`: Core job `112611652610` **1535/1535 PASS** and PostgreSQL job `112611652357` **540/540 PASS**, fail/skip 0; full database bootstrap PASS. Database run `37565345456` / job `112611652471` PASS with **48 migrations / 42 SQL verification files**. Web run `37565345326` / job `112611651980` PASS. REPO-007/008/009/011 all pass on the closure HEAD. RawSource is unchanged; `main` remains unmerged; PR #2 remains draft/unmerged.

## Reconciled owners and determination

- DD-612 owns exact Generated Document→completed AIMediaRequest current evidence. It establishes Document AI-provenance first; non-AI Documents perform zero request reads; AI-generated Documents read exactly persisted `aiMediaRequestId` under the same RequestContext and apply only DD-191.
- DD-192 already owns the pure migration-0031 Generated Document→AIModel exact composite pair floor: for AI-generated rows require exact `model.id === document.aiModelId` and exact `model.providerId === document.aiProviderId`; non-AI rows require no model evidence.
- DD-108 owns immutable global `AIModelCatalogMetadata` plus `AIModelCatalogMetadataReadPort.loadById(id)`. The model catalog is global and does not require a Tenant RequestContext.
- Migration 0031 owns `document_meta_ai_model_provider_fk (ai_model_id, ai_provider_id) → ai_model(id, provider_id)`. A separate AIProvider row is **not** part of this persisted predicate.
- Provider ACTIVE/health/credential/capability/residency/currentness and Model ACTIVE/capability/residency/sensitivity/cost/latency/currentness remain explicitly separate runtime/catalog-policy concerns.

**SOURCE-COMPLETE:** extend exact DD-612 evidence only. If the DD-612 parent is a non-AI Document, perform zero AIModel reads and return frozen parent-only evidence. If AI-generated, read exactly the persisted `document.aiModelId` once through the existing global model metadata port, then apply only DD-192 against the exact already-loaded Document and exact loaded Model. Do not read AIProvider, search by code/provider, select latest/current versions, or interpret raw model/provider lifecycle/policy fields.

## Frozen decisions

**DD-613 — exact DD-612 parent first; preserve no-AI zero-read branch.**  
Add `loadDocumentAIGeneratedModelProviderCurrentEvidence(...)`. Invoke DD-612 first with exact RequestContext/document id and unchanged Document/MediaRequest dependencies. Parent null/errors preserve DD-612 behavior. If the preserved Document is non-AI, return frozen exact parent-only evidence and perform zero AIModel reads.

**DD-614 — exact persisted AIModel id read only.**  
For an AI-generated parent, require persisted `document.aiModelId`; call `AIModelCatalogMetadataReadPort.loadById(document.aiModelId)` exactly once. Missing Model returns null. Model-reader errors propagate unchanged. Do not trim/normalize/search by model code/provider id, select current/latest, or fall back. Do not read AIProvider.

**DD-615 — apply only DD-192 exact composite-pair floor.**  
Require `matchesDocumentAIGeneratedModelProviderBindingFloors(parent.document, model)`. Exact model id and model.providerId→document.aiProviderId continuity is necessary. Model status/version/capabilities/modalities/residency/sensitivity/cost/latency/metadata remain uninterpreted.

**DD-616 — immutable layered evidence.**  
Non-AI success returns frozen `{ parent }`. AI-generated success returns frozen `{ parent, model }`, preserving exact DD-612 parent and exact model reference without clone/normalization/mutation.

**DD-617 — relationship evidence is not Provider/Model currentness or execution authority.**  
Do not read AIProvider; do not interpret Model/Provider ACTIVE/health/security/capability/residency/sensitivity/currentness; do not evaluate moderation/licensing approval, request-principal currentness, Document ACL/storage/signed access, prompt/capability/entitlement/budget, provider/model routing, media generation/publication, mutation or events.

## Fixed acceptance before implementation

- **DOCAI-MODELREAD-BASE-001** exact DD-612 parent evidence is established first with unchanged input/dependencies.
- **DOCAI-MODELREAD-BASE-002** DD-612 null/error short-circuits or propagates before any AIModel read.
- **DOCAI-MODELREAD-BRANCH-001** non-AI Document performs zero AIModel reads and returns frozen exact parent-only evidence.
- **DOCAI-MODELREAD-READ-001** AI-generated Document performs exactly one `loadById` using persisted `document.aiModelId`.
- **DOCAI-MODELREAD-READ-002** missing Model returns null and Model-reader errors propagate unchanged with no search/fallback/Provider read.
- **DOCAI-MODELREAD-FLOOR-001** exact DD-192 Model id + Model.providerId pair passes for valid AI-generated evidence.
- **DOCAI-MODELREAD-FLOOR-002** wrong/malformed Model id/provider pair or malformed relevant generated evidence fails closed through DD-192.
- **DOCAI-MODELREAD-EVID-001** success preserves exact DD-612 parent and exact Model references; raw request/provenance/moderation/licensing/model metadata remain unchanged.
- **DOCAI-MODELREAD-BOUND-001** output grants no Provider row/currentness/health/credential, Model eligibility/currentness/routing, moderation/licensing approval, Document access/storage, media publication or AI execution authority.

Expected executable delta: Core **1535 → 1544**. PostgreSQL remains **540**. Database inventory remains **48 migrations / 42 SQL verification files**.

## Explicit exclusions

No schema, migration, SQL verification, RLS, role, grant, route, frontend, provider SDK, worker, scheduler or RawSource change.

This batch does **not**:
- read AIProvider or resolve provider credentials/secrets;
- interpret Model/Provider ACTIVE, health, capability, modality, residency, sensitivity, cost, latency or version as current/eligible/routable state;
- select current/latest/fallback Model or Provider;
- interpret moderation/licensing/provenance JSON as approval;
- authorize request principal or Document ACL/source-resource/storage/signed access;
- evaluate prompt/capability/entitlement/budget admission;
- generate/publish media, dispatch provider SDK work, mutate state or emit events.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-613…DD-617 and the fixed acceptances above.
