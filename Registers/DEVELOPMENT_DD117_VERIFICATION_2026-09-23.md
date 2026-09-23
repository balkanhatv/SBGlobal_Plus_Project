# DD-117 Development Verification — AI AssistantDefinition Raw Persistence Reader

**Date:** 2026-09-23  
**Branch:** `docs/architecture-branch-2`  
**Prior promoted checkpoint:** `DEV-AI-POLICY-READ-001`  
**Prior DD-116 final head:** `a59e27cf70d10adf15b76cc5475344fc3cb6b89f`

## 1. Source-first ownership audit

Fresh source reconciliation selected one exact `core_ai.assistant_definition` row as the next independent source-complete persistence slice.

Audit commit: `3de1004e5cfa2cfea00c0f7b3dc4cac07a5b10b2`.  
Audit artifact: `Development/AI_ASSISTANT_DEFINITION_RAW_PERSISTENCE_READER_PREREQUISITE_OWNERSHIP_AUDIT.md`.

The audit reconciled migration 0012 physical AssistantDefinition schema, migration 0014 AI Gateway role authority, migration 0031 ToolSet FK/active-index and write-time capability/prompt/tool integrity, migration 0032 PLATFORM write floor, DD-09 Assistant/runtime separation, and existing AI Gateway/RequestScopedSql reader patterns.

## 2. Bounded implementation

Implementation commit: `cf751319c9c89ca9044a941326dc05ce2382de68`.  
Implementation tree: `8c190ae8463e69b7bbdafa94cd83d1e4891e7455`.

Changed implementation/test surface:

- `src/core/ai/assistant-definition.ts`;
- `src/server/ai/postgres-ai-assistant-definition-store.ts`;
- `tests/postgres/ai-assistant-definition-store.test.mjs`;
- `src/core/index.ts` export only.

The reader returns only persisted AssistantDefinition evidence: exact id/scope, raw code, immutable allowed-capability set, immutable normalized RAG-scope JSON, prompt/tool/model/retention references, positive version, raw status and timestamps.

No migration, schema, verification SQL, role, grant, RLS policy, product policy, public/API route, prompt renderer, RAG resolver, model router or execution path was added.

## 3. Write-time integrity is not read-time eligibility

The fixture creates AssistantDefinitions while capability, PromptTemplate and ToolSet references satisfy migration-0031 write integrity, then retires those referenced rows before read acceptance. DD-117 still returns the historical persisted references.

This proves the raw read boundary does not silently become a current eligibility/applicability selector. Runtime revalidation remains separately unimplemented.

## 4. Exact implementation-head CI

Exact tested implementation head: `cf751319c9c89ca9044a941326dc05ce2382de68`.

- Core Service Verify run `35821906928`, Core job `107055367354`: **SUCCESS**, **311/311 Core**.
- Same run, PostgreSQL/RLS job `107055367619`: **SUCCESS**, **259/259 PostgreSQL**, including `AIASSIST-PG-001…007`.
- Database Verify run `35821909394`, job `107055375228`: **SUCCESS** (pull_request event, exact same head).
- Web Boundary Verify run `35821906919`, job `107055367294`: **SUCCESS**.

## 5. Canonical DD / acceptance traceability

Canonical DD/acceptance commit: `9af95e7b0772af0b2ebea99e422e0f6db7261cc2` / tree `e2aebb22879f9a6103535d630bea2aa740a6d6ae`.

It adds exactly one DD-117 definition, exactly one DD-117 acceptance block, and a DD-117 changelog entry.

## 6. Promotion invariant gate

Exact invariant-gate head: `9af95e7b0772af0b2ebea99e422e0f6db7261cc2` / tree `e2aebb22879f9a6103535d630bea2aa740a6d6ae`.

- Core Service Verify run `35822089332`: Core job `107055915625` **SUCCESS**; PostgreSQL job `107055915351` **SUCCESS**.
- Database Verify run `35822089471`, job `107055916001`: **SUCCESS**.
- Web Boundary Verify run `35822089336`, job `107055915234`: **SUCCESS**.
- Counts: **311/311 Core**, **259/259 PostgreSQL**, **47 migrations / 41 SQL verification files**.
- Repository invariants: **9 Industries / 41 canonical Management Systems / 181 registered Industry tables / 2,962 preserved requirement IDs/text / 117 unique contiguous DD definitions**.

This gate authorizes promotion to `DEV-AI-ASSISTANT-DEFINITION-READ-001`; it does not expand DD-117 semantics.

## 7. Runtime semantics explicitly unclaimed

DD-117 does not:
- select ACTIVE/current/latest AssistantDefinition versions;
- resolve code/version fallback or inheritance;
- re-evaluate capability activity/eligibility or entitlement;
- load/render PromptTemplates or compose runtime prompts;
- resolve effective ToolSets/members or authorize tools;
- interpret RAG scope rules or retrieve RAG sources;
- resolve model/retention policies or provider/model routes;
- create/bind conversations;
- evaluate RequestContext authorization/approval;
- execute tools/agents or perform inference/embeddings/RAG.

## 8. Safety

- All repository mutations are forward-only; no force-push was used.
- `main` was not merged by this continuation.
- RawSourceCorpus was not edited.
- PR #2 remains review-only/draft unless explicitly authorized.
