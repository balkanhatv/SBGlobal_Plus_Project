# AutomationRun visible AutomationDefinition + optional WorkflowDefinition current-evidence reader prerequisite ownership audit

**Date:** 2026-10-02  
**Baseline checkpoint:** `DEV-AUTOMATION-DEFINITION-VISIBLE-WORKFLOW-CONTAINMENT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `c8f38ecb6c60a5a08a89b367cf6394c82c407713`  
**Verified entry tree:** `defb2948447aa682d3ffa893d975bfef47c2a385`  
**Governed batch:** DD-378 through DD-382

## Entry gate

DD-373…DD-377 canonical promotion and state closure are verified. Push Core Service Verify run `36967197217`: Core job `110713404696` **1142/1142 PASS**, PostgreSQL job `110713404861` **529/529 PASS**, fail/skip 0; full database bootstrap PASS. Database run `36967197097` / job `110713404318` PASS, **48 migrations / 42 SQL verification files**. Web run `36967197078` / job `110713404329` PASS. PR workflows also ran on the same exact HEAD.

This closes DD-373…DD-377 at its bounded evidence scope. PR #2 remains draft/unmerged; RawSource remains unchanged.

## Reconciled owners and determination

- DD-372 owns `loadAutomationRunDefinitionCurrentEvidence(...)`: exact visible AutomationRun first, exact persisted AutomationDefinition in the same RequestContext, DD-175 id/ACTIVE/scope binding, immutable exact run/definition references and no PLATFORM_GLOBAL fallback.
- DD-176 owns the optional AutomationDefinition→WorkflowDefinition exact-reference/containment predicate, including valid unbound evidence and PLATFORM/TENANT/INDUSTRY containment.
- DD-101 owns exact-by-id RequestContext-scoped raw WorkflowDefinition visibility. PLATFORM WorkflowDefinition rows are not Tenant fallback evidence.
- DD-377 separately proves an AutomationDefinition-first containment reader, but invoking that reader after DD-372 would re-read the same AutomationDefinition and weaken exact parent-envelope identity. This batch therefore reuses the already-returned DD-372 definition reference and calls only the optional WorkflowDefinition reader plus the existing DD-176 floor.
- Migrations 0026/0031/0048 remain the persistence/relationship/containment owners. No new database relationship or lifecycle policy is needed.

**SOURCE-COMPLETE:** extend exact DD-372 parent evidence with optional visible WorkflowDefinition containment using the already-governed DD-176 floor. No duplicate AutomationDefinition read, cross-scope resolver, active/effective selector, trigger/condition interpretation, OperationContract dispatch or Workflow execution is required.

## Frozen decisions

**DD-378 — DD-372 parent evidence first.** Add `loadAutomationRunDefinitionWorkflowCurrentEvidence(input, runReader, definitionReader, workflowDefinitionReader)`. Invoke DD-372 first with the exact supplied RequestContext and AutomationRun id. Null returns null before WorkflowDefinition access; dependency errors propagate unchanged.

**DD-379 — Optional exact WorkflowDefinition read from the preserved definition.** Use exactly `parent.definition.workflowDefinitionId`. If absent, do not call the WorkflowDefinition reader and evaluate DD-176 with no parent. If bound, call the WorkflowDefinition reader exactly once with the identical RequestContext and exact persisted id. Null returns null; errors propagate unchanged. Do not re-read AutomationDefinition.

**DD-380 — DD-176 containment and no fallback.** Re-apply `matchesAutomationDefinitionWorkflowDefinitionContainmentFloors(parent.definition, workflowDefinition?)`. False returns null. A bound broader PLATFORM WorkflowDefinition hidden from the Tenant RequestContext remains null; no PLATFORM_GLOBAL fallback/elevation or alternate reader path is allowed.

**DD-381 — Immutable layered exact-reference evidence.** Unbound success returns frozen `{ runDefinition: parent }`; bound success returns frozen `{ runDefinition: parent, workflowDefinition }`. Preserve the exact DD-372 parent envelope and exact optional WorkflowDefinition reference. No clone, normalization or mutation.

**DD-382 — Combined evidence adds no runtime authority.** Preserve AutomationRun trigger/idempotency/status/time/error, AutomationDefinition trigger/config/condition/operation/workflow/lifecycle metadata and WorkflowDefinition stateMachine/approval/rule/lifecycle metadata unchanged. Do not select active/effective definitions, interpret triggers/conditions/state machines, authorize run/transition/retry, dispatch OperationContract/WorkflowDefinition, mutate, emit events or execute workers.

## Fixed acceptance before implementation

- **WFA-RUN-WFREAD-BASE-001:** DD-372 receives the exact supplied RequestContext/id first; no WorkflowDefinition read precedes it.
- **WFA-RUN-WFREAD-BASE-002:** DD-372 null/error short-circuits all WorkflowDefinition access; dependency error identity is preserved.
- **WFA-RUN-WFREAD-WF-001:** unbound preserved AutomationDefinition skips WorkflowDefinition access; bound evidence forwards the identical RequestContext and exact persisted WorkflowDefinition id once, with no AutomationDefinition re-read beyond DD-372.
- **WFA-RUN-WFREAD-WF-002:** bound hidden/missing WorkflowDefinition returns null; WorkflowDefinition-reader errors propagate unchanged.
- **WFA-RUN-WFREAD-FLOOR-001:** DD-176 exact optional-reference/containment passes valid visible evidence and rejects wrong-id/narrower/foreign/sibling/malformed evidence.
- **WFA-RUN-WFREAD-NOFALLBACK-001:** a bound PLATFORM WorkflowDefinition hidden under Tenant context remains null after one same-context read; no PLATFORM_GLOBAL fallback/elevation occurs.
- **WFA-RUN-WFREAD-EVID-001:** success preserves the exact DD-372 parent envelope and optional WorkflowDefinition object reference inside a frozen envelope; inputs remain unchanged.
- **WFA-RUN-WFREAD-BOUND-001:** combined raw evidence exposes no definition selection, trigger/condition/state-machine decision, retry/finality, run/transition authorization, dispatch, mutation, event or execution authority.

Expected delta: Core **1142 → 1150**. PostgreSQL stays **529**; Database stays **48/42**; Web unchanged.

## Delivery and exclusions

Implementation: `src/core/workflow/automation-run-visible-definition-workflow-current-evidence-reader.ts`, Core export, and `tests/core/automation-run-visible-definition-workflow-current-evidence-reader.test.mjs`. Promote DD-17 acceptances, DD-18 decisions, DD-19 traceability and current checkpoint narratives only after the implementation's exact-head Core/PostgreSQL/Database/Web gate passes; the promotion must independently pass.

No schema, migration, RLS, grant, role, route, frontend, provider, scheduler, worker, product-policy or RawSource change. Active/effective definition selection, Automation trigger/condition evaluation, OperationContract dispatch, Workflow state-machine/approval/rule execution, AutomationRun status transitions and retry/finality remain separately governed. Production readiness is not claimed.
