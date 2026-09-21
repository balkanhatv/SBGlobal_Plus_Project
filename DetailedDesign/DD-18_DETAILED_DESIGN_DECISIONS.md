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

## DD-036 — Database ownership is immutable and dependencies are same-scope [DEV-DB-AC]
**Context:** forced RLS constrained current visibility but did not prevent a privileged update from reclassifying ownership, and UUID-only foreign keys proved existence without proving Tenant/Industry agreement.
**Decision:** ownership/scope selectors are immutable after insert. Every cross-row dependency carrying Tenant/Industry semantics uses a composite same-scope FK or a fail-closed database trigger; null never broadens to sibling contexts.
**Consequences:** commercial, identity/authz, document, integration, workflow/notification and AI relationships reject foreign parent IDs before service logic can consume them.
**Tests:** DBA-001/002/006/007/009.

## DD-037 — Dedicated identity/control roles and bounded operator elevation [DEV-DB-AC]
**Context:** broad application grants and unpersisted operator-elevation semantics could bypass service ownership.
**Decision:** sensitive identity resolution and platform catalog mutation use separate `NOBYPASSRLS` Identity and Control Plane roles. Platform Operators receive no persistent tenant role/API credential; tenant access requires an active, independently approved, time-bounded elevation matching current principal, tenant and optional Industry Context.
**Consequences:** ordinary app/worker roles cannot read credential secrets, mutate global catalogs, create partitions, rewrite evidence or directly delete Industry rows. Restrictive write policies cover every `owner_scope` definition and its role/form/prompt/tool children; selecting `PLATFORM_GLOBAL` alone cannot confer Control Plane authority (migration/verification `0032`).
**Tests:** DBA-002/003/010/011.

## DD-038 — Event evidence carries exact cataloged physical scope [DEV-DB-AC]
**Context:** tenant/context columns without an explicit event scope and loosely checked JSON could disagree with the catalog or webhook delivery.
**Decision:** outbox physical columns, catalog triple and required envelope metadata are identical; cross-context rows name two distinct same-tenant endpoints. Webhooks become ACTIVE only after verification and delivery identity/detail tuples are exact.
**Consequences:** malformed or scope-confused evidence never becomes dispatchable; future partitions inherit the same policies.
**Tests:** DBA-004/005/011.

## DD-039 — AI PromptSet/ToolSet and generated-media provenance are physical contracts [DEV-DB-AC]
**Context:** assistant/agent/config fields referenced sets without physical owners, and generated media lacked the DD-08 provenance fields required for governed publication.
**Decision:** versioned scoped PromptSet/ToolSet plus member rows own bindings. Generated DocumentMeta records link the completed AIMediaRequest and registered provider/model with provenance/moderation/licensing evidence. Platform AI definition writes are Control Plane only; AI Gateway writes remain tenant/industry-scoped.
**Consequences:** prompt/tool escapes, model/provider mismatch and provenance-free generated assets fail closed.
**Tests:** DBA-008/009/010.

## DD-040 — Concrete SQL driver and truthful repository binding [DEV-CORE-AC]
**Context:** the Core kernel and driver-neutral SQL scope wrapper exist, but mock transactions do not prove PostgreSQL RLS or pool cleanup. Several runtime field shapes differ from DD-05, and compiled permissions / Industry presentation lack physical owners. State pointers still advertise a Database-only checkpoint.
**Decision:** map physical fields explicitly in DEV-CORE-MAP-001 before repository implementation. Align lifecycle enums with DD-05; reject mismatched membership/org evidence and stale workspace membership. Opaque restriction collisions deny until a schema-specific intersection exists. Bind RequestScopedSql to a trusted Data Home/region and optional dedicated Tenant; reject unknown/Public/generic cross-context scope before pool access. Implement SqlDatabase using one checked-out node-postgres client per transaction, fixed existing `sbg_app_rw`, forced RLS, explicit clearing of all five app scope/elevation variables, COMMIT/ROLLBACK, and safe cleanup. Reject privileged login/runtime roles; no Identity/Control Plane role elevation. Query handles expire when the callback finishes. SQL/connection errors become safe database errors; domain errors retain their semantics. Failed rollback/cleanup destroys the connection. Do not retry writes implicitly.
**Alternatives / trade-offs:** pool.query per statement is simpler but cannot preserve transaction-local isolation; rejected. Owner/superuser connections or BYPASSRLS are simpler for bootstrapping but weaken the runtime boundary; rejected. A new ORM increases dependency and mapping work with no current requirement; retain SQL-first pg adapter. Exact dependency pins plus lockfile improve reproducibility. Separate trusted directory/Identity/Authorization contracts preserve module ownership at the cost of explicit composition.
**Consequences / dependencies:** RequestScopedSql callers must supply server-resolved route metadata; transport callers cannot select a pool/region. Compiled permission and Industry presentation read adapters remain unbound until their exact contracts exist. No schema, business permission, Industry/MS count, provider baseline or production deployment changes. DD-02/03/05/06, A-02/A-05, F-03/F-11, existing migrations 0001–0032 and runtime role governance are dependencies.
**Acceptance:** existing Core suite plus stale-membership, foreign-org, restriction-widening and route/scope negatives; real PostgreSQL tests under a nonprivileged LOGIN with max-one-connection reuse, alternating tenants/industries, no-context reads, write rollback, leaked-handle rejection, SQL error redaction, unsafe-role rejection and connection cleanup failures. Core and Database CI must assert the actual branch commit. This is a bounded Development gate, not whole-product security certification.


## DD-041 — Compiled permission snapshot persistence and monotonic version [DEV-CORE-AC]
**Context:** DD-02/DD-03 require `permissionVersion` from the Authorization compiled permission set, but migrations 0001–0032 contain role/permission source rows only. Using MAX(version), auth_epoch, a constant or one role row cannot represent the exact effective permission set.
**Decision:** Authorization owns `core_authz.compiled_permission_subject` and immutable `core_authz.compiled_permission_snapshot`. A subject is one exact Tenant + optional Industry Context + principal + optional membership + optional OrgUnit + scopeClass tuple. The subject row carries the current snapshot pointer and monotonic current_version. A snapshot stores exact role_ids, schema-versioned `permission_set_json`, source_fingerprint, version and lifecycle status CURRENT/SUPERSEDED/INVALIDATED. Publication locks the subject row, marks the previous snapshot SUPERSEDED where present, inserts exactly one new CURRENT snapshot at `current_version+1`, then updates the subject pointer/version in the same transaction. Invalidation marks the current snapshot INVALIDATED and clears the pointer without decreasing the last issued version; the next compile uses last_version+1. Payload is immutable after insert; only lifecycle timestamps/status may change.
**Read semantics:** context/role readers match every subject selector with SQL `IS NOT DISTINCT FROM` semantics and read only the pointer's CURRENT snapshot. Missing, invalidated, ambiguous or mismatched scope returns no role context and fails closed as `DEPENDENCY_UNAVAILABLE`.
**Security:** both tables use forced Tenant/Industry RLS. `sbg_app_rw` receives SELECT only. No runtime writer role is introduced by this read-side slice; future Authorization compiler write authority requires its own explicit least-privilege role/policy decision. Migration/admin may bootstrap fixtures/DDL only.
**Acceptance:** tenant/sibling-industry RLS denial; current-pointer/version FK agreement; one CURRENT snapshot per subject; source/membership/org exactness; old snapshot ignored after version advance; application role cannot mutate subject/snapshot; RequestContext and roles query return the persisted current version/role IDs.
**Dependencies:** DD-02/03/05/040; A-02/A-03/A-05; migrations 0001/0003/0029–0032.

## DD-042 — Current Supported Industry presentation catalog [DEV-CORE-AC]
**Context:** `core_tenancy.industry_context` correctly owns Tenant activation but has no presentation fields, while RequestContext/workspace projection requires stable `displayKey/displayName`. A-09/DD-10 define a global Current Supported Industry catalog and prohibit treating Future Industry definitions as live activation metadata.
**Decision:** `core_master.current_supported_industry` is the global Control-Plane-owned presentation catalog. Key is canonical industry_code. Fields: display_key, display_name, route_slug, sort_order, icon_key, experience_package_key, presentation version, ACTIVE/RETIRED lifecycle and promotion_evidence_ref. Initial rows are exactly HLT/EDU/RTL/HSP/MFG/PSV/GOV/NGO/SFM using canonical suite names. Tenant activation continues to reference only industry_code; Tenancy composition merges activation with the ACTIVE catalog row without a cross-module SQL join. A future industry can enter this table only after DD-035 promotion and explicit Control Plane publication evidence.
**Security:** ordinary application role has SELECT only; `sbg_control_plane_rw` owns mutation; PUBLIC has no privilege. No Tenant override may redefine the canonical industry code or global product name; tenant branding remains DD-10 branding composition.
**Acceptance:** exactly nine ACTIVE baseline rows; unique code/displayKey/routeSlug/sortOrder; inactive/unknown code returns null; application role cannot mutate catalog; catalog read requires no Tenant context and does not expose Tenant data.
**Dependencies:** A-09; DD-10/13/26/035/040.


## DD-043 — Platform-global principal and machine-credential scope floor [DEV-CORE-AC]
**Context:** the Core RequestContext supports PLATFORM_GLOBAL, while tenant users/API clients and platform services share the same IdentityPort evidence shape. Without an explicit principal-type floor, a verified tenant human/API credential could be misclassified as platform-global before PDP integration.
**Decision:** protected PLATFORM_GLOBAL RequestContext accepts only (a) an interactive HUMAN evidence whose principal type is PLATFORM_OPERATOR, or (b) an unbound SERVICE machine credential whose principal has PLATFORM_GLOBAL in `allowed_scope_classes`. HUMAN and API_CLIENT machine credentials are always tenant-bound. Platform Operators never use API credentials. Any machine credential used for TENANT_CORE/TENANT_INDUSTRY must carry a fixed tenant binding. Request-context resolution enforces this before tenant/data/resource lookup; DB credential validation independently enforces the same persisted scope floor.
**Boundary:** this decision authenticates and scope-binds the principal only. It does not invent platform RBAC. Concrete platform PDP/ABAC permission evaluation remains part of the next governed Authorization integration slice; until then no transport may treat a PLATFORM_GLOBAL RequestContext by itself as an allow decision.
**Acceptance:** ordinary HUMAN→PLATFORM_GLOBAL denies; API_CLIENT→PLATFORM_GLOBAL denies; allowlisted unbound SERVICE succeeds; PLATFORM_OPERATOR interactive identity succeeds; unbound machine→tenant scope denies; persisted HUMAN/API_CLIENT null-tenant credential rejects.
**Dependencies:** DD-02/03/05/16/037/040; A-03; migration/verification 0034; Core RequestContext tests.

## DD-044 — Clerk human-session verification and internal session/device security epoch [DEV-CORE-AC]
**Context:** DD-03/DD-16 require Clerk-preferred provider verification, SessionVersion invalidation, device trust and fail-closed provider outages. Clerk session tokens provide signed provider/session identity, but SBGlobal authorization, Tenant membership, internal session epoch and device state remain server-owned. Provider token custom claims are not an acceptable current-authorization/session-version authority because they may refresh asynchronously.
**Decision:** the Clerk Identity adapter verifies the provider session token through the official backend-verification boundary with signature/issuer/expiry and configured authorized-party checks, requires the signed provider subject + session ID, then confirms the current provider session is ACTIVE and belongs to that subject. The ACTIVE `IdentityProviderLink(provider=CLERK, provider_subject)` resolves one ACTIVE internal HUMAN or PLATFORM_OPERATOR principal. The live provider session's creation time—not refreshed token `iat`—is compared with the exact internal `SessionVersion(principal_id, tenant_id IS NOT DISTINCT FROM request tenant)` row when present; a session created before `changed_at` is invalid. Missing SessionVersion means no additional internal scope epoch has been published yet; provider liveness remains mandatory. Tenant scope may carry a client-selected `deviceRegistrationId` only as an untrusted selector; server lookup must match device + principal + tenant. PENDING/REVOKED/missing device denies `DEVICE_UNTRUSTED`; RISK_HOLD requires `STEP_UP_REQUIRED`; TRUSTED contributes only normalized server risk/device evidence. Platform-global device policy is not inferred from the tenant-only DeviceRegistration table. Machine credentials remain on the separate governed credential path.
**Provider-strength rule:** Clerk `fva` second-factor age >= 0 maps conservatively to MFA. First-factor-only/absent `fva` maps to the baseline PASSWORD strength; SSO or PHISHING_RESISTANT is never inferred from `fva` alone and requires explicit verified provider-method evidence in a future compatible extension.
**Security boundary:** SBGlobal permissions, roles, entitlements, tenant/context and SessionVersion are never taken from Clerk custom claims. Clerk/provider outage, identity-directory failure or session-security-store failure is `DEPENDENCY_UNAVAILABLE`; invalid/inactive/mismatched provider session is `SESSION_INVALID`. The dedicated SQL boundary uses fixed `sbg_identity_service_rw`, NOBYPASSRLS, and clears any pooled application scope before identity reads.
**Acceptance:** ID-011…ID-016 plus real PostgreSQL identity-role tests. Existing ID-001…ID-010 remain unchanged. No transport, provider SDK package bootstrap, PDP/ABAC or Commercial completion is implied by this bounded slice.
**Dependencies:** F-03; A-03; DD-02/03/16/17/037/043; migrations 0003/0029/0031; Clerk backend session-token/session APIs.


## DD-045 — Fail-closed Authorization evaluator floor for persisted ABAC RESTRICT [DEV-AUTHZ-EVAL-001]

**Context:** DD-03 and the persisted `core_authz.abac_policy` model allow `DENY|RESTRICT`, while the current persisted row has no versioned restriction payload/reducer definition. The existing PEP accepts a `RESTRICT` decision when a concrete restriction set can be enforced; returning RESTRICT without such a set would be indistinguishable from ALLOW in practice. PLATFORM_GLOBAL also has no tenant commercial snapshot, while the legacy AccessDecision shape assumed an entitlement snapshot version.

**Decision:** The first concrete PDP evaluator is a fail-closed floor. RBAC is evaluated from the exact CURRENT compiled permission snapshot. ABAC never creates an allow. Matching DENY returns `DENY/ABAC_DENY`. Matching RESTRICT also returns `DENY/ABAC_DENY` until a separate governed, versioned restriction payload/reducer contract is approved and tested; the evaluator must not invent opaque restrictions. Tenant decisions require the current server-owned entitlement snapshot version; PLATFORM_GLOBAL decisions omit it. Supplemental ABAC facts are supplied only through a server-owned port and cannot override directly resolved principal/scope/resource/time facts. Missing non-`exists` attributes, stale permission version/role context, reader failure or invalid state fail closed as dependency unavailable. Base evaluation defers resource-attribute policies until resource resolution; resource evaluation re-reads current state and evaluates the full applicable policy set.

**Security consequences:** no ABAC grant expansion; no client-computed policy truth; no bare RESTRICT widening; no platform sentinel commercial version; policy changes that occur between base and resource checks can still narrow/deny at the resource check.

**Scope:** this decision does not add a restriction payload schema, compiler writer, commercial fact adapter, audit persistence adapter, transport, rate limiter, UI or deployment claim. Those remain later governed slices.

**Acceptance:** AUTH-001…AUTH-003 and AUTH-009…AUTH-014 plus direct evaluator negatives for malformed/missing facts and stale compiled-context versions.


## DD-046 — Fail-closed resource ownership / org / workflow rule port [DEV-AUTHZ-RESOURCE-RULE-001]

**Context:** DD-03 canonical evaluation step 10 and DD-17 AUTH-004/AUTH-005 require resource ownership/org and workflow business rules after RBAC/ABAC, but the current PEP exposes only a ResourceResolver and resource-level AuthorizationDecisionPort. No executable contract states how module-owned business rules narrow access, how missing rule state behaves, or how their failures are normalized. Inventing a generic rule DSL would conflict with suite-specific domain ownership.

**Decision:** Resource-bound operations must pass a server-owned `ResourceBusinessRulePort.validateCurrent({requestContext, operation, resourceDescriptor})` after exact resource resolution/context isolation and after resource-level PDP ALLOW/RESTRICT. The port is narrowing-only and may return only `allowed:true` or deny with `RESOURCE_SCOPE_DENY` / `WORKFLOW_STATE_DENY`. It cannot grant an operation denied by Commercial/RBAC/ABAC and it cannot change Tenant or Industry Context. A resource-bound operation with no rule adapter, adapter failure, or malformed result fails closed as non-disclosing `DEPENDENCY_UNAVAILABLE`.

**Denial normalization:** `RESOURCE_SCOPE_DENY` becomes opaque `RESOURCE_NOT_FOUND` while preserving the internal reason code and never revealing foreign/sibling resource existence. `WORKFLOW_STATE_DENY` becomes `RESOURCE_STATE_INVALID` with a safe message. The prior Authorization decisionId is retained for correlation. Non-resource operations do not require this port.

**Ownership:** every concrete adapter remains module-owned and must derive current server state from its authoritative repository/workflow model. The generic Core does not interpret suite-specific transition matrices, owner semantics, org hierarchy, arbitrary expressions or client-supplied workflow state.

**Scope:** this decision creates only the fail-closed PEP boundary. It does not claim all 41 MS rule adapters, a generic executable rule engine, durable authorization audit emission, enforceable ABAC RESTRICT payloads, DD-06 transport wiring, or UI.

**Acceptance:** DD-17 AUTH-004 and AUTH-005; explicit tests for order after resource PDP, missing adapter, adapter exception, malformed result, non-disclosing scope denial and non-resource bypass of the port.


## DD-047 — Durable final Authorization decision audit floor [DEV-AUTHZ-AUDIT-001]

**Context:** DD-03 requires every deny and every high-risk allow to produce authorization audit evidence, DD-15 declares audit persistence a correctness dependency for mandatory audit, and the existing evaluator marks current decisions `auditRequired=true`. The current GuardPipeline can deny at Commercial, PDP, resource-context, resource-rule, or restriction-composition stages, but no single final durable append boundary exists. Auditing intermediate base ALLOW decisions would create misleading success evidence when a later resource/workflow check denies.

**Decision:** Protected GuardPipeline evaluation emits exactly one final Authorization audit record after the complete guard chain. Final success is appended before success is returned. Every normalized guard denial is appended before the denial is returned. A direct PDP denial retains its exact AccessDecision metadata; pre-PDP Commercial/context/resource denials do not invent a PDP decision ID. Resource/workflow denials may reference the immediately preceding PDP decision ID for correlation while the audit outcome remains DENIED.

**Durability/failure:** the append uses the existing `core_audit.audit_event_identity` + partitioned `core_audit.audit_event` truth in one RequestScopedSql transaction under existing least-privilege application INSERT authority. Required audit append failure converts the access attempt to non-disclosing `DEPENDENCY_UNAVAILABLE`; no successful protected access may be returned after a mandatory audit failure. Unknown internal guard failures are normalized to dependency-unavailable before audit/return.

**Evidence minimization:** action/permission/module, actor/scope, safe resource type/id where already resolved, final outcome/reason, correlation/request/Data Home/region, PDP decision ID/policy IDs/version numbers and a restriction-present boolean may be recorded. Request bodies, tokens, Commercial fact values, restriction payload contents, workflow/resource content and other sensitive payloads are prohibited from Authorization audit evidence. Resource sensitivity is propagated only from the normalized ResourceDescriptor; an unknown declared sensitivity is conservatively stored as REGULATED.

**Scope:** this floor covers protected PLATFORM_GLOBAL/TENANT_CORE/TENANT_INDUSTRY GuardPipeline paths. PUBLIC is not a private RequestScopedSql path; EXPLICIT_CROSS_CONTEXT requires its dedicated governed repository and is not silently forced through a single-context audit writer.

**Acceptance:** AUTH-008 plus AUTH-015…AUTH-019: one final success audit, direct PDP denial metadata, pre-PDP denial without fabricated decision identity, resource/workflow final denial correlation, audit-write failure blocks success/remains fail closed, sibling-Industry audit visibility is zero, and runtime roles cannot mutate appended evidence.


## DD-048 — Deterministic RBAC source-to-snapshot compiler [DEV-AUTHZ-SOURCE-COMPILER-001]

**Context:** DD-041 and DEV-AUTHZ-COMPILER-001 provide immutable monotonic compiled-snapshot publication but intentionally accept an already-compiled Permission Set. Current source truth remains RoleAssignment / PlatformRoleAssignment → active RoleTemplate → RolePermission → active PermissionDefinition. Without a governed calculation algorithm, callers could invent effective permissions or silently widen scope.

**Decision:** the Authorization source compiler reads source truth through the dedicated `sbg_authorization_compiler_rw` role with SELECT-only access. Tenant compilation reads only ACTIVE/effective assignments for the exact target principal and exact physical scope: TENANT_CORE uses only null Industry assignments; TENANT_INDUSTRY uses only that exact non-null Industry Context. Null Tenant-Core assignment never means every Industry Context. Platform compilation reads only exact-principal PLATFORM_GLOBAL assignments. Active role-template scope must exactly match the target.

OrgUnit handling is conservative and explicit: an assignment with null `org_unit_id` is unscoped within its already-exact Tenant/Industry scope; a non-null OrgUnit assignment applies only when it equals the selected target OrgUnit. No ancestor/descendant inheritance is invented. A null membership assignment may apply to the principal; a non-null membership assignment requires the exact target membership.

Only RolePermission rows whose `version` equals the active RoleTemplate `version` participate. PermissionDefinition must be ACTIVE. Its scope_class must exactly equal the compiled snapshot scope or compilation fails closed. For a permission code, any explicit DENY wins across roles. Permission Set v1 cannot encode arbitrary `constraints_json`; therefore any non-empty constraint is compiled conservatively as DENY, never as an unconstrained ALLOW. ABAC and Commercial are excluded from RBAC grant calculation and can only narrow later.

The compiler canonicalizes assignment IDs, role IDs/versions and permission source rows, computes SHA-256 over that canonical source, then publishes only through the existing monotonic AuthorizationCompilerService. Invalid source attempts invalidate the existing current snapshot before returning a source-invalid failure; source dependency failure never fabricates a new snapshot.

**Security:** compiler source access is SELECT-only; source mutation remains prohibited. Platform assignment source read has a dedicated compiler-only PLATFORM_GLOBAL RLS policy. Tenant role-assignment read remains under existing exact Tenant/Industry FORCE RLS.

**Acceptance:** AUTH-020…AUTH-025 and database verification for compiler SELECT-only source privileges, exact Industry isolation, tenant-null no-industry-fallback, DENY precedence, constrained-ALLOW→DENY, deterministic fingerprint/publication, and no source mutation.


## DD-049 — Transport-neutral idempotency runtime boundary [DEV-API-IDEMPOTENCY-001]

**Context:** DD-06 defines REQUIRED/OPTIONAL/NONE idempotency and migration 0025 already owns `core_integration.idempotency_record`, but no runtime claim/completion service exists. The legacy RLS predicate also treated null Industry as visible from Industry-scoped sessions, which violates the project's rule that null never means all sibling contexts.

**Decision:** first-party tenant commands use one transport-neutral `IdempotencyService` before domain mutation. NONE bypasses persistence. OPTIONAL bypasses when no key is supplied. REQUIRED without a key fails deterministically. Only TENANT_CORE and TENANT_INDUSTRY COMMAND operations are supported by this physical table in this slice; PUBLIC, PLATFORM_GLOBAL and EXPLICIT_CROSS_CONTEXT require separately governed stores/entry paths if later needed.

The runtime never persists plaintext idempotency keys or request bodies. It SHA-256 hashes the key with a versioned domain prefix and hashes a server-produced canonical validated input together with operationId + inputSchemaVersion. The canonical source is produced only after schema validation; clients cannot submit an authoritative fingerprint.

Claim lifecycle under one scoped transaction: no row/expired row → IN_PROGRESS STARTED; same current key+same fingerprint IN_PROGRESS → IN_PROGRESS; SUCCEEDED → REPLAY of stored status/reference only; FAILED_RETRYABLE → atomically reclaims to IN_PROGRESS; FAILED_FINAL → FINAL_FAILURE; same current key+different fingerprint → IDEMPOTENCY_CONFLICT. Concurrent inserts use the scoped uniqueness key plus ON CONFLICT/re-read/row lock so at most one claimant starts.

Completion may transition only IN_PROGRESS to SUCCEEDED, FAILED_RETRYABLE or FAILED_FINAL and stores only bounded response status/reference metadata. No response body is persisted. Expired keys may reuse the same physical row with a fresh fingerprint/window after row lock.

**Isolation/privilege correction:** migration 0039 replaces the legacy nullable-Industry RLS predicate with exact scope-class semantics: TENANT_CORE sees only null Industry; TENANT_INDUSTRY sees only the exact current Industry Context. `sbg_app_rw` receives only SELECT/INSERT/UPDATE on the idempotency table and no DELETE.

**Actor key:** machine/API execution uses credentialId where present; otherwise the resolved principalId. Existing database actor-scope integrity remains authoritative.

**Scope:** no tRPC/REST adapter, rate limiter, domain mutation transaction coordinator, response-body cache, PUBLIC/platform idempotency, or cross-context idempotency is claimed.

**Acceptance:** API-IDEM-001…API-IDEM-008 plus real PostgreSQL exact-scope, actor integrity, concurrency and no-DELETE tests.


## DD-050 — Distributed SecurityRatePolicy v1 runtime [DEV-API-RATE-LIMIT-001]

**Context:** DD-022/DD-028 lock numeric SecurityRatePolicy v1 and DD-06 binds every OperationContract to a symbolic rate class, but no distributed runtime limiter exists. Architecture mandates WAF/bot/rate policy but does not mandate Redis or another limiter provider. Inventing a provider dependency would exceed the current technology contract.

**Decision:** Core owns a transport-neutral RateLimitService and a backend port. The first executable distributed backend uses PostgreSQL under a dedicated `sbg_rate_limiter_rw` NOLOGIN/NOBYPASSRLS role. It stores only SHA-256 bucket identities and operational token/concurrency state; raw IP, principal, credential, Tenant and Industry identifiers are prohibited from limiter tables. Ordinary app/integration/compiler/control-plane roles cannot read limiter state.

SecurityRatePolicy v1 combines the authoritative DD-022 sustained/security defaults with DD-06 §19's more specific burst and concurrency scopes. Where no separate larger scaling ceiling is published, the resulting v1 value is both the current default and maximum for v1. Tenant/plan/risk/abuse overrides may only tighten max requests, burst capacity or concurrency. A relaxation attempt returns POLICY_DENIED. No numeric HIGH-risk multiplier is invented; a server-owned override port may supply a stricter current risk decision.

**Algorithm:** token-bucket capacity uses DD-06 §19's published burst values while refill uses DD-022/DD-06 sustained requests/window. Concurrency scope is also taken from DD-06 §19: PUBLIC classes by IP; AUTH_STANDARD/ADMIN_SENSITIVE/FILE_UPLOAD by principal; AUTH_SECURITY by principal and IP; BULK/AI/TENANT_AGGREGATE by Tenant; WEBHOOK by endpoint; API_CREDENTIAL by credential. Applicable principal/IP/credential/Tenant/endpoint buckets are evaluated atomically in one transaction; the tightest denial wins. Tenant operations also carry TENANT_AGGREGATE and credential-backed requests also carry API_CREDENTIAL. Expiring lease rows prevent crashes from permanently consuming concurrency. All bucket rows are locked in hash order to avoid cross-bucket deadlock; no token/lease is consumed unless every applicable bucket can admit the request.

**Aliases:** DD-06 symbolic aliases map as AUTH_HIGH_COST→ADMIN_SENSITIVE, AI_COSTED→AI and WEBHOOK_ADMIN→WEBHOOK. EXTERNAL_WRITE is the DD-06 120/min class. Unknown rate classes fail as POLICY_DENIED.

**Throttle signal:** before returning RATE_LIMITED the shared service must emit a safe server-owned throttle signal containing only request/correlation IDs, scope class, operation ID, limiting class/dimension and retry seconds. A signal-emission failure stays fail closed as dependency unavailable. Production signal adapters must fan this contract into the governed security audit/operations metric pipelines; this slice does not invent a public/private audit-store bypass.

**Scope:** this slice is transport-neutral. It does not yet implement tRPC/REST response projection, Retry-After headers, WAF edge limits, production signal exporters, or provider-specific distributed caches. The service returns deterministic RATE_LIMITED + retry metadata for transport projection.

**Acceptance:** RATE-T001…RATE-T005 plus API-RATE-001…API-RATE-006: numeric v1 lock, strict-only override, opaque bucket state, concurrent atomic admission, public IP isolation, AI tenant concurrency/release and ordinary-role denial.


## DD-051 — Versioned schema registry + transport-neutral OperationContract executor [DEV-API-EXECUTOR-001]

**Context:** DD-06 requires tRPC and REST to project one canonical OperationContract and to share schema, authorization, idempotency, rate and domain semantics. The branch now has separate RequestContext, GuardPipeline, idempotency and rate runtimes, but no executable coordinator or versioned schema registry. Direct transport wiring at this point would duplicate ordering/error/replay behavior.

**Decision:** a server-owned OperationExecutor is the only shared execution kernel for future tRPC/REST adapters. The adapter supplies a route-bound operationId, raw input, authenticity/selectors, optional idempotency key and any already-verified rate subject (for example webhook endpoint identity). The executor resolves the canonical OperationContract and forcibly derives scopeClass from that contract; a client/adapter-supplied scope value cannot override it.

**Schema contract:** each operation/version pair registers server-code input/output parsers in OperationSchemaRegistry. Parser output must be JSON-compatible. The registry recursively normalizes it, sorts object keys and freezes the result; the resulting deterministic JSON string is the only idempotency request-fingerprint source. Resource references for resource-bound operations are extracted only from validated normalized input by the registered adapter. Missing schema/extractor, non-JSON parser output or version mismatch fails closed. No executable schema/rule code is loaded from tenant data.

**Execution order:** OperationContract lookup → DD-02 RequestContext resolution → input schema validation/canonicalization → DD-050 rate admission → DD-03/DD-04 GuardPipeline → command idempotency claim → exact declared domain-service handler → output-schema validation → idempotency completion → normalized execution result. Rate concurrency leases are released in cleanup on every admitted path.

**Replay/authorization:** idempotency replay, IN_PROGRESS and FINAL_FAILURE are explicit executor results rather than fabricated domain responses. Current RequestContext, rate admission and GuardPipeline always run before replay state is honored, so possession of an old key/reference never bypasses current Commercial/Authorization/resource policy.

**Domain dispatch:** OperationContract.domainService is resolved only through a server-owned DomainOperationRegistry; no reflection/eval/arbitrary import is permitted. A DomainOperationError may surface only when its code is explicitly declared by the OperationContract. An undeclared DomainOperationError normalizes to dependency-unavailable. Any otherwise unknown exception after a handler has been dispatched is treated as an ambiguous mutation outcome: dependency-unavailable but non-retryable, and a STARTED idempotency record is finalized rather than reopened for automatic retry.

**Mutation safety:** if domain execution or output validation fails after a STARTED idempotency claim, the executor records retryable/final failure according to the normalized safe error. If domain execution succeeds but idempotency success persistence fails, the executor fails the response but leaves the record IN_PROGRESS; it must not convert that state to retryable failure and risk duplicate mutation. Output-schema failure is final for that idempotency attempt. A concurrency-lease release failure after work completion does not rewrite a completed business result because leases expire; rewriting success could induce an unsafe duplicate command.

**Scope:** this decision is transport-neutral and does not implement tRPC routers, REST routes, concrete module schemas/handlers across all operations, domain transactions/outbox, or UI. Transport-specific HTTP/tRPC status/envelope projection remains downstream.

**Acceptance:** API-EXEC-001…API-EXEC-010: forced contract scope, deterministic canonical input, validated resource extraction, fixed execution order, current-policy replay, pre-guard throttle, guard-before-idempotency, declared-domain-only dispatch, output validation/idempotency completion semantics and cleanup behavior.


## DD-052 — Zod DTO single-source bridge + transport-neutral envelope projection [DEV-API-DTO-PROJECTION-001]

**Context:** A-06 §2 makes Zod DTO schemas the single source for tRPC validation, REST/OpenAPI and webhook payload schemas. DD-051 intentionally introduced a generic schema port so the execution kernel stayed library-independent, but concrete transport work cannot begin until the architecture-mandated Zod source is bound and the DD-06 response/error envelope is normalized once.

**Decision — DTO source:** implementation pins `zod@4.6.5` and introduces ZodOperationDtoRegistry. One exact `operationId + inputSchemaVersion + outputSchemaVersion` definition owns the Zod input/output schema objects. The same objects are retrievable for future tRPC/REST/OpenAPI projection and install an adapter into OperationSchemaRegistry for DD-051 execution. Version mismatch or missing definition fails closed.

Zod input parsing may apply only schema-declared normalization/default/transform behavior. The resulting parsed value still passes DD-051 JSON normalization/canonicalization before idempotency fingerprinting. Resource-reference extraction consumes the parsed/canonical input, never raw client input.

**Validation disclosure:** Zod input failure maps to INPUT_INVALID with optional fieldErrors containing only deterministic JSON-pointer-like field paths and normalized Zod issue codes. Raw rejected values, arbitrary parser messages, stack traces and schema internals are not surfaced. Output Zod failure remains OUTPUT_INVALID and never exposes field detail.

**Decision — projection:** TransportEnvelopeProjector is transport-neutral. EXECUTED maps to DD-06's canonical `{data,meta:{requestId,correlationId,operationId,version}}` success envelope. A-01 error classes are exactly `USER_ERROR | POLICY_DENIAL | ENTITLEMENT_DENIAL | SYSTEM_FAULT`; known access/commercial/system codes map deterministically and safe declared business errors default to USER_ERROR after DD-051 has already normalized unknown failures. Retry-after seconds remain projection metadata for an adapter/header and are not inserted into the canonical error object.

Idempotency REPLAY/IN_PROGRESS/FINAL_FAILURE remain explicit control projections rather than fabricated output-schema success bodies. Future transports must decide their wire status/behavior from this control result without rerunning the domain operation.

**Correlation:** a concrete transport must normalize/generate requestId/correlationId before invoking DD-051 and pass the same correlationId into RequestContext resolution and the error projector. This slice does not create a second correlation generator.

**Scope:** no tRPC router, REST route, OpenAPI generator or webhook route is implemented here. Generic OperationSchemaRegistry remains the kernel seam, but production API DTO definitions must originate from ZodOperationDtoRegistry to satisfy A-06.

**Acceptance:** API-DTO-001…API-DTO-007: same Zod object exposed to executor/transport; defaults/transforms canonicalize deterministically; safe field issue projection; version mismatch fail closed; canonical success envelope; explicit replay control; four error-taxonomy classes + separate retry metadata.


## DD-053 — First-party tRPC adapter floor [DEV-API-TRPC-001]

**Context:** A-06 makes tRPC the primary internal API plane for all first-party web/mobile/desktop/admin experiences, while REST/OpenAPI is external interoperability only. DD-051/DD-052 already provide the canonical executor, exact Zod DTO source and shared projection contract. A router that reimplements authentication, scope, rate, guard, idempotency or domain logic would violate the one-Core/two-plane architecture.

**Decision:** pin `@trpc/server@11.19.0` and create one server-owned first-party tRPC root. Each procedure binds a fixed OperationContract and must use the exact Zod input/output schema object already registered by ZodOperationDtoRegistry. The procedure calls OperationSchemaRegistry.prepareInput on the value already parsed by tRPC, so Zod defaults/transforms execute exactly once while DD-051 canonical JSON/resource-reference derivation still occurs in the shared schema registry. The executor receives the prepared input with exact operation/schema-version identity and rejects any mismatch.

**Transport context:** protected first-party context creation authenticates the Clerk/API credential through the existing IdentityPort before the procedure is invoked, normalizes/generates UUID request/correlation IDs, bounds selectors/transport metadata and then passes the original AuthenticationInput into DD-02 RequestContext resolution for authoritative current-context validation. This intentionally keeps the existing RequestContext security semantics; the preflight is an edge floor, not a parallel identity truth.

**Projection:** resolver success/control results use TransportEnvelopeProjector. OperationExecutionError is first projected through the shared DD-052 taxonomy, then only mapped to a tRPC transport code. RATE_LIMITED→TOO_MANY_REQUESTS, authentication→UNAUTHORIZED, policy/entitlement→FORBIDDEN, user input→BAD_REQUEST, conflict→CONFLICT and system faults→INTERNAL_SERVER_ERROR. The shared canonical error envelope and retry metadata are attached through the tRPC error formatter; routers do not invent a second business error taxonomy.

**Baseline real route:** the first bounded router is `core.identity.roles.listEffective`, using the existing OperationContract, a strict v1 Zod DTO pair, IdentityRoleQueryService binding and nested tRPC path `core.identity.roles.listEffective`. The router contains no business rule, database access, guard, rate or idempotency implementation.

**Scope:** no HTTP/Next.js tRPC request adapter, no broad Core/Industry router catalog, no REST/OpenAPI generation, no UI client integration and no deployment claim in this slice.

**Acceptance:** API-TRPC-001…API-TRPC-006: preflight authentication/correlation normalization; fixed route→OperationContract binding; exact registered Zod object; one-pass transform/canonical preparation; shared projection/error mapping; baseline Core procedure remains business-logic free.


## DD-054 — Physical first-party tRPC Fetch API handler boundary [DEV-API-TRPC-HTTP-001]

**Context:** DD-053 proves the first-party tRPC procedure plane but no physical HTTP/fetch adapter exists. The repository also has no Next.js application directory yet, so inventing a route location would couple Core transport code to an application structure that has not been bootstrapped. A-06 requires credential verification before request-body parsing, DD-06 locks Authorization/Idempotency-Key/X-Correlation-Id semantics, and DD-16 requires origin/host/size/CSRF controls without inventing their deployment-specific policy values here.

**Decision:** the first physical boundary is a reusable `createFirstPartyTrpcFetchHandler` around `@trpc/server/adapters/fetch`. It accepts an explicit endpoint + router and server-owned ports for Authorization resolution, edge policy, selector derivation and network facts. Those ports receive only method/URL/Headers metadata, never a Request body, so transport/authenticity processing cannot consume domain input before IdentityPort verification.

The handler normalizes request/correlation IDs first, executes edge-policy metadata checks, requires the DD-06 `Authorization` header, resolves it into the existing `AuthenticationInput`, derives only server-owned selector/network facts, and completes `IdentityPort` verification through the DD-053 context factory **before** calling tRPC's fetch handler. This is stricter than tRPC's default flow because upstream request-info parsing may inspect request input before createContext.

`Idempotency-Key` and advisory `X-Correlation-Id` are the only directly bound DD-06 metadata headers in this floor. Tenant/Industry authority is not taken from generic headers; a selector port may derive non-authoritative selectors from a governed host/path/session/workspace binding. Network/IP identity and webhook endpoint identity likewise arrive only through a trusted network port, never raw client authority.

Pre-tRPC authentication/policy failures return the canonical DD-052 error envelope directly with no internal detail, `Cache-Control: no-store` and normalized `X-Correlation-Id`. Once tRPC owns the request, responseMeta always emits the same correlation header and maps a shared RATE_LIMITED projection to HTTP `Retry-After`. tRPC batching is disabled in this bounded floor to reduce mixed-operation/context ambiguity; a future governed decision may enable it.

**Security seam:** origin/host/content-length/CSRF policy is mandatory through `FirstPartyTrpcEdgePolicyPort`, but DD-054 does not invent deployment-specific allowed origins or byte ceilings. The future Next.js route composition must supply that policy and the Clerk/API-credential Authorization resolver.

**Scope:** no guessed `app/api/trpc` file, no Next.js dependency/bootstrap, no Clerk-specific header parser, no REST/OpenAPI, no broad Core/Industry router catalog and no UI client.

**Acceptance:** API-TRPC-HTTP-001…005: real nested HTTP query success/correlation; invalid auth rejected before malformed body parsing; missing Authorization canonical 401; RATE_LIMITED Retry-After; edge-policy denial before auth/body handling.


## DD-055 — First-party Clerk Bearer + official Backend SDK bridge [DEV-WEB-AUTH-001]

**Context:** DD-054 has a physical first-party Fetch handler but intentionally leaves Authorization resolution and the provider-specific ClerkBackendPort to server composition. DD-03 already defines ClerkIdentityAdapter as the provider-specific IdentityPort and explicitly prohibits provider objects/claims from becoming business authorization truth.

**Decision:** the first-party internal plane accepts only the DD-06 human `Authorization: Bearer <token>` form in this slice. It does not infer or introduce a machine/API-key scheme. `FirstPartyClerkBearerAuthorizationResolver` performs bounded syntax extraction and returns only `AuthenticationInput{kind:HUMAN,credential}`; actual token trust remains exclusively inside IdentityPort.

`@clerk/backend@3.18.1` is pinned. `ClerkBackendSdkAdapter` implements the existing ClerkBackendPort with the official SDK: networkless `verifyToken` using a required JWT public key and non-empty `authorizedParties`, plus live Backend API `sessions.getSession` / `sessions.revokeSession` using the required secret key. Only signed default identity/session/factor-age claims are mapped into ClerkVerifiedSessionToken; custom Clerk claims are not admitted as Tenant, Industry, roles, permissions, entitlements or policy facts.

Token verification errors fail closed as TOKEN_INVALID. Session 404 maps to SESSION_NOT_FOUND; other Backend API failures map to DEPENDENCY_UNAVAILABLE. The existing ClerkIdentityAdapter then re-binds the verified Clerk subject to the internal PlatformPrincipal and requires a live active matching provider session before RequestContext can proceed.

**Scope:** no cookies, no Clerk UI/React/Next.js package, no machine/API credential scheme, no Tenant/Industry claims from Clerk, no Next.js route/bootstrap and no production secret values in source.

**Acceptance:** WEB-AUTH-001…006: exact Bearer syntax only; non-Bearer/machine-like schemes denied; JWT key + authorizedParties passed to official verifier; signed subject/session/fva mapping only; live get/revoke session mapping; invalid/missing/provider-outage fail closed without secret/error leakage.


## DD-056 — Trusted first-party web selector + edge/body policy [DEV-WEB-EDGE-001]

**Context:** DD-054 intentionally left selector derivation and origin/host/request-size/CSRF ownership as server composition ports. DD-02 keeps Tenant/Industry authority in RequestContext + membership/current Core state, while A-06/DD-16 require host/origin and request-size controls at the edge. Generic Tenant/Industry headers must not become authority.

**Decision:** first-party web selector derivation starts with an exact server-configured host binding. `ExactHostFirstPartySelectorResolver` maps an allowlisted canonical host to a non-authoritative Tenant selector and optional server-configured Industry/OrgUnit defaults. It reads the normalized request URL host only; headers such as `X-Tenant-Id` or `X-Industry-Context-Id` are ignored. RequestContext still resolves the Tenant against the authenticated principal/membership and resolves any Industry Context under that Tenant.

`ConfiguredFirstPartyWebEdgePolicy` enforces HTTPS, exact allowed hosts, GET/POST only, same-origin/allowlisted Origin when Origin is present, `Sec-Fetch-Site: cross-site` denial, optional declared Content-Length ceiling and JSON content type for POST. Allowed hosts/origins and body ceiling are required server configuration; no production domain/value is invented in source.

Because browsers/proxies may omit Content-Length, metadata checks are not treated as the hard body cap. `BoundedFirstPartyTrpcBodyPolicy` runs only after DD-055 authentication succeeds and before tRPC input parsing. It streams the Request body with a hard byte ceiling, rejects overflow with canonical 413, then rebuilds the Request with the bounded body for native tRPC parsing. This preserves A-06's authentication-before-body-parsing rule while providing an application-layer cap independent of Content-Length. Deployment/reverse-proxy limits must be equal or tighter.

**CSRF:** this first-party floor uses explicit Bearer authorization rather than cookie authentication, so no new anti-CSRF token is invented. Browser requests that provide Origin/Sec-Fetch-Site must satisfy the exact server policy. A future cookie-authenticated surface must implement DD-16's SameSite + origin/host + token controls separately.

**Scope:** no dynamic user-selected Industry cookie/session store, no Next.js route/bootstrap, no production hostname/origin values, no REST/OpenAPI and no broad router catalog.

**Acceptance:** WEB-EDGE-001…006: exact host→selector binding; generic tenant/industry headers ignored; unknown/cross-site host/origin denied; declared oversize denied pre-auth; undeclared streamed oversize denied post-auth/pre-parse; bounded same-origin request passes.


## DD-057 — Pre-context Tenant directory bootstrap [DEV-CONTEXT-BOOTSTRAP-001]

**Context:** DD-02 resolves authentication → candidate Tenant → membership → Industry/OrgUnit → DataHome before any tenant-scoped application SQL transaction can exist. The verified RequestContextService already depends on TenantContextPort, but the server tree had no concrete PostgreSQL implementation. Wiring a Next.js route with an in-memory/fake TenantContextPort would make the first physical web composition non-production-shaped and would violate A-10's server-owned DataHome routing rule.

**Decision:** add a dedicated `sbg_context_bootstrap_ro` NOLOGIN/NOBYPASSRLS role and `PostgresContextBootstrapDatabase`. The role is SELECT-only over exactly DataHome, Tenant, Industry Context, OrgUnit, Tenant Membership and Current Supported Industry presentation truth. It has no access to provider links, API credential secrets, device/session-security tables or PlatformPrincipal directory and no mutation rights.

Because this is a pre-context read boundary, narrow SELECT RLS policies admit only `sbg_context_bootstrap_ro` on Tenant, Industry Context, OrgUnit and Tenant Membership. It is not granted BYPASSRLS. Once DD-02 resolves Tenant/DataHome, all business reads continue through the already verified scoped application SQL boundary.

`PostgresTenantContextAdapter` implements the full TenantContextPort:
- human no-selector resolution succeeds only when exactly one effective ACTIVE membership exists;
- principals with multiple memberships require explicit deterministic selector;
- selector may resolve Tenant UUID or tenant_code but never a Tenant without current membership;
- machine-bound Tenant resolution cannot switch away from the verified bound Tenant;
- Industry selector is scoped to the resolved Tenant and may use exact Context UUID, industry code, active display key or route slug;
- OrgUnit selector resolves exact Tenant UUID/code and derives the root→leaf UUID path server-side; absent selector may use the verified membership default;
- DataHome comes only from the Tenant directory and must be ACTIVE with a positive routing version.

**Scope:** this is directory/bootstrap truth only. It does not authorize business operations, compile permissions, expose identity secrets, create dynamic host bindings or replace DD-02 membership/Industry validation.

**Acceptance:** CTX-BOOT-001…006 plus migration 0041 verification: multi-membership ambiguity; membership-bound selector; exact sibling-Industry isolation; server-derived OrgUnit path; DataHome route; least-privilege/no-sensitive-read proof.


## DD-058 — Concrete first-party Next.js composition

**Registry reconciliation (2026-09-20):** this stable ID was already defined by DD-06 §28 and WEB-COMP-001…007, but was absent from this decision index. This entry records that existing contract; it does not introduce a new implementation slice.

**Context:** the verified Core/Identity/Commercial/Authorization/transport adapters require one production composition owner under the active Next.js 15 baseline.

**Decision:** DD-06 §28 owns the server-only composition and thin Node-runtime App Router route; deployment secrets, host bindings and DataHome are required configuration. Reuse one OperationExecutor and guard chain. Separate Core emit configuration from Next generated types.

**Audit comparison / trade-offs:** route-local reimplementation duplicates security authority; a second backend increases deployment and maintenance dependencies without a justified boundary; composing the existing adapters preserves one Core at the cost of explicit configuration and package/build compatibility checks.

**Consequences / dependencies:** F-01/F-03, A-01/A-03/A-06/A-08 and DD-02/03/04/06 remain owners. `first-party-web-composition.ts`, the App Router route, composition tests and Web Boundary Verify realize this contract. UI, REST and production deployment are separate scopes.

## DD-059 — Tenant workspace query reuses server-resolved context

**Registry reconciliation (2026-09-20):** existing DD-06 §29 and WS-BOOT-001…007 own this ID; this entry repairs its missing central reference.

**Context:** first-party clients need a sanitized workspace projection without gaining authority to select a Tenant through DTO fields.

**Decision:** `core.tenancy.workspace.resolve` is a guarded TENANT_CORE query. Its optional Industry selector is evaluated only within the already-resolved Tenant; WorkspaceService revalidates current membership and returns the existing ClientWorkspaceContext.

**Audit comparison / trade-offs:** trusting a DTO tenantId bypasses the context boundary; returning full persistence rows leaks internal authority. Reusing the existing service costs a current-membership read but preserves isolation and a single projection contract.

**Consequences / dependencies:** F-03, A-02/A-03/A-06, DD-02/DD-06, WorkspaceService, the Core tRPC router and workspace/transport tests form the chain. This query never grants Industry access or enables an Industry.

## DD-060 — Client-safe current Commercial projection

**Registry reconciliation (2026-09-20):** existing DD-04 §12, DD-06 §30 and COMM-UI-001…007 own this ID; this entry repairs its missing central reference.

**Context:** the current-entitlements UI query needs effective facts without raw license, subscription or internal authorization records.

**Decision:** `core.commercial.entitlements.getCurrent` uses a strict empty DTO and the shared guarded TENANT_CORE query path. Return only snapshotVersion, subscriptionState and sorted enabled non-denied `{code,valueType,value}` facts after exact current-snapshot revalidation.

**Audit comparison / trade-offs:** serializing the internal read model exposes persistence and licensing details; deriving access from client plan data creates competing authority. A module-owned projection adds validation work but keeps current server truth and safe client data separate.

**Consequences / dependencies:** F-14, A-04/ADR-007, DD-04/DD-06, CommercialCurrentStateService, the tRPC router and Commercial/transport tests own the implementation. Restricted-state recovery and public changePlan remain separate, unfinished work.

## DD-061 — Change-plan transport contract is corrected; direct mutation remains gated

**Context:** DD-06 originally placed `idempotencyKey` inside the `core.commercial.subscription.changePlan` DTO even though DD-049/DD-054 already established transport-owned idempotency metadata. F-14 also requires route-specific checkout/payment or order/approval before a plan version changes, mandatory downgrade impact/remediation, and atomic entitlement recompilation. The current repository has no Billing/proration runtime, plan-change resolution evidence contract, write-side Commercial compiler, cataloged Commercial events, or dedicated least-privilege Commercial mutation role.

**Decision:** The command uses REQUIRED shared idempotency; `Idempotency-Key` is not a DTO field. `effectiveTiming` is exactly `IMMEDIATE | NEXT_RENEWAL`, derived from F-14's immediate vs next-cycle rule. No direct Subscription plan-version mutation may be implemented until a server-owned route-resolution/evidence contract, downgrade impact/remediation contract, Billing/proration handoff, immutable entitlement compiler/publication boundary, cataloged outbox events and dedicated least-privilege write path are deterministic and testable.

**Consequence:** Development must close prerequisite contracts/boundaries first. No payment/approval result, proration amount, entitlement diff, event payload, or writer privilege may be guessed inside a transport/domain handler. This preserves F-14 atomicity and A-01's one Core enforcement chain while preventing a partially implemented plan change from widening or corrupting access.


## DD-062 — Plan change is a governed request; apply authority is server-owned evidence

**Context:** F-14 requires impact preview, route-specific checkout/payment or order/approval, downgrade remediation and then entitlement recalculation. The repository has generic Workflow persistence but no Billing/payment/proration runtime. Treating the existing `changePlan` DTO as permission for an immediate Subscription UPDATE would invent missing financial/approval semantics and bypass F-14's order of operations.

**Decision:** `core.commercial.subscription.changePlan` is the externally idempotent request/orchestration entry point. Client input is limited to `subscriptionId,targetPlanVersionId,effectiveTiming,expectedVersion`; the server derives source PlanVersion, `SELF_SERVE|SALES_ASSISTED` route, impact/remediation state and route-resolution requirements. Apply authority comes only from immutable/versioned server-owned assessment + remediation + Billing/approval evidence bound to the exact Tenant/Subscription/source/target/timing/version tuple. `NEXT_RENEWAL` effectiveAt is server-owned evidence. No client payment/approval reference or clock value is authority.

**Apply invariant:** Subscription mutation is a separate internal transition and remains blocked until current version/source-plan checks, impact/remediation, route resolution, target validity, entitlement compilation/publication and outbox/audit all succeed under the dedicated write boundary. Request/evaluation alone never changes the current Subscription or entitlement snapshot.

**Consequence:** DD-061 CP-03/04/05 are contractually closed without inventing provider/proration formulas. Physical evidence persistence/Billing producer runtime still must be implemented before direct apply; Commercial event catalog and least-privilege compiler writer remain the next blockers.


## DD-063 — First Commercial events are internal, catalog-first, minimal v1 contracts

**Context:** DD-061 identified that plan-change apply cannot safely emit an uncataloged event. DD-07 requires event type/version/scope/payload to be registered before outbox insertion, while A-04 names `subscription.transitioned` and `entitlement.recompiled` as the Commercial→compiler/cache/notification signals.

**Decision:** Version 1 of both events is TENANT_CORE, producer `Commercial`, sensitivity `INTERNAL`, and not webhook-eligible. `subscription.transitioned` carries only transition/subscription/state/PlanVersion/version/effective-time evidence plus optional plan-change/reason references. `entitlement.recompiled` carries only snapshot identity/version/source references and valid-from time. Neither payload carries entitlement facts, raw licenses/deny sets, monetary calculation, payment instrument/provider secret, or raw approval payload.

**Physicalization:** migration 0042 seeds the exact event-catalog rows; verification 0042 asserts schema metadata and keeps ordinary application runtime catalog access read-only.

**Consequence:** CP-07 is closed at catalog-contract level. A future Commercial writer/compiler may only emit these exact versions until a governed incompatible event version is published. This decision does not yet authorize Subscription mutation or snapshot publication.


## DD-064 — Commercial apply/compiler uses a dedicated no-bypass database writer

**Context:** migration 0009 historically gave `sbg_app_rw` broad Commercial DML. DD-061 requires a least-privilege writer before plan-change apply can exist. A TENANT_CORE entitlement compile also needs same-Tenant reads across all enabled Industry Contexts, while ordinary Industry-scoped RLS intentionally narrows to one active Industry.

**Decision:** introduce `sbg_commercial_transition_compiler_rw`, NOLOGIN/NOBYPASSRLS. Revoke Commercial mutation from general app/worker roles. The dedicated role receives explicit catalog/source reads, column-limited Subscription plan-version/version/timestamp update, append-only transition/snapshot-fact writes, snapshot insert + status-only lifecycle update, and restricted Commercial outbox/audit append. Additional SELECT policies allow this role to read license/override/usage/snapshot-fact rows across Industry Contexts only when `tenant_id=current_tenant_id()`; sibling Tenant access remains impossible.

Outbox uses an additional RESTRICTIVE policy for this role so it can emit only DD-063 v1 `subscription.transitioned` and `entitlement.recompiled` as TENANT_CORE events. Audit uses a corresponding RESTRICTIVE Commercial/TENANT_CORE policy.

**Consequence:** CP-08 is physically closable without BYPASSRLS or broad application DML. The role still does not authorize domain mutation by itself: DD-062 evidence, deterministic compiler logic, atomic publication/outbox/audit and Billing/approval producer runtime remain required.


## DD-065 — Public changePlan remains separate from verified atomic publication

**Context:** DD-062 defines server-owned assessment/remediation/Billing/approval authority; DD-063/064 provide event contracts and a least-privilege writer. The remaining CP-06 blocker was an executable atomic Subscription + entitlement snapshot + outbox/audit publication path.

**Decision:** implement an internal SERVICE/TENANT_CORE `CommercialPublicationService` and dedicated PostgreSQL store. The service accepts only normalized, already server-validated compiled publication input and server-generated IDs. The store re-locks Subscription/current snapshot, checks expected versions/source PlanVersion, revalidates target PlanVersion and fact definitions/Industry ownership, then writes Subscription transition, immutable snapshot/facts, two cataloged outbox events and Commercial audit in one transaction.

**Isolation:** a dedicated fixed-role database adapter uses `sbg_commercial_transition_compiler_rw`; migration 0044 gives only same-Tenant Tenant-record SELECT for authoritative residency. General application roles remain non-writers.

**Consequence:** CP-06 is closed and the atomic apply/publication primitive is executable/tested. This does not close CP-03/04/05 runtime evidence: the public `core.commercial.subscription.changePlan` must remain unbound until persisted/versioned assessment/remediation evidence and Billing/approval SATISFIED producer evidence can authorize a call into this primitive.


## DD-066 — Plan-change evidence is append-only, version-bound and producer-isolated

**Context:** DD-062 locked the authority model but its assessment/remediation/route-resolution objects were not persisted. DD-065 can atomically publish a validated plan transition but must not trust caller-supplied payment/approval/remediation claims.

**Decision:** physically persist `PlanChangeAssessmentV1`, remediation evidence and route resolution in TENANT_CORE FORCE-RLS tables. Assessment insert revalidates the live Subscription/source PlanVersion/version and target route. Versions are contiguous; the source/target/timing/version tuple cannot drift within an assessment id. Remediation completion is evidenced separately, and a SATISFIED reassessment requires that prior evidence. SELF_SERVE route resolution is writable only through a dedicated Billing role; SALES_ASSISTED only through the Workflow worker. General application roles and the Commercial publication writer cannot produce these records.

**Runtime:** `PlanChangeEvidenceService` is SERVICE/TENANT_CORE-only and fixes producer ownership by method rather than input. Dedicated fixed-role PostgreSQL adapters preserve no-bypass least privilege and pooled-scope hygiene.

**Consequence:** DD-062 evidence persistence and producer isolation are executable/tested. This does not claim that impact/diff calculation, payment/proration/provider integration or approval decision runtime exists; those producer computations remain required before public `changePlan` can reach DD-065 publication.


## DD-067 — PlanVersion source JSON is explicit, versioned and marker-complete

**Context:** F-14 requires every plan dimension to carry a configured value or explicit unlimited/not-included/add-on marker. A-04 names PlanVersion dimensions and compiled feature/limit maps, but DD-04 and migration 0004 previously stored `entitlement_template_json` / `limit_set_json` as merely “schema-versioned” without an executable schema. Building an impact evaluator against guessed JSON would be unsafe.

**Decision:** v1 entitlement templates are exact `{schemaVersion:1,facts[]}` documents using canonical Commercial value types, governed scope selectors (`TENANT | LICENSED_INDUSTRIES | INDUSTRY_CODE`) and grant markers (`INCLUDED | NOT_INCLUDED | ADD_ON_ONLY`). v1 limit sets are exact `{schemaVersion:1,limits[]}` documents with the same scope selectors and `FINITE | UNLIMITED | NOT_INCLUDED | ADD_ON_ONLY` modes. FINITE alone carries a numeric value.

The executable parser rejects unknown versions/fields, duplicate scoped keys, marker/value conflicts, invalid Industry codes, invalid value types and bounded-set violations, then returns deterministic sorted immutable output.

**Consequence:** future target-preview/impact compilation has one safe PlanVersion source contract and must not read arbitrary JSON directly. This decision defines representation, not actual per-plan commercial values, and does not move pricing/proration into Commercial.


## DD-068 — PlanVersion baseline expansion never substitutes for Industry licensing

**Context:** DD-067 gives PlanVersion JSON one deterministic shape, but F-14 requires Plan → License → Entitlement rather than Plan-alone access. A compiler that expands Industry-scoped template facts without checking licenses would violate the effective-access chain.

**Decision:** baseline expansion resolves TENANT once and Industry selectors only into ACTIVE same-Tenant Industry Contexts with an effective INDUSTRY license. `LICENSED_INDUSTRIES` and `INDUSTRY_CODE` are selectors, not grants. Inactive Contexts are omitted. A stale license reference fails closed. If different selectors resolve to the same scoped entitlement/limit key, the compiler reports ambiguity rather than inventing an ungoverned winner.

All DD-067 markers are preserved so later add-on/override/impact stages can reason from explicit baseline semantics.

**2026-09-20 targeted correction:** the inventory uses DD-05's complete `PENDING | ACTIVE | SUSPENDED | DISABLED` lifecycle. PENDING is valid but ineligible for expansion; rejecting the whole inventory for a pending Context was an implementation defect. Unknown lifecycle values still reject. COMM-PLAN-BASE-009 covers this distinction.

**Consequence:** the first compiler stage is deterministic and license-safe. It is not the final entitlement preview: add-on, override, compliance/security and usage-impact precedence remain downstream.


## DD-069 — Add-on v1 is quota-additive only; scoped DENY is a disabled fact

**Context:** F-14 says overlapping add-ons sum only for metered quotas and that explicit deny wins. Persistence had generic `add_on.entitlement_delta_json` and untyped `tenant_override.value_json`. A broad add-on parser would invent semantics not present in the governing source. Separately, the current snapshot has a Tenant-wide `deny_set_json` while snapshot facts may be Industry-scoped; using the global deny set for an Industry override would leak that denial into sibling Industries.

**Decision:** v1 add-ons support only bounded INTEGER/DECIMAL quota deltas, scaled by active TenantAddOn quantity. Other capability-delta shapes are unsupported until governed explicitly. Override normalization binds ALLOW/LIMIT values to the canonical entitlement-definition type. DENY is canonical `true`; Tenant DENY maps to the global deny set, while Industry DENY maps to a type-specific disabled Industry fact so the existing most-specific current-state read correctly denies only that Industry.

**Consequence:** source inputs can now be normalized without widening entitlement or financial semantics. Add-on `eligibility_json`, active-row selection and override/add-on precedence remain separate prerequisites before the target preview can be called complete.

## Commercial publication current-state revalidation correction — 2026-09-20

F-14 §4/§5 and DD-04 §5/§11 require current Commercial truth. Publication's existing id/version check omitted snapshot effective dates and the Tenant's authoritative current_subscription_id. DD-04 §14 now states both checks explicitly. No new lifecycle, table, role or privilege is introduced. COMM-PUB-011/012 cover expiry/future activation and pointer removal; COMM-PUB-010 gains a real PostgreSQL late-audit-failure rollback regression. Current CI evidence remains owned by Development/CORE_SERVICE_CHECKPOINT.md.


## DD-070 — Add-on eligibility is a server-owned resolver seam; active source rows remain authoritative

**Context:** DD-069 normalized add-on quota deltas and typed overrides but deliberately left `add_on.eligibility_json`, active-row selection and target-plan policy ownership unresolved. Interpreting arbitrary eligibility JSON inside Commercial would invent business rules not present in the governing source.

**Decision:** bind active adjustment sources through `PostgresCommercialAdjustmentSourceStore` under the existing no-bypass Commercial compiler read boundary. The store revalidates the Tenant's current Subscription/version/source PlanVersion, active target PlanVersion/Plan/route, exact Tenant + Subscription ownership and effective windows for TenantAddOn/override rows. Sibling Tenant rows remain inaccessible by predicates + FORCE-RLS. Target trial/billing policy documents and add-on eligibility JSON stay opaque.

Eligibility is delegated to `CommercialAddOnEligibilityResolverPort`. It is server-owned, receives the authoritative policy/source documents, and returns only `ELIGIBLE | INELIGIBLE` plus versioned evidence. The service applies DD-069 quota deltas only after ELIGIBLE. Client input never supplies eligibility authority.

**Audit / trade-off:** this creates a deterministic ownership seam without guessing eligibility semantics. It costs an explicit resolver dependency before production composition, but avoids hardcoded pricing/market/payment rules and preserves Billing ownership.

**Consequence:** active adjustment-source isolation and the eligibility decision boundary are executable/tested. A concrete production eligibility resolver is still unfinished and remains a prerequisite for end-to-end target preview/public plan change. The next safe compiler slice may consume already prepared/resolver-approved adjustments and implement only F-14/DD-04 precedence, failing closed on ambiguous LIMIT_SET/LIMIT_DELTA meter mapping.

## Existing Commercial contract enforcement correction — 2026-09-21

F-14 §1, A-04 §2 and DD-04 §1 already require immutable published PlanVersions.
Migration 0029 separated the catalog writer role but still allowed that role to
rewrite published content. Migration 0046 adds the missing row-update invariant
and removes runtime deletion authority. Status-only retirement remains supported;
new content requires a new version. This physicalizes existing authority and does
not introduce a new commercial business rule or a new DD decision ID.

DD-060/065 also require malformed values to fail closed. Runtime enum regressions
demonstrated that publication accepted unknown fact types, current-state guard
accepted unknown Subscription states, and projections silently omitted unknown
fact types. The Core validation correction rejects these before access or writes.
The PostgreSQL current-state adapter already validated its enums; no external
exploit or Tenant isolation breach is inferred from the mocked-port regressions.

Affected dependencies: DD-04/05/17, Commercial Core read/publication services,
migration/verification 0046, Development/DB checkpoints and current State evidence.
Remote CI must pass at the correction commit before this slice is promoted.

## DD-071 — Deterministic Commercial adjustment precedence is bounded to existing baseline keys

**Context:** DD-068 creates the license-safe resolved PlanVersion baseline; DD-069 normalizes quota-only add-ons and typed overrides; DD-070 supplies active same-Tenant sources and server-owned eligibility decisions. F-14/DD-04 fixes the order as baseline/licenses → overrides → add-ons and requires deny-wins, most-specific limits and additive overlap only for metered quota. Persisted tenant_override has no meter_code, so choosing among multiple meters would invent business meaning.

**Decision:** introduce a pure intermediate precedence function over DD-068 baseline + DD-070 prepared adjustments. It never synthesizes a capability/limit key absent from the validated resolved baseline. Exact-scope access DENY beats ALLOW; multiple ALLOW rows without a DENY are ambiguous. LIMIT_SET/LIMIT_DELTA require exactly one target meter for the exact entitlement scope; zero/multiple targets fail closed. LIMIT_SET creates a FINITE replacement; LIMIT_DELTA requires an existing FINITE target and valid non-negative result.

Resolver-ELIGIBLE add-ons are applied after overrides and remain quota-additive only. TENANT/INDUSTRY_CODE/LICENSED_INDUSTRIES selectors resolve only against existing target limit keys; FINITE accumulates and ADD_ON_ONLY starts from zero, while NOT_INCLUDED/UNLIMITED are rejected as non-additive v1 targets. Value-type mismatches fail closed. Output is immutable/deterministically sorted.

**Boundary / trade-off:** this deliberately leaves compliance/security restrictions, usage-meter impact, suspension/grace overlay, final snapshot/publication, concrete eligibility business logic, Billing/payment/proration, Workflow approval and public changePlan outside this slice. Requiring an existing baseline key is consistent with F-14's explicit value/unlimited/not-included/add-on marker requirement and avoids inventing hidden plan dimensions.

