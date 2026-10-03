# AI AgentStep visible-parent + optional AgentApproval + TOOL OperationContract current-evidence reader prerequisite ownership audit

**Date:** 2026-10-02  
**Baseline checkpoint:** `DEV-AI-AGENT-STEP-VISIBLE-PARENT-APPROVAL-CURRENT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `2dc88f80fa728300ede4bd140ec09928ad67deee`  
**Verified entry tree:** `ac69e00da74cb892ec29adced9c68256b7eb024e`  
**Governed batch:** DD-408 through DD-412

## Entry gate

DD-403…DD-407 corrected canonical promotion and state closure are exact-head verified. Push Core Service Verify run `37036034979`: Core job `110934363277` **1190/1190 PASS**, PostgreSQL job `110934362975` **529/529 PASS**, fail/skip 0; full database bootstrap PASS. Database run `37036034895` / job `110934362758` PASS, **48 migrations / 42 SQL verification files**. Web run `37036035104` / job `110934363180` PASS.

This closes DD-403…DD-407 at its bounded evidence scope. PR #2 remains draft/unmerged; RawSource remains unchanged; `main` remains unmerged.

## Reconciled owners and determination

- DD-407 owns `loadAIAgentStepApprovalCurrentEvidence(...)`: exact DD-402 AgentStep/run/definition/ToolSet/tool evidence plus optional exact same-context AgentApproval relationship evidence. Approval status/approver/permission remain raw.
- DD-402 guarantees that only a persisted TOOL step carries exact ToolSetMember + global ToolDefinition evidence; non-TOOL PLAN/RAG/APPROVAL/INFERENCE carries no ToolDefinition evidence.
- DD-09 §12 persists `AIToolDefinition.operation_contract_id` and states that a tool is an adapter to an existing DD-06 OperationContract, not a new business-logic channel.
- DD-06 owns the canonical `OperationContract` and `OperationRegistry`; exact registry lookup is by `operationId`.
- DD-09 §13 places OperationContract execution only after tool-set validation, schema validation, current RequestContext rebuild, DD-03 access, DD-04 entitlement/limits and approval checks.
- No source-owned rule presently defines full duplicated-metadata compatibility between ToolDefinition and OperationContract (scope/permission/entitlement/schema/idempotency/audit), nor does exact registry presence grant admission or execution authority.

**SOURCE-COMPLETE:** extend exact DD-407 evidence with the exact registry record referenced by the already-bound TOOL definition. Non-TOOL steps perform zero OperationRegistry reads. Registry presence is evidence only; compatibility/admission/authorization/approval/dispatch/execution remain separately governed.

## Frozen decisions

**DD-408 — DD-407 parent evidence first.** Add `loadAIAgentStepApprovalOperationCurrentEvidence(...)`. Invoke DD-407 first with the exact supplied RequestContext and AgentStep id. Null short-circuits before registry access; dependency errors propagate unchanged.

**DD-409 — branch only on persisted TOOL evidence.** If the preserved AgentStep is not `TOOL`, perform zero OperationRegistry reads and return only the exact DD-407 parent evidence. Do not infer an operation from step input/output, approval type, AgentDefinition, capability or code.

**DD-410 — exact persisted OperationContract registry lookup.** For a TOOL step, require the exact DD-402-preserved ToolDefinition evidence and call `OperationRegistry.get(parent.parent.toolDefinition.operationContractId)` exactly once. Unknown ids propagate the registry error unchanged. Do not search by module, permission, capability, schema or domain service and do not fall back.

**DD-411 — immutable layered exact-reference evidence.** Non-TOOL success returns frozen `{ parent }`. TOOL success returns frozen `{ parent, operationContract }`, preserving the exact DD-407 parent object and exact registry-returned OperationContract reference without clone, normalization or mutation.

**DD-412 — raw operation evidence without compatibility/admission/dispatch authority.** Preserve OperationContract scope/kind/permission/entitlement/schema/idempotency/rate/audit/domainService/event/error metadata as raw canonical registry evidence only. Do not decide ToolDefinition↔OperationContract compatibility, current RequestContext authorization, entitlement, approval satisfaction/currentness, resource resolution, GuardPipeline, idempotency/rate/commercial policy, AgentRun resume/cancel, dispatch, mutation, events, provider/model routing or AI/tool execution.

## Fixed acceptance before implementation

- **AISTEP-OPREAD-BASE-001** exact DD-407 parent evidence is reused first with unchanged RequestContext/id.
- **AISTEP-OPREAD-BASE-002** DD-407 null/error short-circuits or propagates before any OperationRegistry access.
- **AISTEP-OPREAD-BRANCH-001** non-TOOL step performs zero OperationRegistry reads and returns parent-only evidence.
- **AISTEP-OPREAD-OP-001** TOOL step resolves exactly the preserved ToolDefinition `operationContractId` once.
- **AISTEP-OPREAD-OP-002** unknown registry id propagates unchanged and no alternate lookup/fallback occurs.
- **AISTEP-OPREAD-EVID-001** returned envelope is frozen and preserves exact parent/OperationContract object identity.
- **AISTEP-OPREAD-RAW-001** OperationContract metadata and ToolDefinition metadata remain uninterpreted; mismatched execution-adjacent fields do not silently become compatibility authority and inputs are unchanged.
- **AISTEP-OPREAD-BOUND-001** successful evidence creates no approval-currentness, authorization, admission, dispatch, mutation, provider/model or AI/tool execution authority.

Expected executable delta: Core **1190 → 1198**. PostgreSQL remains **529**. Database inventory remains **48 migrations / 42 verification files**.

## Explicit exclusions

No schema, migration, RLS, role, grant, route, frontend, provider SDK, secret access, worker, scheduler or RawSource change.

This batch does **not** implement ToolDefinition↔OperationContract compatibility policy, schema execution, current DD-03/DD-04 authorization, resource resolution, approval satisfaction/currentness, GuardPipeline/idempotency/rate/commercial admission, AgentRun transitions, OperationContract dispatch, provider/model routing or AI/tool execution.

After source-audit exact-head Core/PostgreSQL/Database/Web verification, implement only DD-408…DD-412 and its fixed acceptances.
