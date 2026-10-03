# AI AgentStep persisted-approved + trusted approver-context current-evidence prerequisite ownership audit

**Date:** 2026-10-03  
**Baseline checkpoint:** `DEV-AI-AGENT-STEP-VISIBLE-PARENT-APPROVAL-OPERATION-CAPABILITY-CURRENT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `d05081b715eea2d921deee38ea8bb5ba1a98ecc8`  
**Verified entry tree:** `181820bb1d73017a88ba957be39a048a4c26ed2c`  
**Governed batch:** DD-418 through DD-422

## Entry gate

DD-413…DD-417 canonical promotion and state closure are exact-head verified. Push Core Service Verify run `37094533379`: Core job `111121641739` **1207/1207 PASS**, PostgreSQL job `111121641914` **532/532 PASS**, fail/skip 0; full database bootstrap PASS. Database run `37094533356` / job `111121641785` PASS, **48 migrations / 42 SQL verification files**. Web run `37094533376` / job `111121641779` PASS.

This closes DD-413…DD-417 at its bounded evidence scope. PR #2 remains open/draft/unmerged; RawSource remains unchanged; `main` remains unmerged.

## Reconciled owners and determination

- DD-417 owns the exact DD-412 TOOL evidence plus exact persisted ToolDefinition capability-code AICapability evidence. Capability lifecycle/policy/eligibility and all execution authority remain outside that boundary.
- DD-407 already exposes optional exact same-step/run/scope AgentApproval evidence under DD-183/DD-184.
- Migration 0013 owns AgentApproval status vocabulary `PENDING | APPROVED | REJECTED | EXPIRED` and the persisted check: **APPROVED requires non-null `approver_principal_id` and non-null `approved_at`**.
- Migration 0031 owns approver relationship integrity at write time: a non-null approver must be an active principal for the approval Tenant at `COALESCE(approved_at, created_at)`; it also owns exact AgentRun/AgentStep/Tenant/nullable-Industry parent scope.
- DD-132's PostgreSQL AgentApproval reader already preserves these schema-owned persisted facts and rejects malformed APPROVED rows.
- DD-09 §14 states: a tool cannot execute while required approval is not APPROVED, and the approval itself must be revalidated for approver **permission/context**. An AI-generated recommendation cannot satisfy a principal-required approval.
- DD-02 RequestContext is server-resolved current evidence. This batch may consume an **already-trusted approver RequestContext**; it may not manufacture one from `approverPrincipalId`, switch principals, synthesize authentication, or bypass DD-02.
- Current source does not provide an approval-specific OperationContract/permission evaluator that maps `AgentApproval.requiredPermission` into DD-03 without inventing a parallel/synthetic operation. Therefore **current permission revalidation remains source-incomplete in this batch**.
- DD-06 canonical execution also requires resource references to be derived from schema-validated input. AgentStep exposes only opaque `inputRef`, so GuardPipeline/tool execution composition remains blocked and is not part of this batch.

**SOURCE-COMPLETE:** re-evaluate only persisted APPROVED evidence plus identity/Tenant/Industry continuity against one already-resolved trusted approver RequestContext. This is a necessary context floor, never current permission satisfaction and never execution authority.

## Frozen decisions

**DD-418 — persisted APPROVED necessary floor.** Add `matchesAIAgentApprovalPersistedApprovedFloor(approval)`. Require a valid persisted approval identity/parent/Tenant shape, exact status `APPROVED`, valid non-null approver principal UUID and valid `approvedAt` timestamp. Do not impose an invented `approvedAt >= createdAt` rule because migration 0013 does not own one. All approval type/permission/request-summary/reason/requestedByAgent semantics remain raw.

**DD-419 — trusted current approver-context continuity floor.** Add `matchesAIAgentApprovalApproverContextFloor(approval, approverRequestContext)`. It first requires DD-418. The context is assumed to have been produced by trusted DD-02 resolution; do not re-resolve it. Require exact `context.principalId === approval.approverPrincipalId`, exact Tenant, and protected Tenant scope only. For Industry-scoped approval require exact `TENANT_INDUSTRY` + exact Industry Context. For Tenant-Core approval, same-Tenant `TENANT_CORE` or `TENANT_INDUSTRY` context is permitted because the physical AgentApproval RLS deliberately exposes nullable-Industry rows within the same Tenant; permission remains a later guard.

**DD-420 — DD-417 parent first, optional approval branch only.** Add `loadAIAgentStepApprovedApproverContextCurrentEvidence(...)`. Invoke exact DD-417 first with the existing acting RequestContext/AgentStep id and all existing readers/registry. Null/error short-circuits unchanged. If DD-417 parent contains no AgentApproval, return frozen parent-only evidence and do **not** infer that approval is unnecessary. If an AgentApproval exists, require an explicitly supplied trusted approver RequestContext and apply DD-419; absent/mismatched/non-APPROVED context evidence returns null.

**DD-421 — immutable layered exact-reference evidence.** Preserve the exact DD-417 parent object. When approval exists and passes DD-419, preserve the exact supplied approver RequestContext reference. Do not clone, normalize, mutate, re-read or synthesize principal/context evidence.

**DD-422 — approval permission and execution remain blocked.** `requiredPermission`, `approvalType`, tool side-effect/approval-policy metadata, current permission/ABAC/commercial state and GuardPipeline remain uninterpreted. A successful result means only “persisted approval is APPROVED and its recorded approver matches this already-trusted current Tenant/Industry context.” It does not mean approval is currently authorized/satisfied, does not resume AgentRun, and does not admit/dispatch/execute a tool.

## Fixed acceptance before implementation

- **AIAPP-APPROVED-CUR-001** exact APPROVED + valid approver principal + valid approvedAt passes the persisted floor.
- **AIAPP-APPROVED-CUR-002** PENDING/REJECTED/EXPIRED or missing/malformed approver/approvedAt fails closed.
- **AIAPP-APPROVED-CUR-003** fields not owned by this floor remain uninterpreted; timestamps are not ordered by an invented rule; input unchanged.
- **AIAPP-CTX-CUR-001** exact current approver principal + Tenant-Core context passes Tenant-Core approval continuity.
- **AIAPP-CTX-CUR-002** same approver/same Tenant Tenant-Industry context also passes a Tenant-Core approval continuity check; no permission is inferred.
- **AIAPP-CTX-CUR-003** Industry approval requires exact Tenant-Industry scope and exact Industry Context.
- **AIAPP-CTX-CUR-004** wrong principal, foreign Tenant, sibling/missing Industry, PUBLIC/PLATFORM_GLOBAL/EXPLICIT_CROSS_CONTEXT or malformed context fails closed.
- **AISTEP-APPCTX-BASE-001** exact DD-417 parent evidence is established first; parent null/error propagates before approval-context logic.
- **AISTEP-APPCTX-BRANCH-001** no persisted AgentApproval returns exact frozen parent-only evidence and does not require/synthesize approver context.
- **AISTEP-APPCTX-APPROVAL-001** persisted AgentApproval requires exact DD-419 success; missing/mismatched/non-APPROVED approver-context evidence returns null.
- **AISTEP-APPCTX-EVID-001** success preserves exact DD-417 parent and exact supplied approver RequestContext identities in a frozen envelope; inputs unchanged.
- **AISTEP-APPCTX-BOUND-001** result exposes no required-permission decision, approval-satisfied flag, GuardPipeline result, resume/cancel, dispatch, provider/model routing or AI/tool execution authority.

Expected executable delta: Core **1207 → 1219**. PostgreSQL remains **532**. Database inventory remains **48 migrations / 42 verification files**.

## Explicit exclusions

No schema, migration, RLS, role, grant, route, frontend, provider SDK, credential reconstruction, worker, scheduler or RawSource change.

This batch does **not**:
- construct/rebuild approver RequestContext from persisted principal identity;
- evaluate `AgentApproval.requiredPermission`;
- claim current approver authorization/approval satisfaction;
- infer whether an absent approval means approval is unnecessary;
- interpret ToolDefinition `approvalPolicyId`, side-effect class or risk policy;
- derive resource references from opaque AgentStep `inputRef`;
- call GuardPipeline, schema validation, OperationExecutor or domain dispatch;
- resume/cancel/mutate AgentRun/AgentStep/AgentApproval;
- invoke provider/model/tool execution or inference.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-418…DD-422 and the fixed acceptances.
