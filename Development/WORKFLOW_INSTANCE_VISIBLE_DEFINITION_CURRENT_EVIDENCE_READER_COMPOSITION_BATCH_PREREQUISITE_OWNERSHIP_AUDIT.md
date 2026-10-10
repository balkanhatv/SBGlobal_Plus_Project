# WorkflowInstance visible WorkflowDefinition current-evidence reader composition prerequisite ownership audit

**Date:** 2026-10-01  
**Baseline checkpoint:** `DEV-NOTIFICATION-DELIVERY-SOURCE-EVENT-PAYLOAD-VALIDATED-READER-COMPOSITION-001`  
**Verified entry HEAD:** `7865f061e667a50785a35c8c9e659ab6d186bb53`  
**Verified entry tree:** `acae182cfbfa2776870090859231e9144a19a135`  
**Governed batch:** DD-353 through DD-357

## Entry gate

The DD-348…DD-352 state closure is exact-head verified:
- Core Service Verify `36900990432` / `110499808395`: **1101/1101 PASS**, zero failed/skipped.
- PostgreSQL `36900990432` / `110499808521`: **529/529 PASS**, zero failed/skipped; database bootstrap PASS.
- Database Verify `36900990404` / `110499807747`: PASS.
- Web Boundary Verify `36900990452` / `110499807798`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource is unchanged; `main` remains unmerged.

## Source ownership reconciled

Fresh reconciliation of migration 0026 WorkflowDefinition/WorkflowInstance persistence, migration 0027 Workflow worker privileges, migration 0031 `validate_workflow_relationships()`, DD-101 raw WorkflowDefinition reader, DD-102 raw WorkflowInstance reader, DD-170 definition-scope applicability and DD-173 WorkflowInstance→WorkflowDefinition current-binding floors yields one source-complete **visible current-evidence reader composition**.

The repository already owns:
- exact RequestContext-scoped WorkflowInstance read by id;
- exact RequestContext-scoped WorkflowDefinition read by id;
- DD-173 deterministic id/version/ACTIVE/status/scope relationship validation.

The composition can therefore read the visible WorkflowInstance first, follow only its persisted WorkflowDefinition id, read that definition once under the **same supplied RequestContext**, apply DD-173, and return immutable exact-reference evidence.

## Important visibility boundary

This composition is intentionally not a universal WorkflowDefinition resolver.

The existing WorkflowDefinition reader is FORCE-RLS RequestContext-scoped:
- PLATFORM definitions are readable only from trusted PLATFORM_GLOBAL context;
- TENANT definitions are same-Tenant visible;
- INDUSTRY definitions require the exact Industry Context.

DD-173 correctly states that a supplied PLATFORM definition may be applicable to Tenant-Core/Tenant-Industry instances, but the current Tenant-context reader does **not** own an implicit PLATFORM_GLOBAL fallback lookup.

Therefore:
- no context switch is invented;
- no second platform-global read is attempted;
- if the exact referenced definition is RLS-hidden/absent under the supplied RequestContext, the composition returns `null`;
- a future cross-scope/global-definition resolver requires separately governed authority.

This bounded false-negative posture is fail-closed and preserves existing reader authority.

## Determination

**SOURCE-COMPLETE for one parent-first same-RequestContext WorkflowInstance + visible WorkflowDefinition current-binding evidence reader.**

A successful result means only:
1. the WorkflowInstance was visible in the supplied RequestContext;
2. its exact referenced WorkflowDefinition was visible under that same RequestContext;
3. DD-173's id/version/ACTIVE/applicability floor passed.

It is **not** workflow execution, current-state validity, creator-principal validity, effective-date selection, rule/approval execution or transition authorization.

## Locked DD-353…DD-357 contracts

### DD-353 — WorkflowInstance parent-first exact read

Add `loadWorkflowInstanceDefinitionCurrentEvidence(...)`.

Its first action must invoke `WorkflowInstanceReadPort.loadForContext` with the exact supplied:
- RequestContext object;
- WorkflowInstance id.

If parent returns null:
- return null;
- do not access WorkflowDefinition.

Parent dependency errors propagate unchanged.

### DD-354 — Exact referenced WorkflowDefinition read under the same RequestContext

After a visible parent:
- call `WorkflowDefinitionReadPort.loadForContext` exactly once;
- pass the exact same RequestContext object;
- pass exactly `instance.workflowDefinitionId`.

Do not look up by code/version. Do not switch to PLATFORM_GLOBAL. Do not retry/fallback to another scope.

A null definition returns null. Definition dependency errors propagate unchanged.

### DD-355 — Re-apply exact DD-173 current-binding floor

Call only `matchesWorkflowInstanceDefinitionBindingFloors(instance, definition)`.

If false, return null.

Do not re-implement or weaken DD-173 id/version/status/owner-scope semantics.

### DD-356 — Immutable exact-reference current evidence

On success return frozen evidence containing:
- exact WorkflowInstance reference;
- exact WorkflowDefinition reference.

Do not clone/normalize/mutate either input.

### DD-357 — Preserve bounded visibility and no execution authority

The result must not:
- infer PLATFORM definition fallback visibility;
- validate creator principal currentness;
- select a definition by code/effective date;
- interpret `currentState`, stateMachine, approvalPolicy or ruleRefs;
- decide lifecycle finality, transition availability or task actions;
- mutate Workflow state;
- emit events.

## Fixed acceptance before implementation

- **WFI-DEFREAD-BASE-001** exact RequestContext/id reaches WorkflowInstance reader first; visible parent precedes definition access.
- **WFI-DEFREAD-BASE-002** parent null short-circuits definition access; parent error propagates unchanged.
- **WFI-DEFREAD-DEF-001** visible parent forwards exact same RequestContext and exact persisted WorkflowDefinition id once.
- **WFI-DEFREAD-DEF-002** definition null returns null; definition error propagates unchanged.
- **WFI-DEFREAD-FLOOR-001** exact ACTIVE/version/applicable visible definition passes DD-173; status/version/Tenant/Industry mismatch fails closed.
- **WFI-DEFREAD-NOFALLBACK-001** an RLS-hidden/absent referenced definition remains null with no PLATFORM_GLOBAL/context fallback attempt.
- **WFI-DEFREAD-EVID-001** success preserves exact instance/definition object identities in a frozen evidence envelope.
- **WFI-DEFREAD-BOUND-001** raw lifecycle/currentState/creator/effective/stateMachine/approval/rule evidence remains uninterpreted and output exposes no transition/task/execution/mutation authority.

Expected executable delta: Core **1101 → 1109**. PostgreSQL remains **529/529**. Database inventory remains **48 migrations / 42 verification files**. Web remains unchanged.

## Explicit exclusions

No schema, migration, RLS, role, grant, public route, UI/frontend or product-policy change.

This batch does **not** implement:
- PLATFORM_GLOBAL fallback resolution for a Tenant-context WorkflowInstance;
- WorkflowDefinition active-version selection by code/date;
- creator-principal currentness;
- Workflow currentState/stateMachine validity;
- approval/rule evaluation;
- WorkflowTask assignee/claim/completion semantics;
- WorkflowTransition actor/from/to/action authorization;
- optimistic state mutation or row-version compare-and-swap;
- event emission;
- scheduler/worker execution.

After DD-353…DD-357 implementation and targeted Core regression, run exact-head Core/PostgreSQL/Database/Web verification before canonical promotion.
