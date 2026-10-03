# AI AgentApproval approved + trusted approver-context current-evidence reader composition batch prerequisite ownership audit

**Date:** 2026-10-03  
**Baseline checkpoint:** `DEV-AI-AGENT-APPROVAL-VISIBLE-PARENT-CURRENT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `59a0ec1879c3009c6d65c0a59cdb8a992b419aba`  
**Verified entry tree:** `612d3d133caef1ee4a9be81513cb01a79066d2bc`  
**Governed batch:** DD-428 through DD-432

## Entry gate

DD-423…DD-427 canonical promotion and state closure are exact-head verified. Push Core Service Verify run `37129574651`: Core job `111221826970` **1227/1227 PASS**, PostgreSQL job `111221827073` **532/532 PASS**, fail/skip 0; full database bootstrap PASS. Database run `37129574709` / job `111221826974` PASS, **48 migrations / 42 SQL verification files**. Web run `37129574643` / job `111221826988` PASS.

This closes DD-423…DD-427 at its bounded evidence scope. RawSource remains unchanged; `main` remains unmerged; PR #2 remains draft/unmerged.

## Reconciled owners and determination

- DD-427 owns approval-first exact visible `AgentApproval → AgentRun → AgentStep` historical parent evidence under one supplied RequestContext and DD-184 parent/Tenant/nullable-Industry continuity.
- DD-418 owns the persisted APPROVED necessary floor: exact APPROVED plus valid non-null approver principal and approvedAt; it deliberately does not decide current authorization.
- DD-419 owns continuity between one persisted APPROVED AgentApproval and one **already-trusted current approver RequestContext**. It requires exact principal/Tenant and exact Industry when Industry-scoped; it does not construct or re-resolve RequestContext.
- DD-09 §14 requires approval to be revalidated for approver permission/context before execution. DD-419 supplies only the context half.
- DD-422 already established that current source has no approval-specific OperationContract/permission evaluator that maps `AgentApproval.requiredPermission` into DD-03 without inventing a synthetic operation. That limitation remains unchanged.
- DD-03 AuthorizationDecisionService requires a canonical OperationContract. AgentApproval itself carries only `requiredPermission`, not a source-owned approval authorization OperationContract or resource contract.
- Therefore this batch may compose DD-427 + DD-419 for approval-first current approver-context evidence, but it may **not** claim permission satisfaction, approval satisfaction or execution admission.

**SOURCE-COMPLETE:** add one approval-id keyed current-evidence reader that first reuses exact DD-427 parent evidence, then—only with an explicitly supplied trusted approver RequestContext—re-applies exact DD-419. No context synthesis, permission evaluation, GuardPipeline, transition or execution semantics are required.

## Frozen decisions

**DD-428 — exact DD-427 parent evidence first.** Add `loadAIAgentApprovalApprovedApproverContextCurrentEvidence(...)`. Invoke DD-427 first with the exact supplied acting RequestContext and AgentApproval id. Parent null returns null before approver-context evaluation; dependency errors propagate unchanged.

**DD-429 — explicit trusted approver RequestContext only.** Success requires an explicitly supplied `approverRequestContext`. Do not construct it from `approverPrincipalId`, copy/switch the acting RequestContext, read identity/session state, or synthesize authentication evidence.

**DD-430 — exact DD-419 approved/context floor.** Apply `matchesAIAgentApprovalApproverContextFloor(parent.approval, approverRequestContext)` exactly once. Because DD-419 includes DD-418, PENDING/REJECTED/EXPIRED, malformed APPROVED, wrong principal/Tenant/Industry/scope or malformed context returns null. Do not add reciprocal step backlink, parent lifecycle or timestamp-order predicates.

**DD-431 — immutable exact-reference layered evidence.** Success returns frozen `{ parent, approverRequestContext }`, preserving the exact DD-427 parent object and exact supplied trusted approver RequestContext reference without clone, normalization, mutation or re-read.

**DD-432 — current approver-context evidence without permission/approval/execution authority.** Preserve `requiredPermission`, approval type/status/history, run/step lifecycle and backlink state as raw evidence. A successful result means only that persisted approval is APPROVED and its recorded approver matches this already-trusted current Tenant/Industry context. Do not decide current permission, approval satisfaction, GuardPipeline/commercial/resource admission, AgentRun resume/cancel, OperationContract/tool dispatch, mutation/events, provider/model routing or AI/tool execution.

## Fixed acceptance before implementation

- **AIAPP-APPCTXREAD-BASE-001** exact supplied acting RequestContext + AgentApproval id enter DD-427 first.
- **AIAPP-APPCTXREAD-BASE-002** DD-427 null/error short-circuits or propagates before approver-context evaluation.
- **AIAPP-APPCTXREAD-CTX-001** exact persisted APPROVED + exact trusted Tenant-Core approver context passes.
- **AIAPP-APPCTXREAD-CTX-002** Tenant-Core approval may also pass same-principal/same-Tenant Tenant-Industry trusted context, with no permission inference.
- **AIAPP-APPCTXREAD-CTX-003** Industry approval requires exact Tenant-Industry scope and exact Industry Context.
- **AIAPP-APPCTXREAD-CTX-004** missing context, non-APPROVED/malformed approval, wrong principal/Tenant/sibling or missing Industry, PUBLIC/PLATFORM_GLOBAL/EXPLICIT_CROSS_CONTEXT or malformed context fails closed.
- **AIAPP-APPCTXREAD-EVID-001** success preserves exact DD-427 parent and exact supplied approver RequestContext references in a frozen envelope; inputs unchanged.
- **AIAPP-APPCTXREAD-BOUND-001** result exposes no required-permission decision, approval-satisfied/current authorization flag, GuardPipeline result, transition, dispatch, provider/model routing or AI/tool execution authority.

Expected executable delta: Core **1227 → 1235**. PostgreSQL remains **532**. Database inventory remains **48 migrations / 42 SQL verification files**.

## Explicit exclusions

No schema, migration, SQL verification, RLS, role, grant, route, frontend, identity/session reconstruction, provider SDK, worker, scheduler or RawSource change.

This batch does **not**:
- construct or resolve an approver RequestContext;
- evaluate `AgentApproval.requiredPermission`;
- create an approval-specific synthetic OperationContract;
- claim current approver authorization or approval satisfaction;
- require reciprocal `step.approvalId === approval.id`;
- interpret run/step lifecycle as approval validity;
- derive resource references or invoke GuardPipeline/commercial policy;
- resume/cancel/mutate AgentRun/AgentStep/AgentApproval;
- dispatch OperationContract/tools or invoke provider/model/AI execution.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-428…DD-432 and the fixed acceptances.
