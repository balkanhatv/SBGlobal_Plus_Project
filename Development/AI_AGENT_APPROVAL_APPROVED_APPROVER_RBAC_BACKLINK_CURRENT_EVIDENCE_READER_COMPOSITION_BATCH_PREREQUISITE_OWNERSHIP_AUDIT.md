# AI AgentApproval approved + trusted approver-context + current RBAC + reciprocal backlink evidence reader prerequisite ownership audit

**Date:** 2026-10-04  
**Baseline checkpoint:** `DEV-AI-AGENT-APPROVAL-APPROVED-APPROVER-RBAC-CURRENT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `a6f56b90dc0a129142cdcd07d772604b77381099`  
**Verified entry tree:** `513a496f9aee614a465ea8e12ea9f2a765491998`  
**Governed batch:** DD-438 through DD-442

## Entry gate

DD-433…DD-437 corrected canonical promotion and state closure are exact-head verified. Push Core Service Verify run `37175260458`: Core job `111356452058` **1244/1244 PASS**, PostgreSQL job `111356451974` **532/532 PASS**, fail/skip 0; full database bootstrap PASS. Database run `37175260515` / job `111356452044` PASS, **48 migrations / 42 SQL verification files**. Web run `37175260461` / job `111356451875` PASS.

This closes DD-433…DD-437 at its bounded evidence scope. PR #2 remains open/draft/unmerged; RawSource remains unchanged; `main` remains unmerged.

## Reconciled owners and determination

- DD-437 owns approval-id keyed persisted APPROVED + trusted approver-context + current compiled RBAC ALLOW necessary evidence. Applicable ABAC policies remain raw; DD-437 is not a full AuthorizationDecision or approval-satisfaction result.
- DD-427 already provides the exact already-loaded AgentApproval, AgentRun and AgentStep parent evidence underneath the DD-432/DD-437 layered envelope.
- DD-183, derived from migration 0031 `validate_agent_step_approval()`, owns one pure reciprocal AgentStep→AgentApproval optional-backlink currentness floor:
  - if `step.approvalId` is absent, approval evidence must also be absent;
  - when `step.approvalId` is present, it must exactly equal `approval.id`;
  - `approval.runId` must exactly equal `step.runId`;
  - `approval.stepId` must exactly equal `step.id`;
  - malformed or unexpected evidence fails closed.
- An AgentApproval-first current-evidence chain necessarily carries approval evidence. Therefore applying DD-183 to the already-loaded DD-437 step + approval pair requires the reciprocal persisted backlink to be present and exact.
- This composition requires **zero additional persistence reads** and does not re-resolve approval, run, step, context, permission, policy or commercial facts.
- AgentApproval still lacks a source-owned approval-specific OperationContract/resource descriptor/entitlement requirement/supplemental authorization facts. Full DD-03 authorization, ABAC evaluation and approval satisfaction therefore remain source-incomplete.

**SOURCE-COMPLETE:** extend exact DD-437 evidence only by re-applying the existing DD-183 reciprocal AgentStep→AgentApproval backlink floor to the exact already-loaded step and approval references. False returns null. Do not re-read any parent, approval or Authorization state; do not evaluate ABAC/commercial/resource facts or claim approval satisfaction.

## Frozen decisions

**DD-438 — exact DD-437 parent evidence first.** Add `loadAIAgentApprovalApprovedApproverRbacBacklinkCurrentEvidence(...)`. Invoke DD-437 first with the exact supplied acting RequestContext, AgentApproval id, explicitly supplied trusted approver RequestContext and unchanged reader dependencies. Parent null returns null before backlink evaluation; dependency errors propagate unchanged.

**DD-439 — exact DD-183 reciprocal backlink floor only.** Apply `matchesAIAgentStepApprovalBacklinkFloors(parent.parent.parent.step, parent.parent.parent.approval)` exactly once. False returns null. Because approval evidence is necessarily present in this approval-first chain, an unbound step (`approvalId` absent), wrong approval id, wrong run, wrong step backlink or malformed relevant identifiers fails closed.

**DD-440 — no re-read or alternate relationship resolution.** Use only the exact AgentStep and AgentApproval references already present inside DD-437 evidence. Do not invoke AgentApproval/AgentStep readers again, search/list by alternate ids, synthesize reciprocal links, follow `step.approvalId` into another approval, or fall back to PLATFORM_GLOBAL/another RequestContext.

**DD-441 — immutable exact-reference layered evidence.** Success returns frozen `{ parent }`, preserving the exact DD-437 evidence object by reference. Do not clone, normalize or mutate parent/context/authorization/permission/ABAC/approval/run/step evidence.

**DD-442 — reciprocal backlink evidence is not authorization, approval satisfaction or execution authority.** Treat success only as DD-437 necessary RBAC evidence plus exact current reciprocal persisted step↔approval binding. Do not call `AuthorizationDecisionService`/GuardPipeline, evaluate ABAC/commercial/resource facts, claim approval satisfaction, transition AgentRun/AgentStep/AgentApproval, dispatch operations/tools, mutate/emit, route providers/models or execute AI/tools.

## Fixed acceptance before implementation

- **AIAPP-RBACBACK-BASE-001** exact DD-437 parent evidence is established first with unchanged inputs/dependencies.
- **AIAPP-RBACBACK-BASE-002** DD-437 null/error short-circuits or propagates before reciprocal-backlink evaluation.
- **AIAPP-RBACBACK-BACK-001** exact bound step approvalId + same approval id/run/step passes for valid Tenant-Core and Tenant-Industry parent evidence.
- **AIAPP-RBACBACK-BACK-002** unbound step, wrong approval id, wrong run/step backlink or malformed relevant identifiers fails closed.
- **AIAPP-RBACBACK-BACK-003** backlink evaluation uses only the already-loaded exact approval/step references; no additional reader/search/fallback occurs and unrelated evidence remains uninterpreted.
- **AIAPP-RBACBACK-EVID-001** success returns a frozen envelope preserving the exact DD-437 parent reference and leaves all evidence unchanged.
- **AIAPP-RBACBACK-BOUND-001** success exposes no full authorization, ABAC/commercial/resource/approval-satisfied result, transition, dispatch, mutation, provider/model routing or AI/tool execution authority.

Expected executable delta: Core **1244 → 1251**. PostgreSQL remains **532**. Database inventory remains **48 migrations / 42 SQL verification files**.

## Explicit exclusions

No schema, migration, SQL verification, RLS, role, grant, route, frontend, identity/session reconstruction, provider SDK, worker, scheduler or RawSource change.

This batch does **not**:
- create an approval-specific OperationContract or ResourceDescriptor;
- call `AuthorizationDecisionService` or GuardPipeline;
- evaluate applicable ABAC expressions;
- evaluate subscription/license/entitlement/commercial facts;
- claim current approval satisfaction;
- infer backlink truth from AgentApproval alone when `step.approvalId` is absent;
- re-read or replace the already-loaded AgentApproval/AgentStep evidence;
- resume/cancel/mutate AgentRun/AgentStep/AgentApproval;
- dispatch OperationContract/tools or invoke provider/model/AI execution.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-438…DD-442 and the fixed acceptances.
