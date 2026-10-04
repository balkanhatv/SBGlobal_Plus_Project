# DD-473…DD-477 verification — WorkflowTask acting-principal current RBAC evidence

**Date:** 2026-10-04  
**Source audit:** `Development/WORKFLOW_TASK_ACTING_RBAC_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`  
**Source-audit HEAD/tree:** `a105e242a20850d2caceb420c0716b8d2cfa7047` / `5fe83fff413fbfd1671d3b566d350aa7bf20995f`  
**Implementation HEAD/tree:** `3e3f18723e6caec609077f618b447e9df9ba23a3` / `362ec8fcf7b1906b3cff88ac3ae15ec4240f300d`

## Entry gate

DD-468…DD-472 state closure `0486871dbfd16a00d208ea6228174df6c7dc9e10` / tree `0521f18f8be6c88bfbb02932645ac713453e338b` passed exact-head Core **1302/1302**, PostgreSQL **532/532** plus bootstrap, Database **48 migrations / 42 SQL verification files**, and Web. DD-473…DD-477 source-audit HEAD `a105e242a20850d2caceb420c0716b8d2cfa7047` then passed exact-head Core/PostgreSQL/Database/Web before implementation.

## Exact-head implementation gate

Implementation HEAD `3e3f18723e6caec609077f618b447e9df9ba23a3` / tree `362ec8fcf7b1906b3cff88ac3ae15ec4240f300d` passed:
- Core push run `37217552497` / job `111481058337`: **1310/1310 PASS**, fail/skip 0.
- PostgreSQL same run / job `111481058371`: **532/532 PASS**, fail/skip 0; full database bootstrap PASS.
- Database run `37217552482` / job `111481058052`: PASS; database inventory remains **48 migrations / 42 SQL verification files**.
- Web run `37217552486` / job `111481058132`: PASS.
- Pull-request Core/Database/Web workflows on the same implementation HEAD also passed.

## Bounded implementation result

The batch moves the generic protected-Tenant current-RBAC selector mechanics to Authorization ownership while preserving the existing AI helper as a thin compatibility wrapper. The new WorkflowTask reader reuses exact DD-362 parent evidence, performs exactly one Authorization read with the unchanged RequestContext and exact persisted WorkflowTask.permissionCode, and requires only the generic current compiled-RBAC ALLOW necessary floor.

Raw/noncanonical/empty persisted permissionCode values are not normalized by the caller. Applicable ABAC policies and WorkflowTask/WorkflowInstance state remain raw evidence. Success does not resolve assignee/claimant/completer currentness, due/expiry or task actions; does not create a full AuthorizationDecision/GuardPipeline result; and does not authorize transition, mutation/event, worker dispatch or workflow execution.

No schema, migration, RLS, role, grant, route, frontend, worker, scheduler, RawSource or product-policy change occurred.

## Promotion gate

Canonical DD/traceability/state promotion must independently pass exact-head Core/PostgreSQL/Database/Web before DD-473…DD-477 can be closed.
