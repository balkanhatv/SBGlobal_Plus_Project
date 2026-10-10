# AIMediaRequest optional PromptTemplate current-evidence reader composition batch prerequisite ownership audit

**Date:** 2026-10-06  
**Baseline checkpoint:** `DEV-DOCUMENT-DERIVATIVE-PARENT-ACL-CURRENT-EFFECT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `e0c522b65d8bd2a18c247f49dc88177fa692a355`  
**Verified entry tree:** `fff0280ed552ed38ac8e9a63e4f209fe5370b81e`  
**Governed batch:** DD-593 through DD-597

## Entry gate

DD-588…DD-592 canonical promotion and state closure are exact-head verified. Push Core Service Verify run `37489834100`: Core job `112359345085` PASS, PostgreSQL job `112359344837` PASS with full database bootstrap. Database run `37489834098` / job `112359334622` PASS. Web run `37489834124` / job `112359334266` PASS.

This closes DD-588…DD-592 at its bounded derivative/parent paired ACL current-effect evidence scope. PR #2 remains open/draft/unmerged; RawSource remains unchanged; `main` remains unmerged.

## Reconciled source ownership

- DD-125 owns the raw typed `AIMediaRequestReadPort.loadForContext({ requestContext, mediaRequestId })` and concrete PostgreSQL read boundary.
- DD-115 owns raw PromptTemplate persistence evidence and `AIPromptTemplateReadPort.loadForContext({ requestContext, promptTemplateId })`.
- DD-188 already owns the exact optional AIMediaRequest → PromptTemplate persisted relationship floor: unbound requests require both prompt id/version and prompt evidence absent; bound requests require exact id, exact positive safe-integer version, raw ACTIVE status and canonical PLATFORM/TENANT/INDUSTRY applicability.
- Migration 0031 owns the same optional prompt binding and migration 0048 / DD-170 makes definition applicability total fail-closed.
- DD-09 states only ACTIVE PromptTemplate versions execute, but prompt selection/rendering/approval/override policy and media-generation execution remain separately governed.
- No additional persistence source, resolver, fallback selector, template renderer or product policy is required to sequence the already-owned exact request read → optional exact prompt read → DD-188 relationship floor.

**SOURCE-COMPLETE:** add one bounded reader composition only. Read the exact AIMediaRequest first. If it is unbound, perform zero PromptTemplate reads and apply DD-188 with absent prompt evidence. If it is bound, read exactly its persisted promptTemplateId under the same exact RequestContext, then apply DD-188. Preserve exact evidence references.

## Frozen decisions

**DD-593 — exact AIMediaRequest evidence first.** Add `loadAIMediaRequestPromptTemplateCurrentEvidence(...)`. Invoke `AIMediaRequestReadPort.loadForContext` exactly once with the exact supplied RequestContext and mediaRequestId. Null remains null; dependency/persistence errors propagate unchanged. No PromptTemplate read occurs before request success.

**DD-594 — unbound request branch performs zero PromptTemplate reads.** If persisted `promptTemplateId` is absent, call the existing DD-188 floor with undefined prompt evidence. Success requires DD-188's exact unbound shape, including absent `promptVersion`. Return immutable request-only evidence. Do not search by prompt code, choose a default/latest template or infer a prompt from media type/capability.

**DD-595 — bound request reads one exact PromptTemplate.** If persisted `promptTemplateId` is present, call `AIPromptTemplateReadPort.loadForContext` exactly once using the same exact RequestContext and exact persisted promptTemplateId. Prompt null returns null. Dependency/persistence errors propagate unchanged. No alternate id/code/version lookup or fallback is allowed.

**DD-596 — apply only the existing DD-188 relationship floor.** Require `matchesAIMediaRequestPromptTemplateBindingFloors(request, promptTemplate)` to pass. This proves exact id/version, raw ACTIVE and canonical owner-scope applicability only. Preserve the exact request and exact prompt object references in a frozen result.

**DD-597 — current PromptTemplate binding evidence is not prompt execution authority.** Do not select latest/template-by-code fallback, render/substitute variables, evaluate approval/override/grounding policy, establish principal currentness, Document ACL/state/security, brand/localization/moderation/entitlement/budget, provider/model/tool routing, media generation/publication, mutation/event or transport authority.

## Fixed acceptance before implementation

- **AIMEDIA-PROMPTREAD-BASE-001** exact AIMediaRequest read executes first with exact RequestContext/mediaRequestId.
- **AIMEDIA-PROMPTREAD-BASE-002** request null returns null and request dependency errors propagate unchanged before any prompt read.
- **AIMEDIA-PROMPTREAD-BRANCH-001** unbound valid request performs zero PromptTemplate reads, requires absent promptVersion, and returns frozen exact request-only evidence.
- **AIMEDIA-PROMPTREAD-READ-001** bound request performs exactly one PromptTemplate read using same exact RequestContext and persisted promptTemplateId.
- **AIMEDIA-PROMPTREAD-READ-002** bound prompt null returns null and prompt dependency errors propagate unchanged with no search/fallback.
- **AIMEDIA-PROMPTREAD-FLOOR-001** exact id/version/ACTIVE/applicable PLATFORM/TENANT/INDUSTRY prompt evidence passes through DD-188.
- **AIMEDIA-PROMPTREAD-FLOOR-002** id/version/status/owner-scope/applicability mismatch fails closed.
- **AIMEDIA-PROMPTREAD-EVID-001** success is frozen and preserves exact request/prompt references without mutation or normalization.
- **AIMEDIA-PROMPTREAD-BOUND-001** output exposes no prompt selection/rendering/approval/override/grounding result, principal/document authorization, entitlement/moderation/provider/model/tool/media-execution/publication/mutation authority.

Expected executable delta: Core **1500 → 1509**. PostgreSQL remains **540**. Database inventory remains **48 migrations / 42 SQL verification files**. Web remains unchanged.

## Explicit exclusions

No schema, migration, SQL verification, RLS, role, grant, route, frontend, renderer, provider SDK, worker, scheduler or RawSource change.

This batch does **not**:
- select PromptTemplate by code/latest/fallback;
- interpret template body, variable schema, groundingRequired or allowedOverrideFields;
- decide prompt approval/current publication beyond raw ACTIVE persisted binding;
- validate AIMediaRequest principal currentness;
- validate input-document ACL/access or StorageObject evidence;
- validate capability ACTIVE/entitlement/policy or provider/model/tool eligibility;
- evaluate brand/localization/moderation/budget;
- invoke AI/media generation, publication, mutation or events.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-593…DD-597 and the fixed acceptances above.
