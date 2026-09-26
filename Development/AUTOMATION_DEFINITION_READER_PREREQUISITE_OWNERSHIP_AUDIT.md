# AutomationDefinition PostgreSQL reader prerequisite ownership audit

**Date:** 2026-09-22  
**Baseline:** `c3280b7c94a3327d6827fff63cd69210b4c1e653`  
**Scope:** next independent source-complete Workflow/Automation persistence slice after DD-104.

## Source reconciliation

DD-05 §3B, migration 0026 `automation_definition` schema/FORCE-RLS, migration 0027 dedicated Workflow worker privileges, migration 0031 AutomationDefinition creator/approver/reference integrity and the DD-101 WorkflowDefinition owner-scope reader pattern were reconciled.

The persisted contract is exact:

- owner scope is `PLATFORM | TENANT | INDUSTRY` with matching Tenant/Industry ownership shape;
- version/schemaVersion are positive integers;
- status is `DRAFT | REVIEW | PUBLISHED | ACTIVE | RETIRED`;
- trigger type is `EVENT | SCHEDULE | MANUAL`;
- trigger/config payloads are JSON persistence evidence;
- condition-rule and OperationContract identifiers are optional raw text references;
- at least one of `operation_contract_id` or `workflow_definition_id` is present;
- optional referenced WorkflowDefinition is database-validated so an AutomationDefinition cannot reference a narrower/foreign definition;
- creator/approver identity is validated for definition scope;
- owner-scope FORCE-RLS uses `core_config.row_visible_to_current_context(...)`;
- `sbg_workflow_worker_rw` has SELECT-only access to AutomationDefinition catalog rows.

## Determination

A concrete **exact-by-id raw AutomationDefinition reader** is source-complete.

Automation runtime execution is **not** source-complete in this slice. Persisted status/effective dates, trigger JSON, condition-rule reference, OperationContract id, WorkflowDefinition id and config JSON are evidence only. They must not become scheduler/event/manual execution authority.

## Authorized implementation boundary

Implement:

1. a typed Core `PersistedAutomationDefinition` / `AutomationDefinitionReadPort` contract;
2. `PostgresAutomationDefinitionStore` through the existing `PostgresWorkflowDatabase` + `RequestScopedSql` boundary;
3. exact-by-id parameterized reads;
4. strict UUID/owner/enums/positive integer/timestamp validation;
5. immutable JSON normalization for `triggerConfig` and `config`;
6. raw optional `conditionRuleRef`, `operationContractId` and `workflowDefinitionId` preservation without execution/validation invention;
7. null for RLS-hidden/absent rows;
8. real PostgreSQL acceptance for Industry/sibling/Tenant/Platform/foreign visibility, raw evidence fidelity and worker mutation denial.

The reader must not:

- choose an ACTIVE/effective definition;
- evaluate EVENT/SCHEDULE/MANUAL triggers;
- parse schedule syntax or event selectors;
- evaluate condition rules;
- validate or dispatch an OperationContract;
- instantiate/execute a WorkflowDefinition;
- create/update AutomationRun;
- mutate AutomationDefinition catalog state.

No migration, role, grant, RLS policy, scheduler, event consumer, route or product-policy change is authorized.

Acceptance: `WFA-DEF-PG-001…007`.
