# DD-112 Development Verification — AI PromptSet Raw Persistence Reader

**Date:** 2026-09-23  
**Branch:** `docs/architecture-branch-2`  
**Prior promoted checkpoint:** `DEV-AI-TOOL-SET-READ-001`  
**Prior DD-111 final head:** `7c99553cfe2c4de3381b505eb5d34b7cc94d53cb`

## 1. Source-first ownership audit

Fresh source reconciliation selected the parent `core_ai.ai_prompt_set` row as the next independent source-complete persistence slice.

Audit commit: `494561c2776bb8a465a334d4dc590a56ce2bf463`.  
Audit artifact: `Development/AI_PROMPT_SET_RAW_PERSISTENCE_READER_PREREQUISITE_OWNERSHIP_AUDIT.md`.

Source ownership reconciled migration 0031 physical PromptSet schema/RLS/grants and member/config integrity, migration 0032 PLATFORM write floor, A-07, DD-09, and the existing AI Gateway/RequestScopedSql boundaries.

## 2. Bounded implementation

Implementation commit: `14cf54776df8446f1a83c66c834421cf5119614c`.  
Implementation tree: `b1163db6fc833ec5810bbb049da0bee6728f7a2e`.

Changed implementation/test surface:

- `src/core/ai/prompt-set.ts`;
- `src/server/ai/postgres-ai-prompt-set-store.ts`;
- `tests/postgres/ai-prompt-set-store.test.mjs`;
- `src/core/index.ts` export only.

No migration, schema, verification SQL, role, grant, RLS policy, product policy, public/API route, provider SDK or execution path was added.

The read contract returns only parent PromptSet evidence: exact id, constrained PLATFORM/TENANT/INDUSTRY owner scope, optional Tenant/Industry ownership, raw code, positive version, constrained raw lifecycle status, and timestamps.

## 3. Selection/rendering authority remains separate

DD-09 separately governs PromptSet members, applicable-scope ACTIVE PromptTemplates, IndustryAIConfig domain PromptSet binding, prompt publication lifecycle and execution. DD-112 does not implement those semantics.

Migration 0031 gives `sbg_ai_gateway_rw` PromptSet DML for governed Tenant/Industry authoring; migration 0032 protects PLATFORM definition writes behind the control-plane role. The DD-112 port itself exposes only `loadForContext`.

## 4. Exact implementation-head CI

Exact tested implementation head: `14cf54776df8446f1a83c66c834421cf5119614c`.

- Core Service Verify run `35817204761`, Core job `107041180347`: **SUCCESS**, **311/311 Core**.
- Same run, PostgreSQL/RLS job `107041180167`: **SUCCESS**, **224/224 PostgreSQL**, including `AIPROMPTSET-PG-001…007`.
- Database Verify run `35817209035`, job `107041192969`: **SUCCESS**.
- Web Boundary Verify run `35817204772`, job `107041179944`: **SUCCESS**.

## 5. Canonical DD / acceptance traceability

Canonical DD/acceptance commit: `7e4d5e18aabb8a2a8950ebb0eeba46ab6713bc19` / tree `4a8136c832137f604c032a4f8342da47b19fa1bf`.

It adds exactly one DD-112 definition in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md`, exactly one DD-112 acceptance block in `DetailedDesign/DD-17_TEST_ACCEPTANCE_CONTRACTS.md`, and one DD-112 changelog entry.

## 6. Promotion invariant gate

Exact invariant-gate head: `7e4d5e18aabb8a2a8950ebb0eeba46ab6713bc19` / tree `4a8136c832137f604c032a4f8342da47b19fa1bf`.

- Core Service Verify run `35817372068`: Core job `107041678390` **SUCCESS**; PostgreSQL job `107041678174` **SUCCESS**.
- Database Verify run `35817372133`, job `107041678241`: **SUCCESS**.
- Web Boundary Verify run `35817372062`, job `107041678180`: **SUCCESS**.
- Counts: **311/311 Core**, **224/224 PostgreSQL**, **47 migrations / 41 SQL verification files**.
- Repository invariants: **9 Industries / 41 canonical Management Systems / 181 registered Industry tables / 2,962 preserved requirement IDs/text / 112 unique contiguous DD definitions**.

The green gate authorizes promotion to `DEV-AI-PROMPT-SET-READ-001`; it does not expand DD-112 runtime semantics.

## 7. Runtime semantics explicitly unclaimed

DD-112 does not:
- select ACTIVE/current/latest PromptSet versions;
- resolve code/version fallback or inheritance;
- load PromptSet members or apply priority/enabled filtering;
- select, approve, publish or render PromptTemplates;
- resolve IndustryAIConfig domain PromptSet;
- compose Assistant/system prompts or evaluate prompt precedence;
- select providers/models/policies/routes;
- execute tools/agents;
- resolve credentials, call provider SDKs, perform inference/RAG/media generation;
- expose a public route or change schema, verification SQL, roles, grants, RLS or product policy.

## 8. Safety

- All DD-112 repository mutations are forward-only; no force-push was used.
- `main` was not merged by this continuation.
- RawSourceCorpus was not edited.
- PR #2 remains review-only/draft unless explicitly authorized.
