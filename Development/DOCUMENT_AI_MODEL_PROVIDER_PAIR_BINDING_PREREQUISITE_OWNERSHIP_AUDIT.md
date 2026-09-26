# Generated Document AIModel/AIProvider pair binding prerequisite ownership audit

**Date:** 2026-09-25
**Baseline checkpoint:** `DEV-DOCUMENT-AI-MEDIA-REQUEST-PROVENANCE-FLOORS-001`
**Verified promotion HEAD:** `d7153cd0115da87cbb7ca902e34970aa800ddc92`
**Verified tree:** `8227c3c85f1d4cca1ca1618a7176f1f4493555bf`

## Entry gate

DD-191 canonical promotion is exact-head verified. Core Service Verify run `36133500087` passed Core job `108065986628` at **581/581** and PostgreSQL job `108065986260` at **504/504** plus database bootstrap PASS. Database Verify run `36133500075` / job `108065985934` passed. Web Boundary Verify run `36133500054` / job `108065986108` passed. REPO-007 and REPO-008 both pass. All four logs assert the exact HEAD/tree above. RawSource is unchanged; `main` is unmerged; PR #2 remains draft/unmerged.

## Source ownership reconciled

Migration 0031 creates `ai_model_id_provider_uq UNIQUE (id, provider_id)` on `core_ai.ai_model` and then creates the exact composite foreign key:

`document_meta_ai_model_provider_fk FOREIGN KEY (ai_model_id, ai_provider_id) REFERENCES core_ai.ai_model(id, provider_id)`.

The migration-0031 Document AI-provenance CHECK separately guarantees that non-AI Documents carry no AI Model/Provider ids while AI-generated Documents carry both ids.

DD-190 exposes Document-side `aiGenerated`, optional `aiModelId` and optional `aiProviderId`. DD-108 exposes raw AIModel catalog `id` and `providerId`. Therefore every persisted fact needed to re-evaluate the composite pair relationship is available.

A separate AIProvider row is **not** part of this foreign-key predicate. Provider ACTIVE/health/credential/capability/residency/currentness and Model ACTIVE/capability/residency/sensitivity/currentness are runtime/catalog-policy concerns explicitly excluded by DD-107/DD-108 and A-07/DD-09.

## Determination and locked DD-192 detailed contract

**SOURCE-COMPLETE for the exact persisted Model/Provider pair relationship only.**

Authorize pure helper:

`matchesDocumentAIGeneratedModelProviderBindingFloors(document, model?)`

It takes already-loaded DD-190 Document provenance evidence plus optional already-loaded DD-108 AIModel metadata; returns boolean and never mutates inputs.

1. Validate relevant Document id/Tenant/optional Industry/generated/model/provider UUID shape.
2. For `aiGenerated=false`, require absent `aiModelId` and `aiProviderId`, and no supplied model evidence.
3. For `aiGenerated=true`, require valid `aiModelId` and `aiProviderId`, plus model evidence.
4. Require exact `model.id === document.aiModelId`.
5. Require exact `model.providerId === document.aiProviderId`.
6. Do not require a separate Provider row and do not inspect Model status/version/capabilities/modalities/residency/sensitivity/cost/latency/metadata.
7. Unrelated Document MediaRequest/provenance/moderation/licensing/scope-policy evidence does not create or remove acceptance.

## Fixed acceptance before implementation

- **DOCAI-MODEL-CUR-001**: non-AI Document with no Model/Provider ids/evidence passes; unexpected ids or model evidence fails closed.
- **DOCAI-MODEL-CUR-002**: AI-generated Document with exact Model id and exact Model.providerId pair passes.
- **DOCAI-MODEL-CUR-003**: missing model evidence or wrong Model id fails closed.
- **DOCAI-MODEL-CUR-004**: Model.providerId different from Document.aiProviderId fails closed.
- **DOCAI-MODEL-CUR-005**: malformed relevant Document/model/provider UUID or generated-shape evidence fails closed.
- **DOCAI-MODEL-CUR-006**: raw Model status/version/capability/modality/residency/sensitivity/cost/latency/metadata evidence is uninterpreted and no Provider evidence is required.
- **DOCAI-MODEL-CUR-007**: unrelated Document MediaRequest/provenance/moderation/licensing evidence is uninterpreted; inputs remain unchanged.

Expected executable delta: Core **581 → 588**. PostgreSQL remains **504**. Database inventory remains **48 migrations / 42 SQL verification files**.

## Explicit exclusions / continuation

A true result mirrors only the composite foreign-key pair. It is not Model or Provider active/current/eligible/routable selection, provider health, credential access, capability/media suitability, sensitivity/residency policy, budget/quota, moderation/licensing approval, Document ACL/storage authority or AI execution. It changes no schema/RLS/role/grant/route/product policy.

After DD-192 is implemented and exact-head verified, source-audit another independent persisted relationship; complete Provider/Model selection and AI execution remain separately governed.
