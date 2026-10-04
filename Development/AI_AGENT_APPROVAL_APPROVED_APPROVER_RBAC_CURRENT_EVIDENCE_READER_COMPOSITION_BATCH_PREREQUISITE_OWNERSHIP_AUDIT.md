# AI AgentApproval approved + trusted approver-context + current RBAC evidence reader prerequisite ownership audit

**Date:** 2026-10-04  
**Baseline checkpoint:** `DEV-AI-AGENT-APPROVAL-APPROVED-APPROVER-CONTEXT-CURRENT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `07b42635ad88ca9b3ca5fab4c8410a5a5ef92ed1`  
**Verified entry tree:** `635f8146d08ea50fa5d91135a2c634c55d3b71d4`  
**Governed batch:** DD-433 through DD-437

## Entry gate

DD-428…DD-432 canonical promotion and state closure are exact-head verified. Push Core Service Verify run `37141695483`: Core job `111257294192` **1235/1235 PASS**, PostgreSQL job `111257294286` **532/532 PASS**, fail/skip 0; full database bootstrap PASS. Database run `37141695517` / job `111257294501` PASS, **48 migrations / 42 SQL verification files**. Web run `37141695476` / job `111257294222` PASS.

This closes DD-428…DD-432 at its bounded evidence scope. PR #2 remains open/draft/unmerged; RawSource remains unchanged; `main` remains unmerged.

## Reconciled owners and determination

- DD-432 owns approval-id keyed current evidence that first reuses DD-427 parent evidence and then proves only that persisted APPROVED evidence matches one explicitly supplied already-trusted current approver RequestContext under DD-419. It does not evaluate `requiredPermission`.
- DD-03 §3 owns permission codes and the canonical compiled permission model. DD-048 owns the current compiled RBAC Permission Set v1 publication boundary.
- `AuthorizationReadStorePort.load({ requestContext, permissionCode })` already reads the exact CURRENT compiled permission snapshot plus applicable ACTIVE ABAC policy evidence for a server-resolved RequestContext and exact permission code.
- `AuthorizationDecisionService` owns full access decisions and requires a canonical OperationContract. Its current-context floor requires exact scope, current permissionVersion and exact roleIds before any RBAC/ABAC decision.
- Permission Set v1 owns only exact `{code,effect: ALLOW|DENY}` entries. RBAC DENY/missing is final; ABAC may narrow an RBAC ALLOW but cannot widen a deny.
- AgentApproval carries `requiredPermission` but no source-owned approval-specific OperationContract, resource contract, entitlement requirement or supplemental policy facts. Therefore full DD-03 authorization and approval satisfaction remain source-incomplete.
- Reading the current compiled snapshot with the exact trusted approver RequestContext and persisted `requiredPermission`, re-applying snapshot currentness, and requiring exact RBAC ALLOW is source-owned as a **necessary RBAC evidence floor only**.

**SOURCE-COMPLETE:** extend exact DD-432 evidence with one current Authorization read keyed by the exact trusted approver RequestContext and persisted `AgentApproval.requiredPermission`. Require current snapshot parity plus exact RBAC ALLOW as a necessary floor. Preserve applicable ABAC policies as raw evidence only. Do not call `AuthorizationDecisionService`, invent an OperationContract/resource, evaluate ABAC/commercial state, or claim approval satisfaction.

## Frozen decisions

**DD-433 — exact DD-432 parent evidence first.** Add `loadAIAgentApprovalApprovedApproverRbacCurrentEvidence(...)`. Invoke DD-432 first with the exact acting RequestContext, AgentApproval id and explicitly supplied trusted approver RequestContext. Parent null returns null before Authorization reads; dependency errors propagate unchanged.

**DD-434 — exact current Authorization read by persisted requiredPermission.** Call `AuthorizationReadStorePort.load(...)` exactly once with `requestContext === parent.approverRequestContext` and `permissionCode === parent.parent.approval.requiredPermission`. Do not trim, normalize, alias, substitute ToolDefinition/OperationContract permissions or perform fallback searches. Authorization read errors propagate unchanged.

**DD-435 — current compiled snapshot continuity floor.** Require the returned snapshot scope to equal the trusted approver RequestContext scope. For Tenant scopes require positive safe-integer `permissionVersion` exactly equal to the snapshot version and exact ordered `roleIds` parity, matching the DD-045 current-context floor. This batch does not strengthen membership, entitlement, device, session or policy facts beyond those already present in the trusted RequestContext/read store.

**DD-436 — exact RBAC ALLOW necessary floor.** In the current snapshot require exactly one canonical Permission Set v1 entry whose `code` equals persisted `AgentApproval.requiredPermission` and whose effect is `ALLOW`. Missing or DENY evidence returns null. This is necessary RBAC evidence only; applicable ABAC policies remain uninterpreted and can still narrow/deny in a future full AuthorizationDecisionService path.

**DD-437 — immutable layered evidence without full authorization/approval authority.** Success returns frozen `{ parent, authorizationState, permission }`, preserving the exact DD-432 parent, exact AuthorizationReadStore state and exact matched permission entry references. Do not claim current DD-03 ALLOW, ABAC satisfaction, commercial/entitlement/resource admission, approval satisfaction, AgentRun transition, dispatch, mutation, provider/model routing or AI/tool execution.

## Fixed acceptance before implementation

- **AIAPP-RBACREAD-BASE-001** exact DD-432 parent evidence is established first with unchanged inputs.
- **AIAPP-RBACREAD-BASE-002** DD-432 null/error short-circuits or propagates before Authorization read access.
- **AIAPP-RBACREAD-READ-001** exactly one Authorization read uses the exact trusted approver RequestContext and persisted requiredPermission.
- **AIAPP-RBACREAD-READ-002** Authorization read dependency/state errors propagate unchanged and no permission/operation fallback occurs.
- **AIAPP-RBACREAD-CUR-001** exact Tenant-Core/Tenant-Industry scope + permissionVersion + ordered roleIds snapshot parity passes.
- **AIAPP-RBACREAD-CUR-002** scope mismatch, missing/stale/invalid permissionVersion or role-set mismatch fails closed.
- **AIAPP-RBACREAD-PERM-001** exact current permission entry with ALLOW passes; missing or DENY returns null.
- **AIAPP-RBACREAD-EVID-001** success preserves exact parent/state/permission references in a frozen envelope; applicable ABAC policy evidence and inputs remain unchanged.
- **AIAPP-RBACREAD-BOUND-001** success exposes no full authorization decision, ABAC/commercial/resource/approval-satisfied result, GuardPipeline result, AgentRun transition, dispatch, provider/model routing or AI/tool execution authority.

Expected executable delta: Core **1235 → 1244**. PostgreSQL remains **532**. Database inventory remains **48 migrations / 42 verification files**.

## Explicit exclusions

No schema, migration, SQL verification, RLS, role, grant, route, frontend, identity/session reconstruction, provider SDK, worker, scheduler or RawSource change.

This batch does **not**:
- create an approval-specific OperationContract or ResourceDescriptor;
- call `AuthorizationDecisionService` or GuardPipeline;
- evaluate applicable ABAC expressions;
- evaluate subscription/license/entitlement/commercial facts;
- claim that RBAC ALLOW equals full current authorization;
- claim current approval satisfaction;
- derive resources from AgentStep `inputRef`;
- resume/cancel/mutate AgentRun/AgentStep/AgentApproval;
- dispatch OperationContract/tools or invoke provider/model/AI execution.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-433…DD-437 and the fixed acceptances.
