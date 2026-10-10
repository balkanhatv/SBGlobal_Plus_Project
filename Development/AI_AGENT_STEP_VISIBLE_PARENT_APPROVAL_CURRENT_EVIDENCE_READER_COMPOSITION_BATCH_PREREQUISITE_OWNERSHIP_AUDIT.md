# AI AgentStep visible-parent + optional AgentApproval current-evidence reader prerequisite ownership audit

**Date:** 2026-10-02  
**Baseline checkpoint:** `DEV-AI-AGENT-STEP-VISIBLE-RUN-DEFINITION-TOOL-SET-TOOL-BINDING-CURRENT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `b128c831e69e4ddd823cfe24861bca47599a768e`  
**Verified entry tree:** `131d660b3d520a7bbb1faf8061def8d8abcb5918`  
**Governed batch:** DD-403 through DD-407

## Entry gate

DD-398…DD-402 corrected canonical promotion and state closure are verified. Push Core Service Verify run `37026903076`: Core job `110903724251` **1182/1182 PASS**, PostgreSQL job `110903723804` **529/529 PASS**, fail/skip 0; full database bootstrap PASS. Database run `37026902431` / job `110903721026` PASS, **48 migrations / 42 SQL verification files**. Web run `37026902812` / job `110903722396` PASS.

This closes DD-398…DD-402 at its bounded evidence scope. PR #2 remains draft/unmerged; RawSource remains unchanged.

## Reconciled owners and determination

- DD-402 owns `loadAIAgentStepToolBindingCurrentEvidence(...)`: exact visible AgentStep first, exact persisted AgentRun through DD-397, conditional ToolSetMember/global ToolDefinition evidence for TOOL steps through DD-182, immutable exact-reference evidence and no admission/planning/dispatch/AI execution authority.
- DD-132 owns the exact-by-id RequestContext-scoped raw AgentApproval reader. Persisted status, requiredPermission, approverPrincipalId and timestamps are raw evidence only.
- DD-183 owns `matchesAIAgentStepApprovalBacklinkFloors(step, approval?)`: optional exact approval id plus same run and same step backlink.
- DD-184 owns `matchesAIAgentApprovalParentScopeFloors(approval, run, step)`: exact approval→AgentRun/AgentStep parent chain plus Tenant/nullable-Industry equality.
- Migration 0031 owns both persisted relationship checks. DD-09 separately requires current approval/permission/context revalidation before tool execution.

**SOURCE-COMPLETE:** extend exact DD-402 AgentStep parent/tool evidence with optional visible AgentApproval evidence using the persisted `approvalId`, DD-183 backlink and DD-184 parent/scope floors. No approval satisfaction, approver-currentness, permission evaluation, run resume or tool/OperationContract execution semantics are required.

## Frozen decisions

**DD-403 — DD-402 parent evidence first.** Add `loadAIAgentStepApprovalCurrentEvidence(...)`. Invoke DD-402 first with the exact supplied RequestContext and AgentStep id. Null returns null before AgentApproval access; dependency errors propagate unchanged.

**DD-404 — Optional exact same-context AgentApproval read.** Use exactly `parent.step.approvalId`. If absent, perform zero AgentApproval reads and evaluate DD-183 with no approval evidence. If present, invoke the AgentApproval reader exactly once with the identical RequestContext and exact persisted id. Null returns null; errors propagate unchanged. Do not select an approval by run, permission, status or type.

**DD-405 — DD-183 backlink + DD-184 parent/scope floors.** Re-apply DD-183 to the preserved AgentStep and optional approval. For present approval evidence, additionally re-apply DD-184 against `parent.parent.runDefinition.run` and the same exact AgentStep. False returns null. Do not interpret approval status, approver identity or requiredPermission.

**DD-406 — Immutable layered exact-reference evidence.** Unbound success returns frozen `{ parent }`; bound success returns frozen `{ parent, approval }`. Preserve the exact DD-402 parent envelope and exact AgentApproval object reference. No clone, normalization or mutation.

**DD-407 — Approval evidence adds no satisfaction/resume/execution authority.** Preserve approval requestedBy/type/requiredPermission/approver/status/summary/time/reason/correlation evidence unchanged. Even persisted `APPROVED` remains historical evidence only. Do not decide approval satisfaction/currentness, validate approver permission/context, resume/cancel AgentRun, authorize ToolSetMember/ToolDefinition/OperationContract, dispatch tools, mutate, emit events, choose provider/model or perform AI execution.

## Fixed acceptance before implementation

- **AISTEP-APPREAD-BASE-001:** exact RequestContext/id enters DD-402 first; no AgentApproval access precedes successful parent evidence.
- **AISTEP-APPREAD-BASE-002:** DD-402 null/error short-circuits AgentApproval access and preserves dependency error identity.
- **AISTEP-APPREAD-APP-001:** absent approvalId performs zero approval reads; present id performs exactly one same-context read using the exact persisted id.
- **AISTEP-APPREAD-APP-002:** hidden/missing AgentApproval returns null; approval-reader errors propagate unchanged.
- **AISTEP-APPREAD-FLOOR-001:** DD-183 exact backlink plus DD-184 run/step/Tenant/nullable-Industry parent scope pass valid evidence and fail wrong-id/run/step/Tenant/sibling-Industry/Core-vs-Industry or malformed evidence.
- **AISTEP-APPREAD-RAW-001:** PENDING/APPROVED/REJECTED/EXPIRED, requiredPermission, approverPrincipalId, approval type, summary, times and reason remain raw; persisted APPROVED does not become current satisfaction.
- **AISTEP-APPREAD-EVID-001:** success preserves exact DD-402 parent and optional AgentApproval references in a frozen envelope; inputs remain unchanged.
- **AISTEP-APPREAD-BOUND-001:** no approval-currentness/permission/context decision, AgentRun resume/cancel, tool/OperationContract admission/dispatch, mutation, event, provider/model routing or AI execution authority is exposed.

Expected delta: Core **1182 → 1190**. PostgreSQL stays **529**; Database stays **48/42**; Web unchanged.

## Delivery and exclusions

Implementation: `src/core/ai/agent-step-visible-approval-current-evidence-reader.ts`, Core export, and `tests/core/ai-agent-step-visible-approval-current-evidence-reader.test.mjs`. Promote DD-17 acceptances, DD-18 decisions, DD-19 traceability and current checkpoint narratives only after the implementation's exact-head Core/PostgreSQL/Database/Web gate passes; the promotion must independently pass.

No schema, migration, RLS, grant, role, route, frontend, provider, scheduler, worker, product-policy or RawSource change. Approval satisfaction/currentness, approver authorization, AgentRun resume/retry, tool/OperationContract admission/dispatch and all AI execution remain separately governed. Production readiness is not claimed.
