# Event Catalog exact-tuple PostgreSQL reader prerequisite ownership audit

**Date:** 2026-09-21  
**Baseline:** `8345254718d379b1bf3ad2f97727cdee505bf027`  
**Scope:** next independent source-complete Integration slice after DD-090.

## Source reconciliation

DD-07 §§3/14/16, DD-17 event-catalog acceptance, migration 0008
`event_catalog`, migration 0030 scope-tuple integrity, migration 0042 concrete
Commercial catalog rows, DD-081 `EventCatalogContract` and migration 0028
Integration-service read privileges were reconciled.

The catalog persistence contract is exact:

- identity is `event_type + event_version`; migration 0030 additionally makes
  `event_type + event_version + scope_class` an exact unique tuple for outbox FK use;
- event version is positive;
- scope is PLATFORM_GLOBAL / TENANT_CORE / TENANT_INDUSTRY /
  EXPLICIT_CROSS_CONTEXT;
- sensitivity is PUBLIC / INTERNAL / CONFIDENTIAL / SENSITIVE_PERSONAL / REGULATED;
- persisted metadata includes producer module, payload schema JSON, optional ordering
  key, consumer classes JSON, retention/audit posture, webhook eligibility,
  backward-compatibility declaration, ACTIVE/RETIRED status and createdAt;
- DD-081 consumes event type/version/producer/scope/sensitivity/payload schema as the
  authoritative catalog contract;
- ordinary runtime may SELECT catalog rows but catalog mutation is not part of the
  current runtime boundary;
- migration 0028 grants the Integration service role SELECT on `event_catalog`.

## Determination

A concrete **exact Event Catalog reader** is source-complete.

The catalog is global metadata rather than Tenant-owned data, so the reader does not
need RequestContext/RLS. It must execute through a governed read-capable database
role and require the exact event type/version/scope tuple supplied by server-owned
event processing.

The returned persisted entry is a structural superset of DD-081
`EventCatalogContract`, allowing the existing envelope validator to consume it
without a parallel catalog model.

## Authorized implementation boundary

Implement:

1. typed `PersistedEventCatalogEntry` extending DD-081 catalog fields plus the raw
   catalog metadata;
2. `EventCatalogReadPort.loadExact(eventType,eventVersion,scopeClass)`;
3. `PostgresEventCatalogStore` using the existing fixed-role Integration database;
4. exact parameterized tuple read;
5. exact enum/version/text/timestamp/JSON validation and immutable nested JSON;
6. null for an absent/mismatched tuple;
7. PostgreSQL acceptance proving exact tuple fidelity, RETIRED evidence preservation,
   scope mismatch non-match and malformed-input fail-closed behavior.

The reader does not execute the payload schema, decide compatibility, register or
retire events, select consumers, authorize webhook delivery or mutate the catalog.

No schema engine, catalog writer, migration, role, grant, route or event producer is
authorized.

Acceptance: EVT-CAT-PG-001…004.
