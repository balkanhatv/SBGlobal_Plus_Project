# AI AgentStep acting-principal OperationContract current-RBAC evidence reader prerequisite ownership audit

**Date:** 2026-10-04  
**Baseline checkpoint:** `DEV-AI-AGENT-STEP-ACTING-TOOL-RBAC-CURRENT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `ff6f6e8aabb7b99ccbd089ec09e817a07d147d44`  
**Verified entry tree:** `f3d4bed1c92af795d199c35eb56c708c2c4bb10d`  
**Governed batch:** DD-453 through DD-457

## Entry gate

DD-448…DD-452 state closure and its closure-record commit are exact-head green. Closure-record push Core run `37183547819`: Core job `111380744872` **1269/1269 PASS**, PostgreSQL job `111380744956` **532/532 PASS**, fail/skip 0 plus full database bootstrap PASS. Database run `37183547837` / job `111380744703` PASS with **48 migrations / 42 SQL verification files**. Web run `37183547835` / job `111380744963` PASS. Pull-request gates on the same entry HEAD also passed.

PR #2 remains draft/unmerged; RawSource is unchanged; `main` remains unmerged.

## Source determination

- DD-452 owns exact DD-447 parent evidence plus acting-principal current compiled-RBAC necessary evidence for the preserved ToolDefinition.requiredPermission. It deliberately does not equate ToolDefinition permission metadata with OperationContract or AgentApproval permission metadata.
- DD-408…DD-412 already preserve the exact canonical OperationContract registry record referenced by an already-bound TOOL definition. Unknown OperationContract ids fail through the canonical registry; non-TOOL branches have no OperationContract evidence.
- DD-06 defines canonical `OperationContract.permissionCode` and requires the canonical OperationContract to drive the shared execution/GuardPipeline path. A tool is an adapter to an existing OperationContract, not a new business-logic channel.
- DD-03 owns current RBAC-primary / ABAC-narrowing authorization semantics. The existing Authorization read store supplies the current compiled Permission Set plus applicable raw ABAC evidence, and DD-450 owns the generic protected-Tenant exact scope/version/ordered-role/exact-one-ALLOW necessary floor.
- DD-09 §13 requires current DD-03 access before tool execution. The repository still does not define ToolDefinition.requiredPermission == OperationContract.permissionCode, and this batch must not invent such equality.
- Full access still requires ABAC, optional resource resolution/resource PDP/business rules, Commercial/entitlement checks, durable guard/audit semantics and approval handling. AgentStep.inputRef remains opaque and is not a canonical resource descriptor.

**SOURCE-COMPLETE:** extend exact DD-452 evidence only. Non-TOOL evidence performs zero new OperationContract-permission Authorization reads. TOOL evidence performs exactly one additional current Authorization read using the unchanged acting RequestContext and the already-preserved canonical OperationContract.permissionCode, then applies the same generic protected-Tenant current-RBAC ALLOW necessary floor. ToolDefinition and OperationContract permission evidence are independently required where present; they are not compared for equality. Applicable ABAC remains raw.

## Frozen decisions

**DD-453 — DD-452 parent first; branch only on exact preserved OperationContract evidence.** Add `loadAIAgentStepActingOperationRbacCurrentEvidence(...)`. Invoke DD-452 first with exact supplied inputs/dependencies. Parent null/errors preserve DD-452 behavior. Non-TOOL evidence returns frozen parent-only evidence and performs zero new OperationContract-permission Authorization reads.

**DD-454 — exact one additional acting OperationContract permission read.** For TOOL evidence, obtain the exact OperationContract already preserved by the DD-452 parent chain and call `AuthorizationReadStorePort.load(...)` exactly once with the unchanged acting RequestContext and `permissionCode === operationContract.permissionCode`. Do not trim, alias, search or substitute ToolDefinition.requiredPermission or AgentApproval.requiredPermission. Dependency errors propagate unchanged.

**DD-455 — reuse DD-450 generic current Tenant RBAC floor.** Apply `selectAICurrentTenantRbacAllow(...)` to the acting RequestContext, returned current Authorization state and exact OperationContract.permissionCode. Protected Tenant scope parity, positive safe-integer permissionVersion equality, exact ordered roleIds parity and exactly one matching ALLOW are necessary. Missing/DENY/duplicate/stale/mismatched evidence fails closed.

**DD-456 — immutable exact-reference OperationContract RBAC evidence.** Non-TOOL success returns frozen `{ parent }`. TOOL success returns frozen `{ parent, operationAuthorizationState, operationPermission }`, preserving exact DD-452 parent, exact Authorization state, exact matched permission and raw applicable ABAC references without clone, normalization or mutation.

**DD-457 — independent necessary evidence only.** Do not infer ToolDefinition↔OperationContract↔AgentApproval permission compatibility; do not evaluate ABAC/resource/commercial/entitlement facts; do not claim approval satisfaction or full AuthorizationDecision; do not call GuardPipeline/OperationExecutor; do not transition, dispatch, mutate, emit, route providers/models or execute AI/tools.

## Fixed acceptance before implementation

- **AISTEP-OPRBAC-BASE-001** exact DD-452 parent is established first with unchanged inputs/dependencies.
- **AISTEP-OPRBAC-BASE-002** parent null/error precedes any new OperationContract-permission Authorization read.
- **AISTEP-OPRBAC-BRANCH-001** non-TOOL performs zero new OperationContract-permission Authorization reads and returns frozen exact parent-only evidence.
- **AISTEP-OPRBAC-READ-001** TOOL performs exactly one additional read using exact acting RequestContext + preserved OperationContract.permissionCode.
- **AISTEP-OPRBAC-READ-002** read errors propagate unchanged with no ToolDefinition/AgentApproval permission substitution or fallback.
- **AISTEP-OPRBAC-CUR-001** exact protected Tenant scope/version/ordered-role parity + exactly one OperationContract RBAC ALLOW passes and preserves exact permission evidence.
- **AISTEP-OPRBAC-CUR-002** stale/mismatched scope/version/roles or missing/DENY/duplicate OperationContract permission evidence fails closed.
- **AISTEP-OPRBAC-EVID-001** success preserves exact parent/state/permission/raw-policy references and all prior ToolDefinition/approval/capability/operation evidence unchanged.
- **AISTEP-OPRBAC-BOUND-001** output exposes no permission compatibility, full authorization, approval-satisfied, commercial/resource/entitlement, transition, dispatch, mutation, routing or execution authority.

Expected executable delta: Core **1269 → 1278**. PostgreSQL remains **532**. Database inventory remains **48 migrations / 42 verification files**.

## Explicit exclusions

No schema, migration, SQL verification, RLS, role, grant, route, frontend, identity/session reconstruction, Commercial evaluator, resource resolver, provider SDK, worker, scheduler or RawSource change.

This batch does **not**:
- define equality/compatibility between ToolDefinition.requiredPermission, OperationContract.permissionCode and AgentApproval.requiredPermission;
- evaluate ToolDefinition.requiredEntitlement or OperationContract.entitlementRequirement;
- evaluate ABAC expressions or resource/business rules;
- claim full DD-03 access or GuardPipeline authorization;
- claim approval satisfaction/current execution permission;
- dispatch OperationContract/domain work or mutate AgentRun/AgentStep/AgentApproval;
- route provider/model or invoke AI/tool execution.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-453…DD-457 and the fixed acceptances.
