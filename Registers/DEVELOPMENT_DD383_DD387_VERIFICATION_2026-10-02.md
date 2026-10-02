# DD-383…DD-387 verification — AutomationRun current evidence plus optional OperationContract registry evidence

**Date:** 2026-10-02  
**Source audit:** `Development/AUTOMATION_RUN_VISIBLE_DEFINITION_WORKFLOW_OPERATION_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`  
**Source-audit HEAD/tree:** `f9c7944968994f19f7e7b16d3a26bd121db74716` / `c2a331b3dda862ef93b53bcbdebf750f3d07c264`  
**Verified implementation HEAD/tree:** `e2fbc0eabf3f38bad817e5d1dc94ff47122b0394` / `00198651fcdef3b8c71d1d15eb3ac93ebcfa8224`

## Source-audit exact-head gate

- Core push run `36970379655` / job `110722912215`: **1150/1150 PASS**, fail/skip 0.
- PostgreSQL same run / job `110722912010`: **529/529 PASS**, fail/skip 0; full bootstrap PASS.
- Database push run `36970379662` / job `110722912013`: PASS, **48 migrations / 42 SQL verification files**.
- Web push run `36970379675` / job `110722911993`: PASS.

## Exact-head implementation gate

- Core push run `36970590182` / job `110723542112`: **1158/1158 PASS**, fail/skip 0.
- PostgreSQL same run / job `110723541996`: **529/529 PASS**, fail/skip 0; full bootstrap PASS.
- Database push run `36970590181` / job `110723542008`: PASS, **48 migrations / 42 SQL verification files**.
- Web push run `36970590229` / job `110723542199`: PASS.

The eight new acceptances prove DD-382-first ordering, optional exact registry lookup, no fallback/inference, WorkflowDefinition/OperationContract coexistence, raw OperationContract metadata, exact identity preservation and no compatibility/admission/dispatch/execution authority.

## Bounded result

No schema, migration, RLS, grant, role, route, frontend or RawSource change. OperationContract scope compatibility, permission/entitlement, GuardPipeline, idempotency/rate/commercial/authz admission, domainService/Workflow dispatch and Automation/Workflow execution remain separately governed.

## Canonical promotion gate

This promotion must independently pass exact-head Core/PostgreSQL/Database/Web before DD-383…DD-387 closure or another source audit. Production readiness is not claimed.
