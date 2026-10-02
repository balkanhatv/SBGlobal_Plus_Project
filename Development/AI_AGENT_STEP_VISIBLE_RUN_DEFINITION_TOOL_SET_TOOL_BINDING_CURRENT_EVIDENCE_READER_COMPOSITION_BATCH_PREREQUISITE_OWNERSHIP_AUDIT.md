# AI AgentStep visible parent + ToolSet/tool-binding current-evidence reader prerequisite ownership audit

**Date:** 2026-10-02  
**Baseline checkpoint:** `DEV-AI-AGENT-RUN-VISIBLE-DEFINITION-TOOL-SET-CURRENT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `f33b52256ef74fb7157239771264256fe7653012`  
**Verified entry tree:** `ba773d2ef8f733141f794c96ce2af187b56ec4a3`  
**Governed batch:** DD-398 through DD-402

## Entry gate

DD-393…DD-397 canonical promotion and state closure are verified. Push Core Service Verify run `36992988733`: Core job `110793260813` **1174/1174 PASS**, PostgreSQL job `110793260441` **529/529 PASS**, fail/skip 0; full database bootstrap PASS. Database run `36992988771` / job `110793259961` PASS, **48 migrations / 42 SQL verification files**. Web run `36992989009` / job `110793261070` PASS.

This closes DD-393…DD-397 at its bounded evidence scope. PR #2 remains draft/unmerged; RawSource remains unchanged.

## Reconciled owners and determination

- DD-131 owns the exact-by-id RequestContext-scoped raw AgentStep reader. AgentStep RLS is parent-derived from its AgentRun visibility.
- DD-397 owns `loadAIAgentRunDefinitionToolSetCurrentEvidence(...)`: exact visible AgentRun, ACTIVE/applicable AgentDefinition and ACTIVE/broader-or-equal ToolSet evidence in one same-RequestContext immutable chain, with no PLATFORM_GLOBAL fallback.
- DD-113 owns the exact-by-id RequestContext-scoped raw ToolSetMember reader. Member visibility is parent ToolSet-derived.
- DD-110 owns the global exact-by-id ToolDefinition catalog metadata reader; it deliberately takes no RequestContext and returns catalog evidence only.
- DD-182 owns `matchesAIAgentStepToolBindingFloors(step, run, definition, member?, toolDefinition?)`: exact step→run→definition chain; non-TOOL steps require no tool binding/evidence; TOOL steps require exact persisted ToolSetMember, enabled member, exact referenced ACTIVE ToolDefinition and member ToolSet equal to AgentDefinition.allowedToolSetId.
- Migration 0031 owns these persisted TOOL/non-TOOL relationships. DD-182 explicitly does not interpret member constraints, permission, entitlement, approval, side-effect, idempotency, OperationContract or tool execution semantics.

**SOURCE-COMPLETE:** read one exact visible AgentStep, resolve its exact current DD-397 parent chain by persisted runId, and conditionally resolve only the persisted TOOL binding through DD-113/DD-110/DD-182. No list/next-step planning, effective-member selection or execution policy is required.

## Frozen decisions

**DD-398 — Exact visible AgentStep first.** Add `loadAIAgentStepToolBindingCurrentEvidence(input, stepReader, runReader, definitionReader, toolSetReader, memberReader, toolDefinitionReader)`. Read the exact AgentStep once using the supplied RequestContext and agentStepId before parent/tool access. Null returns null; dependency errors propagate unchanged.

**DD-399 — DD-397 parent evidence by exact persisted runId.** For a visible step, invoke DD-397 with the identical RequestContext and exactly `step.runId`. Null returns null; dependency errors propagate unchanged. Preserve the exact returned parent object; do not separately re-read AgentRun, AgentDefinition or ToolSet outside DD-397.

**DD-400 — Branch exactly on persisted stepType and DD-182.** For non-TOOL PLAN/RAG/APPROVAL/INFERENCE, do not read ToolSetMember or ToolDefinition and apply DD-182 with no tool evidence. For TOOL, use exactly `step.toolBindingId`; read ToolSetMember once in the identical RequestContext, then read exactly `member.toolDefinitionId` once through the global ToolDefinition catalog port. Null returns null; dependency errors propagate unchanged. Apply DD-182 and return null on false. No lookup by toolId/code/version/capability/operation.

**DD-401 — Immutable layered exact-reference evidence.** Non-TOOL success returns frozen `{ step, parent }`. TOOL success returns frozen `{ step, parent, member, toolDefinition }`. Preserve the exact reader/DD-397 references; no clone, normalization or mutation.

**DD-402 — Combined evidence adds no tool/execution authority.** Preserve step refs/status/timestamps/audit, run principal/membership/snapshot/resource/status/budget, definition policy/version/status, ToolSet metadata, member enabled/constraint and ToolDefinition permission/entitlement/scope/schema/side-effect/approval/idempotency/audit/OperationContract metadata unchanged. Do not interpret constraints, authorize permission/entitlement/approval, validate schemas, run GuardPipeline/idempotency/rate/audit, dispatch OperationContract, choose next/retry/resume, mutate, emit events, route providers/models or execute AI/tools.

## Fixed acceptance before implementation

- **AISTEP-EVID-BASE-001:** exact RequestContext/id reaches AgentStep first, once, before DD-397 parent/tool access.
- **AISTEP-EVID-BASE-002:** step null/error short-circuits all parent/member/catalog access and preserves dependency error identity.
- **AISTEP-EVID-PARENT-001:** visible step forwards identical RequestContext and exact persisted runId into the DD-397 chain; run/definition/ToolSet are not independently duplicated.
- **AISTEP-EVID-BRANCH-001:** valid non-TOOL evidence performs zero member/catalog reads and passes DD-182 only with absent tool evidence; TOOL performs exact same-context member read plus exact global member.toolDefinitionId catalog read.
- **AISTEP-EVID-ERROR-001:** TOOL hidden/missing member or ToolDefinition returns null; member/catalog dependency errors propagate unchanged.
- **AISTEP-EVID-FLOOR-001:** DD-182 rejects wrong run/definition/member/tool ids, disabled member, non-ACTIVE ToolDefinition, member outside AgentDefinition.allowedToolSetId, malformed/unsupported evidence and non-TOOL persisted bindings.
- **AISTEP-EVID-EVID-001:** success preserves exact step, DD-397 parent and optional member/ToolDefinition references in a frozen envelope; inputs remain unchanged.
- **AISTEP-EVID-BOUND-001:** combined raw evidence exposes no member-constraint interpretation, permission/entitlement/approval, schema/side-effect/idempotency/audit admission, next-step/retry/resume, OperationContract, provider/model, mutation, event or tool/AI execution authority.

Expected delta: Core **1174 → 1182**. PostgreSQL stays **529**; Database stays **48/42**; Web unchanged.

## Delivery and exclusions

Implementation: `src/core/ai/agent-step-visible-tool-binding-current-evidence-reader.ts`, Core export, and `tests/core/ai-agent-step-visible-tool-binding-current-evidence-reader.test.mjs`. Promote DD-17 acceptances, DD-18 decisions, DD-19 traceability and current checkpoint narratives only after exact-head Core/PostgreSQL/Database/Web verification; the promotion must independently pass.

No schema, migration, RLS, grant, role, route, frontend, provider, scheduler, worker, product-policy or RawSource change. AgentApproval backlink/current satisfaction, ToolSet-member effective selection beyond the persisted binding, current permission/entitlement/resource authorization, schema validation, OperationContract dispatch, AgentRun/AgentStep transitions/retry/resume, provider/model routing and inference remain separately governed. Production readiness is not claimed.
