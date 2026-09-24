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

## DD-072 — Compliance/security target-preview authority is a server-owned deny-only input seam

**Context:** F-14/A-04/DD-04 require compliance/security to participate after Commercial adjustments and to only restrict. F-03/A-03/DD-16 define the security/compliance control domains, but the current repository has no authoritative Commercial restriction table or production target-plan entitlement reducer. DD-03 already records the analogous ABAC safety rule: an ungoverned RESTRICT payload is not interpreted as allow-like behavior and fails closed.

**Decision:** introduce `CommercialComplianceSecurityRestrictionResolverPort` plus a preparation service. The resolver is server-owned and receives SERVICE + TENANT_CORE RequestContext, exact target PlanVersion id and the exact DD-071 intermediate preview. Its v1 normalized output may only identify exact existing entitlement `DENY` targets, optionally exact-Industry scoped, with a control code and versioned evidence. Missing targets, selector fan-out, ALLOW, numeric/opaque effects, duplicate control-target tuples, malformed evidence and target-version mismatch fail closed.

**Boundary / trade-off:** this decision deliberately does not invent a compliance persistence schema, legal/regulatory rule, limit-cap formula or generic restriction reducer, and does not apply the prepared denies yet. A concrete production resolver remains unfinished. This preserves one authority chain and allows future security/compliance policy ownership to bind without coupling Commercial to session, ABAC, residency or rate-limit storage.

**Consequence:** DD-072 closes only the normalized restriction-input ownership seam. Final target preview is still incomplete; applying prepared restrictions, usage-meter impact, lifecycle overlay, Billing/approval producer integrations and public `core.commercial.subscription.changePlan` remain separate governed work.

## DD-073 — Downgrade usage impact compares only source-safe selected usage

**Context:** F-01 BR-SUB-04 and F-14 require usage-vs-target impact before a downgrade can take effect. DD-04 persists used/reserved usage by meter and period; DD-064 already provides a same-Tenant, NOBYPASSRLS read boundary. The current governing source does not define which period is authoritative during plan-change assessment or how outstanding reservations participate in BR-SUB-04 current usage.

**Decision:** introduce a server-owned `CommercialUsageImpactSourcePort` and a pure target-impact evaluator. The source owns exact period selection and returns versioned evidence. The evaluator binds measurements only to exact DD-071 limit keys. FINITE compares persisted `used_value` to the target; NOT_INCLUDED and unresolved ADD_ON_ONLY are zero included capacity; UNLIMITED is non-blocking. Missing/duplicate period selection, missing target keys, malformed evidence and relevant non-zero `reserved_value` fail closed. Reservations are never silently added to `used_value`.

**Boundary / trade-off:** this decision deliberately leaves the concrete PostgreSQL period selector and reservation-reconciliation rule unfinished rather than encoding an unsupported convention. It also does not choose remediation, write DD-066 assessment evidence, apply DD-072 restriction decisions, apply lifecycle overlay or calculate Billing/proration.

**Consequence:** deterministic BR-SUB-04 usage comparison is executable once authoritative selected measurements are supplied. Final plan-change impact/remediation remains incomplete until a governed source selector exists and reservation semantics are resolved.

## DD-074 — Lifecycle overlay is posture metadata, not entitlement-fact mutation

**Context:** F-14/A-04/DD-04 put suspension/grace last in Commercial compilation, while runtime access still revalidates current Subscription state. GRACE explicitly retains full access. SUSPENDED permits only governed read-only/recovery/billing/export paths and pauses ordinary writes/integrations/API. DD-04 §11 already denies generic protected operations for PENDING/SUSPENDED/EXPIRED/CANCELLED until dedicated restricted operation contracts exist.

**Decision:** represent lifecycle as a deterministic server-side posture: PENDING=ACTIVATION_PENDING; TRIAL/ACTIVE/GRACE=FULL_ACCESS; SUSPENDED=RESTRICTED; EXPIRED/CANCELLED=PRESERVATION_ONLY. Generic protected operations and ordinary business writes are eligible only in FULL_ACCESS. All postures retain the data-preservation invariant. Unknown values, PAST_DUE and Renewed-as-state fail closed.

**Boundary / trade-off:** the overlay does not zero entitlement facts/limits, fabricate deny entries, choose restricted-operation identifiers, predict future NEXT_RENEWAL lifecycle, execute dunning/payment policy or authorize reactivation. Restricted capabilities are operation-contract-owned and Subscription state is re-read at apply/runtime, preventing the snapshot from becoming competing authority.

**Consequence:** the deterministic lifecycle stage is executable without widening access. Final target-preview orchestration still requires concrete compliance/security restriction application, production usage-period/reservation binding and final fact/fingerprint materialization before public plan-change apply can be considered.

## DD-075 — Final Commercial target preview composes evidence but is not publication authority

**Context:** DD-071 supplies deterministic plan/adjustment output, DD-072 supplies narrowing-only exact DENY evidence, DD-073 supplies exact-target usage impact, and DD-074 supplies canonical lifecycle posture. The remaining deterministic compiler step is to combine those outputs without turning preview evidence into Billing/remediation/publication authority.

**Decision:** materialize one target-PlanVersion-bound final preview. Apply DD-072 Tenant DENY to the Tenant deny set and Industry DENY as the existing DD-069 type-specific disabled scoped fact. Preserve DD-071 limits. Revalidate DD-073 exact limit coverage, target modes/values, used-value status and aggregate blocker. Recompute DD-074 lifecycle posture from its canonical state and reject any tampered overlay. Preserve versioned restriction/usage evidence and deterministic immutable ordering.

**Boundary / trade-off:** final preview is intentionally not `CommercialCompiledSnapshotFact[]` and not a DD-066 assessment. It does not invent snapshot source IDs/effective windows, marker-to-persistence policy, source fingerprint, blocking impact codes/remediation, concrete policy resolvers, Billing/Workflow evidence or apply authorization.

**Consequence:** the pure target-preview compiler chain through lifecycle is executable. Production/public plan change remains blocked on concrete add-on/compliance/usage source bindings plus assessment/remediation and route-resolution producer orchestration before DD-065 publication.

## DD-076 — Initial assessment uses a server-owned evaluator seam; missing impact semantics are not invented

**Context:** DD-075 now produces the final target preview, while DD-066 requires a persisted assessment carrying route evidence, impact/diff references, blocking codes, remediation state and source fingerprint. The repository still lacks a concrete blocking-code vocabulary, entitlement-diff evidence schema, canonical full Commercial fingerprint algorithm and deterministic route chooser when multiple target routes are enabled.

**Decision:** add a SERVICE/TENANT_CORE-only initial-assessment preparation service backed by a server-owned evaluator port. The evaluator receives exact Subscription/source/target/version/timing plus DD-075. Its normalized result must rebind to the same target, carry valid route policy identity/version, bounded impact/diff references, bounded unique impact codes and an opaque bounded fingerprint. Preparation sorts blockers and derives initial remediation strictly as PENDING when blockers exist, otherwise NOT_REQUIRED. If DD-073 reports blocking usage, at least one blocker is mandatory.

**Boundary / trade-off:** DD-076 never permits initial SATISFIED, never chooses remediation, never defines impact-code/diff/fingerprint/dual-route semantics and does not write DD-066 evidence or call DD-065 publication. Those remain production evaluator/orchestration responsibilities.

**Consequence:** the final preview can now be handed to one explicit server-owned assessment-authority seam without allowing caller-supplied impact/remediation authority or silently losing a known usage blocker.

## DD-077 — Persisted evidence is readable through a fail-closed apply gate, but authorization is not yet atomic with publication

**Context:** DD-066 already persists producer-isolated assessment/remediation/route evidence and grants the Commercial transition/compiler role read-only access. DD-04 §13.4 defines the exact apply conditions, but DD-065 intentionally does not consume DD-066 evidence.

**Decision:** add a read-only persisted evidence store over the existing compiler role plus a SERVICE/TENANT_CORE gate. The store requires the requested assessment version to be the latest, rechecks current Subscription/source/version/Tenant pointer and current target route policy, then loads latest route evidence and required prior remediation evidence. The gate enforces exact opaque source-fingerprint equality, no unresolved blockers, correct Billing/Workflow producer ownership, latest route state and NEXT_RENEWAL effective time.

**Boundary / trade-off:** a successful DD-077 decision is not a publication capability token. The evidence read and DD-065 mutation still occur in separate transactions, so DD-077 explicitly does not claim the DD-04 same-authoritative-transaction invariant. No new DB grant/migration, production assessment evaluator, Billing/Workflow producer or public command is introduced.

**Consequence:** the persisted DD-066 evidence chain now has executable fail-closed consumption semantics. The next safe slice is to bind this evidence validation into the DD-065 publication transaction while preserving all existing publication revalidation and least-privilege guarantees.

## DD-078 — DD-066 evidence validation is serialized inside DD-065 publication

**Context:** DD-077 made persisted evidence consumable but its read transaction ended before DD-065 mutation. Because DD-066 allows append-only later evidence, a newer route/reassessment could otherwise appear between the read gate and publication.

**Decision:** require assessment id/version on internal publication, acquire a Tenant+assessment advisory transaction lock before evidence reads, and make all DD-066 evidence INSERTs acquire the same lock through migration 0047 triggers. Under that lock, publication revalidates latest assessment version, exact Subscription/source/target/version/fingerprint, remediation readiness, current route policy, latest producer-owned SATISFIED route resolution and NEXT_RENEWAL effectiveAt before continuing the existing DD-065 mutation.

**Security / least privilege:** no evidence DML is granted to the compiler. The only added compiler privilege is EXECUTE on the lock helper. FORCE RLS and producer-isolated evidence writes remain unchanged.

**Boundary / trade-off:** advisory-key collisions only reduce concurrency. DD-078 does not create producer business semantics or public changePlan. Existing DD-065 catalog/snapshot/fact revalidation remains authoritative.

**Consequence:** the supplied DD-066 assessment's evidence append stream can no longer change between validation and publication commit. Public changePlan still depends on concrete assessment/Billing/Workflow producers and remaining compiler materialization bindings.

## DD-079 — DD-076 prepared initial assessment persists through DD-066 without semantic reinterpretation

**Context:** DD-076 now produces the exact non-identity fields of a version-1 DD-066 assessment, while DD-066 already owns server-generated identity/time/Tenant/correlation, current-state guards and append-only persistence. The missing step is orchestration, not a new business rule.

**Decision:** add a SERVICE/TENANT_CORE persistence bridge that accepts only the normalized DD-076 version-1 shape and forwards every prepared field unchanged into `PlanChangeEvidenceService.recordAssessment`. The bridge deliberately omits assessment id so DD-066 remains its owner. Returned persisted evidence must exactly match the prepared binding plus RequestContext Tenant/correlation; any drift fails closed.

**Security / persistence:** no new database object or privilege is introduced. Existing DD-066 writer isolation, FORCE RLS, current Subscription/target route guards and DD-078/0047 evidence serialization remain authoritative.

**Boundary / trade-off:** this does not create the concrete DD-076 evaluator, blocker vocabulary, entitlement-diff format, fingerprint algorithm, route chooser, remediation reassessment, Billing or Workflow producers. It makes prepared initial evidence durable only after some governed evaluator has produced it.

**Consequence:** once a concrete evaluator exists, its DD-076 output has an executable least-privilege path into the DD-066 evidence chain consumed atomically by DD-078 publication.

## Existing Identity and Commercial contract enforcement corrections — 2026-09-21

Fresh audit at `3dabe35c71e07ff0750095669f025fe9a413e48f` reproduced three runtime
boundary defects: Tenant machine scope resolution ignored the verified scope
allowlist; human Tenant context copied provider sessionVersion instead of validated
Core sessionVersion; DD-075 accepted VALUE payloads incompatible with their declared
entitlement type. Enforce the existing DD-02/03/043/044 and DD-071/075 contracts at
those boundaries. No new product semantics, DB grant or decision ID is introduced.
Regressions are `request-context-boundaries.test.mjs` and
`commercial-target-preview-values.test.mjs`; no public exploit is inferred from
these internal-boundary reproductions. First-party web remains human-only.

## DD-080 — External REST reuses the canonical executor through a body-safe Fetch boundary

**Context:** A-06 requires a stable external REST plane over the same Core and
DTOs as tRPC. DD-051/DD-052 already own execution and projections, while DD-054
proves the auth-before-body Fetch ordering for the internal plane. The current
repository has no REST adapter, and its concrete machine credential scheme, route
catalog and OpenAPI publication remain undefined.

**Decision:** implement a reusable REST Fetch handler whose mandatory server-owned
ports resolve edge policy, route, Authorization, authenticated context and input.
Metadata ports cannot consume the body. Body preparation/input projection occur
only after authenticated context creation. The route supplies a fixed operationId
and selector facts; OperationExecutor supplies scope and every business/security
check. Responses use only DD-052 success/error/control projections plus governed
HTTP status, correlation, no-store, Retry-After and replay headers.

**Security / trade-off:** a generic injected boundary leaves credential syntax and
routes unexposed until their own governed registrations exist, while still making
ordering and projection executable. It costs an explicit composition step but
avoids guessed API-key parsing, header authority and parallel REST business logic.

**Boundary:** no live endpoint, public route, machine/API-key scheme, OpenAPI
generator, webhook route, deployment policy, database change or Commercial rule is
introduced. The DD-076 dependent evaluator remains blocked independently.

**Acceptance:** REST-001…008 in DD-17 and
`tests/server/rest-fetch-handler.test.mjs`.


## DD-081 — Event envelope validation binds catalog and authoritative scope before payload interpretation

**Context:** DD-07 and migration 0030 already define the exact event-envelope metadata,
catalog tuple and Tenant/Industry/residency integrity rules. PostgreSQL enforces them
at outbox persistence, but reusable Core code had no corresponding pre-persistence /
consumer boundary. Dispatcher retry timing, webhook transport and a concrete payload
schema engine remain separate unresolved runtime concerns.

**Decision:** add one reusable Core validator that accepts an untrusted envelope plus
server-owned persistence binding and event-catalog contract. It validates JSON
compatibility, event id/type/version/scope, required source/actor/correlation/time
metadata, producer module, sensitivity, physical Tenant/Industry/residency ownership,
and exact cross-context endpoint shape. EXPLICIT_CROSS_CONTEXT additionally requires
an injected authoritative same-Tenant endpoint verifier. Only after those checks pass
may an injected catalog payload-schema validator interpret the payload.

**Security / trade-off:** the validator duplicates the database integrity floor on
purpose so malformed events can fail before persistence/dispatch/consumption, while
PostgreSQL remains the final physical guard. The payload-schema engine is a port
rather than an invented JSON-schema implementation. No generic Tenant/Industry
selector becomes authority.

**Boundary:** no outbox poller, claim/lock algorithm, retry interval, DLQ threshold,
webhook challenge/signature/SSRF implementation, external endpoint, new catalog row,
database object or privilege is introduced.

**Acceptance:** EVT-CAT-001…006 in DD-17 and
`tests/core/event-envelope-catalog.test.mjs`.


## DD-082 — Document access candidate validates RLS metadata/state before authorization or signing

**Context:** DD-08 requires RequestContext resolution and DocumentMeta lookup before
ACL/permission/entitlement/sensitivity/residency checks or any StoragePort signing.
Migration 0006 already makes DocumentMeta the FORCE-RLS authorization owner and
migration 0028 defines the dedicated Document service role. No executable Core
Document boundary existed. A complete signed-download operation is still missing an
exact public OperationContract/permission binding, policy-specific step-up rule and
concrete signer TTL/provider composition.

**Decision:** add a reusable `DocumentAccessCandidateService` with an injected
RLS-bound metadata port. It accepts only resolved Tenant RequestContext plus a UUID
document id, loads metadata, validates the authoritative row shape, exact Tenant and
Industry ownership, ACTIVE state and CLEAN scan status, then returns an immutable
internal candidate for the existing authorization chain and future signer.

**Security / trade-off:** sibling Industry/foreign Tenant/missing metadata becomes
`RESOURCE_NOT_FOUND`; unsafe/inactive metadata becomes
`RESOURCE_STATE_INVALID`; malformed rows or dependency failures become safe
`DEPENDENCY_UNAVAILABLE`. The candidate may contain the internal
`storageObjectId` needed by the Document service but never exposes object keys,
provider references, credentials, URLs or tokens.

**Boundary:** this decision does not authorize a download, interpret Document ACLs,
select a permission/entitlement, define step-up/residency exceptions, create a
signed grant, choose TTL/provider configuration, add SQL/privileges or enable public
sharing.

**Acceptance:** DOC-PRE-001…006 in DD-17 and
`tests/core/document-access-candidate.test.mjs`.


## DD-083 — Document metadata port uses RequestScopedSql + existing FORCE-RLS DocumentMeta

**Context:** DD-082 defined a pre-sign access candidate behind an injected
DocumentAccessMetadataPort. Migration 0006 already owns the exact DocumentMeta
projection and FORCE-RLS predicate; migration 0028 already grants the dedicated
NOBYPASSRLS Document service role access. No new persistence semantics are required.

**Decision:** implement `PostgresDocumentAccessMetadataStore` as the concrete port.
It accepts only resolved single-Tenant contexts, uses dedicated
`PostgresDocumentDatabase` to set the existing `sbg_document_service_rw` NOBYPASSRLS
role, opens transaction-local scope with `RequestScopedSql`, selects one DocumentMeta
row by UUID and maps only DD-082 fields. RLS-hidden or absent rows return null;
ambiguous or malformed persistence results fail closed.

**Security / trade-off:** Tenant/Industry ownership is enforced twice: physically by
FORCE-RLS and again by DD-082 candidate validation. Tenant Core rows remain visible
within the same Tenant's Industry workspace exactly as migration 0006 specifies;
sibling Industry rows do not. The reader never joins storage-object provider data.

**Boundary:** DD-083 is persistence binding only. It does not authorize download,
evaluate ACL/permission/entitlement/step-up/residency policy, sign access, select a
TTL/provider, expose a route, add SQL objects/privileges or enable public sharing.

**Acceptance:** DOC-PG-001…005 in DD-17 and
`tests/postgres/document-access-metadata-store.test.mjs`.


## DD-084 — Document ACL persistence is readable without inventing final ACL authorization semantics

**Context:** DD-08 defines the physical ACL row grammar and explicit-deny principle,
while migration 0006 supplies the parent-RLS visibility boundary and migration 0031
validates ACL subjects stay within document scope. The current source does not yet own
the complete operation→Document ACL permission mapping or one deterministic fallback
rule for every operation when explicit ALLOW is absent.

**Decision:** add a raw `DocumentAclReadPort` and concrete
`PostgresDocumentAclStore`. The store returns immutable typed persisted rows for one
document through the existing dedicated Document PostgreSQL/RLS boundary, in stable
order. It preserves `validUntil` instead of filtering it and preserves ALLOW/DENY
instead of evaluating precedence.

**Security / trade-off:** this separates persistence truth from authorization policy.
RLS still prevents foreign/sibling ACL discovery, and no raw ACL row can itself grant
access. A later source-owned evaluator must compose only after parent DD-03
authorization and must remain narrowing-only.

**Boundary:** no subject matching, expiry-effectiveness interpretation, deny reducer,
source-resource inheritance rule, operation/action mapping, signer, route or schema
change is claimed.

**Acceptance:** DOC-ACL-PG-001…004 in DD-17 and
`tests/postgres/document-access-metadata-store.test.mjs`.


## DD-085 — Document ACL subject matching uses only resolved RequestContext identities and remains non-authorizing

**Context:** DD-084 supplies typed raw ACL evidence. DD-08 defines ACL subject types,
and the existing RequestContext resolver owns principal id, effective role ids and the
selected OrgUnit ancestor UUID path. The repository still lacks complete
operation→ACL mapping, validUntil boundary policy, fallback semantics and final deny
reduction required for authorization.

**Decision:** add a pure Core `DocumentAclSubjectMatcher`. For one caller-supplied
explicit ACL permission, it validates resolved single-Tenant context and
single-document evidence, then matches PRINCIPAL to principalId, ROLE to roleIds and
ORG_UNIT to orgUnitPath. It returns immutable matching ACL rows in input order.

**Security / trade-off:** caller/client selectors never participate in matching; only
resolved server-owned RequestContext identities do. Effect and validUntil are
preserved but deliberately uninterpreted, so the matcher cannot widen or grant
access.

**Boundary:** no operation mapping, expiry-effectiveness rule, ALLOW/DENY reducer,
source-resource inheritance/fallback, final authorization decision, signer, route or
schema/privilege change is introduced.

**Acceptance:** DOC-ACL-MATCH-001…006 in DD-17 and
`tests/core/document-acl-subject-match.test.mjs`.


## DD-086 — Physical StorageObject lookup is reachable only through exact RLS-visible DocumentMeta linkage

**Context:** DD-08 makes DocumentMeta the authorization owner and explicitly says an
object key is not authorization. `storage_object` itself is intentionally private and
not Tenant-RLS keyed, while migration 0028 restricts it to the Document service role.
DD-082/083 now provide an exact RLS-visible Document candidate + PostgreSQL boundary.

**Decision:** add server-internal `PostgresDocumentStorageBindingStore`. It never
looks up StorageObject by id alone. It joins the exact document id and exact
storageObjectId through RLS-visible DocumentMeta, requires ACTIVE/CLEAN document
state, ACTIVE object state and exact RequestContext Data Home, then returns immutable
private physical locator metadata.

**Security / trade-off:** the physical object layer remains non-authoritative and
cannot widen access. Known foreign/sibling/unlinked object ids yield no binding.
Private object-key/provider metadata never enters Core authorization or transport
contracts. Rechecking state/Data Home immediately before a future signer narrows the
TOCTOU window relative to relying only on earlier DocumentMeta validation.

**Boundary:** no provider decryptor/selection, StoragePort signer, signed-grant TTL,
ACL/permission/entitlement/step-up policy, route, migration, role, grant or RLS
change is introduced.

**Acceptance:** DOC-STO-PG-001…006 in DD-17 and
`tests/postgres/document-access-metadata-store.test.mjs`.


## DD-087 — Document upload-session persistence is readable without inventing upload-policy semantics

**Context:** DD-08 and migration 0006 define the upload-session storage grammar and
FORCE-RLS scope. Migration 0031 validates the persisted upload principal belongs to
the Tenant. The repository still does not own executable semantics for every
`max_size_class`, media-type policy source, expiry boundary or upload-state
transition.

**Decision:** add a raw `DocumentUploadSessionReadPort` and concrete
`PostgresDocumentUploadSessionStore`. The store reads exactly one RLS-visible
session by UUID through the dedicated Document PostgreSQL boundary and returns an
immutable typed persistence snapshot.

**Security / trade-off:** RLS hides sibling-Industry sessions and preserves Tenant
Core same-Tenant visibility. The reader retains expired/cancelled/rejected facts
rather than silently converting them into an authorization decision. Mutating
principal ownership remains a write-policy concern owned by the existing RLS
WITH CHECK contract.

**Boundary:** DD-087 does not decide whether a session is usable, evaluate
media/size/checksum policy, advance upload states, access temporary storage, sign a
grant, expose a route or change SQL/roles/privileges.

**Acceptance:** DOC-UP-PG-001…005 in DD-17 and
`tests/postgres/document-access-metadata-store.test.mjs`.



## DD-088 — Webhook Subscription persistence is readable under its dedicated Integration role without making endpoint/delivery decisions

**Context:** DD-07 and migrations 0008/0030 already define the exact
WebhookSubscription persistence grammar, Tenant FORCE-RLS visibility and integrity
constraints. Migration 0028 fixes the service privilege owner as
`sbg_integration_service_rw`. Endpoint challenge, SSRF, signature/rotation and
delivery retry behavior remain separate runtime concerns.

**Decision:** add typed `WebhookSubscriptionReadPort`,
`PostgresWebhookSubscriptionStore` and dedicated
`PostgresIntegrationDatabase`. The database wrapper follows existing fixed-role
service boundaries: it sets only `sbg_integration_service_rw`, forces row security,
verifies runtime/login roles are non-superuser/NOBYPASSRLS, clears transaction-local
scope before use and sanitizes pooled connection state on release.

The store performs one parameterized subscription lookup under `RequestScopedSql`,
maps persisted facts immutably and returns null for RLS-hidden/absent rows.

**Security / trade-off:** endpoint URL is data, not an instruction to connect.
secretVersion is version metadata, not secret material. Same-Tenant Industry context
does not narrow a Tenant Core subscription because the source RLS owner is Tenant;
allowed Industry Context ids remain raw governed configuration for a later delivery
filter.

**Boundary:** DD-088 does not verify endpoint control, resolve/allow a network target,
interpret event filters, decrypt/generate secrets, sign webhook requests, authorize a
delivery, schedule retry/DLQ, expose an endpoint or change schema/privileges.

**Acceptance:** WH-SUB-PG-001…005 in DD-17 and
`tests/postgres/webhook-subscription-store.test.mjs`.


## DD-089 — Webhook Delivery attempt evidence is readable without inventing retry/delivery semantics

**Context:** DD-07 and migration 0008 define WebhookDelivery persisted fields and
parent-RLS. Migration 0030 strengthens immutable identity linkage and ensures the
delivery references a same-Tenant webhook-eligible event whose Industry scope is
allowed by the subscription. The persistence schema intentionally leaves delivery
`status` and `error_class` as text and DD-07 keeps retry timing symbolic.

**Decision:** add typed `WebhookDeliveryEvidence` / `WebhookDeliveryReadPort` and
concrete `PostgresWebhookDeliveryStore`. The store reads one parent-RLS-visible
delivery attempt by UUID through the dedicated Integration PostgreSQL boundary and
returns immutable raw persisted evidence.

**Security / trade-off:** parent subscription + event visibility is required before
the delivery row can be read. Tenant-Industry delivery evidence is therefore hidden
from sibling Industry Contexts while Tenant-Core event delivery remains same-Tenant
visible. Endpoint snapshot is evidence of where an attempt was aimed, not authority
to connect.

**Boundary:** DD-089 does not interpret retryability/permanence, schedule next
attempts, exhaust to DLQ, replay, verify an endpoint, resolve network targets,
interpret event filters, sign requests, expose a route or change schema/privileges.

**Acceptance:** WH-DEL-PG-001…005 in DD-17 and
`tests/postgres/webhook-subscription-store.test.mjs`.


## DD-090 — Outbox Event persistence is readable without inventing dispatcher semantics

**Context:** DD-07 and migrations 0008/0030 already define the exact OutboxEvent
fields, catalog/envelope integrity and final scope-specific FORCE-RLS predicate.
Migration 0028 fixes Integration-service privileges. Claim/lock scheduling, retry
timing and DLQ/replay execution remain separate runtime work.

**Decision:** add typed `OutboxEventEvidence` / `OutboxEventReadPort` and concrete
`PostgresOutboxEventStore`. The store reads one RLS-visible outbox event by UUID
through the dedicated Integration PostgreSQL boundary and returns immutable raw
persistence evidence, including the envelope and dispatcher-state columns.

**Security / trade-off:** the reader does not infer authority from a null Industry
Context. Tenant Core and Tenant Industry visibility follow `outbox_row_visible`.
The generic RequestScopedSql path still rejects EXPLICIT_CROSS_CONTEXT, preserving
the requirement for a dedicated governed repository. Raw lock/status/error evidence
cannot itself trigger work.

**Boundary:** DD-090 does not claim/lease, mutate status/attempts, decide
dispatchability/retryability, execute delivery, transition DLQ, replay, interpret
payload schemas, expose a route or change schema/privileges.

**Acceptance:** EVT-OUT-PG-001…005 in DD-17 and
`tests/postgres/webhook-subscription-store.test.mjs`.


## DD-091 — Event Catalog exact tuple is readable as DD-081 authoritative contract without executing schemas

**Context:** DD-07 and migration 0008 define Event Catalog persistence; migration
0030 adds exact type/version/scope uniqueness for outbox integrity; DD-081 consumes
the catalog contract before payload interpretation; migration 0028 already grants
Integration runtime read access. A payload-schema engine and catalog mutation runtime
remain separately unresolved.

**Decision:** add `PersistedEventCatalogEntry` extending DD-081's
`EventCatalogContract`, `EventCatalogReadPort.loadExact`, and concrete
`PostgresEventCatalogStore`. The store performs one parameterized exact
type/version/scope lookup through a governed Integration database transaction and
returns immutable validated persistence facts.

**Security / trade-off:** catalog metadata is global read-only runtime metadata, so
the exact reader is intentionally not Tenant-RLS scoped. Exact scope is still part of
the lookup, preventing callers from silently substituting a different scope contract.
RETIRED is returned as evidence, not converted into a production/consumption
decision.

**Boundary:** DD-091 does not execute payload schemas, register/retire events,
interpret compatibility, select consumers, authorize webhooks, expose a route or
change schema/privileges.

**Acceptance:** EVT-CAT-PG-001…004 in DD-17 and
`tests/postgres/webhook-subscription-store.test.mjs`.


## DD-092 — IntegrationDefinition primary-key registry reads preserve metadata without provider-selection authority

**Context:** DD-06 §15 and migration 0025 define the exact IntegrationDefinition
registry row. Migration 0028 already grants the dedicated Integration service role
SELECT-only access to that table. `owner_scope` has an exact persisted enum, while
definition status/classification fields remain text and do not own universal runtime
selection semantics.

**Decision:** add `IntegrationDefinitionReadPort.loadById` and concrete
`PostgresIntegrationDefinitionStore`. It performs one parameterized primary-key
read through the fixed Integration database role, validates persisted structure,
freezes nested capability/JSON values and returns null for absence.

**Security / trade-off:** this exposes only registry metadata that the Integration
service is already allowed to read. It intentionally does not traverse into
CredentialReference/TenantIntegration, so no secret reference or tenant enablement
state is leaked or conflated with a global definition. Raw RETIRED/other status text
does not itself authorize or prohibit execution at this layer.

**Boundary:** no provider/adapter/capability selection, health fallback, residency
policy evaluation, credential access, callback execution, route or registry mutation
is claimed.

**Acceptance:** INT-DEF-PG-001…004 in DD-17 and
`tests/postgres/webhook-subscription-store.test.mjs`.


## DD-093 — IntegrationCapability exact tuple reads preserve mapping evidence without execution authority

**Context:** DD-06 §15 and migration 0025 define the exact IntegrationCapability row
and unique `integration_definition_id + capability_code` tuple. The Integration
service role already has SELECT-only access. Direction has an exact enum; status and
rate/idempotency/data classifications are persisted text whose runtime interpretation
belongs to later policy/execution composition.

**Decision:** add `IntegrationCapabilityReadPort.loadExact` and concrete
`PostgresIntegrationCapabilityStore`. The reader executes one parameterized exact
tuple query, validates UUID/direction/text/array shape, freezes event-type data and
returns null for tuple absence.

**Security / trade-off:** capability mapping evidence remains separate from
TenantIntegration enablement and provider execution. OperationContract/event ids are
returned as registry references only; the reader does not dispatch or authorize them.
Raw ACTIVE/RETIRED status is not transformed into a permission.

**Boundary:** no ProviderAdapter selection, TenantIntegration enablement, health
fallback, rate/idempotency/data policy evaluation, credential access, callback/event
execution, route or schema/privilege change is claimed.

**Acceptance:** INT-CAP-PG-001…004 in DD-17 and
`tests/postgres/webhook-subscription-store.test.mjs`.


## DD-094 — ProviderAdapter exact tuple reads keep adapter declarations separate from execution

**Context:** DD-06 §§15–16 and migration 0025 define ProviderAdapter registry metadata
and unique `definition_id + adapter_code + contract_version`. Migration 0028 grants
the Integration service SELECT-only access. Auth/timeout/retry/circuit/health/error
map/status fields are declarative registry strings; their executable implementations
remain separate.

**Decision:** add `ProviderAdapterReadPort.loadExact` and concrete
`PostgresProviderAdapterStore`. It performs one parameterized exact tuple query,
validates UUID/non-empty text and returns an immutable registry snapshot or null.

**Security / trade-off:** adapter metadata cannot become a provider client or
credential authority. A RETIRED/ACTIVE string is preserved as evidence; the read
boundary does not choose adapters, probe networks, load secrets or authorize
execution.

**Boundary:** no provider SDK instantiation, auth material, timeout/retry/circuit
engine, health probe, normalized-error execution, TenantIntegration enablement,
callback dispatch, route or schema/privilege change is claimed.

**Acceptance:** INT-ADAPTER-PG-001…004 in DD-17 and
`tests/postgres/webhook-subscription-store.test.mjs`.


## DD-095 — TenantIntegration raw state is readable without becoming execution authority

**Context:** DD-06 and migration 0025 already own the exact TenantIntegration fields,
scope shape and FORCE-RLS policy. DD-092/093/094 separately expose definition,
capability and adapter registry metadata. Provider execution, secret retrieval and
Tenant enablement/health semantics remain separate runtime concerns.

**Decision:** add typed `TenantIntegrationReadPort` and concrete
`PostgresTenantIntegrationStore`. The store reads exactly one RLS-visible row by
UUID through the existing fixed Integration service-role database/request scope and
returns an immutable persistence snapshot.

**Security / trade-off:** the row may carry a CredentialReference **identifier**, but
the reader never joins `credential_reference` or exposes secret-store provider,
secret reference or credential material. Raw status, enabled-capability list and
health state remain evidence only and do not by themselves authorize provider or
OperationContract execution.

**Boundary:** no provider selection/execution, credential retrieval, health-policy
decision, capability authorization, network call, mutation or schema/privilege
change is claimed.

**Acceptance:** INT-TENANT-PG-001…005 in DD-17 and
`tests/postgres/webhook-subscription-store.test.mjs`.


## DD-096 — CredentialReference metadata is readable without creating a generic secret-locator path

**Context:** DD-06 defines CredentialReference persistence but requires secret
material access to be service-principal-only, purpose-bound and audited. Migration
0025 FORCE-RLS scopes Tenant/Industry rows; migration 0028 grants the Integration
service database access. A generic persistence reader returning `secret_reference`
would bypass the missing purpose/audit composition.

**Decision:** add tenant-scoped `CredentialReferenceMetadataReadPort` and concrete
`PostgresCredentialReferenceMetadataStore`. The store reads one RLS-visible row by
UUID but deliberately omits `secret_reference` from SQL projection and the Core
contract. It returns immutable provider/type/key-version/status/rotation/expiry
metadata only.

**Security / trade-off:** metadata supports later governed credential selection and
rotation policy without widening secret disclosure. Platform-global credentials,
secret locator retrieval and secret material remain separate source-audited
boundaries. Raw status/expiry does not become an allow/deny decision.

**Boundary:** no secret-reference locator, secret-store request, plaintext secret,
provider execution, credential usability decision or schema/privilege change is
claimed.

**Acceptance:** INT-CRED-META-PG-001…005 in DD-17 and
`tests/postgres/webhook-subscription-store.test.mjs`.


## DD-097 — SyncCursor raw persistence is readable without implying resume authority

**Context:** DD-06 defines SyncCursor storage; migration 0028 defines exact nullable
scope uniqueness; migration 0030 validates cursor writes against an ACTIVE
TenantIntegration and ACTIVE enabled IntegrationCapability. Parent-RLS already owns
read visibility. None of those facts define future replay/resume authorization.

**Decision:** add typed `SyncCursorReadPort` and concrete
`PostgresSyncCursorStore`. It reads one exact RLS-visible tuple using
`IS NOT DISTINCT FROM` for nullable Industry Context and returns immutable opaque
cursor/watermark/source-version evidence.

**Security / trade-off:** the cursor string stays server-internal and opaque. The
reader never decrypts or serializes it into a public transport contract. Parent
state changes after persistence do not silently delete historical cursor evidence;
later runtime code must re-evaluate current TenantIntegration/capability/policy before
resuming sync.

**Boundary:** no resume/replay decision, provider call, secret access, cursor
mutation, retry policy or schema/privilege change is claimed.

**Acceptance:** INT-CURSOR-PG-001…005 in DD-17 and
`tests/postgres/webhook-subscription-store.test.mjs`.


## DD-098 — NotificationDelivery raw persistence is readable without becoming send/retry/provider authority

**Context:** F-01/A-01 own Notification delivery tracking and channel routing.
Migration 0026 defines the exact delivery row/FORCE-RLS contract, migration 0027
defines the dedicated `sbg_notification_worker_rw` NOBYPASSRLS runtime role, and
migration 0031 validates template/channel/scope, recipient tenancy, optional
TenantIntegration scope/activity and optional source-event scope. These persistence
facts do not define one generic provider-selection, retry/failover or terminal-state
decision for every channel.

**Decision:** add immutable `PersistedNotificationDelivery`,
`NotificationDeliveryReadPort.loadForContext(...)`, dedicated
`PostgresNotificationDatabase`, and `PostgresNotificationDeliveryStore`. The
store performs one parameterized delivery-id read inside the fixed Notification
worker role and RequestScopedSql context, returning raw scoped recipient/channel/
template/integration/event/status/time/error/version evidence.

**Security / trade-off:** FORCE-RLS prevents sibling/foreign delivery discovery.
The Notification worker role explicitly has no CredentialReference privilege.
Recipient reference remains server-internal persistence evidence. Raw FAILED,
SUPPRESSED, CANCELLED or DELIVERED status is not converted into retry/finality or
provider authority.

**Boundary:** no send, retry, provider/failover selection, credential/secret access,
delivery mutation, worker loop, route, migration, role/grant/RLS or product-policy
change is introduced.

**Acceptance:** NOTIF-DEL-PG-001…005 in DD-17 and
`tests/postgres/notification-delivery-store.test.mjs`.


## DD-099 — NotificationDeliveryAttempt raw evidence is readable without becoming retry/finality/provider authority

**Context:** migration 0026 defines append-only parent-scoped
`notification_delivery_attempt` evidence and migration 0027 grants the dedicated
Notification worker role SELECT/INSERT while revoking UPDATE/DELETE. A-06/DD-06
require normalized provider state/retry behavior, but the exact Notification retry
policy, terminality mapping, backoff schedule and provider runtime remain separate
unimplemented concerns.

**Decision:** add immutable `NotificationDeliveryAttempt`,
`NotificationDeliveryAttemptReadPort.loadForDelivery(...)` and
`PostgresNotificationDeliveryAttemptStore`. The store reads attempts for one
delivery through the DD-098 Notification database/request scope, ordered by
`attempt_no`, and validates persisted UUID/integer/text/timestamp shape.

**Security / trade-off:** parent NotificationDelivery FORCE-RLS remains the visibility
authority, so sibling Industry / foreign Tenant attempts are undiscoverable. Provider
message references, normalized statuses/errors and timestamps are evidence only; they
do not select a provider, authorize send, determine retryability/finality or schedule
the next attempt. Worker UPDATE/DELETE remains prohibited and is executable
acceptance evidence.

**Boundary:** no delivery mutation, retry/finality reducer, backoff policy,
provider/credential selection, secret retrieval, network call, route, migration, role,
grant or RLS change is introduced.

**Acceptance:** NOTIF-ATT-PG-001…006 in DD-17 and
`tests/postgres/notification-delivery-attempt-store.test.mjs`.


## DD-100 — NotificationTemplate raw persistence is readable without becoming selection/render/send authority

**Context:** migration 0026 defines owner-scoped NotificationTemplate versioned
content plus FORCE-RLS through `row_visible_to_current_context`; migration 0027
grants Notification workers SELECT only; migration 0031 validates creator/approver
scope. No executable repository rule defines locale fallback, owner-scope fallback,
variable rendering/escaping or template-to-send selection.

**Decision:** add immutable `PersistedNotificationTemplate`,
`NotificationTemplateReadPort.loadForContext(...)` and
`PostgresNotificationTemplateStore`. The store performs one exact UUID read through
the existing dedicated Notification database/request scope and validates owner shape,
channel, lifecycle status, version, JSON schema evidence, principals and timestamps.

**Security / trade-off:** RLS is authoritative. Industry templates are visible only
to their exact Industry Context; Tenant templates remain same-Tenant visible;
PLATFORM templates require PLATFORM_GLOBAL trusted service/operator context and are
not silently exposed as Tenant fallback. Raw DRAFT/REVIEW/PUBLISHED/ACTIVE/RETIRED
status is evidence only.

**Boundary:** no active-version selection, locale/owner fallback, variable
substitution, channel escaping, render engine, approval/send eligibility, provider or
credential selection, secret access, network call, route, migration, role, grant or
RLS change is introduced.

**Acceptance:** NOTIF-TPL-PG-001…006 in DD-17 and
`tests/postgres/notification-template-store.test.mjs`.


## DD-101 — WorkflowDefinition raw persistence is readable without becoming selection/execution authority

**Context:** migration 0026 defines versioned owner-scoped WorkflowDefinition JSON
and effective-date evidence plus FORCE-RLS; migration 0027 grants the dedicated
Workflow worker role SELECT-only catalog access; migration 0031 validates
creator/approver scope. The repository does not yet bind a runtime active-version
selector, state-machine interpreter, approval/rule executor or transition
authorization engine to these persisted definitions.

**Decision:** add immutable `PersistedWorkflowDefinition`,
`WorkflowDefinitionReadPort.loadForContext(...)`, dedicated
`PostgresWorkflowDatabase` fixed to `sbg_workflow_worker_rw`, and
`PostgresWorkflowDefinitionStore`. The store reads one exact UUID through
`RequestScopedSql` and preserves owner scope, version/lifecycle/schema version,
state-machine/approval JSON, rule refs, principals and optional effective dates.

**Security / trade-off:** owner-scope FORCE-RLS remains authoritative. Industry
definitions are exact-context only; Tenant definitions remain same-Tenant visible;
PLATFORM definitions require trusted PLATFORM_GLOBAL context and are not implicit
Tenant fallback. Raw ACTIVE/RETIRED/effective-date evidence does not itself make a
definition selected or executable. The Workflow worker remains unable to UPDATE the
definition catalog.

**Boundary:** no active-version/effective-date selection, state-machine
interpretation, approval/rule execution, transition authorization, instance
creation/mutation, route, migration, role, grant or RLS change is introduced.

**Acceptance:** WFD-PG-001…007 in DD-17 and
`tests/postgres/workflow-definition-store.test.mjs`.


## DD-102 — WorkflowInstance raw persistence is readable without becoming transition/execution authority

**Context:** migration 0026 defines Tenant/Industry-scoped WorkflowInstance rows,
including WorkflowDefinition id/version, resource identity, current state, lifecycle,
row version and timestamps. Migration 0031 already requires the exact ACTIVE
WorkflowDefinition version to apply to the instance scope and requires the creator to
belong to the Tenant. The repository does not yet own a complete executable
transition selector/state-machine interpreter/approval-rule engine.

**Decision:** add immutable `PersistedWorkflowInstance`,
`WorkflowInstanceReadPort.loadForContext(...)` and
`PostgresWorkflowInstanceStore`. The store reads one exact UUID through the
existing dedicated `PostgresWorkflowDatabase` + `RequestScopedSql` boundary.

The reader validates only schema-owned shape. `workflow_definition_version` is
positive because the schema says so; `row_version` is preserved as canonical signed
decimal text because the schema does not impose a positivity check. Resource/current
state text is preserved even when empty, and no extra created/updated timestamp order
is invented.

**Security / trade-off:** FORCE-RLS remains the physical Tenant/Industry visibility
authority. Tenant Core rows remain same-Tenant visible inside a Tenant Industry
workspace, while sibling Industry and foreign Tenant instances are not disclosed.
Persisted current/lifecycle/version evidence is not an authorization result.

**Boundary:** DD-102 does not interpret the referenced state-machine JSON, select or
authorize transitions, evaluate approval/rules, mutate tasks, advance rowVersion,
emit workflow events, expose a route or change SQL/roles/privileges.

**Acceptance:** WFI-PG-001…007 in DD-17 and
`tests/postgres/workflow-instance-store.test.mjs`.


## DD-103 — WorkflowTask raw persistence is readable without becoming task-action authority

**Context:** migration 0026 defines parent-scoped WorkflowTask rows, including task
type, assigned subject, permission code, lifecycle state, due/claim/completion
evidence and row version. Migration 0031 already validates parent-instance scope,
PRINCIPAL/ROLE/ORG_UNIT assignment scope and claimant/completer Tenant identity. The
repository does not yet own a complete task-action authorization/execution contract.

**Decision:** add immutable `PersistedWorkflowTask`,
`WorkflowTaskReadPort.loadForContext(...)` and
`PostgresWorkflowTaskStore`. The store reads one exact task UUID through the
existing dedicated `PostgresWorkflowDatabase` + `RequestScopedSql` boundary.

The reader validates only schema-owned shape. Permission code text is preserved even
when empty, and `row_version` is preserved as canonical signed decimal text because
the schema does not impose positivity. Optional due/claim/completion evidence is
returned without interpreting eligibility, expiry or action rights.

**Security / trade-off:** task FORCE-RLS delegates visibility to the RLS-visible
parent WorkflowInstance, so sibling Industry and foreign Tenant tasks are not
disclosed while Tenant Core tasks remain same-Tenant visible. Persisted assignment
and state evidence cannot itself grant claim/approve/reject/complete authority.

**Boundary:** DD-103 does not match the current principal to the assigned subject,
interpret permission_code, apply due/expiry policy, authorize or mutate task actions,
advance parent WorkflowInstance state, emit workflow events, expose a route or change
SQL/roles/privileges.

**Acceptance:** WFT-PG-001…007 in DD-17 and
`tests/postgres/workflow-task-store.test.mjs`.


## DD-104 — WorkflowTransition raw append-only persistence is readable without becoming transition authority

**Context:** migration 0026 defines parent-scoped WorkflowTransition evidence with
raw from/action/to state text, actor/reason evidence, positive expected version,
strictly greater resulting version, occurredAt and correlation id. Migration 0027
makes transition evidence append-only to the Workflow worker role by granting
SELECT/INSERT without UPDATE/DELETE. Migration 0031 already validates exact
parent-instance scope and active Tenant actor identity.

**Decision:** add immutable `PersistedWorkflowTransition`,
`WorkflowTransitionReadPort.loadForContext(...)` and
`PostgresWorkflowTransitionStore`. The store reads one exact transition UUID
through the existing dedicated `PostgresWorkflowDatabase` +
`RequestScopedSql` boundary.

The reader validates only schema-owned shape. From/action/to/reason text is preserved
even when empty. Expected/resulting bigint versions are preserved as positive decimal
text to avoid JavaScript number precision loss, and the schema-owned
`resulting > expected` invariant is revalidated using decimal-string comparison.

**Security / trade-off:** parent WorkflowInstance FORCE-RLS remains the physical
Tenant/Industry visibility authority. Tenant Core transition evidence remains
same-Tenant visible, while sibling Industry and foreign Tenant rows are not
disclosed. Persisted transition evidence records what occurred; it does not authorize
what may occur next.

**Boundary:** DD-104 does not select/authorize a transition, interpret
WorkflowDefinition state-machine/rules/approvals, mutate WorkflowInstance or tasks,
emit downstream workflow events, expose a route, or change SQL/roles/privileges.

**Acceptance:** WTR-PG-001…007 in DD-17 and
`tests/postgres/workflow-transition-store.test.mjs`.


## DD-105 — AutomationDefinition raw persistence is readable without becoming automation execution authority

**Context:** migration 0026 defines versioned owner-scoped AutomationDefinition rows with trigger/config JSON, optional condition-rule / OperationContract / WorkflowDefinition references and effective-date evidence under FORCE-RLS. Migration 0027 grants the dedicated Workflow worker SELECT-only catalog access, and migration 0031 validates creator/approver scope plus referenced WorkflowDefinition ownership. The repository does not yet own a source-complete scheduler, event/manual trigger interpreter, condition-rule evaluator, OperationContract dispatcher or AutomationRun execution authority.

**Decision:** add immutable `PersistedAutomationDefinition`, `AutomationDefinitionReadPort.loadForContext(...)` and `PostgresAutomationDefinitionStore`. The store reads one exact UUID through the existing dedicated `PostgresWorkflowDatabase` + `RequestScopedSql` boundary, validates schema-owned owner/enums/positive integers/timestamps, preserves optional execution references as raw evidence and deep-normalizes trigger/config JSON into immutable values.

**Security / trade-off:** owner-scope FORCE-RLS remains authoritative. Industry definitions are exact-context only; Tenant definitions remain same-Tenant visible; PLATFORM definitions require trusted PLATFORM_GLOBAL context and are not implicit Tenant fallback. Raw lifecycle/effective-date/trigger/reference/config evidence does not itself select, authorize or execute automation. The Workflow worker remains unable to mutate the AutomationDefinition catalog.

**Boundary:** DD-105 does not choose an ACTIVE/effective definition, interpret EVENT/SCHEDULE/MANUAL triggers, parse schedule syntax or event selectors, evaluate condition rules, validate/dispatch an OperationContract, instantiate/execute a WorkflowDefinition, create/update AutomationRun, expose a route, or change migrations, roles, grants, RLS or product policy.

**Acceptance:** WFA-DEF-PG-001…007 in DD-17 and
`tests/postgres/automation-definition-store.test.mjs`.


## DD-106 — AutomationRun raw persistence is readable without becoming automation execution or mutation authority

**Context:** migration 0026 defines Tenant/Industry-scoped AutomationRun rows with AutomationDefinition linkage, raw trigger/idempotency evidence, lifecycle status, timestamps, correlation and optional error evidence under FORCE-RLS. Migration 0027 grants the dedicated Workflow worker SELECT/INSERT/UPDATE on AutomationRun, while migration 0031 validates the referenced AutomationDefinition is active and compatible with the run scope. The repository does not yet own a source-complete trigger executor, retry/finality policy, run-state transition authorizer or automation runtime.

**Decision:** add immutable `PersistedAutomationRun`, `AutomationRunReadPort.loadForContext(...)` and `PostgresAutomationRunStore`. The store reads one exact UUID through the existing dedicated `PostgresWorkflowDatabase` + `RequestScopedSql` boundary, validates schema-owned UUID/status/timestamp shape and completion ordering, and preserves raw trigger reference, idempotency hash, correlation and optional last-error evidence.

**Security / trade-off:** FORCE-RLS remains authoritative. Industry runs are exact-context only; Tenant Core runs remain same-Tenant visible from Tenant Core and Tenant Industry contexts; foreign Tenant rows are undiscoverable. Persisted status/trigger/idempotency/error evidence does not select a trigger, authorize retry/finality or determine a next state. The schema-owned Workflow worker UPDATE privilege remains unchanged; DD-106 exposes no mutation method through its read port.

**Boundary:** DD-106 does not create/select a run, interpret trigger_ref, treat idempotency evidence as replay/authorization authority, choose or authorize status transitions, schedule retry/backoff/finality, evaluate AutomationDefinition trigger/config/conditions, dispatch an OperationContract or WorkflowDefinition, mutate AutomationRun, expose a route, or change migrations, roles, grants, RLS or product policy.

**Acceptance:** WFA-RUN-PG-001…007 in DD-17 and
`tests/postgres/automation-run-store.test.mjs`.

## DD-107 — AI Provider Catalog Metadata Reader

**Decision:** Introduce a bounded exact-by-id PostgreSQL reader for global `core_ai.ai_provider` catalog metadata through the dedicated `sbg_ai_gateway_rw` database role.

**Source ownership and boundary:**
- DD-101 through DD-106 exhaust the six source-owned Workflow/Automation raw persistence tables: `workflow_definition`, `workflow_instance`, `workflow_task`, `workflow_transition`, `automation_definition`, and `automation_run`. Database privileges over those tables do not supply source authority for workflow execution, mutation, replay, retry, transition, selector, or dispatch semantics.
- The AI catalog migrations and AI Gateway role establish `core_ai.ai_provider` as a global catalog and grant `sbg_ai_gateway_rw` read authority without catalog mutation grants.
- `AIProvider.credential_ref` is a secret reference. It is deliberately excluded from the reader SQL projection and returned contract. The existing credential-reference ownership audit forbids disclosure of sensitive secret locators merely because a schema stores the reference.
- The authorized metadata projection is limited to provider `id`, `code`, raw `status`, `adapter_type`, `supported_regions`, `supported_capabilities`, `security_class`, `residency_metadata`, raw `health_state`, positive `version`, `created_at`, and `updated_at`.
- The reader preserves schema-valid raw catalog evidence; it does not reinterpret raw status or health values as provider eligibility, routing, selection, or execution authority.
- No tenant, industry, organization, branch, department, or user `RequestContext` is invented for this global catalog read.
- No schema, migration, role, grant, RLS, or product-policy change is authorized by this decision.

**Runtime semantics explicitly not claimed:**
- credential-reference disclosure, credential resolution, or secret-store retrieval;
- provider/model active-version selection or request eligibility;
- health-based routing, scoring, fallback, retry, replay, or finality;
- tenant/industry allow-list, sensitivity, residency, budget, quota, or policy evaluation;
- provider SDK dispatch, inference, RAG, assistant, agent, or tool execution;
- AI provisioning snapshot compilation/current-selection or prompt/policy evaluation;
- Workflow/Automation execution or mutation semantics.

**Acceptance linkage:** `AIPROV-PG-001` through `AIPROV-PG-005`.


## DD-108 — AI Model catalog metadata is readable as raw global evidence without creating model-selection authority

**Context:** DD-107 established a bounded global AI Provider catalog metadata reader through the dedicated AI Gateway database role. Migration 0011 also defines `core_ai.ai_model` as global catalog persistence, migration 0014 grants `sbg_ai_gateway_rw` SELECT without model-catalog DML, and migration 0031 enforces provider/model integrity. A-07 and DD-09 keep provider/model selection, routing and execution as separate runtime concerns, so catalog status or provider linkage is insufficient authority to choose a model.

**Decision:** add an exact-by-id immutable `AIModelCatalogMetadataReadPort` and `PostgresAIModelCatalogMetadataStore` through the existing `PostgresAIGatewayDatabase` boundary. The reader projects only schema-owned raw model evidence: `id`, `providerId`, `modelCode`, `displayName`, `capabilities`, `contextWindowClass`, `inputModalities`, `outputModalities`, `residencyRegions`, `sensitivityCeiling`, `costClass`, `latencyClass`, raw `status`, positive `version`, and `metadata`. Schema-valid empty text and nullable array elements are preserved instead of strengthened. Missing rows return null; malformed ids, malformed rows, or ambiguous exact-id results fail closed.

**Security / trade-off:** the fixed `sbg_ai_gateway_rw` role remains SELECT-only for `core_ai.ai_model`; no INSERT/UPDATE/DELETE authority or mutation method is added. `providerId`, `status='ACTIVE'`, sensitivity, residency, cost, and latency facts remain catalog evidence only and do not mean selected, current, eligible, preferred, or routable. No Tenant/Industry RequestContext is invented for this global catalog read.

**Boundary:** DD-108 does not define active/current model selection, provider/model routing, fallback/retry, credential resolution, provider SDK execution, inference/embedding, Tenant/Industry allowlists, sensitivity/residency runtime policy, quota/budget execution, AIProvisioningSnapshot compilation/current selection, prompt/policy evaluation, RAG/assistant/agent/tool execution, a public route, or any migration/schema/role/grant/RLS/product-policy change.

**Acceptance:** `AIMODEL-PG-001` through `AIMODEL-PG-005` in DD-17 and `tests/postgres/ai-model-catalog-metadata-store.test.mjs`.

## DD-109 — AI Capability catalog metadata is readable as raw global evidence without creating capability-authorization authority

**Context:** DD-107 and DD-108 established bounded global AI Provider and AI Model catalog metadata readers through the dedicated AI Gateway database role. Migration 0011 also defines `core_ai.ai_capability` as global catalog persistence; migration 0014 grants `sbg_ai_gateway_rw` SELECT without capability-catalog DML; DD-09 owns the capability entity shape. Migration 0031 consumes capability code/id plus `status='ACTIVE'` in persisted relationship-integrity predicates, while A-07 and DD-09 keep request-time entitlement, policy, provisioning, routing and execution behind the AI Gateway. A catalog row is therefore evidence, not standalone authorization.

**Decision:** add an exact-by-id immutable `AICapabilityCatalogMetadataReadPort` and `PostgresAICapabilityCatalogMetadataStore` through the existing `PostgresAIGatewayDatabase` boundary. The reader projects only schema-owned raw capability evidence: `id`, `code`, constrained `category`, nullable raw `requiredEntitlement`, raw `defaultPolicyClass`, positive `schemaVersion`, and raw `status`. Schema-valid empty text and NULL entitlement evidence are preserved instead of strengthened. Missing rows return null; malformed ids, malformed rows, or ambiguous exact-id results fail closed.

**Security / trade-off:** the fixed `sbg_ai_gateway_rw` role remains SELECT-only for `core_ai.ai_capability`; no INSERT/UPDATE/DELETE authority or mutation method is added. `status='ACTIVE'`, `requiredEntitlement`, and `defaultPolicyClass` remain catalog evidence only and do not mean eligible, entitled, permitted, selected, routable, or executable. No Tenant/Industry RequestContext is invented for this global catalog read.

**Boundary:** DD-109 does not evaluate entitlement or `default_policy_class`; resolve effective Tenant/Industry allowed-capability configuration; compile/select an `AIProvisioningSnapshot`; select or route providers/models; perform capability-to-model suitability decisions; enforce sensitivity/residency/quota/budget; resolve credentials; call provider SDKs; execute inference, embedding, rerank, OCR, media generation, RAG, assistants, agents or tools; evaluate prompts/policies; expose a public route; implement Workflow/Automation runtime semantics; or change any migration/schema/verification SQL/role/grant/RLS/product policy.

**Acceptance:** `AICAP-PG-001` through `AICAP-PG-005` in DD-17 and `tests/postgres/ai-capability-catalog-metadata-store.test.mjs`.

## DD-110 — AI Tool Definition catalog metadata is readable as raw global evidence without creating tool-execution authority

**Context:** migration 0013 defines the global `core_ai.ai_tool_definition` catalog, migration 0029 constrains `scope_class` to the governed `PLATFORM_GLOBAL`, `TENANT_CORE`, `TENANT_INDUSTRY`, or `EXPLICIT_CROSS_CONTEXT` vocabulary, and migration 0014 grants the dedicated `sbg_ai_gateway_rw` role SELECT without tool-definition catalog DML. Migration 0031 consumes active tool definitions only in persisted ToolSet/AgentStep relationship-integrity predicates. A-07 and DD-09 keep request-time permission, entitlement, approval, OperationContract, idempotency, audit and tool execution behind separate AI Gateway runtime checks, so a catalog row is evidence rather than execution authority.

**Decision:** add an exact-by-id immutable `AIToolDefinitionCatalogMetadataReadPort` and `PostgresAIToolDefinitionCatalogMetadataStore` through the existing `PostgresAIGatewayDatabase` boundary. The reader projects only schema-owned evidence: `id`, `toolId`, `capabilityCode`, raw `operationContractId`, constrained `scopeClass`, raw `requiredPermission`, nullable raw `requiredEntitlement`, positive input/output schema versions, constrained `sideEffectClass`, nullable `approvalPolicyId`, raw `idempotencyRequired`, raw `auditClass`, raw `status`, positive `version`, and created/updated timestamps. Schema-valid empty text and NULL evidence are preserved where the database permits them; missing rows return null and malformed identifiers or malformed persisted shapes fail closed.

**Security / trade-off:** the fixed `sbg_ai_gateway_rw` role remains SELECT-only for `core_ai.ai_tool_definition`; no INSERT/UPDATE/DELETE authority or mutation/execute method is added. `status='ACTIVE'`, capability linkage, permission/entitlement references, scope, side-effect class, approval-policy reference, idempotency flag, audit class and OperationContract reference remain catalog facts only. They do not mean eligible, authorized, approved, selected, invokable or executable. No Tenant/Industry RequestContext is invented for this global catalog read.

**Boundary:** DD-110 does not evaluate permissions or entitlements; interpret scope into resource authority; resolve effective Tenant/Industry AI configuration; select ToolSets, Assistants, Agents, providers, models, prompts, policies or routes; enforce side effects or approval satisfaction; execute OperationContracts or DTO/schema registries; reserve idempotency; append audit; invoke tools; plan/execute agents; run Workflow/Automation behavior; resolve credentials; call provider SDKs; perform inference/RAG; expose a public route; or change any migration/schema/verification SQL/role/grant/RLS/product policy.

**Acceptance:** `AITOOLDEF-PG-001` through `AITOOLDEF-PG-005` in DD-17 and `tests/postgres/ai-tool-definition-catalog-metadata-store.test.mjs`.

## DD-111 — AI ToolSet raw persistence is readable without becoming ToolSet selection or tool-execution authority

**Context:** migration 0031 physically owns `core_ai.ai_tool_set` as a versioned PLATFORM/TENANT/INDUSTRY-scoped definition under FORCE-RLS, with exact ownership-shape checks, positive version, constrained lifecycle status, scoped uniqueness and at most one ACTIVE version per scoped code. The same migration grants the dedicated AI Gateway role table-level ToolSet DML for Tenant/Industry authoring, while migration 0032 adds a restrictive floor that reserves PLATFORM definition writes for the control-plane role. DD-09 uses ToolSets as persisted Assistant/Agent tool-binding ownership, but separately requires current context, schema, permission, entitlement, approval, OperationContract and audit checks before tool execution.

**Decision:** add immutable `PersistedAIToolSet`, `AIToolSetReadPort.loadForContext(...)` and `PostgresAIToolSetStore` through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary. The reader loads one exact UUID and projects only schema-owned parent ToolSet evidence: id, owner scope, optional Tenant/Industry ownership, raw code, positive version, constrained raw status, and timestamps. Schema-valid empty code is preserved; created/updated ordering is not invented. Missing rows return null; malformed identifiers, malformed persisted shape or route/context mismatch fail closed.

**Security / trade-off:** FORCE-RLS remains authoritative. Industry ToolSets are exact-context only; Tenant ToolSets remain same-Tenant visible from Tenant Core and Tenant Industry contexts; PLATFORM ToolSets require trusted PLATFORM_GLOBAL context and are not implicit Tenant fallback. DD-111 does not mischaracterize `sbg_ai_gateway_rw` as read-only: migration 0031 intentionally gives it ToolSet DML privileges, constrained by RLS and migration-0032 PLATFORM write protection. The new DD-111 port itself is read-only and exposes no mutation, active-selector, member-loader or execution method.

**Boundary:** DD-111 does not select ACTIVE/current/latest ToolSets; perform code/version fallback; load or interpret ToolSet members/constraints; determine tool eligibility; evaluate permission/entitlement/approval/side effects; select Assistants/Agents; validate AgentSteps; execute Tool Definitions or OperationContracts; resolve AI provisioning/configuration; select providers/models/prompts/policies/routes; resolve credentials; perform inference/RAG/agent execution; expose a public route; or change migrations/schema/verification SQL/roles/grants/RLS/product policy.

**Acceptance:** `AITOOLSET-PG-001` through `AITOOLSET-PG-007` in DD-17 and `tests/postgres/ai-tool-set-store.test.mjs`.

## DD-112 — AI PromptSet raw persistence is readable without becoming prompt selection, composition, or execution authority

**Context:** migration 0031 physically owns `core_ai.ai_prompt_set` as a versioned PLATFORM/TENANT/INDUSTRY-scoped definition under FORCE-RLS, with exact ownership-shape checks, positive version, constrained lifecycle status, scoped uniqueness and at most one ACTIVE version per scoped code. DD-09 §2A defines AIPromptSet/AIPromptSetMember and separately states that members must bind ACTIVE PromptTemplates at applicable scope, `IndustryAIConfig.domain_prompt_set_id` must reference an ACTIVE applicable set, and only ACTIVE prompt versions execute. Migration 0031 grants the AI Gateway role PromptSet DML for governed Tenant/Industry authoring; migration 0032 reserves PLATFORM definition writes for the control-plane role.

**Decision:** add immutable `PersistedAIPromptSet`, `AIPromptSetReadPort.loadForContext(...)` and `PostgresAIPromptSetStore` through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary. The reader loads one exact UUID and projects only schema-owned parent PromptSet evidence: id, owner scope, optional Tenant/Industry ownership, raw code, positive version, constrained raw status and timestamps. Schema-valid empty code is preserved; timestamp ordering is not invented. Missing rows return null; malformed ids, persisted shapes or route/context mismatch fail closed.

**Security / trade-off:** FORCE-RLS remains authoritative. Industry PromptSets are exact-context only; Tenant PromptSets remain same-Tenant visible from Tenant Core and Tenant Industry contexts; PLATFORM PromptSets require trusted PLATFORM_GLOBAL context and are not implicit Tenant fallback. DD-112 does not relabel `sbg_ai_gateway_rw` as read-only: existing PromptSet DML authority remains schema-owned and constrained by RLS, while migration-0032 still prevents PLATFORM mutation. The DD-112 port itself is read-only and exposes no mutation, member-loader, active-selector, renderer or execution method.

**Boundary:** DD-112 does not select ACTIVE/current/latest PromptSets; perform code/version fallback; load PromptSet members; apply member priority/enabled filtering; select/approve/render PromptTemplates; resolve `IndustryAIConfig.domain_prompt_set_id`; compose Assistant/system prompts; evaluate prompt-governance precedence; select providers/models/policies/routes; execute tools/agents; resolve credentials; perform inference/RAG/media generation; expose a public route; or change migrations/schema/verification SQL/roles/grants/RLS/product policy.

**Acceptance:** `AIPROMPTSET-PG-001` through `AIPROMPTSET-PG-007` in DD-17 and `tests/postgres/ai-prompt-set-store.test.mjs`.

## DD-113 — AI ToolSetMember raw persistence is readable without becoming effective membership or tool-execution authority

**Context:** migration 0031 physically owns `core_ai.ai_tool_set_member` as the concrete persisted binding from a ToolSet to an AI Tool Definition. The child row is FORCE-RLS and inherits SELECT visibility from its parent ToolSet. Migration 0031 validates that the referenced Tool Definition is ACTIVE when the member is inserted or updated, but persisted member evidence does not prove that the definition or parent ToolSet remains ACTIVE/current later. DD-09 separately requires effective ToolSet membership, schema, fresh RequestContext, DD-03 permission, DD-04 entitlement/limits, approval, OperationContract execution and audit/usage before any tool execution.

**Decision:** add immutable `PersistedAIToolSetMember`, `AIToolSetMemberReadPort.loadForContext(...)` and `PostgresAIToolSetMemberStore` through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary. The reader loads one exact member UUID and returns only persisted evidence: id, ToolSet id, Tool Definition id, raw enabled boolean, normalized immutable `constraint_json`, and created timestamp. Missing rows return null; malformed identifiers, invalid persisted types/JSON or route/context mismatch fail closed.

**Security / trade-off:** member SELECT visibility remains parent-derived FORCE-RLS. Industry-parent members are exact Industry Context only; Tenant-parent members remain same-Tenant visible; PLATFORM-parent members require trusted PLATFORM_GLOBAL context and are not Tenant fallback. Existing AI Gateway child DML privileges remain migration-owned and are constrained by `definition_member_write_allowed` plus migration-0032 PLATFORM-parent write floors. The DD-113 port itself is read-only.

**Boundary:** DD-113 does not list all ToolSet members; calculate an effective member set; interpret `constraint_json`; select ACTIVE/current ToolSets; revalidate current Tool Definition activity as an execution decision; determine tool eligibility; evaluate permission/entitlement/approval/side effects/resource scope; bind or execute AgentSteps; execute Tool Definitions or OperationContracts; select Assistants/Agents/providers/models/prompts/policies/routes; resolve credentials; perform inference/RAG; expose a public route; or change migrations/schema/verification SQL/roles/grants/RLS/product policy.

**Acceptance:** `AITOOLMEM-PG-001` through `AITOOLMEM-PG-007` in DD-17 and `tests/postgres/ai-tool-set-member-store.test.mjs`.

## DD-114 — AI PromptSetMember raw persistence is readable without becoming effective prompt selection, rendering or execution authority

**Context:** migration 0011 owns PromptTemplate scope/version/status persistence, while migration 0031 physically owns `core_ai.ai_prompt_set_member` as a child binding from a PromptSet to a PromptTemplate. The child table is FORCE-RLS and inherits SELECT visibility from its parent PromptSet. On member insert/update, migration 0031 requires an ACTIVE parent PromptSet, an ACTIVE referenced PromptTemplate, and same-or-broader applicable PromptTemplate scope. Those historical write invariants do not make a persisted child row a current prompt-selection or execution decision.

**Decision:** add immutable `PersistedAIPromptSetMember`, `AIPromptSetMemberReadPort.loadForContext(...)` and `PostgresAIPromptSetMemberStore` through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary. The reader loads one exact member UUID and returns only persisted evidence: id, PromptSet id, PromptTemplate id, raw integer priority, raw enabled boolean, and created timestamp. Priority remains any schema-valid integer; no positive/range constraint is invented. Missing rows return null; malformed identifiers, invalid persisted types or route/context mismatch fail closed.

**Security / trade-off:** child SELECT visibility remains parent-derived FORCE-RLS. Industry-parent members are exact Industry Context only; Tenant-parent members remain same-Tenant visible; PLATFORM-parent members require trusted PLATFORM_GLOBAL context and are not Tenant fallback. Existing AI Gateway child DML privileges remain migration-owned and are constrained by definition-member write policy plus migration-0032 PLATFORM-parent write floors. The DD-114 port itself is read-only.

**Boundary:** DD-114 does not list/sort PromptSet members; resolve enabled/effective membership; select ACTIVE/current/latest PromptSets; revalidate current PromptSet/PromptTemplate activity as an execution decision; load/render PromptTemplates; evaluate variable schemas, overrides or grounding behavior; resolve `IndustryAIConfig.domain_prompt_set_id`; select Assistant prompts; compose runtime prompts; evaluate prompt-policy precedence; select providers/models/routes; execute tools/agents; perform inference/RAG/media generation; expose a public route; or change migrations/schema/verification SQL/roles/grants/RLS/product policy.

**Acceptance:** `AIPROMPTMEM-PG-001` through `AIPROMPTMEM-PG-007` in DD-17 and `tests/postgres/ai-prompt-set-member-store.test.mjs`.

## DD-115 — AI PromptTemplate raw persistence is readable without becoming publication, approval, rendering or execution authority

**Context:** migration 0011 physically owns `core_ai.prompt_template` with PLATFORM/TENANT/INDUSTRY scope, versioned raw template/schema/grounding/override metadata, lifecycle status and creator/approver references. Migration 0031 preserves FORCE-RLS reads, moves writes behind `definition_write_allowed`, and verifies creator/approver scope activity at persisted write time. Migration 0032 separately protects PLATFORM definition mutation behind the control-plane role. DD-09 defines prompt publication and states only ACTIVE versions execute, but reading one persisted row is not lifecycle selection, approval satisfaction, rendering or execution.

**Decision:** add immutable `PersistedAIPromptTemplate`, `AIPromptTemplateReadPort.loadForContext(...)` and `PostgresAIPromptTemplateStore` through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary. The reader loads one exact UUID and returns only persisted evidence: id, owner scope, optional Tenant/Industry ownership, raw code, positive version, raw system template, normalized/frozen variable-schema JSON, raw grounding flag, immutable ordered override-field array, raw lifecycle status, creator/optional approver ids, and timestamps. Schema-valid empty text, duplicate/empty override fields, and nullable approval evidence are preserved. Missing rows return null; malformed identifiers, malformed persisted shapes or route/context mismatch fail closed.

**Security / trade-off:** FORCE-RLS remains authoritative. Industry templates are exact-context only; Tenant templates remain same-Tenant visible from Tenant Core and Tenant Industry contexts; PLATFORM templates require trusted PLATFORM_GLOBAL context and are not implicit Tenant fallback. DD-115 does not mischaracterize `sbg_ai_gateway_rw` as read-only: existing migration-owned PromptTemplate DML remains unchanged and PLATFORM mutation remains restricted by migration 0032. The new port itself is read-only.

**Boundary:** DD-115 does not select ACTIVE/current/latest versions; publish or roll back prompts; evaluate approval satisfaction; render template text; execute variable schemas; authorize/merge override fields; enforce grounding; resolve effective PromptSet membership; resolve `IndustryAIConfig.domain_prompt_set_id`; select Assistant prompts; compose runtime prompts; evaluate prompt-policy precedence; select providers/models/routes; execute tools/agents; perform inference/RAG/media generation; expose a public route; or change migrations/schema/verification SQL/roles/grants/RLS/product policy.

**Acceptance:** `AIPROMPTTPL-PG-001` through `AIPROMPTTPL-PG-007` in DD-17 and `tests/postgres/ai-prompt-template-store.test.mjs`.

## DD-116 — AI Policy raw persistence is readable without becoming an evaluated AI policy decision

**Context:** migration 0011 physically owns `core_ai.ai_policy` with PLATFORM/TENANT/INDUSTRY scope, raw integer priority, constrained effect `ALLOW | DENY | RESTRICT`, condition/constraint JSON, positive version and raw status text. Migration 0031 preserves FORCE-RLS reads and moves writes behind `definition_write_allowed`; migration 0032 independently protects PLATFORM definition mutation behind the control-plane role. DD-09 defines persisted AIPolicy fields but does not make a stored row an evaluated request-time decision.

**Decision:** add immutable `PersistedAIPolicy`, `AIPolicyReadPort.loadForContext(...)` and `PostgresAIPolicyStore` through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary. The reader loads one exact UUID and returns only persisted evidence: id, owner scope, optional Tenant/Industry ownership, raw code, raw safe-integer priority, constrained raw effect, normalized/frozen condition AST JSON, normalized/frozen constraint JSON, positive version, raw status, and timestamps. Missing rows return null; malformed identifiers, malformed persisted shapes or route/context mismatch fail closed.

**Security / trade-off:** FORCE-RLS remains authoritative. Industry policies are exact-context only; Tenant policies remain same-Tenant visible from Tenant Core and Tenant Industry contexts; PLATFORM policies require trusted PLATFORM_GLOBAL context and are not implicit Tenant fallback. Existing migration-owned AI Policy DML authority of `sbg_ai_gateway_rw` remains unchanged, while PLATFORM mutation remains protected by migration 0032. The DD-116 port itself is read-only.

**Boundary:** DD-116 does not list or priority-sort policies; determine applicability; parse/evaluate condition ASTs; interpret constraints; apply ALLOW/DENY/RESTRICT precedence; resolve inherited/effective policies; select current/latest policy versions; authorize capabilities; evaluate entitlements; select providers/models/prompts/tools/agents/routes; enforce grounding/override policy; resolve credentials; perform inference/RAG/media generation; execute tools/agents; expose a public route; or change migrations/schema/verification SQL/roles/grants/RLS/product policy.

**Acceptance:** `AIPOLICY-PG-001` through `AIPOLICY-PG-007` in DD-17 and `tests/postgres/ai-policy-store.test.mjs`.

## DD-117 — AI AssistantDefinition raw persistence is readable without becoming Assistant selection, prompt/RAG/tool resolution or execution authority

**Context:** migration 0012 physically owns `core_ai.assistant_definition` with PLATFORM/TENANT/INDUSTRY ownership, allowed-capability array, RAG-scope JSON and prompt/tool/model/retention references. Migration 0031 adds the ToolSet foreign key, ACTIVE-version uniqueness and write-time integrity requiring a duplicate-free/null-free capability set whose codes are ACTIVE, an ACTIVE same-or-broader PromptTemplate, and an ACTIVE same-or-broader optional ToolSet. Those write-time facts do not make a persisted AssistantDefinition row a current runtime selection or authorization decision. DD-09 keeps prompt execution, RAG, model routing, current RequestContext authorization and tool execution in separate runtime behavior.

**Decision:** add immutable `PersistedAIAssistantDefinition`, `AIAssistantDefinitionReadPort.loadForContext(...)` and `PostgresAIAssistantDefinitionStore` through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary. The reader loads one exact UUID and returns only persisted evidence: id, owner scope, optional Tenant/Industry ownership, raw code, immutable duplicate-free allowed-capability string array, normalized/frozen RAG-scope JSON, PromptTemplate id, optional ToolSet id, optional model-policy id, retention-policy id, positive version, raw status and timestamps. Missing rows return null; malformed identifiers, malformed persisted shapes or route/context mismatch fail closed.

**Security / trade-off:** FORCE-RLS remains authoritative. Industry AssistantDefinitions are exact-context only; Tenant definitions remain same-Tenant visible; PLATFORM definitions require trusted PLATFORM_GLOBAL context and are not implicit Tenant fallback. Existing migration-owned AssistantDefinition DML authority remains unchanged and migration 0032 still blocks PLATFORM mutation for the AI Gateway role. DD-117 intentionally does not revalidate referenced capability/PromptTemplate/ToolSet current activity while reading; historical persisted references remain evidence only.

**Boundary:** DD-117 does not select ACTIVE/current/latest Assistants; perform code/version fallback; re-evaluate capability activity/eligibility or entitlements; load/render PromptTemplates; resolve effective ToolSets/members; interpret `rag_scope_rules`; resolve model/retention policies; select providers/models/routes; create/bind conversations; evaluate RequestContext permissions/approvals; execute tools/agents; resolve credentials; perform inference/embeddings/RAG; expose a public route; or change migrations/schema/verification SQL/roles/grants/RLS/product policy.

**Acceptance:** `AIASSIST-PG-001` through `AIASSIST-PG-007` in DD-17 and `tests/postgres/ai-assistant-definition-store.test.mjs`.

## DD-118 — AI AgentDefinition raw persistence is readable without becoming Agent selection, approval, budget or tool-execution authority

**Context:** migration 0013 physically owns `core_ai.agent_definition` with PLATFORM/TENANT/INDUSTRY ownership, raw objective/risk classes, allowed ToolSet reference, approval/budget policy references, positive version and raw status. Migration 0031 adds the ToolSet foreign key, ACTIVE-version uniqueness, and write-time integrity requiring the allowed ToolSet to be ACTIVE and at the same or broader applicable definition scope. That write-time relationship does not make a persisted AgentDefinition a current agent-selection, approval, budget or execution decision. DD-09 separately defines AgentRun/AgentStep/AgentApproval and requires current acting-principal authorization at tool steps.

**Decision:** add immutable `PersistedAIAgentDefinition`, `AIAgentDefinitionReadPort.loadForContext(...)` and `PostgresAIAgentDefinitionStore` through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary. The reader loads one exact UUID and returns only persisted evidence: id, owner scope, optional Tenant/Industry ownership, raw code, raw objective class, allowed ToolSet id, raw max-risk class, approval-policy id, budget-policy id, positive version, raw status and timestamps. Missing rows return null; malformed identifiers, malformed persisted shapes or route/context mismatch fail closed.

**Security / trade-off:** FORCE-RLS remains authoritative. Industry AgentDefinitions are exact-context only; Tenant definitions remain same-Tenant visible; PLATFORM definitions require trusted PLATFORM_GLOBAL context and are not implicit Tenant fallback. Existing migration-owned AgentDefinition DML authority remains unchanged and migration 0032 still blocks PLATFORM mutation for the AI Gateway role. DD-118 intentionally does not revalidate the referenced ToolSet current activity while reading; persisted relationship evidence remains historical/raw.

**Boundary:** DD-118 does not select ACTIVE/current/latest Agents; perform code/version fallback; revalidate effective ToolSet membership; interpret objective or risk classes; resolve approval or budget policies; satisfy approvals/budgets; create AgentRuns; plan/validate/execute AgentSteps; evaluate acting-principal permission/entitlement; execute Tool Definitions/OperationContracts; select Assistants/providers/models/prompts/policies/routes; resolve credentials; perform inference/embeddings/RAG; expose a public route; or change migrations/schema/verification SQL/roles/grants/RLS/product policy.

**Acceptance:** `AIAGENTDEF-PG-001` through `AIAGENTDEF-PG-007` in DD-17 and `tests/postgres/ai-agent-definition-store.test.mjs`.

## DD-119 — AI TenantAIConfig raw persistence is readable without becoming latest/effective configuration or provisioning authority

**Context:** migration 0011 physically owns `core_ai.tenant_ai_config` as versioned Tenant-scoped AI configuration under FORCE-RLS. It stores raw enablement, capability/provider/model allowlists, sensitivity ceiling and policy references. Migration 0031 adds write-time integrity requiring duplicate-free/non-null allowlists and ACTIVE referenced capability/provider/model catalog rows, with allowed models bound to allowed providers. Multiple versions may exist for one Tenant, and `AIProvisioningSnapshot` separately references a concrete `tenant_ai_config_version`. DD-09/A-07 distinguish persisted Tenant configuration from compiled provisioning and live gateway authorization.

**Decision:** add immutable `PersistedAITenantConfig`, `AITenantConfigReadPort.loadForContext(...)` and `PostgresAITenantConfigStore` through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary. The reader loads one exact UUID and returns only persisted evidence: id, Tenant id, raw enabled flag, immutable raw capability/provider/model arrays, constrained raw sensitivity class, residency-policy id, nullable raw monthly-budget-policy reference, retention-policy id, prompt-override-policy id, positive version and updated timestamp. Missing rows return null; malformed identifiers, malformed persisted values or route/context mismatch fail closed.

**Security / trade-off:** Tenant FORCE-RLS remains authoritative. The same Tenant Core or Tenant Industry RequestContext may read Tenant-owned configuration; foreign-Tenant rows are hidden and PLATFORM_GLOBAL context does not bypass Tenant RLS. Existing migration-owned `sbg_ai_gateway_rw` DML authority remains unchanged; DD-119 does not mischaracterize that database role as read-only. The new application port itself is read-only.

**Boundary:** DD-119 does not select latest/current TenantAIConfig; treat `enabled` as runtime authorization; evaluate capability/provider/model eligibility; revalidate current catalog activity; merge/narrow IndustryAIConfig; compile/select/validate `AIProvisioningSnapshot`; evaluate entitlement/subscription/permission/sensitivity/residency/budget/retention/prompt-override policy; route/fallback providers/models; select/render prompts; select/execute assistants/agents/tools; resolve credentials; perform inference/embeddings/RAG/media generation; expose a public route; or change migrations/schema/verification SQL/roles/grants/RLS/product policy.

**Acceptance:** `AITENCFG-PG-001` through `AITENCFG-PG-007` in DD-17 and `tests/postgres/ai-tenant-config-store.test.mjs`.

## DD-120 — AI IndustryAIConfig raw persistence is readable without becoming effective Tenant+Industry configuration or provisioning authority

**Context:** migration 0011 physically owns `core_ai.industry_ai_config` as versioned exact-Industry configuration under FORCE-RLS. Migration 0031 adds write-time integrity requiring duplicate-free/non-null allowlists, non-widening against the latest TenantAIConfig at write time, active Tenant country-pack references, and an ACTIVE applicable optional domain PromptSet. IndustryAIConfig stores no TenantAIConfig version reference, so a persisted row does not identify or reconstruct the Tenant config used at write time. DD-09/A-07 separately define non-widening configuration and compiled provisioning.

**Decision:** add immutable `PersistedAIIndustryConfig`, `AIIndustryConfigReadPort.loadForContext(...)` and `PostgresAIIndustryConfigStore` through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary. The reader loads one exact UUID and returns only persisted evidence: id, Tenant id, Industry Context id, raw enabled flag, immutable raw capability/provider/model arrays, nullable domain PromptSet id, immutable raw country-pack refs, nullable raw localization-profile reference, positive version and updated timestamp. Missing rows return null; malformed identifiers, malformed persisted values or route/context mismatch fail closed.

**Security / trade-off:** exact Industry FORCE-RLS remains authoritative. Tenant Core, sibling Industry, foreign Tenant and PLATFORM_GLOBAL contexts do not implicitly expose a row; the exact owning Tenant+Industry context may read it. Existing migration-owned `sbg_ai_gateway_rw` DML authority remains unchanged; DD-120 does not relabel that database role read-only. The new application port itself is read-only.

**Boundary:** DD-120 does not select latest/current IndustryAIConfig; merge Tenant+Industry configuration; revalidate against current/latest TenantAIConfig; evaluate current catalog/country-pack/domain-PromptSet activity; resolve effective PromptSet membership; compile/select/validate `AIProvisioningSnapshot`; evaluate entitlement/subscription/permission/sensitivity/residency/budget/retention/prompt-policy; route/fallback providers/models; select/render prompts; select/execute assistants/agents/tools; resolve credentials; perform inference/embeddings/RAG/media generation; expose a public route; or change migrations/schema/verification SQL/roles/grants/RLS/product policy.

**Acceptance:** `AIINDCFG-PG-001` through `AIINDCFG-PG-007` in DD-17 and `tests/postgres/ai-industry-config-store.test.mjs`.

## DD-121 — AI Conversation raw persistence is readable without becoming history aggregation, Assistant selection, retention execution or inference authority

**Context:** migration 0012 physically owns `core_ai.ai_conversation` as a Tenant/principal-scoped conversation record with either Tenant-Core or exact Tenant-Industry scope under FORCE-RLS. RLS requires same Tenant and exact owner principal; Tenant-Core rows remain visible to the owner from same-Tenant Core or Industry request contexts, while Industry rows require the exact Industry Context. Migration 0031 validates at write time that the owner principal is active for the Tenant and any referenced AssistantDefinition is then ACTIVE/applicable. Those write-time facts do not make a persisted conversation row a current Assistant selection, message history, retention action or executable AI request.

**Decision:** add immutable `PersistedAIConversation`, `AIConversationReadPort.loadForContext(...)` and `PostgresAIConversationStore` through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary. The reader loads one exact conversation UUID and returns only persisted evidence: id, Tenant id, optional Industry Context, constrained raw scope class, owner principal id, optional AssistantDefinition id, constrained raw sensitivity class, raw retention class, raw status, created timestamp and last-activity timestamp. No timestamp ordering is invented because the database declares none. Missing rows return null; malformed identifiers, malformed persisted shape/types or route/context mismatch fail closed.

**Security / trade-off:** owner-principal + Tenant/Industry FORCE-RLS remains authoritative. Sibling Industry, same-Tenant different principal, foreign Tenant and PLATFORM_GLOBAL contexts cannot bypass it. Existing migration-owned AI Gateway conversation DML authority remains unchanged; the DD-121 application port itself is read-only.

**Boundary:** DD-121 does not list/search conversations; aggregate/carry history across Industry Contexts; load AIMessage content; execute retention/erasure; evaluate sensitivity policy; select/revalidate current Assistants; resolve PromptSets/prompts; merge effective AI configuration; compile/select provisioning; evaluate entitlement/permission/budget/residency; route providers/models; execute tools/agents; call provider SDKs; perform inference/embeddings/RAG; expose a public route; or change migrations/schema/verification SQL/roles/grants/RLS/product policy.

**Acceptance:** `AICONV-PG-001` through `AICONV-PG-007` in DD-17 and `tests/postgres/ai-conversation-store.test.mjs`.

## DD-122 — AI TokenUsage raw persistence is readable without becoming routing, eligibility, quota, billing or execution authority

**Context:** migration 0012 physically owns `core_ai.token_usage` as Tenant/Industry-scoped usage evidence with optional principal attribution, capability/provider/model references, non-negative PostgreSQL numeric unit fields, occurrence time and correlation id. FORCE-RLS is Tenant/Industry based; `principal_id` is attribution rather than a read-visibility predicate. Migration 0031 adds exact model/provider pair referential integrity and validates a non-null usage principal as active for the Tenant at write time. Those persisted relationships do not make historical usage evidence a current provider/model/capability selection or authorization decision. DD-09 owns usage/cost as observability evidence and separates routing, permission/entitlement, provider execution and billing semantics.

**Decision:** add immutable `PersistedAITokenUsage`, `AITokenUsageReadPort.loadForContext(...)` and `PostgresAITokenUsageStore` through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary. The reader loads one exact UUID and returns only persisted evidence: id, Tenant id, optional Industry Context, optional principal attribution, raw capability code, provider/model ids, PostgreSQL `numeric::text` input/output/media unit evidence, occurrence timestamp and correlation id. Numeric values are not converted through JavaScript floating-point arithmetic. Missing rows return null; malformed identifiers, invalid persisted types or route/context mismatch fail closed.

**Security / trade-off:** FORCE-RLS remains authoritative. Industry usage is exact-context only; Tenant-Core usage is same-Tenant visible from Tenant Core or Tenant Industry contexts; foreign-Tenant and PLATFORM_GLOBAL contexts cannot expose a Tenant usage row. Same-scope access is not principal-private because the database policy does not predicate on `principal_id`. Existing migration-owned AI Gateway TokenUsage DML authority remains unchanged; the DD-122 application port itself is read-only.

**Boundary:** DD-122 does not select/revalidate current providers, models or capabilities; infer routing/eligibility/preference/fallback; evaluate entitlement, permission, budget, quota or limits; aggregate usage or select metering windows; apply provider rates; compute/load/finalize `ai_cost`; perform billing; load conversation/message/prompt content; perform inference/embeddings/RAG/media generation; execute tools/agents; expose a public route; or change migrations/schema/verification SQL/roles/grants/RLS/product policy.

**Acceptance:** `AIUSAGE-PG-001` through `AIUSAGE-PG-007` in DD-17 and `tests/postgres/ai-token-usage-store.test.mjs`.

## DD-123 — AI Cost raw persistence is readable without becoming pricing, billing, finalization or execution authority

**Context:** migration 0012 physically owns `core_ai.ai_cost` as one cost row keyed by `token_usage.usage_id`, with raw three-character currency, non-negative PostgreSQL bigint estimated minor units, raw provider-rate version, raw billable class and optional finalized timestamp. AI Cost FORCE-RLS derives visibility from the referenced TokenUsage row, so Tenant/Industry visibility follows the already-governed TokenUsage parent rather than principal-private ownership. Migration 0014 grants the AI Gateway role table DML. DD-09 names usage/cost as observability evidence but does not define a provider-rate formula, currency conversion rule, invoice linkage or billing-posting behavior for this reader.

**Decision:** add immutable `PersistedAICost`, `AICostReadPort.loadForContext(...)` and `PostgresAICostStore` through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary. The reader loads one exact usage UUID and returns only persisted evidence: usage id, raw currency, exact `bigint::text` estimated minor units, raw provider-rate version, raw billable class and optional finalized timestamp. PostgreSQL bigint evidence is not converted through JavaScript number arithmetic. Missing rows return null; malformed identifiers, invalid persisted types or route/context mismatch fail closed.

**Security / trade-off:** parent TokenUsage FORCE-RLS remains authoritative. Industry cost is exact-context visible; Tenant-Core cost is same-Tenant visible from Tenant Core or Tenant Industry contexts; principal attribution on the parent is not a read-ownership predicate; foreign-Tenant and PLATFORM_GLOBAL contexts do not expose the row. Existing migration-owned AI Gateway Cost DML authority remains unchanged; the DD-123 application port itself is read-only.

**Boundary:** DD-123 does not look up/apply provider rates; convert currency; recompute/reconcile/finalize cost; aggregate usage; select metering windows; evaluate quota/entitlement/budget; interpret billable class; create invoices/tax/payment/dunning/ledger entries; select providers/models/routes; mutate TokenUsage or Cost; load prompt/conversation/message content; perform inference/RAG/media/tool/agent execution; expose a public route; or change migrations/schema/verification SQL/roles/grants/RLS/product policy.

**Acceptance:** `AICOST-PG-001` through `AICOST-PG-007` in DD-17 and `tests/postgres/ai-cost-store.test.mjs`.

## DD-124 — AI ProvisioningSnapshot raw persistence is readable without becoming current/effective provisioning or authorization authority

**Context:** migration 0011 physically owns `core_ai.ai_provisioning_snapshot` as a Tenant/Tenant-Industry persisted snapshot with positive version, commercial/config version references, pack-version maps, governed allowlists, optional budget-policy reference, lifecycle status and compile/valid-until timestamps under FORCE-RLS. Migration 0031 validates at write time that maps/sets are well formed, API classes are governed, the referenced TenantAIConfig exists/enabled and is not widened, an Industry activation version matches the then-active Industry Context, and commercial Subscription/EntitlementSnapshot versions are then current and same-Tenant. A-07 explicitly states that provisioning enables capability definitions while execution remains subject to live Gateway authorization. Persisted write-time consistency therefore does not make an exact row a current/effective authorization decision.

**Decision:** add immutable `PersistedAIProvisioningSnapshot`, `AIProvisioningSnapshotReadPort.loadForContext(...)` and `PostgresAIProvisioningSnapshotStore` through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary. The reader loads one exact snapshot UUID and returns only persisted evidence: id, Tenant/optional Industry ownership, exact bigint-text versions, immutable normalized MS/country pack maps, immutable capability/API/provider/model-class arrays, optional budget-policy reference, raw constrained status, compiled timestamp and optional valid-until timestamp. Bigint values are selected as text to avoid JavaScript precision loss. Missing rows return null; malformed identifiers, malformed persisted shapes or route/context mismatch fail closed.

**Security / trade-off:** snapshot FORCE-RLS remains authoritative. Industry snapshots are exact-context only; Tenant-Core snapshots are same-Tenant visible from Tenant Core or Tenant Industry contexts; foreign-Tenant and PLATFORM_GLOBAL contexts do not expose the row. No principal id participates in ProvisioningSnapshot RLS. Existing migration-owned AI Gateway ProvisioningSnapshot DML authority remains unchanged; the DD-124 application port itself is read-only.

**Boundary:** DD-124 does not select ACTIVE/current/latest snapshots; evaluate `valid_until` against wall-clock time; compile/recompile provisioning; revalidate current Subscription, EntitlementSnapshot, TenantAIConfig or Industry activation; merge effective Tenant+Industry configuration; evaluate capability/API/provider/model-class eligibility; evaluate permission/entitlement/budget/residency/sensitivity; route/fallback providers/models; select/render prompts; select/execute Assistants/Agents/Tools; perform inference/embeddings/RAG/media generation; expose a public route; or change migrations/schema/verification SQL/roles/grants/RLS/product policy.

**Acceptance:** `AIPROVSNAP-PG-001` through `AIPROVSNAP-PG-007` in DD-17 and `tests/postgres/ai-provisioning-snapshot-store.test.mjs`.

## DD-125 — AI MediaRequest raw persistence is readable without becoming media-generation, moderation or publication authority

**Context:** migration 0011 physically owns `core_ai.ai_media_request` as Tenant/Industry-scoped persisted request evidence, and migration 0031 adds relationship-integrity checks for active principals, duplicate-free document refs, optional prompt/version applicability, and exact input-document scope/security/residency at write time. The table is FORCE-RLS. SELECT visibility is same Tenant plus either Tenant-Core or exact Industry Context; it is not principal-private. Migration 0014 gives the AI Gateway role MediaRequest DML, while A-07/DD-09 keep provider/model selection, prompt execution, moderation, generated-output governance and DocumentMeta registration behind separate runtime boundaries.

**Decision:** add immutable `PersistedAIMediaRequest`, `AIMediaRequestReadPort.loadForContext(...)` and `PostgresAIMediaRequestStore` through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary. The reader loads one exact request UUID and returns only persisted evidence: Tenant/Industry ownership, principal attribution, raw capability code, constrained media type, optional prompt id/version, optional bigint-text brand-config version, optional raw localization profile reference, immutable UUID input-document refs, constrained sensitivity class, raw residency/moderation/status fields, and created/completed timestamps. Missing rows return null; malformed identifiers, invalid persisted shapes or route/context mismatch fail closed.

**Security / trade-off:** sibling Industry, foreign Tenant and PLATFORM_GLOBAL contexts cannot read a Tenant/Industry request, while another active principal in the same visible scope may read it because the SELECT RLS policy is scope-based rather than principal-private. Bigint brand version is selected as text to avoid JavaScript precision loss. The DD-125 port itself is read-only and does not expose MediaRequest DML even though the database role retains migration-owned write privileges.

**Boundary:** DD-125 does not generate media; select providers/models/routes; load/render prompts or select current prompt versions; revalidate current input-document ACL/state/scan/sensitivity/residency; execute or interpret moderation policy; treat raw status/completed-at as a governed completion/publication verdict; create generated outputs or DocumentMeta provenance; resolve brand/localization profiles; evaluate capability/entitlement/permission/budget/residency authorization; perform retry/fallback; expose a public route; or change migrations/schema/verification SQL/roles/grants/RLS/product policy.

**Acceptance:** `AIMEDIAREQ-PG-001` through `AIMEDIAREQ-PG-007` in DD-17 and `tests/postgres/ai-media-request-store.test.mjs`.

## DD-126 — AIMessage raw persistence is readable without becoming history, decryption, source-authorization, routing or retention authority

**Context:** migration 0012 physically owns `core_ai.ai_message` as a child of `core_ai.ai_conversation`. Message FORCE-RLS visibility is parent-derived: a message is visible only when its parent Conversation is visible, and Conversation RLS is Tenant + optional exact Industry + exact owner principal. Migration 0014 grants the AI Gateway role message DML. DD-09 states that message persistence follows policy and not every interaction must be retained; role/content/source/model-route/deleted fields therefore remain persistence evidence rather than execution semantics.

**Decision:** add immutable `PersistedAIMessage`, `AIMessageReadPort.loadForContext(...)` and `PostgresAIMessageStore` through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary. The reader loads one exact UUID and returns only id, Conversation id, raw role, raw content reference/encrypted content, optional normalized immutable source JSON, optional model-route UUID, created timestamp and optional deleted timestamp. Schema-valid empty text and timestamp ordering are preserved without invented meaning.

**Security / trade-off:** message visibility remains principal-private through the visible parent Conversation. Sibling Industry, another same-Tenant principal, foreign Tenant and PLATFORM_GLOBAL contexts cannot bypass the parent policy. The new port is read-only even though the AI Gateway database role retains migration-owned DML authority.

**Boundary:** DD-126 does not list/order conversation history; interpret roles; decrypt/dereference content; resolve/authorize source refs; resolve/select model routes or providers/models; treat deleted-at as completed retention/erasure/legal-hold evidence; reconstruct prompts; perform inference/RAG; expose public routes; or change schema/roles/grants/RLS/product policy.

**Acceptance:** `AIMSG-PG-001` through `AIMSG-PG-007` in DD-17 and `tests/postgres/ai-message-store.test.mjs`.

## DD-127 — AI RAGSource raw persistence is readable without becoming retrieval, ACL, chunking, embedding, grounding or inference authority

**Context:** migration 0012 physically owns `core_ai.rag_source` as Tenant-Core or exact Tenant-Industry source-registration evidence under FORCE-RLS. Migration 0031 adds write-time DocumentMeta integrity: when a document reference exists, version/scope/residency/sensitivity must match an then-ACTIVE/CLEAN document; a document version cannot exist without a document id. Those write-time facts do not prove that the document remains current, clean, authorized or retrievable later. DD-09 separately requires scoped/ACL-governed RAG retrieval and treats retrieved content as untrusted data that cannot alter tool/authorization policy.

**Decision:** add immutable `PersistedAIRAGSource`, `AIRAGSourceReadPort.loadForContext(...)` and `PostgresAIRAGSourceStore` through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary. The reader loads one exact UUID and returns only persisted source-registration evidence: Tenant/optional Industry ownership, constrained scope/sensitivity classes, raw source/module/MS/resource metadata, optional document id/version, raw residency/retention/ACL/status, exact bigint-text source version, raw chunking-policy version and timestamps. Schema-valid raw empty/null evidence is preserved and no timestamp ordering is invented.

**Security / trade-off:** RAGSource FORCE-RLS remains authoritative. Industry sources are exact-context only; Tenant-Core sources are same-Tenant visible from Tenant Core or Tenant Industry contexts; the policy is scope-based rather than principal-private. Foreign-Tenant and PLATFORM_GLOBAL contexts do not expose Tenant source rows. Existing migration-owned AI Gateway RAGSource DML remains unchanged; the DD-127 application port itself is read-only.

**Boundary:** DD-127 does not reload/revalidate current DocumentMeta; evaluate document ACL or `acl_policy_ref`; revalidate scan/status/sensitivity/residency; select current/latest source versions; dereference source resources; list chunks; execute chunking policy; select embedding models; perform vector search/retrieval/ranking/filtering/grounding; compose prompts; execute prompt-injection defenses; route providers/models; perform inference/RAG; expose public routes; or change schema/roles/grants/RLS/product policy.

**Acceptance:** `AIRAGSRC-PG-001` through `AIRAGSRC-PG-007` in DD-17 and `tests/postgres/ai-rag-source-store.test.mjs`.

## DD-128 — AI RAGChunk metadata is readable without becoming ACL, vector-search, retrieval, grounding or inference authority

**Context:** migration 0012 physically owns `core_ai.rag_chunk` as Tenant-Core or exact Tenant-Industry chunk persistence under FORCE-RLS, with source linkage, non-negative ordinal, raw text/hash evidence, bounded token count, ACL projection JSON, sensitivity/residency/retention fields, embedding-model/version references, a persisted vector payload, metadata JSON and created timestamp. Migration 0031 adds write-time integrity requiring source ownership/scope/residency/retention agreement, no sensitivity downgrade relative to the source, and an ACTIVE embedding model whose sensitivity ceiling is sufficient at write time. DD-09 separately requires current source/resource ACL and scope/security filtering before vector/FTS retrieval and reranking. Historical chunk persistence therefore does not prove current ACL authorization, model eligibility, retrieval participation or grounding authority.

**Decision:** add immutable `PersistedAIRAGChunkMetadata`, `AIRAGChunkMetadataReadPort.loadForContext(...)` and `PostgresAIRAGChunkMetadataStore` through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary. The reader loads one exact chunk UUID and returns only non-vector persisted metadata: id, source id, Tenant/optional Industry ownership, constrained scope class, non-negative chunk ordinal, raw text reference/encrypted text, raw content hash, bounded token count, normalized immutable ACL projection JSON, constrained sensitivity class, raw residency/retention, embedding model id, raw embedding version, normalized immutable metadata JSON and created timestamp. The persisted vector payload is intentionally not selected.

**Security / trade-off:** RAGChunk FORCE-RLS remains authoritative. Industry chunks are exact-context only; Tenant-Core chunks remain same-Tenant visible from Tenant Core or Tenant Industry contexts; the policy is scope-based rather than principal-private; foreign-Tenant and PLATFORM_GLOBAL contexts cannot expose Tenant chunk rows. Existing migration-owned AI Gateway RAGChunk DML authority remains unchanged; the DD-128 application port itself is read-only. Persisted embedding-model identity/version remains evidence only even if the referenced model is later RETIRED.

**Boundary:** DD-128 does not materialize embedding vectors; perform vector similarity or FTS search; select current/latest RAGSource versions; revalidate current RAGSource/DocumentMeta/ACL/scan/sensitivity/residency; interpret ACL projection as acting-principal authorization; select/revalidate embedding models; decide chunk currentness/dedup/reindex; execute chunking policy; retrieve/rank/rerank/filter/ground/cite chunks; decrypt/dereference chunk text; compose prompts; execute injection defenses; route providers/models; perform inference/RAG; expose public routes; or change migrations/schema/verification SQL/roles/grants/RLS/product policy.

**Acceptance:** `AIRAGCHUNK-PG-001` through `AIRAGCHUNK-PG-007` in DD-17 and `tests/postgres/ai-rag-chunk-metadata-store.test.mjs`.

## DD-129 — AI MemoryRecord raw persistence is readable without becoming current-memory, ACL, retention, decryption, history or execution authority

**Context:** migration 0012 physically owns `core_ai.ai_memory_record` as Tenant-Core or exact Tenant-Industry memory persistence with optional principal and AssistantDefinition attribution, constrained memory/sensitivity/status classes, raw content/source/retention/ACL evidence, optional expiry and supersession linkage, and FORCE-RLS. Visibility requires same Tenant, exact Industry when the row is Industry-scoped, and exact principal when `principal_id` is non-null; null-principal rows are scope-shared. Migration 0031 adds write-time principal/Assistant applicability and exact-scope supersession integrity. DD-09 separately requires scope + ACL governed lookup and explicitly forbids automatic history carry across Industry Context switches. Persisted visibility/write-time validity therefore does not constitute current-memory selection or retrieval authorization.

**Decision:** add immutable `PersistedAIMemoryRecord`, `AIMemoryRecordReadPort.loadForContext(...)` and `PostgresAIMemoryRecordStore` through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary. The reader loads one exact UUID and returns only persisted evidence: id, Tenant/optional Industry ownership, optional principal/Assistant references, constrained memory class, raw content/source evidence, constrained sensitivity, raw retention/ACL evidence, constrained lifecycle status, created/optional expiry timestamps and optional supersedes id. Missing rows return null; malformed identifiers, invalid persisted enum/timestamp/scope shapes or route/context mismatch fail closed.

**Security / trade-off:** MemoryRecord FORCE-RLS remains authoritative. Principal-owned memory is private to the exact principal; null-principal memory is scope-shared; Industry rows are exact-context only; Tenant-Core rows remain same-Tenant visible from Tenant Core or Tenant Industry contexts; foreign-Tenant and PLATFORM_GLOBAL contexts do not bypass Tenant memory RLS. Same-Tenant Tenant-Core raw visibility from an Industry context is not interpreted as automatic cross-context history carry. Existing migration-owned AI Gateway MemoryRecord DML authority remains unchanged; the DD-129 application port itself is read-only.

**Boundary:** DD-129 does not search/list memory; assemble conversation/history; select current/latest memory; resolve supersession chains; evaluate expiry against wall-clock time; execute retention/legal-hold/erasure; evaluate ACL policy or acting-principal authorization beyond existing RLS; carry Tenant-Core memory automatically into another Industry experience; decrypt/dereference content or source references; revalidate current principal/Assistant applicability; select Assistants; compose prompts; route providers/models; execute tools/agents; perform inference/RAG; expose public routes; or change migrations/schema/verification SQL/roles/grants/RLS/product policy.

**Acceptance:** `AIMEM-PG-001` through `AIMEM-PG-007` in DD-17 and `tests/postgres/ai-memory-record-store.test.mjs`.

## DD-130 — AI AgentRun raw persistence is readable without becoming current authorization, resume or execution authority

**Context:** migration 0013 physically owns `core_ai.agent_run` with Tenant/optional Industry scope, acting principal, optional membership, startup entitlement/permission versions, raw requested-resource scope JSON, constrained lifecycle status, raw step/token budget classes, timestamps and correlation id. FORCE-RLS requires exact Tenant + acting principal and exact Industry Context for Industry runs; Tenant-Core runs remain same-principal/same-Tenant visible from Tenant Core or Tenant Industry contexts. Migration 0031 validates AgentDefinition/principal/membership applicability at write time. DD-09 explicitly requires the acting principal's current AccessDecision at each tool step, so startup snapshots and persisted run state are not permanent authorization.

**Decision:** add immutable `PersistedAIAgentRun`, `AIAgentRunReadPort.loadForContext(...)` and `PostgresAIAgentRunStore` through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary. The reader loads one exact UUID and returns only persisted evidence: AgentDefinition/Tenant/optional Industry/acting-principal/optional membership ids, exact bigint-text entitlement and permission versions, normalized immutable requested-resource-scope JSON, constrained raw status, raw budget classes, timestamps and correlation id. Missing rows return null; malformed identifiers/types/JSON or route/context mismatch fail closed.

**Security / trade-off:** AgentRun visibility remains principal-scoped FORCE-RLS. Sibling Industry, other principal, foreign Tenant and PLATFORM_GLOBAL contexts cannot bypass it. Existing `sbg_ai_gateway_rw` AgentRun DML authority remains migration-owned; the DD-130 application port is read-only.

**Boundary:** DD-130 does not list/select current runs; interpret status as resumable/executable authority; transition/cancel/resume runs; load/plan/execute AgentSteps; load/satisfy AgentApprovals; revalidate current AgentDefinition/principal/membership/permission/entitlement; interpret requested resource scope as authorization; evaluate or consume budgets; resolve ToolSets/members; perform permission/entitlement/approval checks; execute OperationContracts; select providers/models/prompts/RAG routes; perform inference; expose a public route; or change migrations/schema/verification SQL/roles/grants/RLS/product policy.

**Acceptance:** `AIAGENTRUN-PG-001` through `AIAGENTRUN-PG-007` in DD-17 and `tests/postgres/ai-agent-run-store.test.mjs`.

## DD-131 — AI AgentStep raw persistence is readable without becoming current step eligibility, approval or execution authority

**Context:** migration 0013 owns `core_ai.agent_step` as a child of AgentRun with non-negative ordinal, constrained step type/status, optional raw input/output/tool-binding/approval/audit references and lifecycle timestamps. FORCE-RLS visibility is parent-derived through AgentRun, therefore preserving its Tenant + acting-principal + optional exact-Industry boundary. Migration 0031 validates TOOL binding and same-step/run approval relationships at write time. DD-09 separately requires current RequestContext, permission, entitlement and approval checks before tool execution.

**Decision:** add immutable `PersistedAIAgentStep`, `AIAgentStepReadPort.loadForContext(...)` and `PostgresAIAgentStepStore` through the existing AI Gateway + RequestScopedSql boundary. The reader returns only exact persisted evidence and validates only schema-owned UUID/ordinal/type/status/timestamp constraints. Missing rows return null; malformed ids/types or route/context mismatch fail closed.

**Security / trade-off:** AgentStep visibility remains parent-derived FORCE-RLS. Sibling Industry, different principal, foreign Tenant and PLATFORM_GLOBAL contexts cannot bypass the parent AgentRun boundary. Existing AI Gateway AgentStep DML authority remains schema-owned; DD-131 exposes only a read port.

**Boundary:** DD-131 does not list/plan/select next steps; transition statuses; interpret input/output refs; resolve current ToolSet/member/ToolDefinition eligibility; evaluate current permission/entitlement/approval/resource scope; satisfy approvals; execute OperationContracts; retry/resume/cancel AgentRuns; route provider/model/prompt/RAG or perform inference.

**Acceptance:** `AIAGENTSTEP-PG-001` through `AIAGENTSTEP-PG-007`.

## DD-132 — AI AgentApproval raw persistence is readable without becoming current approval satisfaction, resume or tool-execution authority

**Context:** migration 0013 owns `core_ai.agent_approval` with direct Tenant/Industry FORCE-RLS and status `PENDING | APPROVED | REJECTED | EXPIRED`. Migration 0031 binds approval run/step/scope and optional approver tenancy at write time. DD-09 states that required approval blocks execution unless APPROVED and that approval itself is revalidated for approver permission/context.

**Decision:** add immutable `PersistedAIAgentApproval`, `AIAgentApprovalReadPort.loadForContext(...)` and `PostgresAIAgentApprovalStore` through the existing AI Gateway + RequestScopedSql boundary. The reader returns only persisted approval identifiers, scope, requested-by-agent flag, raw type/permission/summary/reason, optional approver/approved timestamp, constrained raw status, correlation id and created timestamp. Schema-valid empty text and nullable evidence are preserved.

**Security / trade-off:** approval SELECT visibility follows direct Tenant/Industry RLS rather than AgentRun acting-principal privacy; another principal in the same exact scope may read approval evidence. That visibility does not confer approver authority. Existing AI Gateway AgentApproval DML authority remains migration-owned; DD-132 exposes only a read port.

**Boundary:** DD-132 does not satisfy/revalidate approval; evaluate approver/current permission/risk/side-effect policy; select next AgentStep; resume AgentRun; validate current ToolSet/ToolDefinition; execute OperationContracts/tools/agents; route providers/models/prompts/RAG; or change database policy.

**Acceptance:** `AIAGENTAPP-PG-001` through `AIAGENTAPP-PG-007`.

## DD-133 — MetadataDefinition raw persistence is readable without becoming current/effective metadata, schema-validation or compilation authority

**Context:** migration 0001 physically owns `core_config.metadata_definition` as a versioned PLATFORM/TENANT/INDUSTRY definition under FORCE-RLS. It persists raw code/kind, lifecycle status, schema JSON/schema version, creator/approver references and optional effective timestamps. The table has scoped uniqueness and at most one ACTIVE row per scoped code, but no database-owned effective-window ordering/current-selection rule. A-01 owns Metadata as reusable configuration/field/schema-independent definition evidence with explicit draft/publish/activate/rollback semantics. Reading one row therefore does not itself perform those lifecycle transitions or select an effective definition.

**Decision:** add immutable `PersistedMetadataDefinition`, `MetadataDefinitionReadPort.loadForContext(...)` and `PostgresMetadataDefinitionStore` through the existing `PostgresDatabase` + `RequestScopedSql` application boundary. The reader loads one exact UUID and returns only schema-owned persistence evidence: id, constrained owner scope, optional Tenant/Industry ownership, raw code/kind, positive version, constrained lifecycle status, normalized immutable schema JSON, positive schema version, creator/optional approver UUIDs, optional effective timestamps, and created/updated timestamps. Schema-valid empty text and even non-ordered effective timestamps are preserved rather than strengthened.

**Security / trade-off:** FORCE-RLS remains authoritative. Industry definitions require exact Industry Context; Tenant definitions remain same-Tenant visible from Tenant Core or Tenant Industry contexts; PLATFORM definitions require trusted PLATFORM_GLOBAL context and are not implicit Tenant fallback. Migration 0009 intentionally gives `sbg_app_rw` table-level DML on `core_config`; DD-133 does not relabel that database role read-only. The new application port itself exposes only exact read.

**Boundary:** DD-133 does not select ACTIVE/current/latest definitions; perform code/version fallback, inheritance or override precedence; publish/activate/retire/rollback definitions; interpret or execute schema JSON; validate runtime payloads; compile dynamic fields/forms/rules; resolve effective metadata merges; invalidate caches/search/projections; evaluate permission/entitlement; expose a public route; or change migrations/schema/verification SQL/roles/grants/RLS/product policy.

**Acceptance:** `METADATADEF-PG-001` through `METADATADEF-PG-007` in DD-17 and `tests/postgres/metadata-definition-store.test.mjs`.

## DD-134 — RuleDefinition raw persistence is readable without becoming current/effective rule selection, evaluation or authorization authority

**Context:** migration 0001 physically owns `core_config.rule_definition` as a versioned PLATFORM/TENANT/INDUSTRY definition under FORCE-RLS. It persists raw code, lifecycle status, schema version, input-schema/condition-AST/decision JSON, unconstrained signed integer priority, safety class, optional required-permission text, creator/approver references and optional effective timestamps. The table has scoped uniqueness and at most one ACTIVE row per scoped code, but no database-owned effective-window ordering, priority resolution or runtime evaluator. DD-030 requires shared rule payloads to remain declarative/safe and prohibits arbitrary executable payloads; reading one persisted row does not itself enforce publish safety or execute a rule.

**Decision:** add immutable `PersistedRuleDefinition`, `RuleDefinitionReadPort.loadForContext(...)` and `PostgresRuleDefinitionStore` through the existing `PostgresDatabase` + `RequestScopedSql` application boundary. The reader loads one exact UUID and returns only schema-owned persistence evidence: id, constrained owner scope, optional Tenant/Industry ownership, raw code, positive version, constrained lifecycle status, positive schema version, normalized immutable input-schema/condition-AST/decision JSON, any safe-integer priority, constrained safety class, optional raw required-permission text, creator/optional approver UUIDs, optional effective timestamps, and created/updated timestamps. Schema-valid empty text, negative priority and non-ordered timestamps are preserved rather than strengthened.

**Security / trade-off:** FORCE-RLS remains authoritative. Industry definitions require exact Industry Context; Tenant definitions remain same-Tenant visible from Tenant Core or Tenant Industry contexts; PLATFORM definitions require trusted PLATFORM_GLOBAL context and are not implicit Tenant fallback. Migration 0009 supplies table-level `sbg_app_rw` DML privileges while later write hardening, including migration 0032's restrictive PLATFORM-definition write floor, remains authoritative. DD-134 does not relabel the database role read-only; the application port itself exposes only exact read.

**Boundary:** DD-134 does not select ACTIVE/current/latest definitions; perform code/version fallback, inheritance or override precedence; publish/activate/retire/rollback definitions; validate input JSON Schema; parse or evaluate condition AST; interpret/apply decision JSON; order/resolve rules by priority; enforce safety class at runtime; evaluate required permission; execute business/configuration/validation rules; perform Authorization PDP behavior; bind FormDefinition/validation chains; compile caches/search/projections; expose a public route; or change migrations/schema/verification SQL/roles/grants/RLS/product policy.

**Acceptance:** `RULEDEF-PG-001` through `RULEDEF-PG-007` in DD-17 and `tests/postgres/rule-definition-store.test.mjs`.

## DD-135 — FormDefinition raw persistence is readable without becoming field expansion, rendering, validation-chain or submit authority

**Context:** migration 0001 physically owns `core_config.form_definition` as a versioned PLATFORM/TENANT/INDUSTRY definition under FORCE-RLS. It persists raw code, lifecycle status, schema version, purpose code, optional submit-operation id, layout-schema JSON, validation-rule references, optional localization prefix, allowed-surface classes, creator/approver references and optional effective timestamps. Migration 0002 separately applies parent-derived FORCE-RLS to `form_field_definition`; migration 0029 makes Tenant/Industry ownership immutable; migration 0032 protects PLATFORM definition writes and child writes under PLATFORM parents. None of those boundaries turns one parent read into field listing, rule resolution, rendering or submit execution.

**Decision:** add immutable `PersistedFormDefinition`, `FormDefinitionReadPort.loadForContext(...)` and `PostgresFormDefinitionStore` through the existing `PostgresDatabase` + `RequestScopedSql` application boundary. The reader loads one exact UUID and returns only schema-owned parent persistence evidence: id, constrained owner scope, optional Tenant/Industry ownership, raw code, positive version, constrained lifecycle status, positive schema version, raw purpose/optional submit operation text, normalized immutable layout JSON, immutable raw validation-rule and allowed-surface arrays, optional raw localization prefix, creator/optional approver UUIDs, optional effective timestamps and created/updated timestamps. Because the physical text-array columns have no element-null, uniqueness, vocabulary or order constraint, duplicate/null elements are preserved rather than strengthened.

**Security / trade-off:** FORCE-RLS remains authoritative. Industry definitions require exact Industry Context; Tenant definitions remain same-Tenant visible from Tenant Core or Tenant Industry contexts; PLATFORM definitions require trusted PLATFORM_GLOBAL context and are not implicit Tenant fallback. Existing `sbg_app_rw` table privileges and migration 0029/0032 write restrictions remain schema-owned. DD-135 does not relabel database authority read-only; the application port itself exposes only exact parent read.

**Boundary:** DD-135 does not select ACTIVE/current/latest definitions; perform code/version fallback, inheritance or override precedence; publish/activate/retire/rollback definitions; list/resolve `form_field_definition` children; interpret field type/required/read-only/visibility/reference/sensitivity semantics; validate/render/compile layout schema; resolve or evaluate RuleDefinitions; execute validation chains; bind/invoke submit OperationContracts; enforce surface eligibility; resolve localization keys; compile metadata/dynamic fields; evaluate permissions/entitlements; expose a public route; or change migrations/schema/verification SQL/roles/grants/RLS/product policy.

**Acceptance:** `FORMDEF-PG-001` through `FORMDEF-PG-007` in DD-17 and `tests/postgres/form-definition-store.test.mjs`.

## DD-136 — FormFieldDefinition raw persistence is readable without becoming field enforcement, rendering, validation, catalog, access or submit authority

**Context:** migration 0001 physically owns `core_config.form_field_definition` as a child of `core_config.form_definition`. It persists a parent UUID, raw field key, constrained field-type enum, raw label key, required/read-only booleans, optional visibility-rule text, validation-schema JSON, optional reference-catalog text, unconstrained signed sort order, raw sensitivity class and created timestamp, with uniqueness only on parent+field key. Migration 0002 gives the child FORCE-RLS by checking the parent FormDefinition scope; it does not require the parent to be ACTIVE/current/effective. Migration 0032 adds restrictive child write floors under PLATFORM parents. Reading one child row therefore does not select a form version, expand sibling fields, evaluate rules/schemas, resolve catalogs, enforce sensitivity, render UI or invoke submission.

**Decision:** add immutable `PersistedFormFieldDefinition`, `FormFieldDefinitionReadPort.loadForContext(...)` and `PostgresFormFieldDefinitionStore` through the existing `PostgresDatabase` + `RequestScopedSql` application boundary. The reader loads one exact UUID and returns only schema-owned persistence evidence: id, parent FormDefinition id, raw field key, constrained raw field type, raw label key, exact required/read-only booleans, optional raw visibility-rule text, normalized immutable validation-schema JSON, optional raw reference-catalog text, signed safe-integer sort order, raw sensitivity class and created timestamp. Schema-valid empty text, nullable references and negative sort order are preserved rather than strengthened.

**Security / trade-off:** child visibility remains entirely parent-derived. Tenant-parent fields are same-Tenant visible from Tenant Core or Tenant Industry contexts; Industry-parent fields require exact Industry Context; PLATFORM-parent fields require trusted PLATFORM_GLOBAL context and are not Tenant fallback. Parent lifecycle status is not an RLS selector. Migration 0009 supplies table-level `sbg_app_rw` DML privileges while migration 0032's restrictive PLATFORM-parent child write floor remains authoritative. DD-136 does not relabel the database role read-only; the application port itself exposes only exact read.

**Boundary:** DD-136 does not select ACTIVE/current/effective FormDefinitions; list or order sibling fields; enforce required/read-only; coerce/render by field type; resolve labels/localization; resolve/evaluate visibility RuleDefinitions; execute validation JSON or validation chains; resolve reference catalogs; apply sensitivity masking/redaction/access policy; compose layouts; bind/invoke submit OperationContracts; evaluate permission/entitlement; mutate form/field definitions; compile caches/search/projections; expose a public route; or change migrations/schema/verification SQL/roles/grants/RLS/product policy.

**Acceptance:** `FORMFIELD-PG-001` through `FORMFIELD-PG-007` in DD-17 and `tests/postgres/form-field-definition-store.test.mjs`.

## DD-137 — CountryPack raw global-catalog persistence is readable without becoming current/effective pack selection, Tenant activation or default-application authority

**Context:** migration 0001 physically owns `core_config.country_pack` as a versioned country/reference catalog with country/code/version identity, lifecycle status, locale list, optional currency/timezone/date defaults, optional address/phone JSON, optional reference-bundle pointer, metadata JSON, approver and optional effective-from evidence. It has no Tenant/Industry ownership columns and no RLS policy. F-04 declares platform masters global-read; A-05 classifies Country Packs as a versioned global/reference catalog; DD-031 restricts them to reference/default bundles and keeps Tenant activation explicit. Migration 0029 makes this platform catalog SELECT-only for `sbg_app_rw` and writable through `sbg_control_plane_rw`.

**Decision:** add immutable `PersistedCountryPack`, `CountryPackReadPort.loadById(...)` and `PostgresCountryPackStore` through the existing `PostgresDatabase` / `SqlDatabase` application-role boundary. The reader loads one exact UUID without inventing a Tenant/Industry RequestContext requirement and returns only schema-owned persistence evidence: raw country/code, positive version, constrained lifecycle status, immutable raw locale array, optional raw currency/timezone/date/reference values, normalized immutable optional address/phone JSON, normalized immutable metadata JSON, created timestamp, optional approver UUID and optional effective-from timestamp. The locale array deliberately preserves persisted order, duplicates and nullable elements because the physical column does not prohibit them.

**Security / trade-off:** global-read is intentional for this platform/reference catalog, but mutation is not. The ordinary application role is verified SELECT-only after migration 0029; Control Plane mutation ownership remains unchanged. DD-137 does not introduce RLS, Tenant visibility filters or a PLATFORM_GLOBAL context gate that the physical/source contract does not own. The application port is exact-read only.

**Boundary:** DD-137 does not select ACTIVE/current/latest packs; evaluate `effective_from` against wall-clock time; perform country/locale fallback; activate/deactivate `tenant_country_pack_activation`; merge Tenant overrides; materialize locale/currency/timezone/date/number/language/address/phone defaults; load reference bundles; apply tax/business rules; grant permissions/entitlements/Industry activation; seed masters; mutate/publish Country Packs; revalidate AI provisioning; expose a public route; or change migrations/schema/verification SQL/roles/grants/RLS/product policy.

**Acceptance:** `COUNTRYPACK-PG-001` through `COUNTRYPACK-PG-007` in DD-17 and `tests/postgres/country-pack-store.test.mjs`.

## DD-138 — TenantCountryPackActivation raw persistence is readable without becoming current/effective localization, override materialization or activation-transition authority

**Context:** migration 0001 physically owns `core_config.tenant_country_pack_activation` as a Tenant-owned activation row referencing the global CountryPack catalog. It persists raw activation lifecycle status, override JSON, optional activation/disabled timestamps and bigint row version. FORCE-RLS is Tenant-only: `tenant_id = current_tenant_id()`; migration 0007 registers the table as TENANT_CORE / RLS-TENANT-READ/WRITE owned by Localization. Migration 0029 makes Tenant ownership immutable through the generic scope-ownership trigger but does not make CountryPack id, lifecycle, override, timestamps or row version immutable. Existing `sbg_app_rw` DML remains schema-owned. Migration 0031 consumes ACTIVE activation only as a write-time prerequisite for an IndustryAIConfig allowlist and does not make a raw read an effective localization or AI authorization decision.

**Decision:** add immutable `PersistedTenantCountryPackActivation`, `TenantCountryPackActivationReadPort.loadForContext(...)` and `PostgresTenantCountryPackActivationStore` through the existing `PostgresDatabase` + `RequestScopedSql` application boundary. The reader loads one exact UUID and returns only schema-owned persisted evidence: id, Tenant id, CountryPack id, constrained raw status, normalized immutable override JSON, optional activated/disabled timestamps and exact PostgreSQL bigint row-version text. Because the physical bigint column has no positive CHECK, zero/negative values remain representable evidence rather than being upgraded to a positive concurrency invariant.

**Security / trade-off:** Tenant FORCE-RLS remains authoritative. Same-Tenant Core and Industry contexts may read the row; foreign Tenant and PLATFORM_GLOBAL contexts cannot. Industry Context is deliberately not added to visibility because the physical policy does not own it. Existing application-role DML is not relabeled read-only, while migration-0029 immutable Tenant ownership remains authoritative. The DD-138 port itself exposes exact read only.

**Boundary:** DD-138 does not select a current/effective/primary Tenant CountryPack; interpret ACTIVE as proof that defaults were applied; revalidate CountryPack ACTIVE/effective state; perform activation/deactivation transitions or optimistic-concurrency writes; merge/validate/materialize overrides; apply locale/currency/timezone/date/number/language/address/phone defaults; load reference bundles; apply tax/business rules; revalidate IndustryAIConfig country-pack eligibility; grant permission/entitlement/Industry activation; expose a public route; or change migrations/schema/verification SQL/roles/grants/RLS/product policy.

**Acceptance:** `TENANTPACK-PG-001` through `TENANTPACK-PG-007` in DD-17 and `tests/postgres/tenant-country-pack-activation-store.test.mjs`.

## DD-139 — BrandConfiguration raw scoped persistence remains evidence-only and does not become brand-hierarchy, protected-token, rendering or document-access authority

**Context:** migration 0001 physically owns `core_config.brand_configuration` as a versioned PLATFORM/TENANT/INDUSTRY definition with exact ownership shape, raw token/typography JSON, optional logo/favicon UUID references, accessibility validation status, creator/approver references and audit timestamps. FORCE-RLS uses the shared scoped-definition visibility helper. ACTIVE rows require accessibility PASS at the database layer. Migration 0007 assigns Branding ownership; migration 0029 keeps owner/Tenant/Industry scope immutable after insert; migration 0032 prevents ordinary application-role mutation of PLATFORM-owned rows. F-06/A-08/DD-034 separately own the Platform → allowed Industry override → Tenant white-label override → user preference hierarchy and the protected security/accessibility semantic-token floor.

**Decision:** add immutable `PersistedBrandConfiguration`, `BrandConfigurationReadPort.loadForContext(...)` and `PostgresBrandConfigurationStore` through the existing `RequestScopedSql` boundary. The reader returns only exact persisted evidence: id, owner/scope identifiers, raw code, positive version, lifecycle status, normalized immutable token/typography JSON, optional logo/favicon UUID references, accessibility validation status, creator/approver UUID references and timestamps.

**Security / trade-off:** FORCE-RLS remains authoritative: same-Tenant visibility for TENANT rows, exact Industry Context for INDUSTRY rows, trusted PLATFORM_GLOBAL for PLATFORM rows. Raw document UUIDs are references only; DD-139 does not perform DocumentMeta lookup, ACL/sensitivity checks or binary access. Existing application-role table DML remains schema-owned, while migration-0032's restrictive PLATFORM write floor continues to block PLATFORM-owned mutation through the ordinary application role. The DD-139 port itself is read-only.

**Boundary:** DD-139 does not select current/latest/effective brand versions; resolve Platform/Industry/Tenant/user composition; enforce protected semantic tokens or product identity; validate color/font/token dictionaries; re-run accessibility/WCAG checks; generate themes/CSS/native tokens; dereference logo/favicon documents; evaluate entitlements/permissions; publish/activate/retire/rollback definitions; expose a public route; or change migration/schema/verification SQL/role/grant/RLS/product policy.

**Acceptance:** `BRANDCFG-PG-001` through `BRANDCFG-PG-007` in DD-17 and `tests/postgres/brand-configuration-store.test.mjs`.

## DD-140 — DataExportRequest raw persistence is readable without becoming export approval, generation, download or current authorization authority

**Context:** migration 0001 physically owns `core_config.data_export_request` with Tenant/optional Industry scope, requester/optional subject principal references, scope class, export type, requested resource classes, residency-policy version, sensitivity ceiling, lifecycle status, optional approval/document/expiry evidence and audit timestamps. Migration 0030 narrows the physical contract to exact `TENANT_CORE` versus `TENANT_INDUSTRY` shape, constrains sensitivity vocabulary, adds requester/subject/document foreign keys and replaces FORCE-RLS with exact Tenant + row-scope visibility. Tenant-Core rows remain same-Tenant visible from both Core and Industry contexts, while Tenant-Industry rows require the exact Industry Context. Migration 0031 validates requester/subject Tenant applicability and optional result Document scope/ACTIVE/CLEAN/sensitivity at insert/update time. Migration 0029 keeps Tenant/Industry/scope columns immutable.

**Decision:** add immutable `PersistedDataExportRequest`, `DataExportRequestReadPort.loadForContext(...)` and `PostgresDataExportRequestStore` through the existing `PostgresDatabase` + `RequestScopedSql` application boundary. The reader loads one exact UUID and returns only schema-owned persistence evidence: Tenant/optional Industry scope, requester/optional subject ids, constrained scope/export/sensitivity/status vocabularies, immutable raw requested-resource-class array, raw residency-policy version, optional approval/document/expiry evidence and created/updated timestamps. Schema-valid empty text, duplicate/null array elements and unordered/past expiry evidence are preserved rather than strengthened.

**Security / trade-off:** FORCE-RLS remains authoritative and is not requester-principal-private. A same-Tenant principal may read a Tenant-Core row because the database policy owns that visibility. Foreign Tenant and PLATFORM_GLOBAL contexts remain hidden. Migration-0031 relationship checks are write-time integrity evidence only; DD-140 does not re-authorize requester/subject, revalidate current Document state/ACL/sensitivity, resolve residency policy, satisfy approval, or authorize export generation/download. Existing application-role DML remains migration-owned; the application port is exact-read only.

**Boundary:** DD-140 does not create/validate/approve/generate/cancel/download exports; interpret requested resource classes or construct export queries; resolve/apply residency policy; revalidate current requester/subject membership; revalidate current Document status/virus/sensitivity/ACL/residency or dereference its binary; resolve approval references; enforce expiry against wall-clock time; execute lifecycle transitions; perform cross-context export; evaluate permissions/entitlements/step-up; expose a public route; or change migrations/schema/verification SQL/roles/grants/RLS/product policy.

**Acceptance:** `DATAEXPORT-PG-001` through `DATAEXPORT-PG-007` in DD-17 and `tests/postgres/data-export-request-store.test.mjs`.

## DD-141 — SubscriptionTransition raw Tenant persistence remains append-only evidence and does not become Commercial lifecycle/current-state/replay authority

**Context:** migration 0004 physically owns `core_commercial.subscription_transition` as Tenant-owned append-style Commercial evidence with subscription reference, optional from-state, required to-state, raw trigger/actor/source-event/reason evidence, occurrence timestamp and correlation id. FORCE-RLS is Tenant-only. Migration 0030 hardens `(tenant_id,subscription_id)` as a same-Tenant reference. Migration 0029 makes Tenant ownership immutable and removes ordinary UPDATE/DELETE. Migration 0043 makes the ordinary application/worker role read-only for Commercial truth while `sbg_commercial_transition_compiler_rw` retains SELECT+INSERT and no UPDATE/DELETE. DD-064/DD-065 own publication/write semantics; the existing Commercial publication path remains the write owner.

**Decision:** add immutable `PersistedSubscriptionTransition`, `SubscriptionTransitionReadPort.loadForContext(...)` and `PostgresSubscriptionTransitionStore` through the existing `RequestScopedSql` boundary. The reader returns only exact persisted evidence: id, Tenant/subscription identifiers, optional from-state, to-state, raw trigger code, optional actor/source-event/reason, occurred-at and correlation id. It reuses the existing canonical `CommercialSubscriptionState` type rather than defining a competing subscription-state vocabulary.

**Security / trade-off:** Tenant-only FORCE-RLS means the owning transition is visible from both Tenant Core and Tenant Industry contexts of the same Tenant; foreign Tenant and PLATFORM_GLOBAL contexts remain hidden. Ordinary app role is SELECT-only; compiler write authority remains append-only INSERT. DD-141 does not alter the publication transaction, Commercial compiler roles, grants, RLS or transition ownership.

**Boundary:** DD-141 does not execute Subscription transitions; validate from→to legality; reconstruct a transition chain; select current/latest transition; compare the row with current Subscription state; perform actor authorization/current membership checks; resolve source-event existence/idempotency; infer causality/replayability; perform plan-change routing/remediation/approval; compile/publish entitlements; emit audit/outbox; perform billing/proration/payment; roll back/reverse a transition; mutate SubscriptionTransition; expose a public route; or change migration/schema/verification SQL/product policy.

**Acceptance:** `SUBTRANS-PG-001` through `SUBTRANS-PG-007` in DD-17 and `tests/postgres/subscription-transition-store.test.mjs`.

## DD-142 — OrgUnitIndustry exact-context raw persistence is readable without becoming activation, hierarchy, config-resolution, document-access or workflow-assignment authority

**Context:** migration 0001 physically owns `core_tenancy.org_unit_industry` as the composite `(tenant_id,org_unit_id,industry_context_id)` linkage between a same-Tenant OrgUnit and Industry Context. The row carries only `org_unit_status` (`ACTIVE | SUSPENDED | ARCHIVED`) and raw `config_json`. FORCE-RLS requires exact current Tenant and Industry Context. DD-05 explicitly models Industry linkage separately from the Tenant-owned OrgUnit aggregate. Migration 0007 classifies the table as TENANT_INDUSTRY/Tenancy-owned. Migration 0009 grants the ordinary application role existing-table DML; migration 0029 makes Tenant and Industry ownership immutable after insert but does not make `org_unit_id`, status or config immutable. Migration 0031 consumes ACTIVE links only as write-time integrity evidence in document-ACL and workflow-task owners. Migration 0041 deliberately omits this table from pre-context directory reads.

**Decision:** add immutable `PersistedOrgUnitIndustry`, `OrgUnitIndustryReadPort.loadForContext(...)` and `PostgresOrgUnitIndustryStore` through the existing `RequestScopedSql` boundary. A resolved TENANT_INDUSTRY RequestContext supplies Tenant/Industry scope; the lookup supplies one OrgUnit UUID. Under the composite primary key plus FORCE-RLS, at most one visible row may match. The reader returns only Tenant/OrgUnit/Industry ids, constrained raw status and normalized immutable config JSON.

**Security / trade-off:** exact Industry FORCE-RLS is authoritative; there is no Tenant-Core, sibling-Industry, foreign-Tenant or PLATFORM_GLOBAL fallback. Existing app-role DML remains database-owned, while migration-0029 prevents mutation of Tenant/Industry ownership. The reader does not strengthen `org_unit_id`, status or config into immutability/current-state rules not present in source.

**Boundary:** DD-142 does not create/update/delete links; execute activation/deactivation/status transitions; select current/effective/primary links; traverse OrgUnit hierarchy or infer ancestor/descendant inheritance; revalidate OrgUnit or IndustryContext lifecycle state; interpret/merge/materialize config JSON; authorize document ACLs or workflow assignments; evaluate RBAC/ABAC/Commercial policy; provide pre-context directory visibility; expose a public route; or change migrations/schema/verification SQL/roles/grants/RLS/product policy.

**Acceptance:** `ORGIND-PG-001` through `ORGIND-PG-007` in DD-17 and `tests/postgres/org-unit-industry-store.test.mjs`.

## DD-143 — UsageMeter exact raw persistence remains scoped evidence and does not become current-period, entitlement-binding, reservation-reconciliation or usage-impact authority

**Context:** migration 0004 physically owns `core_commercial.usage_meter` as MIXED_SCOPED Commercial persistence with Tenant ownership, optional Industry Context, raw `meter_code`/`period_key`, non-negative PostgreSQL `numeric` used/reserved values, unconstrained signed bigint `version`, and update timestamp. FORCE-RLS requires the same Tenant and permits a null-Industry row from both same-Tenant Core and Industry contexts while non-null Industry rows require the exact current Industry Context. Migration 0029 makes Tenant/Industry ownership immutable after insert. Migration 0043 removes INSERT/UPDATE/DELETE from ordinary app/worker roles and gives the dedicated Commercial transition/compiler role SELECT-only usage-meter access, including its intentionally broader same-Tenant compiler SELECT policy. DD-073 leaves the concrete Commercial usage-impact source unbound because source does not define authoritative period selection or reservation semantics and the physical UsageMeter carries no entitlement code.

**Decision:** add immutable `PersistedUsageMeter`, `UsageMeterReadPort.loadForContext(...)` and `PostgresUsageMeterStore` through the existing `PostgresDatabase` + `RequestScopedSql` application boundary. The reader loads one exact UsageMeter UUID and returns only persisted evidence: id, Tenant/optional Industry ownership, raw meter code and period key, exact PostgreSQL numeric used/reserved values as text, exact bigint version as text and updated-at timestamp. Finite numeric precision is preserved without JavaScript-number coercion, and schema-admitted `Infinity` / `NaN` evidence is preserved as PostgreSQL text. Schema-valid empty meter/period text and zero/negative bigint version remain raw evidence rather than being strengthened.

**Security / trade-off:** ordinary application FORCE-RLS remains authoritative: same-Tenant null-Industry rows are visible from Tenant Core and same-Tenant Industry contexts; Industry rows are visible only from their exact Industry Context; foreign Tenant and PLATFORM_GLOBAL access fail closed. The DD-143 application reader does not use the compiler role's broader same-Tenant policy to widen request visibility. UsageMeter mutation remains outside this port and both ordinary application and compiler roles are SELECT-only after migration 0043.

**Boundary:** DD-143 does not implement or adapt to `CommercialUsageImpactSourcePort`; select current/authoritative periods; bind entitlement codes or target limits; aggregate across meters, periods or Industries; reconcile reservations or calculate available capacity; evaluate downgrade blockers/usage impact; create/increment/reserve/release/reset/update UsageMeters; define writer idempotency/concurrency semantics; calculate billing/proration/charges; mutate Subscription/PlanVersion/EntitlementSnapshot; authorize permissions/entitlements; expose a public route; or change migrations/schema/verification SQL/roles/grants/RLS/product policy.

**Acceptance:** `USAGEMETER-PG-001` through `USAGEMETER-PG-007` in DD-17 and `tests/postgres/usage-meter-store.test.mjs`.

## DD-144 — AuditEvent exact raw persistence is readable without becoming audit-production, search, retention, export or authorization authority

**Context:** migration 0008 physically owns monthly-partitioned `core_audit.audit_event` plus `audit_event_identity`. The parent carries raw actor/action/resource/outcome/reason/permission/access-decision/module/correlation/causation/request/routing/sensitivity/evidence/schema-version fields and FORCE-RLS. Migration 0030 finalizes the scope model by adding explicit source/target Industry Context ids for `EXPLICIT_CROSS_CONTEXT`, exact physical-scope checks and the `core_audit.audit_row_visible(...)` helper/policy across current and future partitions. Migration 0031 adds write-time evidence-object, Tenant routing and actor-relationship integrity. Migration 0009 gives the ordinary application role explicit SELECT+INSERT but no UPDATE/DELETE; migration 0029 restores required schema usage without changing append/read ownership. Service/compiler-specific later grants do not widen ordinary application visibility.

**Decision:** add immutable `PersistedAuditEvent`, `AuditEventReadPort.loadForContext(...)` and `PostgresAuditEventStore` through the existing `RequestScopedSql` application boundary. One AuditEvent UUID is exact because `audit_event_identity.id` is globally unique and the partition row references its unique `(id,occurred_at)` pair. The reader returns only persisted evidence: optional Tenant/Industry/source-Industry/target-Industry ownership, constrained scope/outcome/sensitivity, occurred-at, optional actor/resource/reason/permission/decision/causation/request/routing evidence, raw actor/action/source-module text, correlation id, immutable normalized generic JSON evidence and positive schema version. Raw nullable/empty text is preserved. `evidence_json` is not strengthened into an object-only read contract because migration 0031 enforces that shape through a write-time trigger rather than a retroactive table CHECK.

**Security / trade-off:** final FORCE-RLS remains authoritative. PLATFORM_GLOBAL rows are visible only from trusted PLATFORM_GLOBAL context; TENANT_CORE rows remain visible from same-Tenant Core and Industry contexts; TENANT_INDUSTRY rows require the exact Industry Context; EXPLICIT_CROSS_CONTEXT rows are visible only from their same-Tenant source or target Industry Context. The ordinary RequestScopedSql path still rejects PUBLIC and EXPLICIT_CROSS_CONTEXT database contexts, so there is no generic cross-context bypass. Foreign Tenant and unrelated sibling Industry reads remain hidden.

**Boundary:** DD-144 does not append/update/delete audit evidence; replace existing audit producers; list/search/filter/page/order audit history; implement retention/legal-hold/archive/purge/partition management; authorize access from event contents; revalidate current actor membership/principal state/Tenant routing/Data Home/region; dereference principals/resources/access decisions/Data Homes/Industry Contexts; reinterpret reason/permission/sensitivity/evidence semantics; export/report audit data; expose a public route; create a dedicated EXPLICIT_CROSS_CONTEXT repository; or change migrations/partitions/roles/grants/RLS/product policy.

**Acceptance:** `AUDITEVENT-PG-001` through `AUDITEVENT-PG-007` in DD-17 and `tests/postgres/audit-event-store.test.mjs`.


## DD-145 — API Credential raw metadata is internally readable without disclosing verifier material or becoming machine-authentication authority

**Context:** migration 0003 physically owns `core_identity.api_credential` with optional Tenant/Industry scope, principal ownership, key prefix, one-way `secret_hash`, lifecycle status, optional permission-profile/expiry/last-used/CIDR evidence, bigint credential version, creation/revocation evidence and migration-0030 allowed-Industry Context ids. Migration 0005 owns platform-vs-Tenant FORCE-RLS shape. Migration 0029 makes the dedicated NOBYPASSRLS `sbg_identity_service_rw` boundary explicit because credential verification is pre-context, grants it Identity-service SELECT/INSERT/UPDATE while revoking direct ordinary app/worker/monitor access, and leaves the general application role outside this sensitive table. Migration 0030/0034 own same-Tenant Industry/principal integrity and the final PLATFORM_GLOBAL service-principal floor. DD-03/DD-16 require a prefix plus one-way Argon2id/approved verifier hash, but do not pin a complete presented-token encoding/hash-parameter/rotation/CIDR/use-audit algorithm sufficient to invent a production `MachineCredentialVerifierPort` adapter.

**Decision:** add immutable `ApiCredentialMetadata`, `ApiCredentialMetadataReadPort.loadById(...)` and `PostgresApiCredentialMetadataStore` through the existing `PostgresIdentityDatabase` fixed Identity-service role. The reader loads one exact UUID and returns only non-secret persisted metadata: optional Tenant/Industry ownership, principal id, raw key prefix/status, optional permission-profile/expiry/last-used, immutable CIDR and allowed-Industry arrays, exact signed bigint credential-version text, creation time and optional revocation time. The SQL projection deliberately excludes `secret_hash`.

**Security / trade-off:** this is a pre-context internal metadata read, not caller-Tenant authorization. The fixed Identity database still sets `sbg_identity_service_rw`, enables row security and clears application scope before work. PLATFORM_GLOBAL metadata can therefore be read by that trusted Identity boundary while direct `sbg_app_rw` SELECT remains revoked. Historical/write-time scope evidence is not revalidated into a current authentication decision.

**Boundary:** DD-145 does not implement `MachineCredentialVerifierPort`; parse presented API keys; select credentials by key prefix for authentication; expose/read/compare `secret_hash`; choose Argon2 parameters; enforce CIDR at request time; decide lifecycle/current usability; resolve `permission_profile_id`; update `last_used_at`; create/rotate/revoke/update/delete credentials; emit credential-use audit; derive RequestContext authorization; expose public/admin transport; enumerate/search credentials; or authorize operator elevation. No migration/schema/role/grant/RLS/product-policy change is introduced.

**Acceptance:** `APICRED-META-PG-001` through `APICRED-META-PG-007` in DD-17 and `tests/postgres/api-credential-metadata-store.test.mjs`.


## DD-146 — OperatorElevation raw metadata is readable through a fixed Control Plane boundary without activating elevation semantics

**Context:** DD-05 §7 and DD-16 §17 define time-bounded OperatorElevation evidence with purpose, Tenant/optional Industry target, bounded permission profile, optional approval/ticket, start/expiry, status and audit requirement. Migration 0029 physically owns `core_authz.operator_elevation`, FORCE-RLS, a Control Plane policy for `sbg_control_plane_rw`, and the ordinary current-read policy that requires exact transaction-local elevation id + principal + Tenant/optional Industry + ACTIVE/time-window evidence. Migration 0029 also defines `sbg_control_plane_rw` as NOLOGIN/NOSUPERUSER/NOINHERIT/NOBYPASSRLS and grants it explicit schema/table control privileges. The ordinary `RequestScopedSql` deliberately keeps `app.operator_elevation_id` empty, so normal Tenant-request elevation remains unresolved.

**Decision:** add a fixed `PostgresControlPlaneDatabase` that sets only `sbg_control_plane_rw`, enables row security, verifies runtime/login role safety, clears application scope settings and follows existing pooled-transaction cleanup semantics. Add immutable `OperatorElevationMetadata`, `OperatorElevationMetadataReadPort.loadById(...)` and `PostgresOperatorElevationMetadataStore`. One exact UUID returns only persisted metadata: operator principal, Tenant/optional Industry target, raw purpose/ticket/approval, starts/expires, constrained raw status, permission-profile id, created time and optional revoked time.

**Security / trade-off:** this Control Plane metadata path is intentionally pre-authorization and internal-only. It may read PENDING/future/EXPIRED/REVOKED evidence and must not convert wall-clock/status evidence into current usability. Ordinary application visibility remains unchanged because DD-146 does not set or accept `app.operator_elevation_id`, change RequestContext, or weaken the existing RLS predicate.

**Boundary:** DD-146 does not resolve/select an elevation for an incoming request; accept client-controlled elevation ids into transaction scope; modify `RequestContext`, context resolution or `RequestScopedSql`; interpret `permission_profile_id`; decide approval/purpose/ticket policy; create/approve/activate/revoke/expire elevations; grant Tenant/Industry access; replace persistent role/membership rules; emit mandatory elevation audit; expose a route/UI; or change migration/schema/role/grant/RLS/product policy.

**Acceptance:** `OPELEV-META-PG-001` through `OPELEV-META-PG-007` in DD-17 and `tests/postgres/operator-elevation-metadata-store.test.mjs`.


## DD-147 — API Credential verifier material may be loaded by exact persisted prefix inside the Identity service without implementing machine authentication

**Context:** DD-03 defines `IdentityPort.verifyMachineCredential(credential)` and the APICredential persistence shape. DD-16 §4 requires verifier-style API credentials to persist only a one-way Argon2id/approved verifier hash plus a prefix for lookup, with fixed scope, optional Industry/CIDR evidence, rotation/revocation, expiry policy and audit. Migration 0003 owns `key_prefix text NOT NULL`, `secret_hash text NOT NULL`, lifecycle/scope/version columns and the unique `api_credential_key_prefix_uq` index. Migration 0029 revokes ordinary app/worker/monitor access and gives the dedicated NOBYPASSRLS `sbg_identity_service_rw` role pre-context credential SELECT/INSERT/UPDATE under explicit Identity-service RLS. Migrations 0030/0034 own final Tenant/Industry/service-principal scope integrity. DD-145 separately owns non-secret exact-id metadata and its nullable-CIDR correction.

**Decision:** add a server-internal `ApiCredentialVerificationMaterial` / `ApiCredentialVerificationMaterialReadPort.loadByKeyPrefix(...)` plus `PostgresApiCredentialVerificationMaterialStore` using the existing fixed `PostgresIdentityDatabase`. The read performs one parameterized exact equality lookup on the persisted unique key prefix and returns opaque `secret_hash` plus persisted id/scope/principal/status/profile/expiry/last-used/CIDR/version/creation/revocation/allowed-Industry evidence. Verifier material remains under `src/server/identity` and is not exported by `src/core/index.ts`.

**Security / trade-off:** a verifier hash must be available to the trusted Identity process for a future comparison, but its presence does not establish authentication. ACTIVE, SUSPENDED, REVOKED and EXPIRED rows may all be returned. NULL CIDR remains absence and credential-version bigint remains signed decimal text. The reader must never serialize verifier material to a transport, log it, expose it to UI, or treat raw lifecycle/scope fields as authorization.

**Boundary:** DD-147 does not implement `IdentityPort.verifyMachineCredential`; parse a presented API-key wire format; choose prefix length/encoding/delimiter; compare Argon2id/other verifier hashes; choose crypto parameters/libraries; enforce CIDR/network policy; decide current lifecycle usability; update `last_used_at`; emit credential-use/authentication audit; rotate/revoke/create/update credentials; resolve permission profiles; construct `VerifiedMachineEvidence`; grant Tenant/Industry/PLATFORM_GLOBAL access; or change migrations/schema/roles/grants/RLS/product policy.

**Acceptance:** `APICRED-VERIFY-PG-001` through `APICRED-VERIFY-PG-007` in DD-17 and `tests/postgres/api-credential-verification-material-store.test.mjs`.


## DD-148 — OperatorElevation current status/time floor is a deterministic necessary predicate, not an access decision

**Context:** DD-05 §6–§7, DD-16 §17 and migration 0029 define OperatorElevation. Migration 0029's ordinary-application current-read predicate requires exact elevation/principal/Tenant/optional Industry binding plus `status='ACTIVE'`, `starts_at <= now()` and `expires_at > now()`. DD-146 exposes raw Control Plane metadata only and explicitly does not decide current/effective usability.

**Decision:** add pure Core helper `matchesOperatorElevationCurrentTimeStatusFloor(metadata, evaluatedAt)`. It uses an explicit caller-supplied server evaluation instant rather than reading the system clock, requires raw status `ACTIVE`, applies inclusive-start/exclusive-expiry semantics, and fails closed on malformed evaluation or persisted timestamps. It also rejects internally invalid `expiresAt <= startsAt` evidence rather than allowing a malformed object to satisfy the floor.

**Security / trade-off:** this helper mirrors only the migration-owned time/status portion of the ordinary-app RLS predicate. It intentionally ignores principal, Tenant, Industry, purpose, ticket, approver and permission-profile fields. A true result is necessary evidence only and cannot be treated as elevation selection, scope binding, permission evaluation or authorization.

**Boundary:** DD-148 does not load/select an elevation; bind interactive PLATFORM_OPERATOR identity; check principal/Tenant/Industry targets; interpret `permission_profile_id`; decide approval/purpose/ticket policy; accept client-controlled time as authority; set `app.operator_elevation_id`; modify RequestContext or RequestScopedSql; return an AuthorizationDecision; create/approve/activate/revoke/expire elevations; emit mandatory elevation-use audit; or change migrations/schema/RLS/roles/grants/product policy.

**Acceptance:** `OPELEV-WIN-001` through `OPELEV-WIN-007` in DD-17 and `tests/core/operator-elevation-window.test.mjs`.


## DD-149 — OperatorElevation persisted subject/target fields may be checked as a pure necessary binding floor without selecting or authorizing an elevation

**Context:** migration 0029's ordinary application `operator_elevation_current_read_policy` requires exact `operator_principal_id = current_principal_id()`, exact `tenant_id = current_tenant_id()`, and `industry_context_id IS NULL OR industry_context_id = current_industry_context_id()`, in addition to exact selected elevation id and the ACTIVE/time predicates isolated by DD-148. DD-05 §6–§7 owns the same operator/Tenant/optional-Industry target concept. DD-146 exposes these persisted identifiers as immutable metadata.

**Decision:** add deterministic Core helper `matchesOperatorElevationSubjectTargetFloor(metadata,input)`. The input carries server-owned operator principal, Tenant and optional Industry identifiers. The helper validates UUID shape, requires exact operator + Tenant equality, treats absent persisted Industry target as Tenant-wide for this predicate, and otherwise requires exact Industry equality. It reads no database state and mutates neither input.

**Security / trade-off:** this helper mirrors only one necessary RLS predicate. A Tenant-wide elevation record may satisfy this target predicate from a same-Tenant Industry input because the authoritative migration predicate explicitly permits persisted NULL Industry. That fact must not be strengthened into broad access authority; final elevation use still requires trusted selection, identity type, DD-148 current-time/status floor, permission/policy and audit composition.

**Boundary:** DD-149 does not select/load/trust an elevation id; establish authenticated interactive `PLATFORM_OPERATOR` principal type; resolve Tenant/Industry lifecycle or Data Home; invoke DD-148 on the caller's behalf; interpret `permission_profile_id`; decide approval/purpose/ticket policy; set `app.operator_elevation_id`; modify `RequestContext` or `RequestScopedSql`; grant access or return an AuthorizationDecision; mutate elevation state; emit mandatory elevation-use audit; or change migrations/RLS/roles/grants/product policy.

**Acceptance:** `OPELEV-BIND-001` through `OPELEV-BIND-007` in DD-17 and `tests/core/operator-elevation-subject-target.test.mjs`.


## DD-150 — OperatorElevation may require exact IdentityPort-verified PLATFORM_OPERATOR identity as a pure necessary floor without deciding step-up or access

**Context:** DD-03 defines `PLATFORM_OPERATOR` as a first-class principal type, requires Platform Operators to use DD-05 time-bounded elevation rather than persistent Tenant roles, and forbids API credentials from substituting for interactive platform identity/elevation. `IdentityPort.verifyHumanSession(...)` returns `VerifiedIdentityEvidence`; current machine evidence can represent only API_CLIENT or SERVICE. DD-146 exposes the persisted elevation operator principal, while DD-149 separately owns raw subject/Tenant/Industry binding.

**Decision:** add deterministic Core helper `matchesOperatorElevationVerifiedPlatformOperatorFloor(metadata,evidence)`. The helper accepts already-verified human identity evidence, requires `principalType === 'PLATFORM_OPERATOR'`, validates UUID shape for persisted and verified principal ids, and requires exact principal-id equality. It performs no provider call and does not inspect authorization policy.

**Security / trade-off:** the helper deliberately does not infer elevation eligibility from authStrength, sessionVersion, deviceId, provider subject/session or authEpoch. Those are verified identity/session facts, not an implicit MFA/step-up or elevation-approval policy. HUMAN, API_CLIENT and SERVICE types fail even with a matching id.

**Boundary:** DD-150 does not select/load/trust an elevation id; verify a raw session token itself; decide MFA/step-up policy; evaluate DD-148 time/status or DD-149 target floor on the caller's behalf; interpret `permission_profile_id`; decide approval/purpose/ticket policy; set `app.operator_elevation_id`; modify `RequestContext` or `RequestScopedSql`; grant access or return AuthorizationDecision; audit elevation use; mutate elevation state; or change migrations/RLS/roles/grants/product policy.

**Acceptance:** `OPELEV-ID-001` through `OPELEV-ID-007` in DD-17 and `tests/core/operator-elevation-verified-operator.test.mjs`.


## DD-151 — OperatorElevation selected id may be checked as a pure exact-id necessary floor without choosing or trusting the selection

**Context:** migration 0029's ordinary application `operator_elevation_current_read_policy` begins with exact row identity: `id::text = NULLIF(current_setting('app.operator_elevation_id', true), '')`. The same policy separately requires the DD-149 subject/target predicates and DD-148 ACTIVE/time predicates. DD-146 exposes immutable persisted `OperatorElevationMetadata.id`; DD-150 separately owns verified interactive PLATFORM_OPERATOR identity.

**Decision:** add deterministic Core helper `matchesOperatorElevationSelectedIdFloor(metadata, selectedElevationId)`. It validates UUID shape for persisted and selected ids and returns true only for exact equality. The helper reads no database state and mutates neither input.

**Security / trade-off:** exact equality is only one necessary migration-owned predicate. This helper deliberately does not establish where the selected id came from or whether it is trusted. A client-provided id does not become authoritative merely because it matches a persisted row.

**Boundary:** DD-151 does not choose/discover/mint/trust an elevation id; accept client selection as authoritative; load an elevation row; verify PLATFORM_OPERATOR identity; evaluate DD-148 or DD-149 on the caller's behalf; interpret permission profiles; decide approval/purpose/ticket or step-up policy; set `app.operator_elevation_id`; modify `RequestContext` or `RequestScopedSql`; grant access or return AuthorizationDecision; emit mandatory elevation-use audit; mutate elevation state; or change migrations/RLS/roles/grants/product policy.

**Acceptance:** `OPELEV-SEL-001` through `OPELEV-SEL-007` in DD-17 and `tests/core/operator-elevation-selected-id.test.mjs`.


## DD-152 — DD-148…151 may be composed as one pure necessary OperatorElevation floor without becoming final elevation authorization

**Context:** DD-148 owns migration 0029's ACTIVE/time predicate, DD-149 owns operator/Tenant/optional-Industry binding, DD-150 owns verified interactive PLATFORM_OPERATOR identity, and DD-151 owns exact selected-id equality. Migration 0029 requires its selected-id, binding and time predicates together; DD-03 separately requires interactive Platform Operator identity. Trusted selected-id sourcing remains under-specified and is deliberately not solved here.

**Decision:** add deterministic Core helper `matchesOperatorElevationCoreNecessaryFloors(metadata,input)` that composes the existing DD-151 selected-id helper, DD-150 verified-operator helper, DD-149 subject/target helper and DD-148 time/status helper. It returns true only when all four existing floors return true.

**Security / trade-off:** composition reduces accidental partial checks but does not strengthen any floor into a final authorization decision. A true result means only that four necessary predicates match for the provided server-owned inputs. The source/trust of the selected id, step-up policy, permission profile, approval/purpose policy, effective permissions, RequestContext/SQL injection and audit remain separate.

**Boundary:** DD-152 does not choose/discover/mint/trust the selected id; make client selection authoritative; load elevation rows; call IdentityPort; decide MFA/step-up; interpret `permission_profile_id`; decide approval/purpose/ticket; construct final effective permissions or AuthorizationDecision; set `app.operator_elevation_id`; modify RequestContext/RequestScopedSql; grant access; emit mandatory elevation-use audit; mutate elevation state; or change migrations/RLS/roles/grants/product policy.

**Acceptance:** `OPELEV-CORE-001` through `OPELEV-CORE-007` in DD-17 and `tests/core/operator-elevation-core-floors.test.mjs`.


## DD-153 — Migration 0029 OperatorElevation current-read RLS must be proven on real PostgreSQL without activating request-time elevation

**Context:** DD-148, DD-149 and DD-151 mirror migration 0029's time/status, subject/target and selected-id predicates in pure Core. DD-150 adds the separate verified interactive PLATFORM_OPERATOR identity prerequisite, which PostgreSQL RLS cannot infer from an id. DD-152 composes those necessary Core floors. The ordinary app role currently has forced-RLS SELECT on `core_authz.operator_elevation`, while RequestScopedSql intentionally supplies no elevation id.

**Decision:** add a PostgreSQL acceptance fixture that sets transaction-local test GUCs directly under the fixed `sbg_app_rw` adapter and proves the physical migration-0029 current-read predicate: exact id/principal/Tenant, NULL-or-exact Industry semantics, ACTIVE status and inclusive-start/exclusive-expiry current window. The acceptance also proves empty elevation scope remains closed and app mutation privilege remains absent.

**Integrity discovery:** the first disposable fixture correctly surfaced migration 0031's relationship-integrity trigger: ACTIVE elevations require a distinct ACTIVE PLATFORM_OPERATOR or SERVICE approver. The fixture was corrected to satisfy that already-owned database invariant; no production behavior changed.

**Security / trade-off:** this is acceptance-only parity evidence. Direct `set_config` calls exist only inside the disposable test fixture and do not create a runtime selection/injection path.

**Boundary:** DD-153 does not add elevation fields to RequestContext; allow RequestScopedSql to populate elevation scope; choose/trust an elevation id; make client selection authoritative; prove PLATFORM_OPERATOR type in SQL; interpret permission profiles or approval/purpose/ticket policy; decide step-up; grant business access; emit elevation-use audit; mutate elevation state; or change migrations/RLS/roles/grants/product policy.

**Acceptance:** `OPELEV-RLS-PG-001` through `OPELEV-RLS-PG-007` in DD-17 and `tests/postgres/operator-elevation-rls-current-read.test.mjs`.


## DD-154 — OperatorElevation persisted operator/approver relationships are enforced by migration 0031 without constituting complete approval authorization

**Context:** migration 0031 owns `core_authz.validate_operator_elevation()` and its BEFORE INSERT/UPDATE trigger. The trigger requires every elevation operator principal to exist as an ACTIVE PLATFORM_OPERATOR. For `status='ACTIVE'`, `approved_by` must exist, differ from the operator principal, and identify an ACTIVE PLATFORM_OPERATOR or SERVICE. DD-153's first physical RLS fixture surfaced this integrity rule. DD-16 separately states that broader approval requirements may depend on sensitivity and Tenant/compliance policy.

**Decision:** add PostgreSQL acceptance `tests/postgres/operator-elevation-relationship-integrity.test.mjs` proving the migration-owned relationship rules across insert and update paths. The test uses disposable source-valid tenancy and principal fixtures and does not add any production mutation API.

**Security / trade-off:** persisted relationship integrity prevents missing, self, inactive or invalid operator/approver principals from becoming ACTIVE elevation state. It is intentionally not interpreted as proof that a particular approver was policy-authorized for a particular request; broader approval, purpose, sensitivity, compliance and step-up rules remain separate.

**Boundary:** DD-154 does not implement elevation create/approve/activate APIs; decide who may approve a request; enforce Tenant/compliance approval policy; interpret purpose/ticket or `permission_profile_id`; require request-time revalidation of approver status; decide MFA/step-up; choose/trust selected elevation ids; inject RequestContext/SQL elevation scope; grant access; emit mandatory use audit; or change migrations/RLS/roles/grants/product policy.

**Acceptance:** `OPELEV-REL-PG-001` through `OPELEV-REL-PG-007` in DD-17 and `tests/postgres/operator-elevation-relationship-integrity.test.mjs`.


## DD-155 — Generic pooled SQL paths must remain explicitly elevation-off until a separately governed activation contract exists

**Context:** the current RequestContext contract intentionally carries no OperatorElevation id. `RequestScopedSql` always writes the fifth transaction-local setting `app.operator_elevation_id` as empty. Both `PostgresDatabase` and `PostgresContextBootstrapDatabase` clear elevation scope at transaction start, RESET it before pooled release, and destroy the connection if cleanup fails. DD-153 proves the physical RLS behavior that a future governed activation path must satisfy; DD-154 proves persisted operator/approver relationship integrity.

**Decision:** add server acceptance coverage that explicitly locks this fail-closed SQL hygiene. Generic application/bootstrap transactions must begin without inherited elevation state, must reset elevation state before connection reuse, and must destroy connections on elevation-reset cleanup failure. `RequestScopedSql` must ignore an extra unsanctioned `operatorElevationId` object property while the governed RequestContext contract has no such field.

**Security / trade-off:** this protects against pooled-session elevation leakage and accidental activation through shape-smuggling without introducing an elevation runtime path. The implementation remains intentionally conservative until trusted selection, policy evaluation, RequestContext integration, SQL activation and mandatory audit are separately source-owned.

**Boundary:** DD-155 does not add `operatorElevationId` to RequestContext; permit RequestScopedSql to populate elevation scope; choose/discover/mint/trust an elevation id; activate an elevation; evaluate DD-148…154 on behalf of a request; interpret permission profile, approval/purpose/ticket or step-up policy; grant access; emit mandatory elevation-use audit; or change migrations/RLS/roles/grants/product policy.

**Acceptance:** `OPELEV-SQL-001` through `OPELEV-SQL-007` in DD-17 and `tests/server/operator-elevation-sql-scope-hygiene.test.mjs`.


## DD-156 — OperatorElevation persisted lifecycle/time and Tenant/Industry ownership integrity is database-authoritative

**Context:** migration 0029 defines the OperatorElevation status allowlist, requires `expires_at > starts_at`, requires `revoked_at >= created_at` when present, and requires REVOKED rows to carry revocation evidence. The same migration's generic `immutable_scope_ownership` trigger attaches to scoped Core tables including `core_authz.operator_elevation`, making Tenant and Industry ownership immutable after insert. Migration 0031 separately owns operator/approver relationship integrity verified by DD-154.

**Decision:** add PostgreSQL acceptance `tests/postgres/operator-elevation-lifecycle-integrity.test.mjs` only. The acceptance proves the existing lifecycle/time constraints and immutable Tenant/Industry ownership against a real migrated database.

**Security / trade-off:** these persistence constraints prevent malformed or ownership-reclassified elevation records but do not define a lifecycle command API or transition authority. A persisted valid row is not automatically selected, activated or authorized for request use.

**Boundary:** DD-156 does not implement create/approve/activate/revoke/expire APIs; decide who may transition state; define automatic expiry mutation; trust/select an elevation id; activate request-time elevation; interpret permission profiles; decide step-up/MFA or broader approval/purpose/ticket policy; inject RequestContext/SQL scope; grant access; emit mandatory elevation-use audit; or change migrations/RLS/roles/grants/product policy.

**Acceptance:** `OPELEV-LIFE-PG-001` through `OPELEV-LIFE-PG-007` in DD-17 and `tests/postgres/operator-elevation-lifecycle-integrity.test.mjs`.


## DD-157 — OperatorElevation Control Plane SQL access must stay behind one fixed, fail-closed internal adapter boundary

**Context:** migration 0029 defines `sbg_control_plane_rw` as a NOLOGIN, non-superuser, non-BYPASSRLS role and grants it explicit CRUD on `core_authz.operator_elevation`, while ordinary `sbg_app_rw` retains SELECT only through forced RLS. The migration verification already proves the grant matrix. Runtime source contains internal-only `PostgresControlPlaneDatabase`, which pins that role, turns RLS on, verifies role safety, clears request/elevation settings before work, closes transaction handles, RESETs scope before pool reuse and destroys connections when cleanup fails.

**Decision:** add server acceptance for the existing fixed Control Plane SQL adapter. No production source change is needed. The acceptance proves role pinning, RLS-on, startup scope clear, unsafe-role fail closed, cleanup RESET, destroy-on-cleanup-failure, closed leaked handles and safe error projection.

**Security / trade-off:** DD-157 proves that a later Control Plane service has a hardened SQL boundary available. It does not grant any service permission to mutate OperatorElevation and does not turn direct SQL capability into lifecycle/activation authorization.

**Boundary:** DD-157 does not implement create/approve/activate/revoke/expire services; decide transition authorization; choose/trust an elevation id; populate RequestContext or RequestScopedSql elevation scope; interpret permission profiles/effective permissions; decide step-up/MFA or broader approval/purpose/ticket policy; grant access; emit mandatory elevation-use audit; or change migrations/RLS/roles/grants/product policy.

**Acceptance:** `OPELEV-CP-SQL-001` through `OPELEV-CP-SQL-007` in DD-17 and `tests/server/postgres-control-plane-database.test.mjs`.


## DD-158 — API Credential persisted status/expiry may be checked as a deterministic current lifecycle floor without implementing machine authentication

**Context:** DD-03 canonical evaluation requires an API credential to be valid before entitlement/RBAC/ABAC evaluation. DD-16 requires rotation/revocation/expiry policy. Migration 0003 owns the credential status enum, while migration 0030 consumes persisted API credentials only when `status='ACTIVE'` and `expires_at IS NULL OR expires_at > evaluation time`. DD-147 already provides server-internal raw verifier material containing status and optional expiry.

**Decision:** add server-internal deterministic helper `matchesApiCredentialCurrentLifecycleFloor(material,evaluatedAt)`. It requires ACTIVE status, accepts absent expiry, requires non-null expiry to be strictly after the explicit evaluation instant, treats the exact expiry boundary as expired, fails closed on malformed timestamps and calls no system clock internally.

**Security / trade-off:** this is one necessary machine-verification predicate only. It deliberately does not inspect the verifier hash, CIDR, permission profile, Tenant/Industry scope, principal status, credential version or usage metadata and does not produce authenticated machine evidence.

**Boundary:** DD-158 does not parse presented API credentials or key-prefix wire format; compare `secretHash`; select verifier algorithm/parameters/library; enforce CIDR; interpret permission profiles; decide scope authorization; validate principal/membership/service scope; update last-used evidence; emit credential-use audit; construct `VerifiedMachineEvidence`; implement `IdentityPort.verifyMachineCredential`; mutate credential lifecycle; or change migrations/RLS/roles/grants/product policy.

**Acceptance:** `APICRED-LIFE-001` through `APICRED-LIFE-007` in DD-17 and `tests/server/api-credential-current-lifecycle.test.mjs`.


## DD-159 — Machine principal directory metadata must be read as raw server-internal evidence before current-principal validation or machine authentication

**Context:** DD-03 requires final `VerifiedMachineEvidence` to carry machine principal type and allowed scope classes. DD-147 API Credential verification material contains only the persisted `principalId`; it does not carry current PlatformPrincipal type/status/service metadata. Migration 0003 owns PlatformPrincipal type/status/auth epoch/service metadata; migration 0029 constrains allowed scope classes and grants the fixed Identity-service role pre-context access; migrations 0030/0034 consume that metadata when enforcing API Credential persistence integrity.

**Decision:** add server-internal immutable `MachinePrincipalMetadata`, exact `loadById({principalId})` read port and `PostgresMachinePrincipalMetadataStore` through `PostgresIdentityDatabase`. The projection contains only id, principal type, raw status, exact bigint auth epoch text, optional service code/owning module and optional allowed-scope array. It excludes display name/email/mobile and is not exported through Core/client DTOs.

**Security / trade-off:** DD-159 intentionally reads HUMAN, PLATFORM_OPERATOR and non-active principal rows as raw evidence so the reader itself cannot silently become the authentication policy. Current machine-principal validity, service-scope compatibility, lifecycle composition, verifier execution and final evidence construction remain separately governed.

**Boundary:** DD-159 does not decide current machine-principal validity; map principal evidence into final machine acceptance; compose DD-158 lifecycle; decide Tenant/Industry/PLATFORM_GLOBAL authorization; interpret permission profiles; parse credentials or compare verifier hashes; enforce CIDR; update auth epoch or credential usage; emit authentication audit; construct `VerifiedMachineEvidence`; implement `IdentityPort.verifyMachineCredential`; mutate principal/credential state; or change migrations/RLS/roles/grants/product policy.

**Acceptance:** `MACHPRINC-PG-001` through `MACHPRINC-PG-007` in DD-17 and `tests/postgres/machine-principal-metadata-store.test.mjs`.


## DD-160 — Current machine-principal admissibility must be a pure ACTIVE API_CLIENT/SERVICE floor over DD-159 raw principal metadata

**Context:** DD-03 defines final `VerifiedMachineEvidence.principalType` as only API_CLIENT or SERVICE and explicitly forbids Platform Operators from substituting API credentials for interactive platform identity/elevation. Migration 0030 requires the API Credential principal to exist and be ACTIVE, rejects PLATFORM_OPERATOR, and separately owns SERVICE scope compatibility. Migration 0003 requires SERVICE principals to carry service code and owning module. DD-159 now supplies raw principal type/status/service metadata.

**Decision:** add server-internal pure helper `matchesCurrentMachinePrincipalFloor(metadata)`. It requires ACTIVE status, accepts API_CLIENT, accepts SERVICE only with non-blank service code and owning module, and rejects HUMAN/PLATFORM_OPERATOR and all non-active statuses. It does not interpret requested scope.

**Security / trade-off:** persistence admissibility for a HUMAN API Credential is not equivalent to runtime machine authentication: the canonical machine-evidence contract excludes HUMAN. Likewise, allowed scope classes are not converted into access authority by this helper.

**Boundary:** DD-160 does not evaluate DD-158 lifecycle on the caller's behalf; decide credential Tenant/Industry/PLATFORM_GLOBAL compatibility; decide SERVICE requested-scope compatibility; validate HUMAN membership administration rules; parse tokens or compare verifier hashes; enforce CIDR; interpret permission profiles; update auth epoch/credential usage; emit authentication audit; construct `VerifiedMachineEvidence`; implement `IdentityPort.verifyMachineCredential`; mutate principal/credential state; or change migrations/RLS/roles/grants/product policy.

**Acceptance:** `MACHPRINC-CUR-001` through `MACHPRINC-CUR-007` in DD-17 and `tests/server/machine-principal-currentness.test.mjs`.


## DD-161 — Persisted API Credential and principal scope evidence may be checked against a server-owned requested scope without becoming authentication or authorization

**Context:** DD-03 requires final machine evidence to preserve fixed Tenant binding, allowed Industry ids and scope classes, and requires RequestContext to enforce the allowed scope class again. PLATFORM_GLOBAL does not grant Tenant scope, TENANT_CORE does not grant TENANT_INDUSTRY, and generic machine evidence does not grant EXPLICIT_CROSS_CONTEXT. Migration 0034 owns platform/Tenant credential shape and SERVICE persisted-scope allowlists; migration 0030 demonstrates exact Industry consumption semantics. DD-147 supplies credential scope evidence, DD-159 supplies principal type/scope evidence, and DD-160 separately owns principal currentness.

**Decision:** add server-internal pure helper `matchesApiCredentialRequestedScopeFloor(material,principal,target)`. It requires exact credential→principal id binding, validates present UUID evidence, enforces platform/Tenant/Industry target shape, requires exact Tenant binding, permits Tenant-Core credentials to reach only explicitly allowlisted Industries, requires exact Industry for Industry-scoped credentials, enforces SERVICE requested-scope allowlist entries, and always denies EXPLICIT_CROSS_CONTEXT.

**Security / trade-off:** SERVICE scope is checked against the requested scope, not merely the credential's persisted scope. Therefore a SERVICE allowlisted only for TENANT_CORE cannot use a Tenant-Core credential plus Industry allowlist to gain TENANT_INDUSTRY runtime authority. API_CLIENT does not invent SERVICE allowlist semantics.

**Boundary:** DD-161 does not evaluate DD-158 lifecycle or DD-160 currentness on the caller's behalf; verify principal current status; parse credentials or compare verifier hashes; enforce CIDR; interpret permission profiles; update usage/auth epoch; emit authentication audit; construct final `VerifiedMachineEvidence`; implement `IdentityPort.verifyMachineCredential`; mutate principal/credential state; or change migrations/RLS/roles/grants/product policy.

**Acceptance:** `APICRED-SCOPE-001` through `APICRED-SCOPE-007` in DD-17 and `tests/server/api-credential-requested-scope.test.mjs`.


## DD-162 — DD-158, DD-160 and DD-161 may be composed as one pure API Credential necessary floor without becoming machine authentication

**Context:** DD-158 owns current API Credential lifecycle, DD-160 owns current machine-principal admissibility, and DD-161 owns requested-scope compatibility over persisted credential/principal evidence. DD-147 and DD-159 provide the raw server-internal source material. None of those decisions owns presented-token parsing, verifier execution, CIDR, permission-profile evaluation, use mutation/audit or final machine evidence.

**Decision:** add server-internal deterministic helper `matchesApiCredentialCoreNecessaryFloors(material, principal, input)`. The input carries the DD-161 requested-scope target plus an explicit server-owned evaluation instant. The helper returns true only when DD-158 lifecycle, DD-160 current principal and DD-161 requested scope all return true.

**Security / trade-off:** composition reduces accidental partial checks but does not strengthen any necessary predicate into authentication. A true result says only that persisted lifecycle, principal-currentness and requested-scope evidence are compatible for the supplied server-owned inputs.

**Boundary:** DD-162 does not parse presented credentials or extract prefixes; compare `secretHash`; choose crypto/verifier algorithms or parameters; enforce CIDR; interpret `permissionProfileId`; update `lastUsedAt`, credential version or auth epoch; emit authentication/use audit; construct final `VerifiedMachineEvidence`; implement `IdentityPort.verifyMachineCredential`; mutate credential/principal state; or change migrations/RLS/roles/grants/product policy.

**Acceptance:** `APICRED-CORE-001` through `APICRED-CORE-007` in DD-17 and `tests/server/api-credential-core-floors.test.mjs`.

## DD-163 — Webhook delivery may compose existing subscription/event/catalog evidence as one ordinary single-context necessary floor without becoming delivery authorization

**Context:** DD-07 §7 requires ACTIVE WebhookSubscription verification evidence and §10 permits delivery only when the event is cataloged webhook-eligible, belongs to the subscription Tenant and its Industry endpoint is included by the subscription. DD-081 owns authoritative envelope/catalog/scope validation; DD-088 exposes persisted WebhookSubscription evidence; DD-090 exposes persisted OutboxEvent evidence; DD-091 exposes exact EventCatalog metadata including `webhookEligible`. Event-filter grammar, endpoint SSRF/control, secret/signature handling, dispatcher readiness/retry and explicit cross-context endpoint composition remain separately unresolved.

**Decision:** add pure deterministic Core helper `matchesWebhookDeliveryNecessaryFloors(subscription,event,catalog)`. It requires ACTIVE subscription state plus valid verification evidence; exact event Tenant equality with the subscription Tenant; exact event type/version/scope equality with the supplied catalog; `webhookEligible === true`; and, for TENANT_INDUSTRY, the exact event Industry Context in the subscription allowlist. TENANT_CORE requires no Industry selector. PLATFORM_GLOBAL and EXPLICIT_CROSS_CONTEXT fail in this bounded helper.

**Security / trade-off:** the helper reduces accidental omission of already-owned DD-07 delivery prerequisites but does not authorize or execute delivery. A true result means only that the ordinary single-context subscription/event/catalog necessary facts are compatible. It does not interpret event filters, endpoint safety/control, permission profiles, secret versions, signing, Outbox readiness, retry/finality, catalog lifecycle status or network behavior.

**Boundary:** DD-163 does not parse/evaluate `eventFilterJson`; verify endpoint control; perform DNS/IP/redirect SSRF checks; access/generate/decrypt/rotate signing secrets; produce HMAC signatures; decide claim/lease/readiness/ordering/retry/DLQ/replay; authorize EXPLICIT_CROSS_CONTEXT; interpret EventCatalog ACTIVE/RETIRED status; interpret `permissionProfileId`; create WebhookDelivery rows; make network calls; expose a route; or change migrations/RLS/roles/grants/product policy.

**Acceptance:** `WH-FLOOR-001` through `WH-FLOOR-007` in DD-17 and `tests/core/webhook-delivery-floors.test.mjs`.

## DD-164 — SyncCursor current parent/capability binding may be re-evaluated as a pure necessary floor without authorizing synchronization

**Context:** DD-093 exposes exact IntegrationCapability registry evidence, DD-095 exposes exact RLS-visible TenantIntegration evidence, and DD-097 exposes the exact raw SyncCursor tuple while deliberately leaving the cursor payload opaque. Migration 0030 already owns the deterministic write-time binding predicate: the parent TenantIntegration is ACTIVE, the exact capability belongs to the same IntegrationDefinition and is ACTIVE, the capability code is present in the integration's enabled set, and the nullable Industry Context exactly matches the parent integration.

**Decision:** add pure Core helper `matchesCurrentSyncCursorBindingFloors(cursor, tenantIntegration, capability)`. It re-evaluates only those already-owned binding predicates over supplied immutable evidence. It requires valid identifier shape, exact cursor→TenantIntegration identity, ACTIVE TenantIntegration, exact IntegrationDefinition/capability identity, ACTIVE capability, exact enabled-capability membership, duplicate-free enabled-capability evidence and exact TENANT_CORE/TENANT_INDUSTRY Industry shape.

**Security / trade-off:** a persisted cursor can outlive changes to its parent integration or capability, so rechecking these predicates narrows accidental use of stale binding evidence. The helper does not make separately loaded snapshots atomic and does not turn a true result into sync/resume/provider authority.

**Boundary:** DD-164 does not decrypt or interpret cursor contents; decide cursor freshness from watermark/source version/update time; interpret Integration health/config/permission profile or capability direction/rate/idempotency/data class; select a ProviderAdapter; read CredentialReference or secret material; execute OperationContracts/events; mutate cursor/integration/capability state; authorize resume/replay/synchronization; perform provider/network calls; or change migrations/RLS/roles/grants/routes/product policy.

**Acceptance:** `SYNC-BIND-001` through `SYNC-BIND-007` in DD-17 and `tests/core/sync-cursor-binding-floors.test.mjs`.

## DD-165 — TenantIntegration CredentialReference current binding may be re-evaluated as a pure necessary floor without authorizing provider execution

**Context:** DD-095 exposes exact RLS-visible TenantIntegration evidence and DD-096 exposes non-secret CredentialReference metadata. Migration 0030 already owns the deterministic write-time relationship/currentness predicate: the referenced credential id exists, Tenant ownership matches, an Industry-scoped credential may bind only the exact integration Industry Context while a Tenant-wide credential may bind Tenant-Core or Tenant-Industry, credential status is ACTIVE, and optional expiry is strictly later than the evaluation instant.

**Decision:** add pure Core helper `matchesCurrentTenantIntegrationCredentialFloors(integration, credential, evaluatedAt)`. It validates required UUID identity, exact integration ownership shape, exact credential id and Tenant binding, optional exact Industry binding, raw ACTIVE credential status and strict expiry currentness using a supplied server-owned instant.

**Security / trade-off:** rechecking only migration-owned credential linkage/currentness avoids silently treating stale CredentialReference status/expiry as current execution authority. The helper deliberately ignores TenantIntegration lifecycle/health/config/profile, IntegrationDefinition/capabilities, provider/adapter choice, secret-store/provider metadata, key rotation semantics and network execution.

**Boundary:** a true result is only a necessary current-binding floor. DD-165 does not read/dereference `secret_reference`, retrieve secret material, interpret credential type/key version/rotation overlap, select ProviderAdapter/provider, resolve permission profiles, decide integration health/executability, execute callbacks/sync/OperationContracts/events, mutate usage/audit/state or change SQL/RLS/roles/grants/routes/product policy.

**Acceptance:** `INT-CRED-CUR-001…007` in DD-17 and `tests/core/tenant-integration-credential-floors.test.mjs`.

## DD-166 — TenantIntegration Definition/config/enabled-capability current set may be re-evaluated as a pure necessary floor without authorizing execution

**Context:** DD-092/DD-093/DD-095 expose exact IntegrationDefinition, IntegrationCapability and TenantIntegration evidence. Migration 0030 already owns the deterministic write-time Definition/config/enabled-capability predicate: the exact Definition is ACTIVE; integration config is a JSON object; enabled codes are duplicate-free; each enabled code belongs to the Definition capability list and has an exact ACTIVE IntegrationCapability row under that Definition.

**Decision:** add pure Core helper `matchesCurrentTenantIntegrationDefinitionCapabilityFloors(integration, definition, capabilities)`. It requires exact integration→definition identity, raw ACTIVE Definition status, JSON-object config, duplicate-free non-empty enabled codes, Definition membership and exactly one supplied exact ACTIVE capability evidence row for each enabled code. Empty enabled sets are valid when Definition/config predicates match. Extra non-enabled capability evidence is ignored.

**Security / trade-off:** rechecking only migration-owned set predicates prevents stale Definition/capability registry changes from silently satisfying current integrity. It deliberately does not make TenantIntegration status executable, compose credential currentness, select a provider/adapter or authorize OperationContract/event/network execution.

**Boundary:** DD-166 does not interpret config beyond object shape; decide TenantIntegration lifecycle/health/profile; re-evaluate DD-165 credential binding; re-evaluate DD-164 SyncCursor binding; choose provider/direction; apply rate/idempotency/retry/circuit/residency policy; access secrets; mutate state; execute callbacks/sync/OperationContracts/events/network; or change SQL/RLS/roles/grants/routes/product policy.

**Acceptance:** `INT-SET-CUR-001…007` in DD-17 and `tests/core/tenant-integration-definition-capability-floors.test.mjs`.

## DD-167 — DD-165 and DD-166 may be composed as one TenantIntegration current-integrity necessary floor without authorizing execution

**Context:** migration 0030 owns one TenantIntegration write-time integrity predicate whose credential relationship/currentness half is re-evaluable through DD-165 and whose Definition/config/enabled-capability half is re-evaluable through DD-166. Neither helper makes TenantIntegration executable or owns provider/runtime semantics.

**Decision:** add pure Core helper `matchesCurrentTenantIntegrationIntegrityFloors(integration, credential, evaluatedAt, definition, capabilities)`. It delegates exactly to DD-165 and DD-166 and returns true iff both existing floors return true. No new primitive predicate, fallback or precedence is introduced.

**Security / trade-off:** composition reduces accidental partial integrity checks while preserving the distinction between current persisted integrity and execution authority. TenantIntegration lifecycle, health/profile policy, provider/adapter selection, secret access, OperationContract/event execution, callbacks/sync and network behavior remain separate.

**Boundary:** DD-167 does not make TenantIntegration ACTIVE/executable/healthy; resolve profiles; read or dereference secret locators/material; interpret rotation policy; select provider/adapter/direction; authorize SyncCursor resume/synchronization; execute OperationContracts/events/callbacks/network; apply rate/retry/circuit/residency/data-transfer policy; mutate state/use/audit evidence; or change SQL/RLS/roles/grants/routes/product policy.

**Acceptance:** `INT-INTEGRITY-001…007` in DD-17 and `tests/core/tenant-integration-integrity-floors.test.mjs`.

## DD-168 — NotificationDelivery optional TenantIntegration binding may be re-evaluated as a pure current relationship floor without authorizing delivery

**Context:** DD-098 exposes raw NotificationDelivery evidence and DD-095 exposes raw TenantIntegration evidence. Migration 0031 conditionally validates `tenant_integration_id`: when present, the referenced integration must be same-Tenant, raw ACTIVE, and either Tenant-wide or exact-Industry compatible with the delivery. When absent, no integration relationship is required.

**Decision:** add pure Core helper `matchesNotificationDeliveryIntegrationBindingFloors(delivery, integration?)`. It validates delivery identity/scope shape, treats absent integration binding as valid only when no integration evidence is supplied, and for present bindings requires exact integration id, same Tenant, ACTIVE status and Tenant-wide-or-exact-Industry compatibility.

**Security / trade-off:** the helper mirrors only migration-0031 relationship integrity. It deliberately does not compose DD-167 current Integration integrity, because migration 0031 does not re-evaluate credential/Definition/capability predicates for NotificationDelivery writes.

**Boundary:** DD-168 does not send/retry notifications; choose channel/provider/adapter; access secrets; interpret delivery lifecycle/finality; validate template/recipient/source-event relationships; resolve profiles/health/fallback; execute callbacks/OperationContracts/events/network; mutate delivery/integration state; or change SQL/RLS/roles/grants/routes/product policy.

**Acceptance:** `NOTIF-INT-CUR-001…007` in DD-17 and `tests/core/notification-integration-binding-floors.test.mjs`.

## DD-169 — NotificationDelivery optional source-event binding may be re-evaluated as a pure exact-scope relationship floor without authorizing dispatch

**Context:** DD-098 exposes raw NotificationDelivery evidence and DD-090 exposes raw OutboxEvent evidence. Migration 0031 conditionally validates `source_event_id`: when present, the referenced event must be same-Tenant, exact scope-class equal and exact nullable Industry Context equal to the delivery. When absent, no source-event relationship is required.

**Decision:** add pure Core helper `matchesNotificationDeliverySourceEventBindingFloors(delivery, event?)`. It validates delivery identity/scope shape, treats absent source-event binding as valid only when no event evidence is supplied, and for present bindings requires exact event id, same Tenant, exact scope class and exact nullable Industry Context.

**Security / trade-off:** the helper mirrors only migration-0031 relationship integrity. It deliberately ignores Outbox dispatcher lifecycle, availability, attempts, locks, errors, catalog status and payload/envelope semantics.

**Boundary:** DD-169 does not decide event readiness; claim/lease/lock/increment/retry/DLQ/replay; interpret payload/envelope schemas; validate EventCatalog lifecycle/webhook eligibility; send/retry notifications; select providers/adapters; access secrets; validate template/recipient/integration current integrity; execute callbacks/OperationContracts/events/network; mutate state; or change SQL/RLS/roles/grants/routes/product policy.

**Acceptance:** `NOTIF-EVT-CUR-001…007` in DD-17 and `tests/core/notification-source-event-binding-floors.test.mjs`.

## DD-170 — Shared definition-scope applicability/containment predicates must be total fail-closed booleans

**Context:** migration 0031 explicitly labels `core_tenancy.definition_applies_to_scope()` and `definition_contains_definition()` as shared fail-closed predicates. The original ordinary nullable equality could return SQL NULL for a narrower Industry definition evaluated against a Tenant-Core target. Integrity callers commonly use `NOT predicate` inside PL/pgSQL `IF` conditions, where UNKNOWN/NULL is not a true rejection condition.

**Decision:** forward migration 0048 replaces both predicate bodies with the same existing PLATFORM/TENANT/INDUSTRY hierarchy wrapped in `COALESCE(..., false)`. Function signatures, IMMUTABLE classification, fixed search path and PUBLIC revocation are preserved. No owner hierarchy or applicability rule is widened.

**Security / trade-off:** malformed or nullable mismatches now deterministically resolve to false, restoring the fail-closed semantics already declared by migration 0031 and preventing `NOT NULL` integrity-trigger bypass. Direct verification covers PLATFORM/TENANT/INDUSTRY applicability, exact Industry matching, Industry→Tenant-Core rejection, Industry-parent→Tenant-child containment rejection, malformed/null inputs and trigger-style `NOT` behavior.

**Boundary:** DD-170 does not define NotificationTemplate selection/rendering/locale fallback; authorize notification delivery/provider/retry; alter Identity/Authz policy; modify existing data; add tables/indexes/RLS/roles/grants/routes; change the PLATFORM/TENANT/INDUSTRY hierarchy; or widen machine-auth, Webhook, SyncCursor or Integration execution boundaries.

**Acceptance:** `DEF-SCOPE-FC-001…007` in DD-17 and `database/verification/0048_definition_scope_fail_closed.verify.sql`.

## DD-171 — NotificationDelivery optional NotificationTemplate binding may be re-evaluated as a pure current relationship floor without authorizing rendering or delivery

**Context:** DD-098 exposes raw NotificationDelivery evidence and DD-100 exposes raw NotificationTemplate evidence. Migration 0031 conditionally validates `template_id`: exact template version, raw ACTIVE status, exact channel and canonical definition applicability. DD-170 restored that shared applicability predicate to a total fail-closed boolean without changing the owner hierarchy.

**Decision:** add pure Core helper `matchesNotificationDeliveryTemplateBindingFloors(delivery, template?)`. An unbound delivery requires both template id/version and template evidence to be absent. A bound delivery requires exact template id/version, ACTIVE status, exact channel and valid PLATFORM/TENANT/INDUSTRY ownership applicability to the delivery.

**Security / trade-off:** this helper mirrors only persisted relationship/currentness semantics. It deliberately does not select another version, choose scope/locale fallback, render/escape variables, infer creator/approver send authority, select provider/integration or send/retry.

**Boundary:** DD-171 does not choose templates by code; select latest versions; define scope/locale fallback; render/sanitize/substitute content; authorize send from creator/approver evidence; select integration/provider/credentials; send/retry/finalize; validate recipient/source-event/integration relationships beyond their independent floors; mutate state; or change SQL/RLS/roles/grants/routes/product policy.

**Acceptance:** `NOTIF-TPL-CUR-001…007` in DD-17 and `tests/core/notification-template-binding-floors.test.mjs`.

## DD-172 — Known NotificationDelivery persisted relationship floors may be composed without claiming complete delivery validity

**Context:** DD-168, DD-169 and DD-171 separately re-evaluate migration-0031-owned TenantIntegration, OutboxEvent and NotificationTemplate relationships. The recipient-principal path remains source-incomplete for general later re-evaluation because its authoritative PLATFORM_OPERATOR path depends on request-local elevation/current-principal/current-Tenant state not persisted on NotificationDelivery.

**Decision:** add pure Core helper `matchesKnownNotificationDeliveryRelationshipFloors(delivery, integration?, event?, template?)`. It returns true iff the existing DD-168, DD-169 and DD-171 helpers all return true. It adds no primitive relationship rule and deliberately excludes recipient-principal currentness.

**Security / trade-off:** one conjunction reduces accidental omission of already-governed relationship checks while preserving the explicit gap. A true result means only that the three known re-evaluable persisted relationships are current; it is not complete NotificationDelivery validity and not execution authorization.

**Boundary:** DD-172 does not validate recipient-principal currentness; infer membership/elevation provenance; decide delivery lifecycle/finality; render/select/fallback templates; select providers/secrets; dispatch/retry Outbox events; send/retry notifications; perform network calls; mutate state; or change SQL/RLS/roles/grants/routes/product policy.

**Acceptance:** `NOTIF-REL-CUR-001…007` in DD-17 and `tests/core/notification-known-relationship-floors.test.mjs`.

## DD-173 — WorkflowInstance definition binding may be re-evaluated as a pure current relationship floor without authorizing workflow execution

**Context:** DD-101 exposes raw WorkflowDefinition evidence and DD-102 exposes raw WorkflowInstance evidence. Migration 0031 validates one exact WorkflowInstance→WorkflowDefinition relationship: exact definition id, exact persisted version, raw ACTIVE status and canonical scope applicability. DD-170 already makes definition applicability total/fail-closed.

**Decision:** add pure Core helper `matchesWorkflowInstanceDefinitionBindingFloors(instance, definition)`. It validates instance identity/scope shape, definition identity/version/status and PLATFORM/TENANT/INDUSTRY applicability only.

**Security / trade-off:** the helper deliberately excludes WorkflowInstance `created_by` currentness because `principal_is_active_for_tenant(...)` can depend on TenantMembership or request-local PLATFORM_OPERATOR elevation/current-principal/current-Tenant evidence. It also leaves state-machine/current-state/transition semantics uninterpreted.

**Boundary:** DD-173 does not select definitions by code/date; validate creator-principal currentness; interpret state-machine JSON, approval policy or rules; decide current-state validity; authorize/execute transitions; claim/complete tasks; mutate instances; emit events; or change SQL/RLS/roles/grants/routes.

**Acceptance:** `WFI-DEF-CUR-001…007` in DD-17 and `tests/core/workflow-instance-definition-binding-floors.test.mjs`.

## DD-174 — WorkflowTask/WorkflowTransition parent scope may be re-evaluated as a pure exact WorkflowInstance relationship floor

**Context:** DD-102 exposes raw WorkflowInstance evidence; DD-103/DD-104 expose raw WorkflowTask/WorkflowTransition evidence. Migration 0031 validates both child types against the referenced WorkflowInstance by exact parent id, same Tenant and exact nullable Industry Context.

**Decision:** add pure Core helper `matchesWorkflowChildParentBindingFloors(child, instance)` for `PersistedWorkflowTask | PersistedWorkflowTransition`. It validates child/parent identity and parent ownership shape, then requires exact parent id, same Tenant and exact nullable Industry Context.

**Security / trade-off:** the helper mirrors only migration-0031 parent-scope relationship integrity. It deliberately does not evaluate task assignee/claimant/completer identity, transition actor identity, permission codes, due/expiry, state-machine/rule semantics, task actions or transition execution.

**Boundary:** DD-174 does not authorize task claim/approve/reject/complete, validate assigned PRINCIPAL/ROLE/ORG_UNIT currentness, validate transition actors, interpret current state/action/to state/version evidence, mutate Workflow state, emit events, or change SQL/RLS/roles/grants/routes/product policy.

**Acceptance:** `WFCH-PARENT-CUR-001…007` in DD-17 and `tests/core/workflow-child-parent-binding-floors.test.mjs`.

## DD-175 — AutomationRun definition currentness may be re-evaluated as a pure exact ACTIVE/scope relationship floor

**Context:** DD-105 exposes raw AutomationDefinition evidence and DD-106 exposes raw AutomationRun evidence. Migration 0031 validates AutomationRun against its referenced AutomationDefinition by exact id, raw ACTIVE status and canonical owner-scope applicability.

**Decision:** add pure Core helper `matchesAutomationRunDefinitionBindingFloors(run, definition)`. It validates run/definition identities, exact id equality, raw `ACTIVE` status and PLATFORM/TENANT/INDUSTRY applicability to the run Tenant/optional Industry scope.

**Security / trade-off:** AutomationRun does not persist a definition version and migration 0031 does not compare version/effective dates for this relationship. DD-175 therefore does not invent version selection, effective-date selection or execution semantics.

**Boundary:** DD-175 does not interpret triggers/config/conditions, authorize AutomationRun status transitions, schedule retry/backoff/finality, dispatch OperationContracts or WorkflowDefinitions, mutate runs, emit events, or change SQL/RLS/roles/grants/routes/product policy.

**Acceptance:** `WFA-RUN-DEF-CUR-001…007` in DD-17 and `tests/core/automation-run-definition-binding-floors.test.mjs`.

## DD-176 — AutomationDefinition optional WorkflowDefinition reference may be re-evaluated as a pure broader/equal containment floor

**Context:** DD-101 exposes raw WorkflowDefinition evidence; DD-105 exposes raw AutomationDefinition evidence. Migration 0031 validates optional `workflow_definition_id` using migration 0048's fail-closed `definition_contains_definition(...)`.

**Decision:** add pure Core helper `matchesAutomationDefinitionWorkflowDefinitionContainmentFloors(automationDefinition, workflowDefinition?)`. Unbound AutomationDefinitions require no WorkflowDefinition evidence. Bound definitions require exact id plus canonical broader/equal scope containment.

**Containment:** PLATFORM AutomationDefinition requires PLATFORM WorkflowDefinition; TENANT AutomationDefinition accepts PLATFORM or same-Tenant TENANT parent; INDUSTRY AutomationDefinition accepts PLATFORM, same-Tenant TENANT or exact same-Tenant INDUSTRY parent.

**Security / trade-off:** migration 0031 does not inspect WorkflowDefinition status, version, effective dates, state-machine, approval policy or rule references for this relation. DD-176 therefore deliberately does not convert containment into WorkflowDefinition currentness or execution authority.

**Boundary:** DD-176 does not select WorkflowDefinition versions, require ACTIVE/PUBLISHED status, interpret state-machine/approval/rules, interpret Automation trigger/config/conditions, dispatch OperationContracts/Workflows, mutate runs/instances, emit events, or change SQL/RLS/roles/grants/routes/product policy.

**Acceptance:** `WFA-DEF-WF-CUR-001…007` in DD-17 and `tests/core/automation-definition-workflow-containment-floors.test.mjs`.

## DD-177 — PromptSetMember current relationship may be re-evaluated as an ACTIVE parent/template plus broader/equal containment floor

**Context:** DD-112 exposes raw PromptSet evidence, DD-114 raw PromptSetMember evidence and DD-115 raw PromptTemplate evidence. Migration 0031 validates PromptSetMember against an ACTIVE PromptSet and ACTIVE PromptTemplate; migration 0048 defines template-scope containment.

**Decision:** add pure Core helper `matchesAIPromptSetMemberBindingFloors(member, promptSet, promptTemplate)`. It requires exact member reference identities, valid owner shapes, raw ACTIVE statuses on both referenced definitions and PromptTemplate broader/equal containment of PromptSet scope.

**Security / trade-off:** member `priority`, `enabled`, createdAt and PromptTemplate content/schema/grounding/override fields are not part of migration-0031's relationship predicate. DD-177 does not convert them into effective-set, rendering or execution authority.

**Boundary:** DD-177 does not list/order members, filter by enabled, select current/latest versions, render prompts, validate variables/overrides/grounding, resolve IndustryAIConfig prompt sets, compose prompts, select providers/models/policies, execute AI tools/agents, mutate persistence, or change SQL/RLS/roles/grants/routes/product policy.

**Acceptance:** `AIPROMPTMEM-CUR-001…007` in DD-17 and `tests/core/ai-prompt-set-member-binding-floors.test.mjs`.

## DD-178 — AIToolSetMember referenced ToolDefinition currentness may be re-evaluated as a pure exact-id/ACTIVE relationship floor

**Context:** DD-110 exposes raw AIToolDefinition catalog metadata and DD-113 exposes raw AIToolSetMember evidence. Migration 0031 validates an `ai_tool_set_member` by requiring its referenced ToolDefinition to exist and have raw status exactly `ACTIVE`.

**Decision:** add pure Core helper `matchesAIToolSetMemberDefinitionBindingFloors(member, definition)`. It validates member/definition identities, exact `definition.id === member.toolDefinitionId`, and raw `definition.status === 'ACTIVE'`.

**Security / trade-off:** the helper deliberately ignores member `enabled`, `constraint_json`, parent ToolSet status and all ToolDefinition permission/entitlement/approval/side-effect/idempotency/audit/OperationContract semantics because migration 0031's member relationship branch does not make those execution predicates.

**Boundary:** DD-178 does not compute effective ToolSet membership; validate parent ToolSet currentness; interpret constraints; authorize permissions/entitlements/approvals; execute OperationContracts; validate AgentStep/AgentDefinition runtime eligibility; invoke tools/providers/models; or change SQL/RLS/roles/grants/routes/product policy.

**Acceptance:** `AITOOLMEM-DEF-CUR-001…007` in DD-17 and `tests/core/ai-tool-set-member-definition-binding-floors.test.mjs`.

## DD-179 — AssistantDefinition PromptTemplate/ToolSet references may be re-evaluated as pure ACTIVE containment floors

**Context:** DD-117 exposes raw AssistantDefinition evidence, DD-115 raw PromptTemplate evidence and DD-111 raw ToolSet evidence. Migration 0031 requires the AssistantDefinition's mandatory PromptTemplate and optional ToolSet to exist, be raw ACTIVE and contain the AssistantDefinition owner scope under the DD-170 fail-closed definition-containment hierarchy.

**Decision:** add pure Core helper `matchesAIAssistantDefinitionRelationshipFloors(assistant, promptTemplate, toolSet?)`. It validates AssistantDefinition owner shape; requires exact PromptTemplate id, ACTIVE status and broader-or-equal containment; and, when `toolSetId` is present, requires exact ToolSet id, ACTIVE status and broader-or-equal containment. An AssistantDefinition without `toolSetId` rejects extra ToolSet evidence.

**Security / trade-off:** capability currentness is a separate migration-0031 predicate and is not silently folded into this relationship helper. PromptTemplate/ToolSet versions and effective dates are not persisted on these AssistantDefinition references and therefore are not invented.

**Boundary:** DD-179 does not validate Assistant capability currentness; select current/latest AssistantDefinition; render prompts; interpret grounding/overrides; resolve effective ToolSet members; authorize permission/entitlement/approval; resolve RAG/model/retention policy; bind conversations/memory/runs; execute OperationContracts/tools/agents/providers/models; or change SQL/RLS/roles/grants/routes/product policy.

**Acceptance:** `AIASSIST-REL-CUR-001…007` in DD-17 and `tests/core/ai-assistant-definition-relationship-floors.test.mjs`.

## DD-180 — AgentDefinition allowed ToolSet currentness may be re-evaluated as a pure exact ACTIVE/containment relationship floor

**Context:** DD-118 exposes raw AgentDefinition evidence and DD-111 exposes raw ToolSet evidence. Migration 0031 validates `allowed_tool_set_id` by exact id, raw ACTIVE ToolSet status and broader-or-equal definition containment. Migration 0048 makes the shared containment predicate total/fail-closed.

**Decision:** add pure Core helper `matchesAIAgentDefinitionToolSetBindingFloors(agent, toolSet)`. It validates AgentDefinition/ToolSet identities and owner shapes, requires exact ToolSet id equality, raw `ACTIVE` ToolSet status, and canonical PLATFORM/TENANT/INDUSTRY broader-or-equal containment.

**Security / trade-off:** AgentDefinition persists no ToolSet version/effective-date reference for this binding. DD-180 therefore does not invent version selection or effective ToolSet-member resolution. Agent objective/risk/approval/budget/version/status/timestamp evidence remains uninterpreted by this floor.

**Boundary:** DD-180 does not select current/latest AgentDefinition; resolve effective ToolSet members; interpret objective/risk classes; resolve approval/budget policy; authorize AgentRun/AgentStep; validate acting principal/membership; authorize tool permissions/entitlements/approvals; execute OperationContracts/tools/agents/providers/models; perform inference/RAG/embeddings/media; or change SQL/RLS/roles/grants/routes/product policy.

**Acceptance:** `AIAGENT-TOOLSET-CUR-001…007` in DD-17 and `tests/core/ai-agent-definition-tool-set-binding-floors.test.mjs`.

## DD-181 — AgentRun definition currentness may be re-evaluated as a pure exact ACTIVE/scope relationship floor

**Context:** DD-130 exposes raw AgentRun evidence and DD-118 exposes raw AgentDefinition evidence. Migration 0031 validates AgentRun against its referenced AgentDefinition by exact id, raw ACTIVE status and canonical scope applicability. The same trigger separately validates acting-principal currentness and optional membership currentness.

**Decision:** add pure Core helper `matchesAIAgentRunDefinitionBindingFloors(run, definition)`. It validates run/definition identities, exact id equality, raw `ACTIVE` definition status and PLATFORM/TENANT/INDUSTRY applicability to the run Tenant/optional Industry scope.

**Security / trade-off:** AgentRun persists no AgentDefinition version and migration 0031 does not compare version/effective dates for this relationship. DD-181 therefore does not invent version selection. Acting-principal and membership predicates remain separate and are not weakened into this relationship floor.

**Boundary:** DD-181 does not validate acting-principal or membership currentness; evaluate permission/entitlement snapshots; interpret requested resource scope as authorization; select current/latest AgentDefinition; compose DD-180 ToolSet currentness automatically; interpret AgentRun lifecycle/resume/cancel status; enforce budgets; plan/execute AgentSteps; resolve approvals; authorize tools; execute providers/models/tools; or change SQL/RLS/roles/grants/routes/product policy.

**Acceptance:** `AIARUN-DEF-CUR-001…007` in DD-17 and `tests/core/ai-agent-run-definition-binding-floors.test.mjs`.

## DD-182 — AgentStep TOOL/non-TOOL persisted binding may be re-evaluated without authorizing tool execution

**Context:** migration 0031 resolves AgentStep→AgentRun→AgentDefinition and, for TOOL steps, validates the persisted ToolSetMember/ToolDefinition chain against the AgentDefinition's persisted allowed ToolSet. Non-TOOL steps must not carry a tool binding.

**Decision:** add pure Core helper `matchesAIAgentStepToolBindingFloors(step, run, definition, member?, toolDefinition?)`. It validates only the exact parent id chain and migration-owned TOOL/non-TOOL binding relationship: TOOL requires exact member id, enabled member, exact ACTIVE ToolDefinition and exact member ToolSet equality to `definition.allowedToolSetId`; PLAN/RAG/APPROVAL/INFERENCE require no binding/evidence.

**Security / trade-off:** DD-182 deliberately does not compose DD-180 ToolSet currentness or DD-181 AgentDefinition currentness beyond the exact persisted parent-id chain. A true result is not acting-principal authorization, permission/entitlement/approval satisfaction, OperationContract eligibility or tool execution authority.

**Boundary:** DD-182 does not evaluate approval backlinks/satisfaction, ToolSetMember constraint JSON, ToolDefinition permission/entitlement/approval/side-effect/risk/idempotency/audit/schema metadata, provider/model selection, inference/RAG/media, step selection/retry/resume/cancel, run mutation or network/tool execution.

**Acceptance:** `AISTEP-TOOL-CUR-001…007` in DD-17 and `tests/core/ai-agent-step-tool-binding-floors.test.mjs`.

