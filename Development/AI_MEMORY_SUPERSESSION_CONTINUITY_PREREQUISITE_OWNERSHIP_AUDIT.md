# AIMemoryRecord supersession-continuity prerequisite ownership audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-AI-MEMORY-ASSISTANT-CURRENT-BINDING-FLOORS-001`  
**Current remote HEAD basis:** `5e3a0cbc05a2efd6eb74278bdfa88cc93ea35221`  
**Last fully exact-head verified executable basis:** `c354aa1422c68a5e0ef2a2b96e28f6384da0e102`  
**Scope:** next independent source-complete AIMemoryRecord persisted-relationship prerequisite after DD-186.

## Source reconciliation

Migration 0012 AIMemoryRecord persistence, migration 0031 `validate_ai_relationships()`, DD-129 AIMemoryRecord raw reader, DD-186's explicit supersession exclusion, DD-09 §17 and the current PostgreSQL AIMemoryRecord raw-reader acceptance were reconciled.

For an AIMemoryRecord carrying optional `supersedes_id`, migration 0031 owns one deterministic persisted relationship predicate:

- if `supersedes_id` is absent, no superseded-parent relationship is required;
- if present, the id cannot equal the child AIMemoryRecord id;
- the referenced parent AIMemoryRecord must exist at exactly that id;
- parent and child must have the exact same Tenant id;
- parent and child Industry Context ids must be null-safe equal;
- parent and child principal ids must be null-safe equal;
- parent and child memory classes must be equal.

The trigger does **not** require the referenced parent to have status `SUPERSEDED`; does not require the child to be `ACTIVE`; does not compare created/expiry timestamps; does not traverse a chain; does not select a current/latest memory; and does not interpret content, source, sensitivity, retention, ACL or AssistantDefinition semantics.

The same trigger separately validates optional `principal_id` currentness and optional `assistant_definition_id` currentness. Those predicates are not part of this floor.

## Determination

One pure **AIMemoryRecord→optional superseded AIMemoryRecord exact owner/scope/class continuity necessary floor** is source-complete:

> Given one already-loaded AIMemoryRecord and optional already-loaded superseded-parent AIMemoryRecord evidence, determine only whether migration-0031's direct `supersedes_id` continuity relationship still matches.

A true result is **not current-memory selection, chain resolution, lifecycle transition validation, principal authorization, retention/ACL authority or AI execution authority**.

## Authorized DD-187 boundary

Implement:

`matchesAIMemorySupersessionContinuityFloors(memory, supersededMemory?)`.

It must:

1. require valid child AIMemoryRecord id and Tenant id UUIDs;
2. require child Industry Context id and principal id, when present, to be valid UUIDs;
3. require child memory class to be one of the persisted AIMemoryRecord classes;
4. when `memory.supersedesId` is absent:
   - require `supersededMemory === undefined`;
   - return true after child identity/owner/class validation;
5. when `memory.supersedesId` is present:
   - require it to be a valid UUID;
   - reject `memory.supersedesId === memory.id`;
   - require superseded-parent evidence;
   - require valid parent id and Tenant id UUIDs;
   - require parent Industry Context id and principal id, when present, to be valid UUIDs;
   - require parent memory class to be persisted/valid;
   - require exact `supersededMemory.id === memory.supersedesId`;
   - require exact same Tenant id;
   - require null-safe exact same Industry Context id;
   - require null-safe exact same principal id;
   - require exact same memory class;
6. fail closed for malformed relevant evidence or unexpected parent evidence on an unbound memory;
7. leave all inputs unchanged.

DD-187 must not silently infer lifecycle semantics that migration 0031 does not evaluate for this relationship.

## Acceptance target

- **AIMEM-SUP-CUR-001** — memory without `supersedesId` matches only with no parent evidence.
- **AIMEM-SUP-CUR-002** — exact direct parent with same Tenant/Industry/principal/class matches.
- **AIMEM-SUP-CUR-003** — self-reference, wrong parent id or missing required parent evidence fails closed.
- **AIMEM-SUP-CUR-004** — Tenant or null-safe Industry mismatch fails closed.
- **AIMEM-SUP-CUR-005** — principal mismatch, including null-vs-present mismatch, fails closed.
- **AIMEM-SUP-CUR-006** — memory-class mismatch or malformed relevant identity/owner/class evidence fails closed.
- **AIMEM-SUP-CUR-007** — status/content/source/sensitivity/retention/ACL/assistant/timestamps/expiry and deeper-chain evidence remain uninterpreted; inputs remain unchanged.

Expected Core delta: +7 tests, from 549 to 556. PostgreSQL acceptance remains 497; database inventory remains 48 migrations / 42 verification files.

## Explicitly unclaimed

DD-187 does **not**:

- validate memory principal currentness or acting-principal authorization;
- require the parent status to be `SUPERSEDED`;
- require child status `ACTIVE`;
- prove legal lifecycle transitions;
- traverse or resolve supersession chains;
- detect indirect cycles beyond the direct self-reference persisted predicate;
- decide current/latest/effective memory;
- compare parent/child chronology;
- evaluate expiry against wall clock;
- enforce retention/legal hold/erasure;
- interpret ACL policy;
- decrypt/dereference memory content/source;
- validate or select AssistantDefinition;
- carry Tenant-Core memory across Industry experiences;
- resolve prompt/RAG/model/provider/tool policy;
- execute inference/RAG/tools/agents;
- mutate AIMemoryRecord;
- change SQL/RLS/roles/grants/routes;
- widen machine-auth, Webhook, SyncCursor, Integration, Outbox, Notification, Workflow, Automation or Agent execution boundaries.

## CI note

The current state-sync HEAD `5e3a0cbc05a2efd6eb74278bdfa88cc93ea35221` has Core and Database success. Its Web Boundary run failed before runner allocation with zero executed steps, so that result is not treated as a code/test failure and is not used to widen this DD-187 boundary.

## Next dependency boundary

After DD-187, AIMemoryRecord optional principal currentness remains a separate migration-0031 persisted predicate and may be source-audited independently. Current-memory selection, retention/ACL and AI runtime semantics remain blocked.
