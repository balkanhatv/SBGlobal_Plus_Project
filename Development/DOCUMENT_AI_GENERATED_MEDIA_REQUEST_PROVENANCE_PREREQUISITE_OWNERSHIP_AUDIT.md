# Generated Document → AIMediaRequest provenance prerequisite ownership audit

**Date:** 2026-09-25
**Baseline checkpoint:** `DEV-DOCUMENT-AI-PROVENANCE-RAW-READER-001`
**Verified promotion HEAD:** `4ada4f8747a824257ec128695ac6e2cc7c6099de`
**Verified tree:** `43c7803f59da459ffebc8441bb6f18ceb415e41f`

## Entry gate

DD-190 canonical promotion is exact-head verified. Core Service Verify run `36132278076` passed Core job `108062067291` at **573/573** and PostgreSQL job `108062066771` at **504/504** plus database bootstrap PASS. Database Verify run `36132278070` / job `108062066714` passed. Web Boundary Verify run `36132278057` / job `108062066512` passed. REPO-007 and REPO-008 both pass on the promoted checkpoint. All four logs assert the exact HEAD/tree above. RawSource is unchanged; `main` is unmerged; PR #2 remains draft/unmerged.

## Source ownership reconciled

Migration 0031 owns the generated-Document relationship inside `core_document.validate_document_relationships()`. When `document_meta.ai_generated=true`, the referenced `core_ai.ai_media_request` must:
1. exist at exact `ai_media_request_id`;
2. have non-null `completed_at`;
3. have the same Tenant;
4. have null-safe exact Industry Context;
5. have `residency_requirement` exactly equal to the Document `residency_region`;
6. have sensitivity rank less than or equal to the generated Document sensitivity rank.

The source-owned rank order is PUBLIC=1, INTERNAL=2, CONFIDENTIAL=3, SENSITIVE_PERSONAL=4, REGULATED=5.

DD-125 exposes all required MediaRequest evidence: id, Tenant/optional Industry, sensitivity, residency requirement and optional completed timestamp. DD-190 now exposes all required Document-side evidence: id, Tenant/optional Industry, sensitivity, residency, `aiGenerated` and optional exact `aiMediaRequestId`.

The migration also persists Provider/Model ids and provenance/moderation/licensing JSON on DocumentMeta, but none of those fields participates in this relationship predicate. Model/Provider currentness, moderation/licensing interpretation, Document ACL/storage authorization, generation/publication and request principal validity remain separate boundaries.

## Determination and locked DD-191 detailed contract

**SOURCE-COMPLETE for this direct persisted relationship floor only.**

Authorize pure helper:

`matchesDocumentAIGeneratedMediaRequestProvenanceFloors(document, mediaRequest?)`

It takes already-loaded DD-190 Document provenance evidence plus optional already-loaded DD-125 MediaRequest evidence; returns boolean and never mutates inputs.

1. Validate relevant Document identity/Tenant/optional Industry/sensitivity/residency/generated/request-id shape.
2. For `aiGenerated=false`, require absent `aiMediaRequestId` and no supplied MediaRequest evidence.
3. For `aiGenerated=true`, require a valid `aiMediaRequestId`, exact referenced request evidence and non-null valid persisted `completedAt`.
4. Require exact request id, same Tenant and null-safe exact Industry Context.
5. Require exact residency string equality; do not trim, case-fold or invent fallback.
6. Require both sensitivity classes to be known and generated Document rank >= request rank.
7. Provider/Model ids, provenance/moderation/licensing JSON and unrelated request fields do not create or remove acceptance.

## Fixed acceptance before implementation

- **DOCAI-MEDIA-CUR-001**: non-AI Document with no request binding/evidence passes; unexpected request evidence fails.
- **DOCAI-MEDIA-CUR-002**: exact completed same-scope generated Document/MediaRequest binding passes for Tenant-Industry and Tenant-Core evidence.
- **DOCAI-MEDIA-CUR-003**: missing request, wrong request id or absent/invalid completion timestamp fails closed.
- **DOCAI-MEDIA-CUR-004**: foreign Tenant, sibling Industry and null-versus-present Industry mismatch fail closed.
- **DOCAI-MEDIA-CUR-005**: residency mismatch fails; exact equality is required.
- **DOCAI-MEDIA-CUR-006**: all known sensitivity pairs follow generated-document-rank >= request-rank; unknown classes fail closed.
- **DOCAI-MEDIA-CUR-007**: malformed relevant UUID/scope/generated/request shape fails closed.
- **DOCAI-MEDIA-CUR-008**: Provider/Model ids, provenance/moderation/licensing JSON, request principal/capability/media/prompt/brand/localization/moderation-policy/status/createdAt remain uninterpreted; inputs remain unchanged.

Expected executable delta: Core **573 → 581**. PostgreSQL remains **504**. Database inventory remains **48 migrations / 42 SQL verification files**.

## Explicit exclusions / continuation

A true result is only the migration-0031 direct generated Document → completed MediaRequest relationship floor. It is not Document ACL/storage/signed-URL authority; it does not validate Provider/Model status, capabilities, residency or sensitivity; it does not interpret moderation/licensing/provenance; it does not validate request principal currentness; it does not execute generation, publication, retry/fallback or transport; and it changes no schema/RLS/role/grant/product policy.

After DD-191 is implemented and exact-head verified, source-audit another independent persisted relationship. Provider/Model currentness and complete AI execution remain separately governed.
