# Definition scope applicability fail-closed prerequisite ownership audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-NOTIFICATION-SOURCE-EVENT-CURRENT-BINDING-FLOORS-001`  
**Verified synchronized basis:** `c260b726be913b20c48105f64fe556887da97b9d`  
**Scope:** shared cross-layer scope-predicate correctness prerequisite before NotificationTemplate continuation.

## Source reconciliation

Migration 0031 explicitly introduces `core_tenancy.definition_applies_to_scope()` and `definition_contains_definition()` under the comment:

> Shared, fail-closed predicates used by cross-layer integrity triggers.

The intended owner hierarchy is explicit in the function:
- PLATFORM definition: applicable with null owner Tenant/Industry;
- TENANT definition: applicable only to the same Tenant and no owner Industry;
- INDUSTRY definition: applicable only to the same Tenant and exact target Industry.

Current implementation uses ordinary SQL equality inside a CASE without coercing UNKNOWN/NULL to false:

`p_owner_industry_context_id = p_target_industry_context_id`.

For an INDUSTRY owner with a valid non-null Industry id and a Tenant-Core target whose Industry id is NULL, the equality evaluates to SQL NULL. The function therefore returns NULL rather than false.

Multiple migration-0031 integrity callers use the predicate as:

`... OR NOT core_tenancy.definition_applies_to_scope(...) THEN RAISE ...`

In PL/pgSQL an IF branch is entered only when its condition is true. When all other disjuncts are false and `NOT predicate` is NULL, the condition is NULL rather than true, so the intended rejection is not fail-closed.

The shared predicate is consumed by Document ACL role checks, WorkflowDefinition/Task role checks, AutomationDefinition runs, NotificationTemplate delivery binding, Industry AI prompt-set binding, Assistant/Memory definition binding, AI media prompt binding and AgentRun definition binding. `definition_contains_definition()` also delegates to the same predicate and can propagate nullable results for narrower-parent/broader-child combinations.

Existing verification covers cross-Tenant/Industry mismatches but does not cover an INDUSTRY definition evaluated against a same-Tenant Tenant-Core target.

## Determination

This is a real shared scope-isolation correctness gap, not a new product-policy choice.

The canonical owner hierarchy already determines the missing behavior:

- scope applicability/containment predicates must be **total booleans**;
- malformed or nullable mismatches must resolve to **false**, never UNKNOWN;
- an INDUSTRY definition must never apply to a Tenant-Core target;
- an INDUSTRY parent must never contain a broader TENANT definition.

A targeted database hardening is source-complete and is a prerequisite before deriving any NotificationTemplate current-binding helper from migration 0031.

## Authorized DD-170 boundary

Implement one forward-only migration and verification:

1. add migration `0048_definition_scope_fail_closed.sql`;
2. replace `core_tenancy.definition_applies_to_scope(...)` with the same owner hierarchy wrapped so any NULL/UNKNOWN result becomes false;
3. replace `core_tenancy.definition_contains_definition(...)` with the same hierarchy wrapped so any NULL/UNKNOWN result becomes false;
4. preserve signatures, IMMUTABLE classification, search path and PUBLIC revocation;
5. add verification `0048_definition_scope_fail_closed.verify.sql` proving:
   - PLATFORM applies to Tenant-Core and Tenant-Industry targets;
   - TENANT applies to same-Tenant Core/Industry and not foreign Tenant;
   - INDUSTRY applies only to exact same-Tenant Industry;
   - INDUSTRY→Tenant-Core is exact FALSE, not NULL;
   - INDUSTRY parent→TENANT child containment is exact FALSE, not NULL;
   - malformed/null comparison inputs fail closed;
   - `NOT definition_applies_to_scope(INDUSTRY → Tenant-Core)` is true, proving trigger-style rejection semantics.
6. change no table, RLS policy, role/grant, route or product behavior beyond restoring the already-declared fail-closed predicate semantics.

Expected inventory delta: 47→48 migrations and 41→42 SQL verification files. Core acceptance count remains 437; PostgreSQL Node acceptance remains 497.

## Explicitly unclaimed

DD-170 does **not**:

- define NotificationTemplate selection/rendering/locale fallback;
- authorize notification send/retry/provider execution;
- alter owner-scope hierarchy;
- add cross-context widening;
- change Identity/Authorization evaluation;
- modify existing rows;
- introduce a new table/index/role/grant/RLS policy;
- change AI/Workflow/Document business semantics beyond making their existing shared scope predicate total/fail-closed;
- widen machine-auth, Webhook, SyncCursor or Integration execution boundaries.

## Next dependency boundary

After DD-170 is migrated, verified, canonically promoted and state-synchronized, migration 0031's NotificationTemplate version/status/channel/scope relationship may be audited against the corrected total applicability predicate.
