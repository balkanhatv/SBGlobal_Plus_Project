# DD-593…DD-597 verification — AIMediaRequest optional PromptTemplate current-binding evidence

**Date:** 2026-10-06  
**Source audit:** `Development/AI_MEDIA_REQUEST_PROMPT_TEMPLATE_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`  
**Source-audit HEAD/tree:** `7f9ca2e82468f18246dc48566052bc0114e154bf` / `54cfbb73db751f15a89782eca3a4df410093f6ac`  
**Verified implementation HEAD/tree:** `3e6bd8985f5778eccbed34f79b7ad2ad3513059d` / `8de14fb9f1e5518ba2c6a28517cf2676fd18239b`

## Entry gate

DD-588…DD-592 state closure `e0c522b65d8bd2a18c247f49dc88177fa692a355` / tree `fff0280ed552ed38ac8e9a63e4f209fe5370b81e` passed exact-head Core/PostgreSQL/Database/Web. DD-593…DD-597 source-audit HEAD subsequently passed exact-head Core/PostgreSQL/Database/Web before implementation.

## Exact-head implementation verification

Implementation HEAD `3e6bd8985f5778eccbed34f79b7ad2ad3513059d` / tree `8de14fb9f1e5518ba2c6a28517cf2676fd18239b` passed:
- Core push run `37491574152` / job `112365368079`: **1509/1509 PASS**, fail/skip 0.
- PostgreSQL same run / job `112365367647`: **540/540 PASS**, fail/skip 0; full database bootstrap PASS.
- Database run `37491573863` / job `112365367025`: PASS with unchanged **48 migrations / 42 SQL verification files**.
- Web run `37491574103` / job `112365368334`: PASS.
- Pull-request Core/Database/Web workflows on the same implementation HEAD also passed.

## Bounded implementation result

The reader loads the exact AIMediaRequest first. An unbound request performs zero PromptTemplate reads and passes only when DD-188 accepts the exact unbound shape. A bound request performs exactly one same-RequestContext PromptTemplate read using persisted promptTemplateId, then applies only the existing DD-188 exact id/version/ACTIVE/applicability floor.

Success preserves exact request/prompt references. No prompt selection/rendering/approval/override/grounding, principal/document authorization, entitlement/moderation/provider/model/tool routing, media execution/publication, mutation/event, schema/RLS/route/frontend/RawSource authority is added.

## Promotion gate

Canonical DD/traceability/state promotion must independently pass exact-head Core/PostgreSQL/Database/Web before DD-593…DD-597 can be closed.
