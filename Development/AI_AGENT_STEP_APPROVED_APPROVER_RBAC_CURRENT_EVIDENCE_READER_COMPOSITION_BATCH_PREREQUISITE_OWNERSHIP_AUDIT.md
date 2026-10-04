# AI AgentStep approved + trusted approver-context + current RBAC evidence reader prerequisite ownership audit

**Date:** 2026-10-04  
**Baseline checkpoint:** `DEV-AI-AGENT-APPROVAL-APPROVED-APPROVER-RBAC-BACKLINK-CURRENT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `01be53486e4b2c58385e6e7f19871801862a4c34`  
**Verified entry tree:** `3ab77461e031552b0ef09de31f0aba65e62157dd`  
**Governed batch:** DD-443 through DD-447

## Entry gate

DD-438…DD-442 canonical promotion and state closure are exact-head verified. Push Core Service Verify run `37176963787`: Core job `111361487499` **1251/1251 PASS**, PostgreSQL job `111361487279` **532/532 PASS**, fail/skip 0; full database bootstrap PASS. Database run `37176963780` / job `111361487327` PASS, **48 migrations / 42 SQL verification files**. Web run `37176963764` / job `111361487587` PASS.

This closes DD-438…DD-442 at its bounded evidence scope. PR #2 remains open/draft/unmerged; RawSource remains unchanged; `main` remains unmerged.

## Reconciled owners and determination

- DD-422 owns the step-centered exact DD-417 evidence plus persisted APPROVED + explicitly supplied already-trusted approver RequestContext continuity when an AgentApproval exists. Its parent chain already preserves TOOL ToolDefinition, canonical OperationContract and exact capability evidence as raw metadata.
- DD-442 independently owns the approval-first DD-437 necessary current RBAC evidence plus reciprocal AgentStep↔AgentApproval backlink currentness. It does not add full AuthorizationDecision or approval satisfaction.
- DD-03/DD-045/DD-048 own current compiled permission-snapshot semantics: Tenant scope parity, positive safe-integer permissionVersion parity, exact ordered roleIds continuity and exact canonical Permission Set evidence. RBAC missing/DENY is final; ABAC may still narrow an ALLOW.
- `AuthorizationReadStorePort.load({ requestContext, permissionCode })` is the existing source-owned exact current compiled snapshot + applicable ACTIVE ABAC evidence read boundary.
- DD-09 §14 requires approval itself to be revalidated for approver permission/context. DD-422 already owns the context half but deliberately leaves current permission incomplete.
- DD-408 explicitly established that source does **not** define full duplicated-metadata compatibility between ToolDefinition and OperationContract. Therefore this batch must not equate ToolDefinition.requiredPermission, OperationContract.permissionCode or AgentApproval.requiredPermission as a compatibility policy.
- DD-06/DD-09 execution still requires schema-validated resource resolution, DD-03 access, DD-04 entitlement/limits and approval checks before dispatch. AgentStep still exposes opaque `inputRef`; no approval-specific ResourceDescriptor/OperationContract authorization input is source-owned here.

**SOURCE-COMPLETE:** extend exact DD-422 evidence only. If no persisted AgentApproval exists, preserve parent-only evidence and perform zero Authorization reads without inferring approval is unnecessary. If an approval exists, perform one exact current Authorization read using the already-trusted approver RequestContext and persisted `AgentApproval.requiredPermission`; require the same current compiled RBAC necessary floor already owned by DD-435/DD-436. Preserve applicable ABAC and all ToolDefinition/OperationContract/capability metadata as raw evidence only.

## Frozen decisions

**DD-443 — exact DD-422 parent evidence first and branch on preserved approval evidence.** Add `loadAIAgentStepApprovedApproverRbacCurrentEvidence(...)`. Invoke DD-422 first with the exact acting RequestContext, AgentStep id, optional trusted approver RequestContext and unchanged dependencies. Parent null returns null; dependency errors propagate unchanged. If DD-422 contains no AgentApproval, return frozen parent-only evidence and perform zero Authorization reads. This does not mean approval is unnecessary.

**DD-444 — exact approval-branch Authorization read only.** When an AgentApproval is present, DD-422 must also have preserved the exact already-trusted approver RequestContext. Call `AuthorizationReadStorePort.load(...)` exactly once with that exact context and `permissionCode === approval.requiredPermission`. Do not trim, normalize, alias, substitute ToolDefinition/OperationContract permission metadata, search or fall back. Read errors propagate unchanged.

**DD-445 — one shared current RBAC necessary floor with no semantic widening.** Extract/reuse one pure helper for the DD-435/DD-436 current compiled RBAC floor so DD-437 and this step-centered reader cannot diverge. Require protected Tenant scope equality, positive safe-integer permissionVersion equality, exact ordered roleIds parity and exactly one matching Permission Set entry with `effect === "ALLOW"`. Missing, DENY, duplicate exact evidence or stale/mismatched current snapshot fails closed. Refactoring DD-437 to consume this helper must preserve all existing DD-433…DD-437 behavior and acceptance tests.

**DD-446 — immutable branch-specific layered evidence.** No-approval success returns frozen `{ parent }`. Approval+RBAC success returns frozen `{ parent, authorizationState, permission }`, preserving exact DD-422 parent, exact Authorization state and exact matched permission object references without clone/normalization/mutation. Applicable ABAC policies stay raw.

**DD-447 — current RBAC evidence is not compatibility, approval satisfaction or execution authority.** Do not compare or reconcile AgentApproval.requiredPermission with ToolDefinition.requiredPermission or OperationContract.permissionCode; do not evaluate ABAC/commercial/entitlement/resource facts; do not call AuthorizationDecisionService/GuardPipeline; do not infer approval satisfaction; do not transition AgentRun/AgentStep/AgentApproval; do not dispatch/mutate/emit/route providers/models or execute AI/tools.

## Fixed acceptance before implementation

- **AISTEP-RBACREAD-BASE-001** exact DD-422 parent evidence is established first with unchanged inputs/dependencies.
- **AISTEP-RBACREAD-BASE-002** DD-422 null/error short-circuits or propagates before Authorization access.
- **AISTEP-RBACREAD-BRANCH-001** no persisted AgentApproval performs zero Authorization reads and returns frozen exact parent-only evidence without inferring approval is unnecessary.
- **AISTEP-RBACREAD-READ-001** approval branch performs exactly one Authorization read using exact trusted approver RequestContext and persisted AgentApproval.requiredPermission.
- **AISTEP-RBACREAD-READ-002** Authorization dependency errors propagate unchanged with no ToolDefinition/OperationContract permission substitution or fallback.
- **AISTEP-RBACREAD-CUR-001** exact current Tenant scope/permissionVersion/ordered-role parity plus exactly one RBAC ALLOW passes and preserves exact matched permission evidence.
- **AISTEP-RBACREAD-CUR-002** stale/mismatched scope/version/roles or missing/DENY/duplicate exact permission evidence fails closed.
- **AISTEP-RBACREAD-EVID-001** success preserves exact DD-422 parent, Authorization state, permission and raw ABAC references; all inputs/evidence remain unchanged.
- **AISTEP-RBACREAD-BOUND-001** output exposes no ToolDefinition↔OperationContract permission compatibility, full AuthorizationDecision, ABAC/commercial/resource/approval-satisfied result, transition, dispatch, mutation, provider/model routing or AI/tool execution authority.

Expected executable delta: Core **1251 → 1260**. PostgreSQL remains **532**. Database inventory remains **48 migrations / 42 verification files**.

## Explicit exclusions

No schema, migration, SQL verification, RLS, role, grant, route, frontend, identity/session reconstruction, provider SDK, worker, scheduler or RawSource change.

This batch does **not**:
- invent ToolDefinition↔OperationContract↔AgentApproval permission compatibility;
- create an approval-specific OperationContract or ResourceDescriptor;
- evaluate applicable ABAC expressions;
- evaluate subscription/license/entitlement/commercial facts;
- claim current approval satisfaction;
- infer whether an absent approval means approval is unnecessary;
- derive resource references from opaque AgentStep.inputRef;
- call GuardPipeline/OperationExecutor or dispatch a domain operation;
- resume/cancel/mutate AgentRun/AgentStep/AgentApproval;
- route provider/model or invoke AI/tool execution.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-443…DD-447 and the fixed acceptances.
