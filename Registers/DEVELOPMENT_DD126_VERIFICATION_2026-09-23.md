# DD-126 Development Verification — AI Message Raw Persistence Reader

**Date:** 2026-09-23  
**Branch:** `docs/architecture-branch-2`  
**Prior promoted checkpoint:** `DEV-AI-MEDIA-REQUEST-READ-001`  
**Prior DD-125 final head:** `269a7f8bca48e8a69a5064a53aff4d720c86ec59`

## 1. Source-first ownership audit

Fresh source reconciliation selected one exact `core_ai.ai_message` row as the next independent source-complete persistence slice.

Audit artifact: `Development/AI_MESSAGE_RAW_PERSISTENCE_READER_PREREQUISITE_OWNERSHIP_AUDIT.md`.

The audit reconciled migration 0012 AIMessage schema and parent Conversation RLS, migration 0014 AI Gateway message DML authority, migration 0031 relationship-integrity scope, DD-09 persistence/runtime separation, and the existing AI Gateway/RequestScopedSql boundary.

## 2. Bounded implementation

Implementation commit: `fec7fd3a6c699f1284fe170a92ac68c1d9ecdb2e`.  
Implementation tree: `ec0afe1fc58f3be5bf9ed34084a4cd06226a9ed5`.

Changed implementation/test surface includes the AI Message contract/store, PostgreSQL acceptance coverage and Core export only. No migration, schema, verification SQL, role, grant, RLS policy, product policy, public/API route, decryption, source-authorizer, model router, retention executor or inference path was added.

The reader returns only:
- exact message id;
- parent Conversation id;
- raw role;
- raw content reference/encrypted content;
- optional normalized/frozen source JSON;
- optional raw model-route UUID;
- created timestamp;
- optional deleted timestamp.

## 3. Exact implementation-head CI

- Core Service Verify run `35839573511`, Core job `107111144138`: **SUCCESS**, **311/311 Core**.
- Same run, PostgreSQL/RLS job `107111144398`: **SUCCESS**, **322/322 PostgreSQL**, including `AIMSG-PG-001…007`.
- Database Verify run `35839578605`, job `107111159262`: **SUCCESS**.
- Web Boundary Verify run `35839573548`, job `107111143829`: **SUCCESS**.

## 4. Canonical DD / acceptance traceability

Canonical DD/acceptance commit: `a3c7dafc0df0dfd01edba42f9dce85c98b9ae9c6` / tree `b66ae8e0935d65e86283624c624511555c54b2b8`.

It adds exactly one DD-126 definition, exactly one DD-126 acceptance block and a DD-126 changelog entry.

## 5. Promotion invariant gate

- Core Service Verify run `35839860371`: Core job `107112086949` **SUCCESS**; PostgreSQL job `107112086571` **SUCCESS**.
- Database Verify run `35839860327`, job `107112086412`: **SUCCESS**.
- Web Boundary Verify run `35839860622`, job `107112087219`: **SUCCESS**.
- Counts: **311/311 Core**, **322/322 PostgreSQL**, **47 migrations / 41 SQL verification files**.
- Repository invariants: **9 Industries / 41 canonical Management Systems / 181 registered Industry tables / 2,962 preserved requirement IDs/text / 126 unique contiguous DD definitions**.

This gate authorizes promotion to `DEV-AI-MESSAGE-READ-001`; it does not expand DD-126 semantics.

## 6. Runtime semantics explicitly unclaimed

DD-126 does not:
- list/order Conversation history;
- interpret message role semantics;
- decrypt/dereference stored content;
- resolve/authorize source references;
- resolve/select model routes/providers/models;
- treat `deleted_at` as completed retention/erasure/legal-hold evidence;
- reconstruct prompts or perform inference/RAG/response generation;
- expose mutation/public routes or change schema/roles/grants/RLS/product policy.

## 7. Safety

- All repository mutations are forward-only; no force-push was used.
- `main` was not merged by this continuation.
- RawSourceCorpus was not edited.
- PR #2 remains review-only/draft unless explicitly authorized.
