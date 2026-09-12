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


## DD-011 — One manifest-driven shell per application responsibility
**Context:** four surfaces require distinct responsibility while sharing identity/context/API contracts.  
**Options:** independent auth/navigation stacks; one monolithic UI; responsibility-specific shells consuming common contracts.  
**Decision:** public, platform, tenant-management and industry-experience shells remain distinct responsibility surfaces; authenticated navigation is manifest-driven from DD-02/03/04 inputs.  
**Trade-offs:** shared shell primitives require disciplined manifests but avoid security/business duplication.  
**Consequences:** no operational industry screens inside Tenant Management; UI hiding never replaces server authorization.  
**Risks:** navigation manifest drift.  
**Dependencies:** A-08, DD-02/DD-03/DD-06.  
**Reversibility:** route/layout implementation may change while responsibility boundaries remain.


## DD-012 — Context-partitioned local stores
**Context:** mobile/desktop offline data can leak between multiple tenant/industry memberships if one local cache is reused.  
**Options:** one shared local DB; clear-all on every switch; encrypted context namespaces.  
**Decision:** private local data is logically partitioned by tenant + explicit industry/core scope + principal, with active namespace switching and in-memory purge on context change.  
**Trade-offs:** more storage/index management; stronger isolation and resumable offline work.  
**Consequences:** pending mutations keep immutable origin context and never rebind.  
**Risks:** namespace cleanup bugs.  
**Dependencies:** DD-02/DD-05/A-08.  
**Reversibility:** physical storage engine may change without altering namespace contract.

## DD-013 — One offline replay contract for Mobile and Desktop
**Context:** Architecture requires one sync model across React Native and Tauri.  
**Options:** separate mobile/desktop queues; shared contract.  
**Decision:** DD-11 QueuedOperation/replay/conflict contract is authoritative for both channels; desktop adds native capability metadata only.  
**Trade-offs:** common constraints may limit channel-specific shortcuts; eliminates divergent security.  
**Consequences:** server reauthorization/idempotency behavior is identical.  
**Risks:** older clients with stale schema versions.  
**Dependencies:** DD-06/DD-11/DD-12.  
**Reversibility:** client storage implementation may vary.

## DD-014 — Native desktop capability allowlist
**Context:** Tauri web content must not inherit broad OS authority.  
**Options:** broad bridge; plugin defaults; explicit capability catalog.  
**Decision:** every native operation is a typed allowlisted capability with app-origin/device/context/policy validation.  
**Trade-offs:** more adapter definitions; materially smaller attack surface.  
**Consequences:** no generic shell/process/filesystem execution contract.  
**Risks:** missing capability may require later designed adapter.  
**Dependencies:** ADR-015/DD-03/DD-12.  
**Reversibility:** adapters can be added without widening existing capabilities.


## DD-015 — AI tools bind only to existing OperationContracts
**Context:** agent tools can become a parallel privilege/business-logic plane.  
**Options:** arbitrary tool handlers; direct DB/provider tools; OperationContract-backed tools.  
**Decision:** every stateful AI tool binds to an existing DD-06 OperationContract and is reauthorized as the acting principal at execution time.  
**Trade-offs:** less agent freedom; one business/security truth.  
**Consequences:** agent permission cannot exceed user/service principal; audit/idempotency/events remain identical to non-AI calls.  
**Risks:** overly broad OperationContract permissions.  
**Dependencies:** A-07, DD-03/DD-06.  
**Reversibility:** tool registry/model may evolve without bypassing operation contracts.

## DD-016 — AI provider fallback is policy-filtered before optimization
**Context:** naive fallback can violate residency/sensitivity rules.  
**Options:** health-first fallback; cost-first fallback; policy-filter then optimize.  
**Decision:** filter candidates by tenant/industry/sensitivity/residency/entitlement first, then choose by capability/health/cost/latency.  
**Trade-offs:** fewer fallback options; compliance/isolation preserved.  
**Consequences:** unavailable compliant provider can yield controlled failure instead of forbidden route.  
**Risks:** reduced availability in restricted regions.  
**Dependencies:** F-11/A-07/DD-09.  
**Reversibility:** routing scoring changes after mandatory filters.

## DD-017 — Integration secrets are references, never business-table plaintext
**Context:** many adapters need credentials with tenant/industry ownership.  
**Options:** encrypted credential columns; secret-manager references; provider SDK embedded secrets.  
**Decision:** business records store CredentialReference metadata pointing to environment/regional secret stores; service principals retrieve by purpose.  
**Trade-offs:** secret-store dependency; smaller database exposure.  
**Consequences:** rotation/version/access auditing standardized.  
**Risks:** secret-store availability.  
**Dependencies:** A-10/DD-06/DD-16.  
**Reversibility:** secret-store provider can change behind reference contract.


## DD-018 — Workload placement follows responsibility and residency, not one hosting product
**Context:** active stack includes Vercel and Coolify/Docker VPS; forcing all workloads to one creates runtime/residency conflicts.  
**Options:** Vercel-only; VPS-only; classified hybrid cells.  
**Decision:** public/suitable Next.js workloads may use Vercel; regional/data-bound API/workers/processing use governed Coolify/Docker cells as required; one logical Core remains.  
**Trade-offs:** hybrid operations complexity vs portability/residency.  
**Consequences:** routing/data-home contracts are deployment-independent.  
**Risks:** configuration drift.  
**Dependencies:** ADR-013/017/DD-14.  
**Reversibility:** workload can move between approved placements behind same contracts.

## DD-019 — Transaction-local RLS context with pooled connections
**Context:** pooled sessions risk context leakage.  
**Options:** session variables; per-tenant pools; transaction-local trusted context.  
**Decision:** set DD-05 RLS context transaction-locally after verified RequestContext; pool reuse never carries prior context.  
**Trade-offs:** transaction discipline; strong isolation with shared pools.  
**Consequences:** middleware/repository operations must be transaction-aware for tenant data.  
**Risks:** operations outside transaction.  
**Dependencies:** DD-02/DD-05/DD-14.  
**Reversibility:** pooler/provider may change.

## DD-020 — Cross-region availability never overrides residency
**Context:** failover automation can accidentally move prohibited data.  
**Options:** automatic global failover; no failover; policy-authorized destination set.  
**Decision:** region-local recovery first; cross-region only to pre-authorized destinations. If none, controlled unavailability is safer than illegal movement.  
**Trade-offs:** availability may be lower for restrictive tenants.  
**Consequences:** failover policy is tenant/contract/legal data.  
**Risks:** stale policy during incident.  
**Dependencies:** F-11/A-10/DD-14/DD-16.  
**Reversibility:** destinations can be expanded by governed policy.

## DD-021 — Security numeric controls remain configurable approved policy
**Context:** Wave 1 left rate/SLO/retention numbers intentionally open.  
**Options:** invent defaults; omit controls; define classes + approval-bound values.  
**Decision:** DD defines symbolic classes and policy fields; numeric limits/durations are approved configuration/contract values.  
**Trade-offs:** later operational input required; avoids fabricated enterprise commitments.  
**Consequences:** affected implementation can wire policy before values are approved, but production gate requires approved values where mandatory.  
**Risks:** delayed decisions.  
**Dependencies:** DD-14/DD-16/DD-REVIEW_REQUIRED.  
**Reversibility:** values/versioning are configuration.


## DD-022 — Vision-centric rate-limit defaults [DD-AC]
**Context:** shared DD defined symbolic rate classes but no implementation-ready defaults.  
**Options:** leave values to Development; one global limit; hierarchical configurable classes.  
**Trade-offs:** concrete defaults require later tuning, but remove developer invention and improve tenant fairness.  
**Decision:** use versioned rate policies with defaults: PUBLIC_LOW 30/min burst 10; PUBLIC_STANDARD 120/min burst 30; AUTH_STANDARD 600/min burst 120; ADMIN_SENSITIVE 60/min burst 15; AUTH_SECURITY 20/5min burst 5; BULK 30 submissions/hour concurrency 2/tenant; WEBHOOK 600/min/endpoint; AI 60/min concurrency 8/tenant; FILE_UPLOAD 60 starts/hour; API_CREDENTIAL 1200/min; TENANT_AGGREGATE 3000/min. Enforce IP/principal/credential/tenant scopes; tightest limit wins.  
**Consequences:** values are authoritative versioned security defaults. Tenant/plan configuration may set stricter limits or consume a documented scaling profile, but may not exceed the platform maximum ceilings without publishing a new SecurityRatePolicy version under security change-control. No separate unresolved human approval is required for the current defaults. Retry-After is returned for throttled requests.  
**Risks:** capacity tuning may change values.  
**Dependencies:** DD-06/DD-16/DD-15.  
**Reversibility:** high.

## DD-023 — Commercial lifecycle timing defaults [DD-AC]
**Context:** lifecycle semantics are fixed but retry/grace timing was open.  
**Options:** provider-defined ad hoc timing; no retry; versioned platform lifecycle policy.  
**Trade-offs:** platform defaults simplify behavior while markets/providers/contracts may differ.  
**Decision:** default failed-renewal policy: ACTIVE→GRACE on definitive failure; retries at +24h, +72h, +120h; notices at Grace entry, before retries and 24h before suspension; Grace duration 168h; unresolved Grace→SUSPENDED; default suspended preservation window 720h before expiry eligibility; successful settlement may reactivate according to policy. Renewed remains an event; PAST_DUE remains prohibited.  
**Consequences:** plan/market/provider/Enterprise contract may override timings through versioned policy without changing states.  
**Risks:** provider rules may require variant policy.  
**Dependencies:** F-14/DD-04.  
**Reversibility:** high.

## DD-024 — Platform audit-retention defaults [DD-AC]
**Context:** retention classes existed without numeric defaults.  
**Options:** no defaults; one universal duration; risk-based defaults.  
**Trade-offs:** longer retention costs storage; shorter retention weakens evidence.  
**Decision:** defaults: SECURITY_CRITICAL 7y; FINANCIAL_AUDIT 10y; ACCESS_DECISION 2y; ADMIN_CONFIGURATION 7y; DATA_GOVERNANCE 10y; AI_GOVERNANCE 2y; OPERATIONAL_STANDARD 90d hot and up to 365d archive. Legal hold, jurisdiction, contract and industry policy override. These are platform defaults, not statutory minimum claims.  
**Consequences:** destruction requires eligibility; pseudonymization may preserve required evidentiary skeleton; immutable evidence is append/supersede, not silent rewrite.  
**Risks:** jurisdiction-specific requirements need external validation.  
**Dependencies:** DD-15/DD-16.  
**Reversibility:** policy-versioned.

## DD-025 — OpenTelemetry-compatible observability and engineering SLOs [DD-AC]
**Context:** telemetry vendor/SLO ambiguity remained.  
**Options:** proprietary-only stack; defer; portable OTel model.  
**Trade-offs:** OTel collector operations vs portability.  
**Decision:** OpenTelemetry semantic model and Collector, with Prometheus/Grafana/Loki/Tempo-compatible defaults and managed equivalents allowed. Initial internal engineering availability targets: Public Website 99.90%; Authenticated App 99.90%; Transaction API 99.95%; Critical Transaction 99.95%; Worker/Queue 99.90%; Webhook 99.90%; AI Gateway 99.0%; Document Pipeline 99.90%; Data Home 99.95%. Error-budget fast burn pauses risky releases. These are engineering SLOs, not contractual SLAs.  
**Consequences:** vendor can change without changing telemetry contracts.  
**Risks:** telemetry cost/cardinality.  
**Dependencies:** A-11/DD-15/DD-14.  
**Reversibility:** high.

## DD-026 — Portable S3-compatible StoragePort default [DD-AC]
**Context:** physical object-storage selection remained open.  
**Options:** provider-specific storage; filesystem; portable S3-compatible abstraction.  
**Trade-offs:** abstraction limits provider-exclusive features but improves portability/residency.  
**Decision:** StoragePort is authoritative; AWS S3 is preferred managed-cloud profile and MinIO-compatible S3 storage is preferred regional/self-hosted profile. Private primary/quarantine/derivative/backup classes, encryption, versioning, SHA-256 checksums, lifecycle, signed URLs and residency rules are mandatory. Storage paths never authorize access.  
**Consequences:** provider may change without DocumentMeta/ACL changes.  
**Risks:** S3 compatibility differences require adapter conformance tests.  
**Dependencies:** DD-08/DD-14/DD-16.  
**Reversibility:** high.


## DD-027 — Recovery objective platform defaults [DD-AC]
**Context:** DD-14 defined recovery mechanics but numeric RPO/RTO remained avoidably open.  
**Options:** leave to Development; one universal objective; service-class defaults with governed overrides.  
**Trade-offs:** tighter objectives cost more infrastructure; class-based defaults balance resilience and cost.  
**Decision:** defaults: CRITICAL_TRANSACTION RPO ≤5m/RTO ≤30m; STANDARD_TRANSACTIONAL RPO ≤15m/RTO ≤60m; DOCUMENT_PIPELINE RPO ≤15m/RTO ≤4h; REBUILDABLE_PROJECTION inherits source-truth RPO and rebuild RTO ≤8h; PUBLIC_WEB stateless runtime RTO ≤60m. Enterprise contract, jurisdiction or approved plan policy may tighten them. These are internal engineering defaults, not contractual SLA claims.  
**Consequences:** backup cadence, replication, restore exercises and release gates consume a versioned RecoveryObjectivePolicy.  
**Risks:** high-scale/region/provider constraints may require a tighter or explicitly approved exception profile.  
**Dependencies:** F-11/A-10/DD-14/DD-15/DD-16.  
**Reversibility:** policy-versioned and high.


## DD-028 — SecurityRatePolicy authority [DD-AC]
**Context:** DD-022 contained concrete numeric defaults but also implied unresolved Security approval, creating contradictory certification evidence.
**Options:** keep an external approval blocker; remove ceilings; make the published DD policy itself the authoritative security baseline.
**Decision:** DD-022 values are the initial authoritative `SecurityRatePolicy v1`. Each class stores platform_default, platform_maximum_ceiling, minimum_security_floor, plan_scale_profile, tenant_override_bounds and risk_engine_multiplier. Tenant/plan overrides may be stricter; risk/abuse controls may always tighten; relaxing beyond the published maximum requires a new versioned security-policy decision, not an ad hoc runtime approval.
**Security floors:** AUTH_SECURITY may never exceed 20 attempts/5m/principal+network without a new policy version; ADMIN_SENSITIVE may never exceed 60/min/principal; FILE_UPLOAD may never exceed 60 starts/hour/principal; aggregate tenant limits never bypass per-principal/credential limits.
**Consequences:** current numeric defaults are resolved and implementation-ready; no hidden human approval dependency remains.
**Tests:** RATE-T001 stricter tenant limit wins; RATE-T002 weaker-than-floor override returns `POLICY_DENIED`; RATE-T003 abuse engine may tighten; RATE-T004 plan scaling cannot exceed platform ceiling; RATE-T005 all throttles return deterministic `RATE_LIMITED` + retry metadata.
**Reversibility:** high through policy versioning.


## DD-029 — Historical Fable 5 final recertification gate [DD-AC]
**Context:** the prior DD-COMPLETE gate was reopened because counts/status labels did not prove deterministic 41-MS behavior, requirement-level traceability or final-head isolation.
**Decision:** accept the fresh evidence set DD-20C, DD-20D, DD-21…DD-31 and the final ISOLATION_ATTACK_MATRIX evaluated at substantive HEAD `810e43c9c75e3750f52cc7e1954db8f341e6d79b`. Create checkpoint `DD-F5-RECERTIFIED`. Historical `DD-COMPLETE` remains provenance only.
**Gate result:** Fable P0=0; P1=0; REAL_DD_GAP=0; 41/41 MS PASS; 165/165 named KPI metrics mapped; RawSource/user requirement traceability REAL_GAP=0; Development determinism 9/9 YES; QA determinism 9/9 YES; final isolation PASS.
**Historical consequence at that evaluated HEAD:** Detailed Design was complete and Development was authorized as the next phase. This does not claim implementation, executable testing, security validation, production readiness or deployment.
**Reversibility:** any future material audit finding reopens the gate; historical evidence is never deleted.


## DD-030 — Shared definition lifecycle and safe-expression boundary [DD-AC]
**Context:** Phase-1/2 restored explicit Metadata, Rules/Policy, Form/Dynamic Fields, Country/Localization Pack and related shared-engine ownership.
**Decision:** all shared definitions use DRAFT→REVIEW→PUBLISHED→ACTIVE→RETIRED, scoped by owner/Tenant/Industry as applicable. Rule/Form/Metadata payloads are declarative only; arbitrary JavaScript, SQL, shell, dynamic import or equivalent executable payload is prohibited. One ACTIVE version per owner/code unless an explicit effective-dated owner contract states otherwise.
**Consequences:** publish/activate/rollback is auditable and deterministic; Industry modules consume Core definitions rather than private engines.
**Tests:** CFG-001…CFG-004.
**Dependencies:** ADR-019, DD-01, DD-05, DD-17.

## DD-031 — Country/localization-pack data boundary [DD-AC]
**Decision:** Country Packs are versioned reference/default bundles only. They may set locale/currency/timezone/date-number/language/address/phone/reference defaults, but may not grant permissions, entitlements, live Industry activation or arbitrary business-rule authority. Tenant activation is explicit and audited.
**Tests:** LOC-001/002.
**Dependencies:** F-04, A-01/A-05, DD-05/DD-17.

## DD-032 — AI provisioning/API/media/memory contract [DD-AC]
**Decision:** AIProvisioningSnapshot is the compiled entitlement/config capability boundary; all AI API classes traverse the AI Gateway; PromptTemplate versions use governed publication; AIMemoryRecord obeys Tenant+Industry+ACL+retention; generated media enters DD-08 DocumentMeta/provenance before governed publication/use.
**Tests:** AI-013…AI-017.
**Dependencies:** A-07/ADR-010, DD-08/DD-09/DD-17.

## DD-033 — Exactly-two Tenant mobile app classes [DD-AC]
**Decision:** canonical Tenant app classes are only TENANT_STAFF_APP and TENANT_USER_APP. Role/persona labels never become app classes/binaries. Platform Mobile is a separate Platform Application channel. Every mobile capability manifest declares one canonical appClass.
**Tests:** APP-009/013 plus DD-11 acceptance.
**Dependencies:** F-06, A-08/ADR-014, DD-10/DD-11/DD-17.

## DD-034 — Brand hierarchy and protected semantic-token floor [DD-AC]
**Decision:** brand resolution is Platform Brand → allowed Industry override → Tenant white-label override → user presentation preference. Protected security/accessibility semantic tokens and Platform product identity cannot be weakened/replaced by lower layers. Brand versions require preview/accessibility validation/review/publish/activate.
**Tests:** APP-010, BRAND-001/002.
**Dependencies:** F-06, A-08/ADR-011, DD-05/DD-10/DD-17.

## DD-035 — Future Industry promotion state machine [DD-AC]
**Decision:** use DD-13 FutureIndustryDefinition states DRAFT_FUTURE→FOUNDATION_READY→ARCHITECTURE_READY→DD_READY→APPROVAL_REQUIRED→APPROVED_FOR_PROMOTION→PROMOTED, with RETIRED as lifecycle exit. Only PROMOTED may enter Current Supported catalog, licensing and live Tenant Industry Context creation. Explicit user approval is mandatory before APPROVED_FOR_PROMOTION.
**Tests:** APP-011/012.
**Dependencies:** F-01, A-09/ADR-020, DD-13/DD-17.
