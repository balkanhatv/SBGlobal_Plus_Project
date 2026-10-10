# WorkflowTask visible WorkflowDefinition current-evidence reader composition prerequisite ownership audit

**Date:** 2026-10-05  
**Baseline checkpoint:** `DEV-WORKFLOW-TASK-ACTING-RBAC-CURRENT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `18fbb34ff8f8d8b4305f3f80a0014780c744d988`  
**Verified entry tree:** `16f87797fd1abf6d69937a53f30c60b1b2da2b73`  
**Governed batch:** DD-478 through DD-482

## Entry gate

DD-473…DD-477 state closure and closure-record HEAD are exact-head verified:
- Core Service Verify push run `37253818599` / job `111586642831`: **1310/1310 PASS**, fail/skip 0.
- PostgreSQL same run / job `111586642893`: **532/532 PASS**, fail/skip 0; full database bootstrap PASS.
- Database Verify push run `37253818598` / job `111586642491`: PASS; database inventory remains **48 migrations / 42 SQL verification files**.
- Web Boundary Verify push run `37253818620` / job `111586642622`: PASS.
- Pull-request Core/Database/Web workflows on the same closure-record HEAD also passed.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource is unchanged; `main` remains unmerged.

## Reconciled owners and determination

- DD-362 already owns exact visible WorkflowTask → WorkflowInstance current-binding evidence under the unchanged supplied RequestContext.
- DD-173 owns the deterministic WorkflowInstance → WorkflowDefinition id/version/status/scope relationship floor:
  - exact referenced definition id;
  - positive exact version equality;
  - WorkflowDefinition status exactly `ACTIVE`;
  - exact PLATFORM/TENANT/INDUSTRY applicability to the persisted WorkflowInstance scope.
- `WorkflowDefinitionReadPort.loadForContext(...)` is the existing RequestContext-scoped exact-by-id raw definition read boundary. FORCE-RLS visibility remains authoritative.
- DD-357 already established an important visibility constraint: a Tenant-context read does not own a PLATFORM_GLOBAL fallback. A referenced PLATFORM WorkflowDefinition may therefore be hidden and produce a fail-closed null under the supplied Tenant context.
- Reusing DD-357 directly would re-read the WorkflowInstance already preserved by DD-362. This batch therefore composes exact DD-362 parent evidence with one exact WorkflowDefinition read and the existing DD-173 floor; it does not add another WorkflowInstance read.
- WorkflowTask assignment/current claimant/completer, task state, due/expiry, task actions and permission evidence remain separately governed.
- WorkflowDefinition `effectiveFrom/effectiveTo`, stateMachine, approvalPolicy and ruleRefs remain raw evidence. Existing source explicitly does not define active-version/effective-date selection here.
- No task→definition direct foreign key is invented: the relationship is strictly WorkflowTask → exact current WorkflowInstance → that instance's persisted WorkflowDefinition id/version.

**SOURCE-COMPLETE:** extend exact DD-362 WorkflowTask→WorkflowInstance evidence with one same-RequestContext read of the exact persisted WorkflowDefinition id already held by the current WorkflowInstance, then re-apply only DD-173. Preserve raw task/instance/definition semantics and the existing no-PLATFORM_GLOBAL-fallback boundary.

## Frozen decisions

### DD-478 — exact DD-362 WorkflowTask parent evidence first

Add `loadWorkflowTaskDefinitionCurrentEvidence(...)`. Invoke `loadWorkflowTaskInstanceCurrentEvidence(...)` first with the exact supplied RequestContext, WorkflowTask id and unchanged task/instance readers. Parent null returns null; parent dependency errors propagate unchanged. No WorkflowDefinition read occurs before successful DD-362 evidence.

### DD-479 — one exact same-context WorkflowDefinition read

After exact DD-362 evidence:
- call `WorkflowDefinitionReadPort.loadForContext(...)` exactly once;
- pass the identical supplied RequestContext object;
- pass exactly `parent.instance.workflowDefinitionId`.

Do not look up by code/version, task fields or alternate ids. Do not switch to PLATFORM_GLOBAL, retry another scope or infer cross-scope authority. Null returns null; dependency errors propagate unchanged.

### DD-480 — exact DD-173 current definition-binding floor

Apply only `matchesWorkflowInstanceDefinitionBindingFloors(parent.instance, definition)`.

If false, return null. Reuse its exact id/version/ACTIVE/owner-scope applicability semantics without adding effective-date, creator, task assignment, state-machine or action predicates.

### DD-481 — immutable exact-reference task/instance/definition evidence

Success returns frozen `{ parent, definition }`, preserving:
- the exact DD-362 parent object;
- the exact WorkflowTask reference nested in parent;
- the exact WorkflowInstance reference nested in parent;
- the exact WorkflowDefinition reference.

Do not clone, normalize or mutate any input/evidence object.

### DD-482 — visible current definition evidence is not task/action/workflow execution authority

A success proves only:
1. the WorkflowTask and its exact WorkflowInstance are visible/currently bound under DD-362;
2. the exact referenced WorkflowDefinition is visible in the same supplied RequestContext;
3. DD-173 exact id/version/ACTIVE/applicability passed.

Do not:
- resolve assigned PRINCIPAL/ROLE/ORG_UNIT currentness;
- validate claimant/completer currentness;
- decide due/expiry;
- authorize claim/approve/reject/complete;
- interpret task.permissionCode as task action authority;
- select another definition by code/date;
- evaluate effectiveFrom/effectiveTo;
- interpret stateMachine, approvalPolicy or ruleRefs;
- validate instance.currentState against the definition;
- authorize WorkflowTransition;
- mutate WorkflowTask/WorkflowInstance;
- emit events, dispatch workers or execute workflow logic.

## Fixed acceptance before implementation

- **WFT-DEFREAD-BASE-001** exact RequestContext/id reaches DD-362 parent first; definition access occurs only after successful parent evidence.
- **WFT-DEFREAD-BASE-002** DD-362 null/error short-circuits or propagates before definition access.
- **WFT-DEFREAD-DEF-001** exactly one definition read receives the identical RequestContext and exact persisted `parent.instance.workflowDefinitionId`, including Tenant-Core and Tenant-Industry cases.
- **WFT-DEFREAD-DEF-002** hidden/missing definition returns null and definition dependency errors propagate unchanged.
- **WFT-DEFREAD-FLOOR-001** exact DD-173 id/version/ACTIVE/applicability evidence passes; status/version/Tenant/Industry/owner-shape mismatch fails closed.
- **WFT-DEFREAD-NOFALLBACK-001** an RLS-hidden/absent referenced definition remains null with no PLATFORM_GLOBAL/context fallback or alternate lookup.
- **WFT-DEFREAD-EVID-001** success preserves exact DD-362 parent and exact definition references in a frozen envelope; inputs remain unchanged.
- **WFT-DEFREAD-BOUND-001** output exposes no assignment/current claimant/completer, due/expiry, task-action, effective-date selection, state-machine validity, transition, mutation/event, worker or execution authority.

Expected executable delta: Core **1310 → 1318**. PostgreSQL remains **532**. Database inventory remains **48 migrations / 42 verification files**. Web unchanged.

## Explicit exclusions

No schema, migration, SQL verification, RLS, role, grant, route, frontend, scheduler, worker, public API, RawSource or product-policy change.

This batch does **not**:
- add a direct WorkflowTask→WorkflowDefinition relationship;
- perform a second WorkflowInstance read;
- switch context to PLATFORM_GLOBAL;
- choose a WorkflowDefinition by code/version/date;
- interpret effective dates;
- resolve task assignee/claimant/completer identity;
- evaluate WorkflowTask.permissionCode;
- evaluate task actions or WorkflowTransition rules;
- interpret stateMachine/approvalPolicy/ruleRefs;
- mutate state, emit events or execute workflow logic.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-478…DD-482 and the eight fixed acceptances.
