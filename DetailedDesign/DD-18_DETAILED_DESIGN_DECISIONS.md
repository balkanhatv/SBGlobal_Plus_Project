# DD-18 — DETAILED DESIGN DECISIONS
**Status:** ACTIVE · **Wave:** 1+

Detailed Design decisions refine implementation contracts without redesigning certified Foundation/Architecture.

## DD-001 — Canonical context object is server-built and non-serializable as authority
**Context:** clients carry claims but cannot be the authority for tenant/industry/security context.  
**Decision:** server constructs `RequestContext` from verified identity/credential + membership + route/surface intent + server records. Clients may send selectors/claims, never a trusted complete context.  
**Alternatives:** trust client context; store opaque context blob.  
**Trade-offs:** more resolution queries/cache coordination; materially stronger isolation.  
**Consequences:** all protected entry points consume the same server-built context.  
**Risks:** resolver inconsistency.  
**Dependencies:** A-01/A-02/A-03; ADR-002/004.  
**Affected design:** DD-02/DD-03/DD-06/DD-07/DD-08.  
**Reversibility:** resolver internals can change without changing contract fields.

## DD-002 — Scope classification is mandatory metadata
**Context:** Industry Context can be optional only for genuinely Core/global resources.  
**Decision:** every service procedure, entity/table, event, document type, projection and worker handler declares one scope class: PLATFORM_GLOBAL, TENANT_CORE, TENANT_INDUSTRY, EXPLICIT_CROSS_CONTEXT, PUBLIC.  
**Alternatives:** infer scope from router/table name; make Industry Context universally nullable.  
**Trade-offs:** extra metadata; removes ambiguous null semantics.  
**Consequences:** missing classification fails design review; runtime guard generation can consume metadata.  
**Dependencies:** ADR-002/012.  
**Affected design:** DD-01/DD-02/DD-05/DD-06/DD-07/DD-08.

## DD-003 — UUID identifiers and immutable ownership keys
**Context:** multi-tenant/imported systems need collision-safe IDs and stable ownership.  
**Decision:** newly generated business IDs use UUID v7 semantics; ownership keys `tenant_id` and `industry_context_id` are immutable after creation. Moving a record across tenant/industry is a governed copy/transfer workflow, never an UPDATE of ownership.  
**Alternatives:** sequential IDs; mutable ownership.  
**Trade-offs:** wider keys; safer distributed creation and audit.  
**Consequences:** indexes use UUID keys; transfer events carry source/target.  
**Dependencies:** A-02/A-05.  
**Affected design:** DD-02/DD-05/DD-07.  
**Reversibility:** UUID generation algorithm may evolve while UUID database type remains.

## DD-004 — Permission names represent capabilities, not generic CRUD
**Context:** CRUD-only permissions cannot represent approval/publish/refund/verify business authority.  
**Decision:** naming grammar `<domain>.<ms-or-core-module>.<resource-or-capability>.<action>`; actions are domain capabilities. CRUD verbs are used only when business meaning truly is generic data maintenance.  
**Alternatives:** role hardcoding; CRUD matrix only.  
**Trade-offs:** larger catalog; auditable real business authority.  
**Consequences:** roles are templates of permissions; ABAC narrows grants.  
**Dependencies:** F-03; ADR-004.  
**Affected design:** DD-03 and all later industry DD.

## DD-005 — Entitlement snapshots are immutable versioned compiled facts
**Context:** clients/modules must not reinterpret plan/license policy.  
**Decision:** each compilation creates immutable `entitlement_snapshot` + child capability/limit facts; tenant points to current snapshot version.  
**Alternatives:** JSON-only mutable cache; evaluate plan tree on every request.  
**Trade-offs:** storage/history vs predictable/auditable access.  
**Consequences:** RequestContext stores snapshot ID/version; invalidation by version bump/event.  
**Dependencies:** F-14/A-04/ADR-007.  
**Affected design:** DD-04/DD-02/DD-03.

## DD-006 — RLS policy functions consume server-set transaction-local context
**Context:** RLS must not trust query parameters.  
**Decision:** application/worker establishes transaction-local tenant/industry/principal/elevation variables after verified RequestContext resolution; RLS predicates compare row ownership to those server-set values. Exact executable SQL belongs Development/migration generation, but predicate contracts are fixed in DD-05.  
**Alternatives:** ORM-only filter; user-supplied session vars.  
**Trade-offs:** connection/transaction discipline; final database enforcement.  
**Consequences:** every tenant-owned table must be registered in RLS catalog before implementation gate.  
**Dependencies:** ADR-002/018.  
**Affected design:** DD-05/DD-06/DD-07.

## DD-007 — API schemas project one domain command/query contract
**Context:** tRPC and REST cannot become duplicate business truth.  
**Decision:** each business operation has one canonical command/query schema and service contract; tRPC and REST are adapters/projections.  
**Alternatives:** separate REST and tRPC logic.  
**Trade-offs:** adapter discipline; eliminates drift.  
**Consequences:** error codes, validation, permission, event behavior identical across planes.  
**Dependencies:** ADR-005.  
**Affected design:** DD-06.

## DD-008 — Outbox envelope always carries explicit scope
**Context:** nullable Industry Context must not be ambiguous.  
**Decision:** event envelope contains `scopeClass`; `industryContextId` may be null only when scopeClass is PLATFORM_GLOBAL or TENANT_CORE. PUBLIC does not generate private domain events. EXPLICIT_CROSS_CONTEXT carries source + target context metadata.  
**Alternatives:** infer from event type.  
**Trade-offs:** slightly larger envelope; safer consumers/webhooks/projectors.  
**Consequences:** consumers validate event scope before processing.  
**Dependencies:** ADR-006/009/012.  
**Affected design:** DD-07.

## DD-009 — Document path is never authorization
**Context:** storage key prefixes are not a sufficient security boundary.  
**Decision:** signed URL issuance requires DocumentMeta ownership + ACL + context + residency + state checks through the normal access decision contract.  
**Alternatives:** path-prefix authorization.  
**Trade-offs:** metadata read per issuance; prevents leakage.  
**Consequences:** object store remains private.  
**Dependencies:** A-05; ADR-002.  
**Affected design:** DD-08.

## DD-010 — Audit events and operational logs are separate contracts
**Context:** diagnostic logging and evidentiary audit have different integrity/retention/access rules.  
**Decision:** `audit_event` is append-only business/security evidence; operational logs are external/telemetry streams with separate retention. Correlation IDs link them.  
**Alternatives:** one log stream for both.  
**Trade-offs:** two pipelines; correct evidence semantics.  
**Consequences:** deleting/rotating operational logs cannot erase required audit evidence.  
**Dependencies:** A-11.  
**Affected design:** DD-15.
