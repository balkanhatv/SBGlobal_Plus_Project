# AutomationDefinition visible WorkflowDefinition containment-evidence reader prerequisite ownership audit

**Date:** 2026-10-02  
**Baseline checkpoint:** `DEV-AUTOMATION-RUN-VISIBLE-DEFINITION-CURRENT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `d6ac80b1d82520de1312c347c2e2941308265aba`  
**Verified entry tree:** `200dc503f13b1d76ef469c7036cc50ee0c5a940a`  
**Governed batch:** DD-373 through DD-377

## Entry gate

DD-368…DD-372 corrected canonical promotion and state closure are verified. Pull-request Core Service Verify run `36963295272`: Core job `110701480141` **1134/1134 PASS**, PostgreSQL job `110701479923` **529/529 PASS**, fail/skip 0; full database bootstrap PASS. Database run `36963295285` / job `110701479833` PASS, **48 migrations / 42 SQL verification files**. Web run `36963295330` / job `110701480526` PASS. Push workflows also passed on the same exact HEAD.

This closes DD-368…DD-372 at its bounded evidence scope. PR #2 remains draft/unmerged; RawSource remains unchanged.

## Reconciled owners and determination

- Migration 0026 persists AutomationDefinition and WorkflowDefinition. `automation_definition.workflow_definition_id` is optional raw UUID evidence.
- Migration 0031 `validate_workflow_relationships()` owns the optional AutomationDefinition→WorkflowDefinition reference: when bound, the referenced WorkflowDefinition must exist and its scope must contain the AutomationDefinition scope through the canonical definition containment relation.
- Migration 0048 `definition_contains_definition()` owns fail-closed PLATFORM/TENANT/INDUSTRY containment: PLATFORM child requires PLATFORM parent; TENANT child accepts PLATFORM or exact same-Tenant TENANT; INDUSTRY child accepts PLATFORM, exact same-Tenant TENANT or exact same-Tenant INDUSTRY.
- DD-101 owns the exact-by-id RequestContext-scoped raw WorkflowDefinition reader. Its PostgreSQL acceptance proves a PLATFORM WorkflowDefinition is **not** Tenant fallback evidence and requires PLATFORM_GLOBAL context.
- DD-105 owns the exact-by-id RequestContext-scoped raw AutomationDefinition reader and preserves optional `workflowDefinitionId` as evidence.
- DD-176 owns `matchesAutomationDefinitionWorkflowDefinitionContainmentFloors(automationDefinition, workflowDefinition?)`. Unbound AutomationDefinition requires no WorkflowDefinition evidence; bound evidence requires exact id + valid canonical containment. Status, version, effective dates, state-machine, approval, rule, trigger, condition, operation and config semantics are deliberately uninterpreted.

**SOURCE-COMPLETE:** compose the existing AutomationDefinition reader, optional WorkflowDefinition reader and DD-176 floor without new persistence, cross-scope resolver, definition selection, lifecycle interpretation or Automation/Workflow execution semantics.

This is intentionally **visible containment evidence**, not an exhaustive cross-scope resolver. A TENANT or INDUSTRY AutomationDefinition may validly reference a broader PLATFORM WorkflowDefinition under database integrity while that PLATFORM parent remains hidden to the supplied Tenant RequestContext. In that case the same-context WorkflowDefinition read returns null and this composition returns null. It must not switch to PLATFORM_GLOBAL, synthesize a platform principal or use an alternate read path.

## Frozen decisions

**DD-373 — Exact visible AutomationDefinition first.** Add `loadAutomationDefinitionWorkflowContainmentEvidence(input, automationDefinitionReader, workflowDefinitionReader)`. Invoke the AutomationDefinition reader first, exactly once, with the exact supplied RequestContext object and exact `automationDefinitionId`. Null returns null without WorkflowDefinition access; dependency errors propagate unchanged.

**DD-374 — Optional exact referenced WorkflowDefinition under the same context.** If `automationDefinition.workflowDefinitionId` is absent, do not call the WorkflowDefinition reader and evaluate DD-176 with no parent evidence. If bound, invoke the WorkflowDefinition reader exactly once with the identical RequestContext object and exact persisted id. Bound null returns null; dependency errors propagate unchanged. No code/version lookup or context switch.

**DD-375 — Existing DD-176 containment plus no fallback.** Apply `matchesAutomationDefinitionWorkflowDefinitionContainmentFloors(...)`; false returns null. Preserve exact PLATFORM/TENANT/INDUSTRY containment and unbound semantics. A broader PLATFORM parent hidden from Tenant context remains null; no PLATFORM_GLOBAL fallback/elevation is allowed.

**DD-376 — Immutable exact-reference evidence.** Unbound success returns frozen `{ automationDefinition }`; bound success returns frozen `{ automationDefinition, workflowDefinition }`, preserving exact reader-returned references. No clone, normalization or mutation.

**DD-377 — Raw definition evidence adds no runtime authority.** Preserve AutomationDefinition status/version/schema/trigger/config/condition/operation/workflow/effective evidence and WorkflowDefinition status/version/schema/stateMachine/approval/rules/effective evidence unchanged. Do not choose active/effective versions, interpret state machines/rules/triggers, dispatch OperationContract/WorkflowDefinition, create AutomationRun/WorkflowInstance, mutate, emit events or execute workers.

## Fixed acceptance before implementation

- **WFA-DEF-WFREAD-BASE-001:** exact AutomationDefinition id and exact RequestContext reach the AutomationDefinition reader once before any WorkflowDefinition access.
- **WFA-DEF-WFREAD-BASE-002:** AutomationDefinition null/error short-circuits; dependency error identity is preserved.
- **WFA-DEF-WFREAD-WF-001:** unbound AutomationDefinition performs no WorkflowDefinition read and returns valid immutable automation-only evidence; bound evidence forwards the identical RequestContext and exact persisted WorkflowDefinition id once.
- **WFA-DEF-WFREAD-WF-002:** bound hidden/missing WorkflowDefinition returns null; WorkflowDefinition-reader errors propagate unchanged.
- **WFA-DEF-WFREAD-FLOOR-001:** DD-176 exact optional-reference/containment floor passes valid unbound and visible broader/equal parents; extraneous/unbound evidence, wrong id, narrower/foreign/sibling parent or malformed ownership fails closed.
- **WFA-DEF-WFREAD-NOFALLBACK-001:** a bound PLATFORM WorkflowDefinition hidden under Tenant context remains null after one same-context read; no PLATFORM_GLOBAL fallback/elevation occurs.
- **WFA-DEF-WFREAD-EVID-001:** success preserves exact AutomationDefinition and optional WorkflowDefinition references in a frozen envelope; inputs remain unchanged.
- **WFA-DEF-WFREAD-BOUND-001:** status/version/effective/stateMachine/approval/rule/trigger/config/condition/operation evidence remains raw; no selection, dispatch, mutation, event or Automation/Workflow execution authority is exposed.

Expected delta: Core **1134 → 1142**. PostgreSQL stays **529**; Database stays **48/42**; Web unchanged.

## Delivery and exclusions

Implementation: `src/core/workflow/automation-definition-visible-workflow-containment-evidence-reader.ts`, Core export, and `tests/core/automation-definition-visible-workflow-containment-evidence-reader.test.mjs`. Promote DD-17 acceptances, DD-18 decisions, DD-19 traceability and current checkpoint narratives only after the implementation's exact-head Core/PostgreSQL/Database/Web gate passes; the promotion must independently pass.

No schema, migration, RLS, grant, role, route, frontend, provider, scheduler, worker, product-policy or RawSource change. Active/effective WorkflowDefinition selection, Automation trigger/condition evaluation, OperationContract dispatch, Workflow execution, run-state transitions and retry/finality remain separately governed. Production readiness is not claimed.
