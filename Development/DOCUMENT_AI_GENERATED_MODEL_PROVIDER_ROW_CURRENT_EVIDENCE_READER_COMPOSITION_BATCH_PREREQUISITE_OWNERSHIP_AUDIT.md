# Generated Document + AIModel + AIProvider row current-evidence reader prerequisite ownership audit

**Date:** 2026-10-07  
**Baseline checkpoint:** `DEV-DOCUMENT-AI-GENERATED-MODEL-PROVIDER-CURRENT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `744fcecb0e21a089f63fdd5ccf2751951f85bcc6`  
**Verified entry tree:** `91cb587ce529fe5874b857c12b7868efd93dabb1`  
**Governed batch:** DD-618 through DD-622

## Entry gate

DD-613…DD-617 state closure `744fcecb0e21a089f63fdd5ccf2751951f85bcc6` / tree `91cb587ce529fe5874b857c12b7868efd93dabb1` is exact-head verified. Core Service Verify run `37575162539`: Core job `112642302038` **1544/1544 PASS** and PostgreSQL job `112642301768` **540/540 PASS**, fail/skip 0; full database bootstrap PASS. Database run `37575162581` / job `112642302093` PASS with **48 migrations / 42 SQL verification files**. Web run `37575162555` / job `112642301801` PASS. RawSource remains unchanged; `main` remains unmerged; PR #2 remains draft/unmerged.

## Reconciled owners and determination

- DD-617 owns exact Generated Document→completed AIMediaRequest→AIModel(id, providerId) relationship evidence. Non-AI Documents perform zero AIModel reads; AI-generated Documents read exact persisted `document.aiModelId` once and apply only DD-192.
- DD-107 owns immutable global `AIProviderCatalogMetadata` plus `AIProviderCatalogMetadataReadPort.loadById(id)`. Provider metadata is global and does not require a Tenant RequestContext.
- DD-200 owns the pure persisted `AIModel.providerId → AIProvider.id` foreign-key continuity floor through `matchesAIModelProviderBindingFloors(model, provider?)`.
- DD-200 explicitly excludes Provider/Model ACTIVE/current/healthy/eligible state, credential disclosure/secret resolution, capability/modality/residency/sensitivity compatibility, Tenant/Industry allowlists, provisioning validity, budget/quota, routing/fallback/retry, SDK dispatch and AI execution.
- DD-617 already preserves the exact loaded Model reference when AI-generated; therefore no second Model read is needed.
- The non-AI parent branch has no Model evidence by construction and must preserve zero Provider reads.

**SOURCE-COMPLETE:** extend exact DD-617 evidence only. If the parent is non-AI/model-absent, perform zero AIProvider reads and return frozen exact parent-only evidence. If AI-generated/model-bound, call `AIProviderCatalogMetadataReadPort.loadById(parent.model.providerId)` exactly once, then apply only DD-200 against the exact already-loaded Model and exact loaded Provider. Do not search/select by Provider code, current/latest version, capability, region, health, status or credential metadata.

## Frozen decisions

**DD-618 — exact DD-617 parent first; preserve non-AI zero-provider-read branch.**  
Add `loadDocumentAIGeneratedModelProviderRowCurrentEvidence(...)`. Invoke DD-617 first with exact RequestContext/document id and unchanged Document/MediaRequest/Model dependencies. Parent null/errors preserve DD-617 behavior. If the parent has no Model evidence, return frozen exact parent-only evidence and perform zero AIProvider reads.

**DD-619 — exact persisted Model.providerId Provider read only.**  
For model-bound evidence call `AIProviderCatalogMetadataReadPort.loadById(parent.model.providerId)` exactly once. Missing Provider returns null. Provider-reader errors propagate unchanged. Do not trim/normalize/search by Provider code, choose current/latest, inspect health/status to select fallback, or read credentials/secrets.

**DD-620 — apply only DD-200 direct Model→Provider FK floor.**  
Require `matchesAIModelProviderBindingFloors(parent.model, provider)`. Exact Provider.id == Model.providerId is necessary. Model/Provider lifecycle, capability, residency, sensitivity, cost, latency, security, health, version and metadata remain uninterpreted.

**DD-621 — immutable layered evidence.**  
Non-AI success returns frozen `{ parent }`. Model-bound success returns frozen `{ parent, provider }`, preserving exact DD-617 parent and exact Provider reference without clone/normalization/mutation.

**DD-622 — Provider-row relationship evidence is not Provider/Model currentness or execution authority.**  
Do not interpret Provider/Model ACTIVE/current/healthy/eligible/routable state, credential refs/secrets, capability/residency/sensitivity compatibility, allowlists, provisioning, entitlement/budget, moderation/licensing approval, request-principal currentness, Document ACL/storage/signed access, media publication, mutation/events or AI execution.

## Fixed acceptance before implementation

- **DOCAI-PROVREAD-BASE-001** exact DD-617 parent evidence is established first with unchanged input/dependencies.
- **DOCAI-PROVREAD-BASE-002** DD-617 null/error short-circuits or propagates before any AIProvider read.
- **DOCAI-PROVREAD-BRANCH-001** non-AI/model-absent parent performs zero AIProvider reads and returns frozen exact parent-only evidence.
- **DOCAI-PROVREAD-READ-001** model-bound parent performs exactly one `loadById` using exact preserved `model.providerId`.
- **DOCAI-PROVREAD-READ-002** missing Provider returns null and Provider-reader errors propagate unchanged with no code/current/latest/fallback/credential lookup.
- **DOCAI-PROVREAD-FLOOR-001** exact DD-200 Model.providerId→Provider.id binding passes.
- **DOCAI-PROVREAD-FLOOR-002** wrong/malformed Provider id or malformed relevant Model evidence fails closed through DD-200.
- **DOCAI-PROVREAD-EVID-001** success preserves exact DD-617 parent and exact Provider references; raw model/provider/request/provenance metadata remain unchanged.
- **DOCAI-PROVREAD-BOUND-001** output grants no Provider/Model currentness/health/credential/eligibility/routing, moderation/licensing, Document access/publication or AI execution authority.

Expected executable delta: Core **1544 → 1553**. PostgreSQL remains **540**. Database inventory remains **48 migrations / 42 SQL verification files**.

## Explicit exclusions

No schema, migration, SQL verification, RLS, role, grant, route, frontend, provider SDK, worker, scheduler or RawSource change.

This batch does **not**:
- read/resolve Provider credentials or secrets;
- interpret Provider/Model ACTIVE, health, capability, modality, residency, sensitivity, cost, latency, security or version as current/eligible/routable state;
- select current/latest/fallback Provider or Model;
- evaluate Tenant/Industry Provider/Model allowlists or provisioning snapshots;
- interpret moderation/licensing/provenance JSON as approval;
- authorize request principal or Document ACL/source-resource/storage/signed access;
- evaluate prompt/capability/entitlement/budget admission;
- generate/publish media, dispatch provider SDK work, mutate state or emit events.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-618…DD-622 and the fixed acceptances above.
