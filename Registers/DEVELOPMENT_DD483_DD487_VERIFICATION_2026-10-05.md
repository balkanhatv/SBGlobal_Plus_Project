# DD-483…DD-487 verification — WorkflowTask visible definition + acting RBAC evidence

**Date:** 2026-10-05  
**Source audit:** `Development/WORKFLOW_TASK_VISIBLE_DEFINITION_ACTING_RBAC_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`  
**Source-audit HEAD:** `dc3f60309095747611f9df1cc6755d4a070e1a7e`  
**Implementation HEAD/tree:** `93ae951362fc79c83e7c47c54308f3fa1c7eaf65` / `3b71d836f839b80c73b1a0a63a3da23345471c7e`

## Entry gate

DD-478…DD-482 closure-record HEAD `b95bc78dc3144ac87f8e8dc59ae9dbb1a6fc3faa` / tree `dff8e70e4447da61f39df02bdd2c7ee4217ec765` passed exact-head Core **1318/1318**, PostgreSQL **532/532** plus bootstrap, Database **48 migrations / 42 SQL verification files**, and Web. DD-483…DD-487 source-audit HEAD then passed push and pull-request Core/PostgreSQL/Database/Web gates before implementation.

## Exact-head implementation verification

Implementation HEAD `93ae951362fc79c83e7c47c54308f3fa1c7eaf65` / tree `3b71d836f839b80c73b1a0a63a3da23345471c7e` passed:
- Core push run `37259077560` / job `111602248461`: **1326/1326 PASS**, fail/skip 0.
- PostgreSQL same run / job `111602248293`: **532/532 PASS**, fail/skip 0; full database bootstrap PASS.
- Database run `37259077616` / job `111602248755`: PASS; inventory remains **48 migrations / 42 SQL verification files**.
- Web run `37259077574` / job `111602248409`: PASS.
- Pull-request Core/Database/Web workflows on the same implementation HEAD also passed.

## Bounded implementation result

The new reader invokes exact DD-482 WorkflowTask→WorkflowInstance→WorkflowDefinition evidence first, then performs exactly one Authorization read using the identical RequestContext and exact persisted `WorkflowTask.permissionCode`. It applies the existing DD-475 protected-Tenant current RBAC selector and returns frozen exact-reference `{ parent, authorizationState, permission }` evidence.

WorkflowTask assignment/current claimant/completer, due/expiry/task-action semantics, WorkflowDefinition effective dates/stateMachine/approvalPolicy/ruleRefs, applicable ABAC policies and WorkflowInstance lifecycle/state remain uninterpreted. No full AuthorizationDecision, GuardPipeline, transition, mutation/event, worker dispatch or workflow execution authority is added. No schema/RLS/role/grant/route/frontend/RawSource change occurred.

## Promotion gate

Canonical DD/traceability/state promotion must independently pass exact-head Core/PostgreSQL/Database/Web before DD-483…DD-487 can be closed.
