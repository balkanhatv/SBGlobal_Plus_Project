# DD-653…DD-657 verification — RAG bound-Document ACL access-path evidence

**Date:** 2026-10-07  
**Source audit:** `Development/RAG_CHUNK_BOUND_DOCUMENT_ACL_ACCESS_PATH_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`  
**Source-audit HEAD/tree:** `df405c62781916f28dd8ff93e7b11c7b91cb01e9` / `58e6cb137107da37f8751683758f13f09d935e00`  
**Verified implementation HEAD/tree:** `c35494e6f825e611f475733180fbedb8837f6d0a` / `7b47dbeff5acf6104fc2ec152af60150b085342f`

## Entry gate

DD-648…DD-652 state closure `d8db01e27986b689ff410546caac74e9d67f14b0` / tree `e41ec6dab52fd33ec8b10199d7c25c9c98112c14` passed exact-head Core **1606/1606**, PostgreSQL **540/540** plus bootstrap, Database **48 migrations / 42 SQL verification files** and Web. DD-653…DD-657 source-audit HEAD then passed exact-head Core/PostgreSQL/Database/Web before implementation.

## Forward-only implementation correction

Initial implementation `ceb4cbf82bb551248768589ca23c11c139725c22` correctly implemented the runtime semantics and shared DD-572 classifier, but one new BASE acceptance incorrectly required the DD-562 projected candidate object to be reference-equal to raw DocumentAccessMetadata. Core executed **1614** tests with **1613 PASS / 1 FAIL**; all other new tests and all existing DD-572 regressions passed.

Forward-only correction `c35494e6f825e611f475733180fbedb8837f6d0a` changed only that over-strong test assertion to verify canonical candidate document identity continuity. Runtime code and frozen DD-653…DD-657 semantics were unchanged.

## Exact-head implementation gate

Corrected implementation HEAD `c35494e6f825e611f475733180fbedb8837f6d0a` / tree `7b47dbeff5acf6104fc2ec152af60150b085342f` passed:
- Core push run `37661948983` / job `112931424955`: **1614/1614 PASS**, fail/skip 0.
- PostgreSQL same run / job `112931425249`: **540/540 PASS**, fail/skip 0; full database bootstrap PASS.
- Database push run `37661948990` / job `112931424681`: PASS; inventory remains **48 migrations / 42 SQL verification files**.
- Web push run `37661948882` / job `112931427874`: PASS.
- Existing `DOC-ACLPATH-*` DD-568…DD-572 regression tests all remained green after shared-helper refactor.

## Bounded result

The batch creates one shared pure Core ACL-path classifier and reuses it from both existing DD-572 and the new RAG reader. The RAG reader invokes exact DD-652 first and performs zero additional persistence/storage/authorization reads. Unbound evidence stays frozen parent-only. Bound evidence adds only one exact three-way classification.

EXPLICIT_ACL_DENY blocks source-resource fallback only at the ACL layer. EXPLICIT_ACL_ALLOW is positive ACL-path evidence only. SOURCE_RESOURCE_AUTHORIZATION_REQUIRED identifies the still-unexecuted source-resource path. No StorageObject prerequisite is added to RAG. No RAG→Document permission mapping, ResourceDescriptor/source resolver, final authorization, entitlement/security filtering, retrieval/ranking/grounding/citation, prompt-injection policy, provider/model routing, inference, mutation/events or AI execution authority is added.

No schema/RLS/role/grant/route/frontend/worker/scheduler/RawSource change occurred.

## Canonical promotion gate

Canonical DD/traceability/state promotion must independently pass exact-head Core/PostgreSQL/Database/Web before DD-653…DD-657 state closure.
