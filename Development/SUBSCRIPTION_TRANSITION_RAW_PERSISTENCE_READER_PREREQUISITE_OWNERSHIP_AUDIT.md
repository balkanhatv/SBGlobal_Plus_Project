# SubscriptionTransition raw persistence reader prerequisite ownership audit

**Date:** 2026-09-23  
**Baseline checkpoint:** `DEV-DATA-EXPORT-REQUEST-READ-001`  
**Baseline branch head:** `21bf3db684d11b1168301d4bd50e5447dcb08dbc`  
**Scope:** next independent governed continuation after DD-140.

## Source reconciliation

Freshly reconciled:

- `database/migrations/0004_commercial_entitlement.sql`;
- `database/migrations/0007_database_governance.sql`;
- `database/migrations/0009_database_roles.sql`;
- migration 0029 immutable ownership and append-style privilege hardening;
- migration 0030 same-Tenant Subscription reference hardening;
- migrations 0043–0047 Commercial transition/compiler and publication/evidence boundaries;
- `DetailedDesign/DD-05_DATA_MODEL_AND_DATABASE_DESIGN.md`;
- DD-064/DD-065/DD-078/DD-079 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md`;
- existing `PostgresDatabase` + `RequestScopedSql` application boundary;
- current DD-140 promoted state.

## Candidate determination

The next independently source-complete uncovered Core persistence slice is one exact `core_commercial.subscription_transition` row.

Migration 0004 owns:

- `id uuid PRIMARY KEY`;
- `tenant_id uuid NOT NULL`;
- `subscription_id uuid NOT NULL`;
- nullable `from_state` in `PENDING | TRIAL | ACTIVE | GRACE | SUSPENDED | EXPIRED | CANCELLED`;
- required `to_state` in the same vocabulary;
- raw `trigger_code text NOT NULL`;
- nullable raw `actor_principal_id uuid`;
- nullable raw `source_event_id uuid`;
- nullable raw `reason_code text`;
- `occurred_at timestamptz NOT NULL`;
- `correlation_id uuid NOT NULL`;
- uniqueness of `(subscription_id,source_event_id)` only when source-event id is present.

Migration 0004 applies FORCE-RLS using Tenant ownership only: `tenant_id = core_tenancy.current_tenant_id()`. Therefore the owning transition is visible from both Tenant Core and Tenant Industry contexts for that Tenant; sibling/foreign Tenant and PLATFORM_GLOBAL contexts do not gain visibility.

Migration 0030 upgrades `(tenant_id,subscription_id)` to a same-Tenant foreign key. Migration 0029 makes Tenant ownership immutable and revokes UPDATE/DELETE from ordinary app/worker roles. Migration 0043 then makes Commercial truth explicit: ordinary app/worker roles are readers only, while the dedicated `sbg_commercial_transition_compiler_rw` may SELECT + INSERT SubscriptionTransition but may not UPDATE/DELETE it. DD-064/DD-065 define this row as append-only publication evidence written inside the governed Commercial publication transaction.

The existing `PostgresCommercialPublicationStore` writes SubscriptionTransition as one step of atomic plan publication. It does not expose a raw exact read port. DD-141 therefore adds read-side observability/evidence only; it does not duplicate or alter publication.

No later migration adds a state-machine constraint requiring `from_state <> to_state`, a non-empty trigger/reason, actor/source-event presence, occurrence ordering, or current-Subscription binding. The current DD-065 publication path currently writes `from_state` and `to_state` from the pre-update Subscription state, so the raw reader must preserve equal states if persisted rather than inventing transition semantics.

## Authorized implementation boundary

DD-141 may implement only an exact-by-id immutable SubscriptionTransition persistence reader through existing `PostgresDatabase` + `RequestScopedSql` under the ordinary application read role.

Authorized returned evidence:

- `id`;
- `tenantId`;
- `subscriptionId`;
- optional raw `fromState`;
- raw `toState`;
- raw `triggerCode`;
- optional raw `actorPrincipalId`;
- optional raw `sourceEventId`;
- optional raw `reasonCode`;
- `occurredAt`;
- `correlationId`.

Validation remains physical-schema aligned only:

- UUID validation for ids/references;
- exact subscription-state vocabulary;
- raw text stays raw, including schema-valid empty trigger/reason values;
- nullable fields remain absent;
- timestamps must be valid persisted values;
- no from→to transition legality, current Subscription state, event existence, actor current membership, ordering, causality or replay semantics are inferred.

## Explicitly unclaimed semantics

This slice does **not** implement or authorize:

- Subscription state transition execution;
- plan-change assessment, route, remediation or approval;
- Subscription/PlanVersion mutation;
- entitlement compilation/publication;
- outbox/audit publication;
- source-event lookup/idempotency semantics;
- actor authorization or current membership validation;
- transition ordering, chain reconstruction or lifecycle legality;
- current/latest transition selection;
- billing/proration/payment semantics;
- rollback/reversal;
- mutation through the new port;
- public/API routes;
- migration/schema/verification SQL/role/grant/RLS/product-policy changes.

Existing DD-065 publication remains the write owner. Existing compiler role INSERT-only / no UPDATE-DELETE boundary remains authoritative.

## Acceptance expectations

1. exact Tenant SubscriptionTransition returns complete immutable raw evidence;
2. same-Tenant Core and Industry contexts see the same Tenant-owned transition;
3. foreign Tenant and PLATFORM_GLOBAL contexts cannot read the transition;
4. nullable actor/source-event/from-state/reason and schema-valid empty raw text are preserved;
5. equal from/to states and arbitrary occurrence chronology remain raw evidence and do not become lifecycle legality;
6. missing well-formed id returns `null`; malformed id and route/context mismatch fail closed;
7. ordinary app role is SELECT-only, compiler remains SELECT+INSERT/no UPDATE/DELETE, and the new port exposes no create/update/delete/list/latest/execute/authorize/replay/publish method.

Acceptance IDs: `SUBTRANS-PG-001` through `SUBTRANS-PG-007`.

Exact implementation-head Core/PostgreSQL/Database/Web CI must pass before canonical DD-141 traceability or state promotion.
