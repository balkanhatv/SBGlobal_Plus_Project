# AutomationRun visible AutomationDefinition current-evidence reader prerequisite ownership audit

**Date:** 2026-10-02  
**Baseline checkpoint:** `DEV-WORKFLOW-TRANSITION-VISIBLE-INSTANCE-CURRENT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `fb143106868206abb9452046c300b10d941b3916`  
**Verified entry tree:** `544ecb583c44cb9631b6ff6a93b723760f75a7e0`  
**Governed batch:** DD-368 through DD-372

## Entry gate

DD-363…DD-367 canonical promotion and state closure are verified. Core Service Verify push run `36961367413`: Core job `110695572337` **1126/1126 PASS**, PostgreSQL job `110695572390` **529/529 PASS**, fail/skip 0; full database bootstrap PASS. Database run `36961367404` / job `110695572159` PASS, **48 migrations / 42 SQL verification files**. Web run `36961367420` / job `110695572594` PASS. All results identify the exact entry HEAD/tree above.

The first closure attempt `053157839f329f5360c3e4cabd7fd913180eefac` correctly failed REPO-007 because the bounded runtime audit had not yet named the verified DD-363…DD-367 promotion basis; `fb143106868206abb9452046c300b10d941b3916` is the forward-only root-cause correction and is green. PR #2 remains draft/unmerged; RawSource remains unchanged.

## Reconciled owners and determination

- Migration 0026 persists AutomationRun and AutomationDefinition. AutomationRun is Tenant-owned with nullable Industry Context and stores one required `automation_definition_id`; AutomationDefinition may be PLATFORM, TENANT or INDUSTRY owned.
- Migration 0031 `validate_workflow_relationships()` owns the deterministic AutomationRun→AutomationDefinition relationship: referenced definition exists, raw definition status is exactly `ACTIVE`, and definition ownership applies to the run Tenant/Industry scope. AutomationRun stores no definition version, so version/effective-date matching is not part of this relationship.
- DD-105 owns the exact-by-id RequestContext-scoped raw AutomationDefinition reader and persisted field validation. Its PostgreSQL acceptance explicitly proves PLATFORM AutomationDefinition is **not** a Tenant fallback and requires PLATFORM_GLOBAL context.
- DD-106 owns the exact-by-id RequestContext-scoped raw AutomationRun reader. It accepts resolved TENANT_CORE/TENANT_INDUSTRY contexts only and preserves trigger/idempotency/status/time/error fields as raw evidence.
- DD-175 owns `matchesAutomationRunDefinitionBindingFloors(run, definition)` for exact id + ACTIVE + canonical PLATFORM/TENANT/INDUSTRY applicability, explicitly excluding trigger execution, run-state transition, retry/finality and OperationContract/Workflow dispatch.

**SOURCE-COMPLETE:** compose the existing run reader, AutomationDefinition reader and DD-175 floor without new persistence, context elevation, definition selection, trigger parsing or execution semantics.

This is intentionally **visible definition current evidence**, not an exhaustive cross-scope resolver. A persisted AutomationRun may validly reference an applicable PLATFORM AutomationDefinition under migration 0031 while that PLATFORM definition remains hidden to the supplied Tenant RequestContext. In that case the same-context definition read returns null and this composition returns null. It must not switch to PLATFORM_GLOBAL, synthesize a platform principal or use another reader path.

## Frozen decisions

**DD-368 — Exact visible AutomationRun first.** Add `loadAutomationRunDefinitionCurrentEvidence(input, runReader, definitionReader)`. Invoke the AutomationRun reader first, exactly once, with the supplied RequestContext object and exact `automationRunId`. Null returns null without definition access; dependency errors propagate unchanged.

**DD-369 — Exact persisted AutomationDefinition in the same context.** For a visible run, invoke the AutomationDefinition reader exactly once with the identical RequestContext object and exactly `run.automationDefinitionId`. Definition null returns null; dependency errors propagate unchanged. No alternate id, code/version lookup, PLATFORM_GLOBAL fallback or context switch.

**DD-370 — Existing DD-175 current binding.** Apply `matchesAutomationRunDefinitionBindingFloors(run, definition)`; false returns null. Reuse its exact id/ACTIVE/PLATFORM-TENANT-INDUSTRY applicability semantics. Do not add definition version/effective-date or trigger predicates.

**DD-371 — Immutable exact-reference evidence.** Success returns a frozen `{ run, definition }` envelope retaining the two exact object references. No clone, normalization or mutation.

**DD-372 — Raw Automation evidence adds no execution authority.** Preserve run triggerRef/idempotency/status/timestamps/correlation/error and definition version/schema/trigger/config/condition/operation/workflow/effective metadata unchanged. Do not select a definition version, parse a trigger, evaluate conditions, authorize run-state changes, decide retry/finality, dispatch OperationContract/WorkflowDefinition, mutate, emit events or execute workers.

## Fixed acceptance before implementation

- **WFA-RUN-DEFREAD-BASE-001:** exact AutomationRun id and exact RequestContext reach the run reader once, before definition access.
- **WFA-RUN-DEFREAD-BASE-002:** run null/error short-circuits definition access; dependency error identity is preserved.
- **WFA-RUN-DEFREAD-DEF-001:** visible run forwards the identical RequestContext and exact persisted `automationDefinitionId` to the definition reader once for Tenant-Core and Tenant-Industry inputs.
- **WFA-RUN-DEFREAD-DEF-002:** hidden/missing definition returns null; definition-reader error identity is preserved.
- **WFA-RUN-DEFREAD-FLOOR-001:** exact ACTIVE applicable definition passes; wrong id, non-ACTIVE status, foreign Tenant, sibling Industry and malformed owner/identity evidence fail closed through DD-175.
- **WFA-RUN-DEFREAD-NOFALLBACK-001:** hidden PLATFORM definition remains null under Tenant context; there is exactly one same-context definition read and no PLATFORM_GLOBAL fallback/elevation.
- **WFA-RUN-DEFREAD-EVID-001:** success preserves exact run/definition references in a frozen two-field envelope; inputs remain unchanged.
- **WFA-RUN-DEFREAD-BOUND-001:** raw trigger/idempotency/run-state/error and definition trigger/config/condition/operation/workflow/version/effective evidence remain uninterpreted; no retry, transition, dispatch, mutation, event or execution authority is exposed.

Expected delta: Core **1126 → 1134**. PostgreSQL stays **529**; Database stays **48/42**; Web unchanged.

## Delivery and exclusions

Implementation: `src/core/workflow/automation-run-visible-definition-current-evidence-reader.ts`, Core export, and `tests/core/automation-run-visible-definition-current-evidence-reader.test.mjs`. Promote DD-17 acceptances, DD-18 decisions, DD-19 traceability and current checkpoint narratives only after the implementation's exact-head Core/PostgreSQL/Database/Web gate passes; the promotion must independently pass.

No schema, migration, RLS, grant, role, route, frontend, provider, scheduler, worker, product-policy or RawSource change. AutomationDefinition→WorkflowDefinition containment, OperationContract dispatch, WorkflowDefinition execution, trigger/event/schedule/manual interpretation, run-state transitions and retry/finality remain separately governed. Production readiness is not claimed.
