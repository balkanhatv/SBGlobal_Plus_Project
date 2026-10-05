# DD-478…DD-482 verification — WorkflowTask visible current WorkflowDefinition evidence

**Date:** 2026-10-05  
**Source audit:** `Development/WORKFLOW_TASK_VISIBLE_DEFINITION_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`  
**Source-audit HEAD:** `c1b2c669612b425754faa36c4c6a12577f57be89`  
**Implementation HEAD/tree:** `d0a0422473aecd820c83860b96c33e28e5e27738` / `cbe5a22452b02812f99428d832ff6e7ddcf5e41f`

## Entry gate

DD-473…DD-477 closure-record HEAD `18fbb34ff8f8d8b4305f3f80a0014780c744d988` / tree `16f87797fd1abf6d69937a53f30c60b1b2da2b73` passed exact-head Core **1310/1310**, PostgreSQL **532/532** plus bootstrap, Database **48 migrations / 42 SQL verification files**, and Web. DD-478…DD-482 source-audit HEAD `c1b2c669612b425754faa36c4c6a12577f57be89` subsequently passed exact-head Core/PostgreSQL/Database/Web before implementation.

## Exact-head implementation gate

Implementation HEAD `d0a0422473aecd820c83860b96c33e28e5e27738` / tree `cbe5a22452b02812f99428d832ff6e7ddcf5e41f` passed:
- Core push run `37254279975` / job `111587953735`: **1318/1318 PASS**, fail/skip 0.
- PostgreSQL same run / job `111587953610`: **532/532 PASS**, fail/skip 0; full database bootstrap PASS.
- Database run `37254279938` / job `111587953545`: PASS; database inventory remains **48 migrations / 42 SQL verification files**.
- Web run `37254279987` / job `111587953904`: PASS.
- Pull-request Core/Database/Web workflows on the same implementation HEAD also passed.

## Bounded implementation result

The new reader reuses exact DD-362 WorkflowTask→WorkflowInstance evidence, performs exactly one same-RequestContext read of the persisted WorkflowInstance.workflowDefinitionId, and re-applies only DD-173 id/version/ACTIVE/owner-scope applicability. It performs no second WorkflowInstance read and no PLATFORM_GLOBAL fallback.

WorkflowTask assignment/current claimant/completer, permissionCode, due/expiry/action semantics, WorkflowInstance currentState/lifecycle, and WorkflowDefinition effectiveFrom/effectiveTo/stateMachine/approvalPolicy/ruleRefs remain raw/uninterpreted. No task action, transition, mutation/event, worker dispatch or workflow execution authority is created. No schema/RLS/role/grant/route/frontend/RawSource change occurred.

## Promotion gate

Canonical DD/traceability/state promotion must independently pass exact-head Core/PostgreSQL/Database/Web before DD-478…DD-482 can be closed.
