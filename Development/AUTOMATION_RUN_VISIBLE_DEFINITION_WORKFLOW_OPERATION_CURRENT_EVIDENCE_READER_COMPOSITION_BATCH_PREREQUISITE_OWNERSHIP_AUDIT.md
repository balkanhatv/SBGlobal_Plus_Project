# AutomationRun visible Definition + optional Workflow + optional OperationContract current-evidence reader prerequisite ownership audit

**Date:** 2026-10-02  
**Baseline checkpoint:** `DEV-AUTOMATION-RUN-VISIBLE-DEFINITION-WORKFLOW-CURRENT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `b2a302580f187a5902863eb052b8905c971c07df`  
**Verified entry tree:** `ad14de6cacf77d7655a65f8da4cbde1e7a2888db`  
**Governed batch:** DD-383 through DD-387

## Entry gate

DD-378…DD-382 canonical promotion and state closure are verified. Push Core Service Verify run `36969971538`: Core job `110721711021` **1150/1150 PASS**, PostgreSQL job `110721711224` **529/529 PASS**, fail/skip 0; full database bootstrap PASS. Database run `36969971491` / job `110721707018` PASS, **48 migrations / 42 SQL verification files**. Web run `36969971643` / job `110721707741` PASS.

This closes DD-378…DD-382 at its bounded evidence scope. PR #2 remains draft/unmerged; RawSource remains unchanged.

## Reconciled owners and determination

- DD-382 owns the current AutomationRun→AutomationDefinition→optional WorkflowDefinition raw evidence composition and explicitly adds no operation dispatch authority.
- Migration 0026 stores nullable `automation_definition.operation_contract_id` as raw text and requires at least one of `operation_contract_id` or `workflow_definition_id`; it does **not** own OperationContract registry existence or scope compatibility.
- DD-06 §1 owns the canonical OperationContract model and states that every business operation is registered once. `OperationRegistry.get(operationId)` is the existing exact registry lookup and throws for an unknown id. The registry owns operation metadata such as scopeClass, permissionCode, entitlementRequirement, idempotencyPolicy, rateClass, auditClass, domainService, emittedEvents and errors.
- There is no source-owned AutomationDefinition→OperationContract scope-compatibility, permission, entitlement, lifecycle, dispatch or execution predicate. This batch therefore resolves only exact registry evidence and deliberately does **not** interpret whether the contract is executable for the run/context.

**SOURCE-COMPLETE:** extend DD-382 evidence with optional exact OperationContract registry evidence using the persisted `operationContractId`. No operation inference, fallback, scope/permission/entitlement interpretation or dispatch semantics are required.

## Frozen decisions

**DD-383 — DD-382 parent evidence first.** Add `loadAutomationRunDefinitionWorkflowOperationCurrentEvidence(...)`. Invoke DD-382 first with the exact supplied RequestContext and AutomationRun id. Null short-circuits registry access; dependency errors propagate unchanged.

**DD-384 — Optional exact OperationContract registry lookup.** Use exactly `parent.runDefinition.definition.operationContractId`. If absent, do not access the registry. If present, invoke the canonical registry exact lookup once with that id. Unknown-operation errors propagate unchanged. Do not derive an operation from module, workflow, trigger, code, domainService or any other field.

**DD-385 — Registry identity only; no compatibility policy.** The registry-returned OperationContract is evidence of exact canonical registration. Preserve its `operationId` and metadata unchanged. Do not add RequestContext/OperationContract scope compatibility, permission/entitlement, idempotency/rate/audit, domain-service availability, event/error or lifecycle interpretation. Both optional WorkflowDefinition and OperationContract evidence may coexist.

**DD-386 — Immutable layered exact-reference evidence.** Success returns a frozen envelope preserving the exact DD-382 parent object and, when present, the exact registry-returned OperationContract reference. No clone, normalization or mutation.

**DD-387 — Combined evidence adds no dispatch/execution authority.** Raw run/definition/workflow/operation metadata remains evidence only. Do not select definitions, authorize transitions/retries, evaluate trigger/condition/state machine, run GuardPipeline, claim idempotency, enforce rate/commercial/authz, dispatch domainService/WorkflowDefinition, mutate, emit events or execute workers.

## Fixed acceptance before implementation

- **WFA-RUN-OPREAD-BASE-001:** exact RequestContext/id enters DD-382 first; no registry access precedes successful parent evidence.
- **WFA-RUN-OPREAD-BASE-002:** DD-382 null/error short-circuits registry access and preserves dependency error identity.
- **WFA-RUN-OPREAD-OP-001:** absent operationContractId performs zero registry lookups; present id performs exactly one lookup using the exact persisted string.
- **WFA-RUN-OPREAD-OP-002:** unknown-operation registry error propagates unchanged; no fallback/derived operation lookup occurs.
- **WFA-RUN-OPREAD-COEXIST-001:** optional WorkflowDefinition evidence and optional OperationContract evidence coexist independently without mutual-exclusion policy.
- **WFA-RUN-OPREAD-RAW-001:** scopeClass, permission, entitlement, schema versions, idempotency, rate, audit, domainService, emittedEvents and errors are preserved raw and are not evaluated against RequestContext/run/definition.
- **WFA-RUN-OPREAD-EVID-001:** success preserves exact DD-382 parent and OperationContract references in a frozen envelope; inputs remain unchanged.
- **WFA-RUN-OPREAD-BOUND-001:** no selection, trigger/condition/state-machine decision, transition/retry, GuardPipeline, idempotency/rate/commercial/authz, dispatch, mutation, event or execution authority is exposed.

Expected delta: Core **1150 → 1158**. PostgreSQL stays **529**; Database stays **48/42**; Web unchanged.

## Delivery and exclusions

Implementation: `src/core/workflow/automation-run-visible-definition-workflow-operation-current-evidence-reader.ts`, Core export, and `tests/core/automation-run-visible-definition-workflow-operation-current-evidence-reader.test.mjs`. Promote DD-17 acceptances, DD-18 decisions, DD-19 traceability and current checkpoint narratives only after exact-head Core/PostgreSQL/Database/Web verification; the promotion must independently pass.

No schema, migration, RLS, grant, role, route, frontend, provider, scheduler, worker, product-policy or RawSource change. OperationContract compatibility/admission and all Automation/Workflow execution remain separately governed. Production readiness is not claimed.
