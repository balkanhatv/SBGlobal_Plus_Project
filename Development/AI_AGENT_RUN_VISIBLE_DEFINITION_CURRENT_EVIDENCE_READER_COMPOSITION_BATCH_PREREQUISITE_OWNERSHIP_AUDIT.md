# AI AgentRun visible AgentDefinition current-evidence reader prerequisite ownership audit

**Date:** 2026-10-02  
**Baseline checkpoint:** `DEV-AUTOMATION-RUN-VISIBLE-DEFINITION-WORKFLOW-OPERATION-CURRENT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `bccfcd78b850dd163c87381daa0eee00fc8be9bf`  
**Verified entry tree:** `d21d0c29aa525ea60d97aaed49220352fa25a42c`  
**Governed batch:** DD-388 through DD-392

## Entry gate

DD-383…DD-387 corrected canonical promotion and state closure are verified. Push Core Service Verify run `36978417198`: Core job `110747234516` **1158/1158 PASS**, PostgreSQL job `110747234757` **529/529 PASS**, fail/skip 0; full database bootstrap PASS. Database run `36978416953` / job `110747233747` PASS, **48 migrations / 42 SQL verification files**. Web run `36978416997` / job `110747233862` PASS.

This closes DD-383…DD-387 at its bounded evidence scope. PR #2 remains draft/unmerged; RawSource remains unchanged.

## Reconciled owners and determination

- DD-130 owns the exact-by-id RequestContext-scoped raw AgentRun reader. AgentRun visibility is Tenant + acting-principal scoped, with exact Industry Context when the row is Industry-scoped; Tenant-Core rows remain same-principal/same-Tenant visible from Core or Industry contexts.
- DD-118 owns the exact-by-id RequestContext-scoped raw AgentDefinition reader. PLATFORM definitions require trusted PLATFORM_GLOBAL context; there is no implicit Tenant fallback to PLATFORM rows.
- DD-181 owns `matchesAIAgentRunDefinitionBindingFloors(run, definition)`: exact persisted AgentDefinition id, raw status exactly `ACTIVE`, and PLATFORM/TENANT/INDUSTRY applicability to the run Tenant/optional Industry scope.
- Migration 0031 additionally validates acting-principal and optional membership historical write-time facts. Those are separate identity relations and are not part of DD-181.
- AgentRun stores startup entitlement/permission snapshot versions, requested resource scope, status and budget classes. DD-09 and the DD-130/DD-181 audits explicitly state those fields do not authorize resume, step execution or tool execution.

**SOURCE-COMPLETE:** compose the existing AgentRun reader, AgentDefinition reader and DD-181 floor without new persistence, principal/membership revalidation, definition selection or execution semantics.

This is deliberately **visible definition current evidence**, not an exhaustive cross-scope resolver. A persisted AgentRun may validly reference an applicable PLATFORM AgentDefinition while that definition remains hidden to the supplied Tenant RequestContext. In that case the same-context AgentDefinition read returns null and this composition returns null. It must not switch to PLATFORM_GLOBAL, synthesize a platform principal or use another reader path.

## Frozen decisions

**DD-388 — Exact visible AgentRun first.** Add `loadAIAgentRunDefinitionCurrentEvidence(input, runReader, definitionReader)`. Invoke AgentRun reader first, exactly once, with the supplied RequestContext object and exact `agentRunId`. Null returns null without definition access; dependency errors propagate unchanged.

**DD-389 — Exact persisted AgentDefinition in the same context.** For a visible run, invoke AgentDefinition reader exactly once with the identical RequestContext object and exactly `run.agentDefinitionId`. Definition null returns null; dependency errors propagate unchanged. No alternate code/version lookup, PLATFORM_GLOBAL fallback or context switch.

**DD-390 — Existing DD-181 current binding.** Apply `matchesAIAgentRunDefinitionBindingFloors(run, definition)`; false returns null. Reuse exact id/ACTIVE/PLATFORM-TENANT-INDUSTRY applicability only. Do not add definition version/effective, principal, membership, snapshot, resource-scope, budget or lifecycle predicates.

**DD-391 — Immutable exact-reference evidence.** Success returns a frozen `{ run, definition }` envelope retaining the two exact object references. No clone, normalization or mutation.

**DD-392 — Raw Agent evidence adds no runtime authority.** Preserve actingPrincipalId, membershipId, startup entitlement/permission versions, requestedResourceScope, status, budgets, timing/correlation plus definition objective/ToolSet/risk/approval/budget/version/status metadata unchanged. Do not infer current principal/membership authorization, resumability, budget sufficiency, AgentStep planning, ToolSet/tool permission, approval satisfaction, OperationContract/provider/model execution, mutation or events.

## Fixed acceptance before implementation

- **AIARUN-DEFREAD-BASE-001:** exact AgentRun id and exact RequestContext reach the run reader once, before definition access.
- **AIARUN-DEFREAD-BASE-002:** run null/error short-circuits definition access; dependency error identity is preserved.
- **AIARUN-DEFREAD-DEF-001:** visible run forwards the identical RequestContext and exact persisted `agentDefinitionId` to the definition reader once for Tenant-Core/Tenant-Industry visibility cases.
- **AIARUN-DEFREAD-DEF-002:** hidden/missing definition returns null; definition-reader error identity is preserved.
- **AIARUN-DEFREAD-FLOOR-001:** exact ACTIVE applicable definition passes; wrong id, non-ACTIVE, foreign Tenant, sibling Industry and malformed owner/identity evidence fail closed through DD-181.
- **AIARUN-DEFREAD-NOFALLBACK-001:** hidden PLATFORM AgentDefinition remains null under Tenant context; exactly one same-context definition read occurs and no PLATFORM_GLOBAL fallback/elevation is attempted.
- **AIARUN-DEFREAD-EVID-001:** success preserves exact run/definition references in a frozen two-field envelope; inputs remain unchanged.
- **AIARUN-DEFREAD-BOUND-001:** principal/membership/snapshot/resource/status/budget and definition ToolSet/risk/approval/budget/version evidence remains uninterpreted; no resume/step/tool/approval/provider/OperationContract/mutation/event/execution authority is exposed.

Expected delta: Core **1158 → 1166**. PostgreSQL stays **529**; Database stays **48/42**; Web unchanged.

## Delivery and exclusions

Implementation: `src/core/ai/agent-run-visible-definition-current-evidence-reader.ts`, Core export, and `tests/core/ai-agent-run-visible-definition-current-evidence-reader.test.mjs`. Promote DD-17 acceptances, DD-18 decisions, DD-19 traceability and current checkpoint narratives only after the implementation's exact-head Core/PostgreSQL/Database/Web gate passes; the promotion must independently pass.

No schema, migration, RLS, grant, role, route, frontend, provider, scheduler, worker, product-policy or RawSource change. Acting-principal/membership currentness, permission/entitlement snapshot currentness, AgentDefinition active-version selection, ToolSet currentness, AgentStep planning/execution, approvals, budgets, tools, OperationContract dispatch, provider/model routing and inference remain separately governed. Production readiness is not claimed.
