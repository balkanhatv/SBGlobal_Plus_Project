# AI AgentApproval visible AgentRun/AgentStep parent current-evidence reader prerequisite ownership audit

**Date:** 2026-10-03  
**Baseline checkpoint:** `DEV-AI-AGENT-STEP-APPROVED-APPROVER-CONTEXT-CURRENT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `3d0599dd9e4353b14261501231807d5ba45cbc5d`  
**Verified entry tree:** `164d00ef7abf07797d05d816606c0cf45731ebc8`  
**Governed batch:** DD-423 through DD-427

## Entry gate

DD-418…DD-422 state closure passed exact-head **LOCAL CLOUD** verification at the HEAD/tree above: Core **1219/1219 PASS**, PostgreSQL **532/532 PASS**, zero failed/skipped tests; full database bootstrap and Database verification PASS with **48 migrations / 42 SQL verification files**, including the **9 equal Industries / 41 canonical Management Systems / 181 Industry tables** checks; Web PASS. The verified toolchain was Node **22.23.3**, PostgreSQL **16.13**, and pgvector **0.8.2**.

These are local cloud results. Remote CI inspection is blocked by the current `api.github.com` network policy; no remote CI result or run id is asserted for this entry HEAD. PR #2 is required to remain draft/unmerged; its live API metadata was not inspected. RawSource remains unchanged; no PR mutation or `main` merge was performed.

This audit freezes one independent backend evidence composition after the local entry gate. It does not reopen the verified DD-403…DD-422 compositions or imply production readiness.

## Reconciled owners and determination

- DD-132 owns the exact-by-id RequestContext-scoped raw AgentApproval reader and immutable persisted approval shape. Migration `0013_ai_agents_tools.sql` owns its status vocabulary and the schema rule that an APPROVED row carries approver principal and approval time. These remain raw historical facts.
- DD-130 owns the exact-by-id RequestContext-scoped raw AgentRun reader. DD-131 owns the exact-by-id RequestContext-scoped raw AgentStep reader, whose visibility is parent-run-derived. Each existing reader retains its own persistence validation and RLS boundary.
- Migration `0031_document_workflow_ai_integrity.sql`, `validate_agent_step_approval()`'s AgentApproval branch, owns the direct approval-to-run/step relationship: referenced parents exist; `step.run_id = approval.run_id`; run Tenant matches approval Tenant; nullable run Industry exactly matches nullable approval Industry.
- DD-184 owns `matchesAIAgentApprovalParentScopeFloors(approval, run, step)`, including exact approval/run/step ids, Tenant equality, nullable-Industry equality and malformed-identity rejection. It deliberately excludes approval status, approver currentness, permission and execution semantics.
- The migration's AgentStep branch separately validates an optional `step.approval_id` backlink. The AgentApproval branch does not require the step to point back to this approval. An approval can exist before backlink linkage or remain historical evidence after a different approval is linked. DD-183 is therefore not a prerequisite for this approval-first reader.
- DD-418…DD-422 separately own persisted APPROVED plus supplied trusted approver-context continuity. Those floors are not required to read a pending, rejected, expired or historical approval's visible parents, and do not own approval permission satisfaction.
- DD-363…DD-367's WorkflowTransition visible-instance composition provides the existing delivery pattern: follow exact persisted parent references in one unchanged RequestContext, re-apply the already-owned relationship floor, and preserve historical child evidence without deriving execution authority.

**SOURCE-COMPLETE:** read one exact visible AgentApproval first, follow only its persisted `runId` and `stepId` through the existing raw readers in the same RequestContext, apply DD-184, and return immutable exact-reference evidence. This requires no reciprocal backlink, approved-state filter, current approver context, definition/tool resolution, policy interpretation or execution semantics.

## Frozen decisions

**DD-423 — Exact visible AgentApproval first.** Add `loadAIAgentApprovalParentCurrentEvidence(input, approvalReader, runReader, stepReader)`, where input contains `requestContext` and `agentApprovalId`. Invoke DD-132 once with the exact supplied RequestContext object and approval id before either parent read. Null returns null without parent access; dependency errors propagate unchanged.

**DD-424 — Exact persisted parents in fixed same-context order.** For a visible approval, invoke DD-130 once with the identical RequestContext and exactly `approval.runId`. Run null returns null before any step read; run errors propagate unchanged. Only after a visible run, invoke DD-131 once with the identical RequestContext and exactly `approval.stepId`. Step null returns null; step errors propagate unchanged. The read order is approval → run → step. Do not substitute a run id obtained from the step, search/list parents, switch context, retry under another principal, or elevate to PLATFORM_GLOBAL.

**DD-425 — Existing DD-184 parent/scope floor.** Re-apply `matchesAIAgentApprovalParentScopeFloors(approval, run, step)` to the three exact reader-returned objects. False returns null. Preserve its UUID/exact-id/Tenant/nullable-Industry semantics without adding lifecycle, principal, membership, permission, definition or tool predicates. In particular, do not require `step.approvalId === approval.id` or apply DD-183's reciprocal backlink floor.

**DD-426 — Immutable exact-reference evidence.** Success returns frozen `{ approval, run, step }`, preserving all three exact reader-returned references. Do not clone, normalize, mutate or re-read evidence. No additional success or authorization flags are returned.

**DD-427 — Raw approval history adds no approval or execution authority.** Preserve all schema-valid PENDING/APPROVED/REJECTED/EXPIRED approval evidence and its requestedByAgent/type/requiredPermission/approver/summary/timestamps/reason/correlation fields. Preserve raw run principal/membership/snapshots/resource/status/budgets and step type/tool/approval/status/timestamps/audit fields. An absent or different step approval backlink does not invalidate the direct DD-184 relationship. Do not call DD-418/DD-419/DD-422, require APPROVED, construct or demand a current approver context, decide permission or approval satisfaction, infer whether approval is necessary, resume/cancel AgentRun, admit or dispatch an OperationContract, mutate, emit events, select providers/models or execute AI/tools.

## Fixed acceptance before implementation

- **AIAPP-PARENTREAD-BASE-001:** exact supplied approval id and identical RequestContext reach the approval reader exactly once before either parent read.
- **AIAPP-PARENTREAD-BASE-002:** approval null/error short-circuits both parent readers; dependency error identity is preserved.
- **AIAPP-PARENTREAD-PARENT-001:** success reads approval → run → step exactly once each, forwarding persisted `approval.runId` and `approval.stepId` with the identical RequestContext; valid Tenant-Core and Tenant-Industry chains pass.
- **AIAPP-PARENTREAD-PARENT-002:** hidden/missing run returns null with zero step reads; run error preserves identity and prevents step access; hidden/missing step returns null and step error preserves identity, with no fallback or alternate-context read.
- **AIAPP-PARENTREAD-FLOOR-001:** DD-184 rejects wrong run id, wrong step id, step belonging to another run, foreign Tenant, sibling Industry, both directions of Core/Industry mismatch and malformed relevant identifiers; exact parent/scope evidence passes.
- **AIAPP-PARENTREAD-EVID-001:** success returns only the exact approval/run/step references inside a frozen envelope and leaves all inputs unchanged.
- **AIAPP-PARENTREAD-RAW-001:** all four schema-valid approval states and historical principal/permission/time/reason evidence remain raw; absent or different `step.approvalId` and later parent state remain acceptable when DD-184 matches, with no approved-state or reciprocal-backlink requirement.
- **AIAPP-PARENTREAD-BOUND-001:** the three-reader composition requests no approver context, definition/tool/operation/capability evidence or execution dependency and exposes no approval-satisfied/current, permission-granted, resume/cancel, mutation, event, admission, dispatch, provider/model or AI/tool execution authority.

Expected executable delta: Core **1219 → 1227**. PostgreSQL remains **532**. Database inventory remains **48 migrations / 42 SQL verification files**. Web is unchanged.

## Delivery and exclusions

Implementation: `src/core/ai/agent-approval-visible-parent-current-evidence-reader.ts`, Core export, and `tests/core/ai-agent-approval-visible-parent-current-evidence-reader.test.mjs`.

This source-audit commit must pass exact-head Core/PostgreSQL/Database/Web before implementation. The implementation must then independently pass those exact-head gates before DD-17 acceptance, DD-18 decision, DD-19 traceability or current-checkpoint promotion. Canonical promotion and state closure must each receive their own exact-head verification. Record whether evidence is local cloud or remote CI and retain any remote-inspection limitation explicitly.

No schema, migration, SQL verification, RLS, grant, role, route, frontend, provider, scheduler, worker, product-policy or RawSource change. Approval satisfaction/currentness, approver permission/context revalidation, AgentDefinition/ToolSet/tool currentness, resource/schema/GuardPipeline admission, OperationContract dispatch, AgentRun transitions and all AI/tool execution remain separately governed. Production readiness is not claimed.
