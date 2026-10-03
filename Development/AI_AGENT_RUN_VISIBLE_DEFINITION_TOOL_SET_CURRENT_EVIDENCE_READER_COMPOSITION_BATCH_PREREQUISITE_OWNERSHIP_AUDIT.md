# AI AgentRun visible AgentDefinition + ToolSet current-evidence reader prerequisite ownership audit

**Date:** 2026-10-02  
**Baseline checkpoint:** `DEV-AI-AGENT-RUN-VISIBLE-DEFINITION-CURRENT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `e0e1e608abc45cbbfc9d6b976e037771a51d8aca`  
**Verified entry tree:** `f694ccc3abd5a4766d906efc7cc83062ee76c7e6`  
**Governed batch:** DD-393 through DD-397

## Entry gate

DD-388…DD-392 canonical promotion and state closure are verified. Push Core Service Verify run `36987007920`: Core job `110774216830` **1166/1166 PASS**, PostgreSQL job `110774217044` **529/529 PASS**, fail/skip 0; full database bootstrap PASS. Database run `36987007869` / job `110774216623` PASS, **48 migrations / 42 SQL verification files**. Web run `36987007888` / job `110774216662` PASS.

This closes DD-388…DD-392 at its bounded evidence scope. PR #2 remains draft/unmerged; RawSource remains unchanged.

## Reconciled owners and determination

- DD-392 owns `loadAIAgentRunDefinitionCurrentEvidence(...)`: exact visible AgentRun first, exact persisted AgentDefinition in the same RequestContext, DD-181 exact id/ACTIVE/scope binding, immutable exact references and no PLATFORM_GLOBAL fallback.
- DD-111 owns the exact-by-id RequestContext-scoped raw ToolSet reader. Tenant rows are same-Tenant visible, Industry rows require exact Industry Context, and PLATFORM rows require trusted PLATFORM_GLOBAL context; there is no implicit Tenant fallback.
- DD-180 owns `matchesAIAgentDefinitionToolSetBindingFloors(agent, toolSet)`: exact persisted `allowedToolSetId`, raw ToolSet status exactly `ACTIVE`, valid owner shapes and broader-or-equal PLATFORM/TENANT/INDUSTRY containment.
- Migration 0031 owns AgentDefinition→ToolSet existence/ACTIVE relationship; migration 0048 owns definition containment. AgentDefinition stores no ToolSet version/effective-date reference for this relation.
- AgentDefinition objective/risk/approval/budget/version/status and ToolSet code/version/timestamps are independent raw evidence. ToolSet members, tool eligibility, permission, entitlement, approvals, OperationContract dispatch and Agent execution remain separately governed.

**SOURCE-COMPLETE:** extend the existing DD-392 AgentRun/AgentDefinition evidence with exact visible ToolSet current evidence using DD-111 and DD-180. No duplicate AgentDefinition read, cross-scope resolver, ToolSet version selection, member resolution or tool execution semantics are required.

A valid Tenant/Industry AgentDefinition may reference a broader PLATFORM ToolSet while that ToolSet remains hidden to the supplied Tenant RequestContext. Same-context ToolSet null therefore returns null. This batch must not switch to PLATFORM_GLOBAL, synthesize a platform principal or use an alternate reader path.

## Frozen decisions

**DD-393 — DD-392 parent evidence first.** Add `loadAIAgentRunDefinitionToolSetCurrentEvidence(input, runReader, definitionReader, toolSetReader)`. Invoke DD-392 first with the exact supplied RequestContext and AgentRun id. Null short-circuits ToolSet access; dependency errors propagate unchanged.

**DD-394 — Exact persisted ToolSet in the same context.** Use exactly `parent.definition.allowedToolSetId`; invoke ToolSet reader exactly once with the identical RequestContext and exact id. Null returns null; dependency errors propagate unchanged. Do not re-read AgentDefinition, lookup by code/version or change context.

**DD-395 — Existing DD-180 current binding and no fallback.** Apply `matchesAIAgentDefinitionToolSetBindingFloors(parent.definition, toolSet)`; false returns null. Reuse exact id/ACTIVE/broader-or-equal containment only. A hidden PLATFORM ToolSet remains null under Tenant context with no PLATFORM_GLOBAL fallback/elevation.

**DD-396 — Immutable layered exact-reference evidence.** Success returns a frozen `{ runDefinition: parent, toolSet }` envelope preserving the exact DD-392 parent object and exact ToolSet object reference. No clone, normalization or mutation.

**DD-397 — Combined evidence adds no tool/execution authority.** Preserve AgentRun principal/membership/snapshot/resource/status/budget, AgentDefinition objective/ToolSet/risk/approval/budget/version/status and ToolSet code/version/status metadata unchanged. Do not resolve ToolSet members, authorize tools, permissions, entitlements or approvals, select current versions, plan AgentSteps, dispatch OperationContracts, route providers/models, mutate, emit events or execute AI.

## Fixed acceptance before implementation

- **AIARUN-TOOLSETREAD-BASE-001:** exact RequestContext/id enters DD-392 first; no ToolSet access precedes successful parent evidence.
- **AIARUN-TOOLSETREAD-BASE-002:** DD-392 null/error short-circuits ToolSet access; dependency error identity is preserved.
- **AIARUN-TOOLSETREAD-TOOLSET-001:** successful parent forwards the identical RequestContext and exact persisted `allowedToolSetId` to ToolSet reader once, with no AgentDefinition re-read beyond DD-392.
- **AIARUN-TOOLSETREAD-TOOLSET-002:** hidden/missing ToolSet returns null; ToolSet-reader errors propagate unchanged.
- **AIARUN-TOOLSETREAD-FLOOR-001:** DD-180 exact ACTIVE broader-or-equal binding passes; wrong id, non-ACTIVE, narrower/foreign/sibling/malformed evidence fails closed.
- **AIARUN-TOOLSETREAD-NOFALLBACK-001:** a broader PLATFORM ToolSet hidden under Tenant context remains null after one same-context read; no PLATFORM_GLOBAL fallback/elevation occurs.
- **AIARUN-TOOLSETREAD-EVID-001:** success preserves exact DD-392 parent and ToolSet references in a frozen envelope; inputs remain unchanged.
- **AIARUN-TOOLSETREAD-BOUND-001:** combined raw evidence exposes no ToolSet-member resolution, tool eligibility, permission/entitlement/approval, AgentStep, OperationContract, provider/model, mutation, event or execution authority.

Expected delta: Core **1166 → 1174**. PostgreSQL stays **529**; Database stays **48/42**; Web unchanged.

## Delivery and exclusions

Implementation: `src/core/ai/agent-run-visible-definition-tool-set-current-evidence-reader.ts`, Core export, and `tests/core/ai-agent-run-visible-definition-tool-set-current-evidence-reader.test.mjs`. Promote DD-17 acceptances, DD-18 decisions, DD-19 traceability and current checkpoint narratives only after exact-head Core/PostgreSQL/Database/Web verification; the promotion must independently pass.

No schema, migration, RLS, grant, role, route, frontend, provider, scheduler, worker, product-policy or RawSource change. ToolSet-member resolution, tool/current permission/entitlement/approval checks, AgentStep planning/execution, OperationContract dispatch, provider/model routing and inference remain separately governed. Production readiness is not claimed.
