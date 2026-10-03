# Document AI-generated provenance raw-reader prerequisite ownership audit

**Date:** 2026-09-25
**Baseline checkpoint:** `DEV-AI-MEDIA-INPUT-DOCUMENT-BINDING-FLOORS-001`
**Verified closure HEAD:** `a778d5ffa70098bf49db93b90b1219a3e47bfe8b`
**Verified tree:** `40b7ece060fab94dc81c6c1bc03ac9683cb86ee9`

## Entry gate

DD-189 state closure is exact-head verified. Core Service Verify run `36124745355` passed Core job `108038152553` at **573/573** and PostgreSQL job `108038152708` at **497/497** plus database bootstrap PASS. Database Verify run `36124745385` / job `108038152966` passed. Web Boundary Verify run `36124745408` / job `108038153205` passed. All four logs assert the exact HEAD/tree above. RawSource is unchanged; `main` is unmerged; PR #2 remains draft/unmerged.

## Source ownership reconciled

Migration 0031 extends `core_document.document_meta` with persisted AI provenance evidence:
- `ai_generated boolean NOT NULL DEFAULT false`
- optional `ai_media_request_id`
- optional `ai_provider_id`
- optional `ai_model_id`
- optional `ai_provenance_json`
- optional `ai_moderation_result_json`
- optional `ai_licensing_usage_json`

The same migration owns `document_meta_ai_provenance_ck`: non-AI documents must carry no AI provenance fields; AI-generated documents require MediaRequest, Provider and Model ids plus object-shaped provenance/moderation JSON, with optional object-shaped licensing JSON. It also owns foreign keys from DocumentMeta to AIMediaRequest and the exact AIModel/AIProvider pair.

The generated-document relationship trigger additionally re-checks, for an AI-generated document, that the referenced MediaRequest exists, is completed, has the same Tenant/null-safe Industry scope, has exact residency equality, and does not exceed the generated document sensitivity. DD-125 already exposes the MediaRequest side of that later relationship.

DD-082/DD-083 intentionally expose only access metadata and omit every `ai_*` provenance column. Therefore the generated-document relationship is **not yet source-complete at the Core evidence boundary** even though the database persists the facts. Inventing the missing evidence in a relationship helper would violate source-first/no-loss governance.

Migration 0006 + migration 0028 + DD-083 already provide the authoritative DocumentMeta FORCE-RLS and dedicated `sbg_document_service_rw` RequestScopedSql read boundary. No schema, RLS, role or grant change is required to read the existing AI provenance columns.

## Determination and locked DD-190 prerequisite

**SOURCE-COMPLETE for a raw persistence reader only.**

Authorize DD-190 as a new immutable read contract, not as provenance validation:

`DocumentAIGeneratedProvenanceReadPort.loadForContext({ requestContext, documentId })`

with one concrete PostgreSQL adapter through the existing `PostgresDocumentDatabase` + `RequestScopedSql` Document boundary.

The returned raw evidence may contain only:
1. Document id, Tenant id and optional Industry Context id.
2. Existing Document sensitivity class and residency region needed by the later migration-owned MediaRequest relationship.
3. `aiGenerated`.
4. Optional exact `aiMediaRequestId`, `aiProviderId`, `aiModelId`.
5. Optional normalized immutable object-shaped `aiProvenance`, `aiModerationResult`, `aiLicensingUsage`.

Reader shape rules mirror only the existing persisted CHECK: non-AI rows require all AI provenance fields absent; AI-generated rows require request/provider/model ids and provenance/moderation objects; licensing is optional object evidence. Malformed persisted evidence fails closed. No provider/model/request lookup is performed by DD-190.

## Fixed acceptance before implementation

- **DOCAIPROV-PG-001**: exact RLS-visible AI-generated Industry Document preserves ids, sensitivity/residency and immutable provenance/moderation/licensing objects.
- **DOCAIPROV-PG-002**: exact non-AI Document preserves `aiGenerated=false` with all optional AI evidence absent.
- **DOCAIPROV-PG-003**: sibling Industry and foreign Tenant rows remain hidden; same-Tenant Tenant-Core visibility follows existing DocumentMeta RLS.
- **DOCAIPROV-PG-004**: malformed UUID/ownership/provenance shape fails closed; normalized JSON is immutable and preserves data without invented semantics.
- **DOCAIPROV-PG-005**: malformed request context, invalid document id and Data Home route mismatch fail safely before disclosure.
- **DOCAIPROV-PG-006**: the port is exact-read only and exposes no create/update/delete/generate/moderate/publish/execute surface.
- **DOCAIPROV-PG-007**: raw evidence does not claim MediaRequest completion/currentness, Provider/Model currentness, moderation approval, licensing approval, publication, Document ACL/storage access or AI execution authority.

Expected executable delta: Core remains **573**; PostgreSQL acceptance rises **497 → 504**. Database inventory remains **48 migrations / 42 SQL verification files**.

## Explicit exclusions / continuation

DD-190 does not compose DD-189 or DD-188, validate AIMediaRequest completion/scope/sensitivity/residency, validate AIProvider/AIModel status/capabilities/residency/sensitivity, interpret provenance/moderation/licensing JSON, authorize Document access, expose storage locators, generate or publish media, or change schema/RLS/roles/grants/routes/product policy.

After DD-190 is implemented and exact-head verified, a separate source audit may evaluate the direct DocumentMeta → completed AIMediaRequest provenance relationship. Provider/Model currentness and execution policy remain separate boundaries.
