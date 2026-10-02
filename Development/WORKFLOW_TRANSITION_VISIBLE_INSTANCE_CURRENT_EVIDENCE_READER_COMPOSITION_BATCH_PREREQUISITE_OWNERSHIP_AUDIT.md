# WorkflowTransition visible WorkflowInstance current-evidence reader prerequisite ownership audit

**Date:** 2026-10-02  
**Baseline checkpoint:** `DEV-WORKFLOW-TASK-VISIBLE-INSTANCE-CURRENT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `5c84e635285fceea1b3e28030d872bb8b51546dd`  
**Verified entry tree:** `38bb9a253940c4c5105286b29497f3dbb90d7d39`  
**Governed batch:** DD-363 through DD-367

## Entry gate

DD-358…DD-362 promotion and the active-checkpoint narrative correction are verified. Core Service Verify run `36958140793`: Core job `110685638195` **1118/1118 PASS**, PostgreSQL job `110685638317` **529/529 PASS**, fail/skip 0; full database bootstrap PASS. Database run `36958140792` / job `110685638025` PASS, **48 migrations / 42 SQL verification files**. Web run `36958140791` / job `110685638024` PASS. Push workflows also passed on this same HEAD.

This closes the preceding batch's conditional exact-head gate. PR #2 remains draft/unmerged; RawSource remains unchanged. This audit freezes one bounded backend reader composition before implementation.

## Reconciled owners and determination

- Migration 0026 persists WorkflowTransition and WorkflowInstance, with transition FORCE-RLS visibility inherited from its parent; expected/resulting versions are bigint historical evidence.
- Migration 0027 grants SELECT/INSERT but denies UPDATE/DELETE to the workflow worker on transition evidence.
- Migration 0031 `validate_workflow_relationships()` owns exact referenced instance id, same Tenant and nullable Industry equality. Transition actor membership at `occurred_at` is a separate predicate.
- DD-102 and DD-104 own exact-by-id RequestContext-scoped raw readers and persisted field validation.
- DD-174 owns `matchesWorkflowChildParentBindingFloors(transition, instance)` for current parent identity/scope binding, explicitly excluding actor and transition authority.

**SOURCE-COMPLETE:** combine these existing readers and floor without new persistence, policy, actor resolution, version selection or execution semantics. The returned parent is current evidence; the transition remains historical evidence. In particular, the transition's `toState` and `resultingInstanceVersion` need not equal the parent's later `currentState` and `rowVersion`.

## Frozen decisions

**DD-363 — Exact visible transition first.** Add `loadWorkflowTransitionInstanceCurrentEvidence(input, transitionReader, instanceReader)`. Invoke the transition reader first with the exact supplied RequestContext object and transition id, once. Null returns null without parent access; dependency errors propagate unchanged.

**DD-364 — Exact persisted parent in the same context.** For a visible transition, invoke the instance reader once with the same RequestContext object and exactly `transition.workflowInstanceId`. Parent null returns null; errors propagate unchanged. No resource/definition/state lookup, alternate id or context switch.

**DD-365 — Existing DD-174 parent binding.** Apply `matchesWorkflowChildParentBindingFloors(transition, instance)`; false returns null. Reuse its exact UUID/Tenant/nullable-Industry semantics without adding actor or state predicates.

**DD-366 — Immutable exact-reference evidence.** Success returns a frozen `{ transition, instance }` envelope retaining the two exact object references. No clone, normalization or mutation.

**DD-367 — Historical transition evidence adds no execution authority.** Preserve actor, from/action/to/reason, versions, occurredAt, correlation and parent state/lifecycle fields unchanged. Do not compare historical transition state/version to the current parent, validate actor membership/currentness, resolve definitions, authorize transition/replay, mutate, emit events or execute workers.

## Fixed acceptance before implementation

- **WTR-INSTREAD-BASE-001:** exact transition id and RequestContext reach transition reader once, before any parent access.
- **WTR-INSTREAD-BASE-002:** transition null/error short-circuits; error identity is preserved.
- **WTR-INSTREAD-INST-001:** exact persisted instance id and the identical RequestContext reach instance reader once, including Tenant-Core and Tenant-Industry contexts.
- **WTR-INSTREAD-INST-002:** hidden/missing parent returns null; parent error identity is preserved.
- **WTR-INSTREAD-FLOOR-001:** exact Core/Industry binding passes; wrong id, foreign Tenant, sibling Industry, Core/Industry mismatch and malformed parent ownership fail closed.
- **WTR-INSTREAD-EVID-001:** exact references in a frozen two-field envelope; input objects remain unchanged.
- **WTR-INSTREAD-HISTORY-001:** large decimal version strings, historical from/action/to/time/correlation and later parent state/version remain raw; history is not rejected because parent has advanced.
- **WTR-INSTREAD-BOUND-001:** no actor-current, actor-at-occurrence, state-machine, replay/transition authorization, task action, mutation, event or execution authority is exposed.

Expected delta: Core **1118 → 1126**. PostgreSQL stays **529**; Database **48/42**; Web unchanged.

## Delivery and exclusions

Implementation: `src/core/workflow/transition-visible-instance-current-evidence-reader.ts`, Core export, and `tests/core/workflow-transition-visible-instance-current-evidence-reader.test.mjs`. Promote DD-17 acceptances, DD-18 decisions, DD-19 traceability and all current checkpoint narratives only after the implementation's exact-head Core/PostgreSQL/Database/Web gate passes; the promotion must independently pass.

No schema, RLS, grant, role, public route, frontend, provider, worker, product-policy or RawSource change. WorkflowDefinition resolution, actor authorization, transition selection/replay and optimistic mutation remain separately governed. Production readiness is not claimed.
