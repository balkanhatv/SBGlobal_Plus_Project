# AI AgentStep acting-principal TOOL current-RBAC evidence reader prerequisite ownership audit

**Date:** 2026-10-04  
**Baseline checkpoint:** `DEV-AI-AGENT-STEP-APPROVED-APPROVER-RBAC-CURRENT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `b7b4683b0159c63e3fee93c032cb6bd4269d813f`  
**Verified entry tree:** `d0f629ab16c135057c1174dd9fb7d30f3a018f18`  
**Governed batch:** DD-448 through DD-452

## Entry gate

The latest closure/evidence basis is exact-head green: Core run `37181225472` / job `111374054842`, PostgreSQL job `111374054895`, Database run `37181225505` / job `111374055085`, and Web run `37181225487` / job `111374054918`. Core remains **1260/1260**, PostgreSQL **532/532** plus full bootstrap, database inventory **48 migrations / 42 SQL verification files**. PR #2 remains draft/unmerged; RawSource and `main` are unchanged.

## Source determination

DD-402 already preserves exact current TOOL binding evidence including the ACTIVE ToolDefinition and its persisted `requiredPermission`. DD-447 layers approver-current-RBAC evidence without interpreting ToolDefinition↔OperationContract compatibility. DD-09 states that an agent is bounded by the acting principal's current access decision at each tool step, places `required_permission` on AIToolDefinition, and orders current context/access checks before tool execution. The existing Authorization read port provides current compiled Permission Set plus applicable ABAC evidence.

The source still does not define equality between ToolDefinition.requiredPermission, OperationContract.permissionCode and AgentApproval.requiredPermission, and opaque AgentStep.inputRef still cannot supply canonical resource facts. Therefore full access/guard/execution remains out of scope.

**SOURCE-COMPLETE:** for already-preserved TOOL evidence only, read current Authorization state exactly once using the unchanged acting RequestContext and exact ToolDefinition.requiredPermission, then apply the same protected-Tenant current compiled RBAC ALLOW necessary floor already frozen in DD-445. Non-TOOL evidence performs zero new Authorization reads. ABAC remains raw.

## Frozen decisions

**DD-448 — DD-447 first, then TOOL branch.** Add `loadAIAgentStepActingToolRbacCurrentEvidence(...)`. Reuse exact DD-447 parent first. Null/errors preserve parent behavior. Non-TOOL returns frozen parent-only evidence with zero new acting-principal Authorization reads.

**DD-449 — exact acting-context permission read.** TOOL evidence performs exactly one Authorization read with the exact input acting RequestContext and the preserved ToolDefinition.requiredPermission. No trim, alias, search, AgentApproval permission substitution or OperationContract permission substitution.

**DD-450 — generic shared Tenant RBAC floor.** Extract DD-445's pure scope/version/ordered-role/exact-one-ALLOW logic into a generic helper. Keep the existing approval-specific helper as a thin wrapper so DD-437/DD-447 semantics and imports do not change. Missing, DENY, duplicate, stale or mismatched evidence fails closed.

**DD-451 — immutable exact-reference evidence.** Non-TOOL success is frozen `{ parent }`. TOOL success is frozen `{ parent, actingAuthorizationState, actingPermission }`, preserving exact references and raw ABAC evidence.

**DD-452 — evidence only.** Do not infer permission compatibility, evaluate ABAC/resource/commercial/entitlement facts, claim approval satisfaction, transition state, dispatch/mutate/emit, or execute provider/model/tool/AI work.

## Fixed acceptance before implementation

- `AISTEP-ACTRBAC-BASE-001` exact DD-447 parent is established first.
- `AISTEP-ACTRBAC-BASE-002` parent null/error precedes any new acting Authorization read.
- `AISTEP-ACTRBAC-BRANCH-001` non-TOOL performs zero new Authorization reads.
- `AISTEP-ACTRBAC-READ-001` TOOL performs one exact acting-context + ToolDefinition.requiredPermission read.
- `AISTEP-ACTRBAC-READ-002` read errors propagate with no alternate permission fallback.
- `AISTEP-ACTRBAC-CUR-001` exact protected Tenant scope/version/ordered-role parity + one ALLOW passes.
- `AISTEP-ACTRBAC-CUR-002` stale/missing/DENY/duplicate evidence fails closed and prior DD-445 behavior stays green.
- `AISTEP-ACTRBAC-EVID-001` exact parent/state/permission/raw-policy references are preserved.
- `AISTEP-ACTRBAC-BOUND-001` output exposes no compatibility/full-authorization/approval-satisfied/dispatch/execution authority.

Expected executable delta: Core **1260 → 1269**. PostgreSQL remains **532**. Database inventory remains **48/42**.

## Exclusions

No schema/migration/RLS/role/grant/route/frontend/RawSource change. No resource resolver, full access decision, commercial/entitlement evaluation, approval satisfaction, OperationExecutor/domain dispatch, state mutation/event, provider/model routing or AI/tool execution.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-448…DD-452 and the fixed acceptances.
