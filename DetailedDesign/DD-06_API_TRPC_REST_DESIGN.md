# DD-06 — API / tRPC / REST DESIGN
**Wave:** 1 · **Status:** DETAILED DESIGN COMPLETE  
**Traces:** F-01 §7 · F-03 §3 · A-01 §3 · A-06 §1–§3/§7 · ADR-004/005 · DD-01/02/03

## 1. Canonical operation definition
Every business operation is registered once as:
`OperationContract{operationId, module, scopeClass, kind(COMMAND|QUERY), permissionCode, entitlementRequirement?, inputSchemaVersion, outputSchemaVersion, resourceResolver?, idempotencyPolicy, rateClass, auditClass, domainService, emittedEvents[], errorCodes[]}`.

tRPC and REST project this same contract.

## 2. tRPC naming
Router grammar:
- Core: `core.<module>`
- Industry: `ind.<industry>.<ms>`
Procedure grammar: `<resource>.<capability>` or business verb such as `sample.collect`, `result.publish`, `subscription.changePlan`.

First-party procedures never encode business logic in routers.

## 3. tRPC procedure specification template
For each future procedure:
| Item | Required |
|---|---|
| Router/procedure | Yes |
| OperationContract ID | Yes |
| Input schema | Exact |
| Output schema | Exact |
| Scope class | Yes |
| Required permission | Yes |
| Required entitlement | If applicable |
| Required Industry Context | Derived from scope |
| Resource resolver | If resource-bound |
| Idempotency | Commands |
| Expected row/version | Conflict-sensitive writes |
| Domain service | Yes |
| Events | If emitted |
| Errors | Enumerated |
| Audit class | Yes |

## 4. REST convention
Base: `/api/v1`. External interoperability only.

Path conventions:
- tenant core: `/api/v1/tenants/{tenantId}/...`
- industry: `/api/v1/tenants/{tenantId}/industries/{industryContextId}/...`
The path IDs are selectors/references only; server RequestContext remains authoritative.

Methods: GET query; POST create/command; PATCH partial governed update; PUT only full replacement with explicit semantic; DELETE only where true hard-delete is allowed. Business transitions prefer named action endpoints, e.g. `POST .../subscriptions/{id}:change-plan`, not generic state PATCH.

## 5. Headers
- `Authorization`: human bearer or machine credential scheme.
- `Idempotency-Key`: required for externally retryable mutating commands.
- `If-Match` / operation expectedVersion equivalent for conflict-sensitive writes.
- `X-Correlation-Id`: accepted as advisory; normalized/generated server-side.
- Tenant/industry headers may be supported for integrations only as selectors; never authoritative over credential/resource binding.

## 6. Request/response envelopes
Success:
`{data, meta:{requestId, correlationId, operationId, version?}}`

List:
`{data:[...], page:{cursor?, nextCursor?, limit}, meta:{...}}`

Error:
`{error:{code, class, messageSafe, fieldErrors?, retryable, decisionId?}, meta:{requestId, correlationId}}`

No stack traces, SQL, provider secrets, internal resource existence, or policy internals.

## 7. Pagination
Cursor-based default for mutable/high-volume collections. Cursor encodes stable sort keys and is integrity-protected. Offset pagination allowed only for small reference catalogs where drift risk is accepted.

## 8. Idempotency record
`id, tenant_id, industry_context_id?, credential_or_principal_id, operation_id, idempotency_key_hash, request_fingerprint, response_status, response_reference?, state(IN_PROGRESS,SUCCEEDED,FAILED_RETRYABLE,FAILED_FINAL), expires_at, created_at, updated_at`.
Unique on scoped principal+operation+key. Same key + different request fingerprint → `IDEMPOTENCY_CONFLICT`.

## 9. API credential enforcement
API credential resolves one principal and fixed tenant plus optional allowed industry set. Requesting an industry outside that set denies before resource resolution.

## 10. Rate classes
OperationContract references a symbolic rate class resolved through **SecurityRatePolicy v1 (DD-022/DD-028)**. Canonical mapping/default ceiling: `PUBLIC_LOW`→30/min burst10; `AUTH_STANDARD`→600/min burst120; `AUTH_HIGH_COST`→`ADMIN_SENSITIVE` 60/min burst15; `EXTERNAL_WRITE`→120/min unless the credential-specific `API_CREDENTIAL` ceiling 1200/min is tighter/looser only within DD-028 bounds; `AI_COSTED`→60/min concurrency8/tenant; `WEBHOOK_ADMIN`→600/min/endpoint. Tightest principal/IP/credential/tenant/security-risk limit wins. Tenant/plan policy may tighten; it cannot exceed DD-028 platform ceilings without a new versioned security-policy decision. Every throttle emits deterministic `RATE_LIMITED`, Retry-After metadata and a security/operations audit/metric.

## 11. Versioning
REST: additive-compatible changes within v1; breaking contract opens v2 with explicit deprecation.  
tRPC: first-party release-train compatibility; persisted/offline queued commands carry operation/schema version and must have an upgrade/reject path.

## 12. Validation order
Transport/authenticity → selector normalization → DD-02 context → schema → commercial/access DD-03/04 → resource ownership → business/workflow → transaction/outbox/audit.

## 13. Baseline Core procedure contracts
### core.tenancy.workspace.resolve
Query; TENANT_CORE; Tenant selection is a transport/server selector fact resolved into RequestContext before the procedure executes; the procedure DTO may carry only an optional Industry selector for workspace projection. Output is sanitized ClientWorkspaceContext; permission is membership-derived; no client field becomes Tenant authority.

### core.identity.roles.listEffective
Query; TENANT_CORE; input membership/principal reference; output effective role/permission version summary; permission `core.identity.role.view`.

### core.commercial.entitlements.getCurrent
Query; TENANT_CORE; output current snapshot projection safe for UI; permission tenant membership + entitlement self-view policy.

### core.commercial.subscription.changePlan
Command; TENANT_CORE; provisional input fields are `subscriptionId`, `targetPlanVersionId`, `effectiveTiming`, `expectedVersion`; `effectiveTiming` vocabulary is `IMMEDIATE | NEXT_RENEWAL`. `Idempotency-Key` is transport metadata owned by DD-049/DD-054 and MUST NOT be duplicated inside the DTO. Operation idempotency policy is REQUIRED. Direct mutation remains implementation-blocked until DD-061 closes route/payment-or-approval evidence, impact/remediation/proration, compiler/outbox and least-privilege write-boundary prerequisites; no client field may bypass those server-owned gates.

### core.document.signedDownload.create
Command/query hybrid capability; scope follows document; input documentId; output short-lived signed URL descriptor; permission resolved by source document ACL; never exposes storage secret/key as authority.

## 14. Acceptance
No tRPC-only/REST-only business rules; wrong-context IDs deny; retries cannot duplicate side effects; permission/error/event semantics are adapter-invariant.


## 15. Wave-2 Integration Registry extension
### IntegrationDefinition
`id uuid PK, code UNIQUE, name, provider_family, capability_codes[], adapter_contract_version, owner_scope, status, data_transfer_class, residency_metadata_json, created_at, updated_at`.

### TenantIntegration
`id, tenant_id, industry_context_id?, integration_definition_id, scope_class, display_name, status(PENDING,ACTIVE,PAUSED,ERROR,REVOKED), credential_reference_id, config_json_encrypted_or_safe, enabled_capabilities[], permission_profile_id, health_state, last_health_at?, version, created_at, updated_at`.

### CredentialReference
`id, tenant_id?, industry_context_id?, secret_store_provider, secret_reference, credential_type, key_version, status, rotated_at?, expires_at?, created_at`. Secret plaintext is never represented in business tables/contracts.

### IntegrationCapability
`id, integration_definition_id, capability_code, direction(INBOUND,OUTBOUND,BIDIRECTIONAL), operation_contract_id?, event_types[], data_class, idempotency_class, rate_class, status`.

### ProviderAdapter
Registry metadata: `id, definition_id, adapter_code, contract_version, auth_method, timeout_class, retry_class, circuit_class, health_probe_class, normalized_error_map_version, status`.

### SyncCursor
`id, tenant_integration_id, capability_code, industry_context_id?, cursor_encrypted_or_opaque, watermark_time?, source_version?, updated_at`.

### RetryState / DeliveryState / HealthState
Stored per operation/delivery with normalized state; provider-specific raw error is redacted/mapped before persistence.

## 16. Provider adapter standard
Every adapter declares:
- capability and OperationContract/event mapping;
- auth method and CredentialReference ownership;
- tenant/Industry scope;
- timeout class;
- retry/idempotency class;
- rate handling;
- health probe;
- circuit-breaker behavior;
- normalized error mapping;
- audit/metric fields;
- residency/data-transfer classification.

Adapters cannot write domain tables directly. Inbound callbacks verify provider authenticity then translate into governed domain commands/events.

## 17. Integration credential handling
Secrets live in deployment/secret-store systems referenced by CredentialReference. Rotation may overlap old/new key versions for bounded policy window. Access to secret material is service-principal-only, purpose-bound and audited; UI receives only masked metadata/status.

## 18. Integration health
Health states: `UNKNOWN, HEALTHY, DEGRADED, UNAVAILABLE, AUTH_ERROR, RATE_LIMITED, POLICY_BLOCKED`. Provider health never causes fallback to a provider/region forbidden by tenant policy.


## 19. Concrete rate-limit defaults [DD-AC]
| Class | Sustained | Burst | Concurrency / scope | Primary enforcement |
|---|---:|---:|---|---|
| PUBLIC_LOW | 30/min | 10 | 5/IP | IP+route |
| PUBLIC_STANDARD | 120/min | 30 | 10/IP | IP+route |
| AUTH_STANDARD | 600/min | 120 | 20/principal | principal+tenant+route |
| ADMIN_SENSITIVE | 60/min | 15 | 5/principal | principal+tenant+operation |
| AUTH_SECURITY | 20/5min | 5 | 3/principal/IP | principal+IP+tenant |
| BULK | 30 submissions/hour | 5 | 2 active/tenant | tenant+operation |
| WEBHOOK | 600/min/endpoint | 120 | 20/endpoint | tenant+endpoint |
| AI | 60/min | 12 | 8/tenant | tenant+principal+capability |
| FILE_UPLOAD | 60 starts/hour | 10 | 5/principal | tenant+principal |
| API_CREDENTIAL | 1200/min | 240 | 40/credential | credential+tenant+route |
| TENANT_AGGREGATE | 3000/min | 600 | 100/tenant | tenant aggregate |

Hierarchical enforcement applies route/class + IP/principal/credential + tenant aggregate; tightest limit wins. Pro/Enterprise scaling may raise commercial classes through versioned policy, but AUTH_SECURITY/ADMIN_SENSITIVE security floors cannot be relaxed without Security approval. Abuse overrides may temporarily tighten only. REST returns 429 + Retry-After; tRPC returns normalized RATE_LIMITED. Distributed limiter implementation must preserve these semantics across replicas.


## 20. Transport-neutral idempotency runtime floor [DD-049 / DEV-API-IDEMPOTENCY-001]

Before tRPC/REST wiring, tenant COMMAND operations use the shared IdempotencyService. REQUIRED requires a key, OPTIONAL uses the service only when a key is present, and NONE bypasses it. Only server-validated canonical input is fingerprinted; plaintext keys and request bodies do not persist.

Current lifecycle is STARTED/IN_PROGRESS/REPLAY/FINAL_FAILURE with conflict on key reuse for a different request. Retryable failures may atomically reclaim the same record. Success/failure completion stores only bounded status/reference metadata.

The existing `core_integration.idempotency_record` remains physical truth. Tenant Core and Tenant Industry are exact separate RLS scopes; null Industry is never visible as a wildcard from an Industry request. This floor is transport-neutral and does not yet claim rate limiting or tRPC/REST adapters.


## 21. Distributed runtime rate-limit floor [DD-050 / DEV-API-RATE-LIMIT-001]

SecurityRatePolicy v1 is enforced by the shared RateLimitService before a transport dispatches protected domain execution. Applicable principal/IP/credential/Tenant/endpoint buckets are combined and the tightest limit wins. Tenant aggregate and API-credential ceilings are additive safeguards, not replacements for principal/IP limits.

The first distributed state adapter is PostgreSQL-backed through a dedicated least-privilege rate-limiter role. Persistent state contains only SHA-256 bucket identities, token/refill metadata and expiring concurrency leases; it contains no raw Tenant, Industry, principal, credential or network identifiers.

RATE_LIMITED carries deterministic retryAfterSeconds plus the limiting class/dimension. Transport-specific 429/Retry-After projection remains the next adapter layer, not part of this runtime floor.


## 22. Canonical execution kernel [DD-051 / DEV-API-EXECUTOR-001]

Future tRPC and REST adapters must call the same transport-neutral OperationExecutor. They may bind route/header/authenticity facts, but they may not reorder or duplicate business enforcement.

The kernel order is: canonical OperationContract → RequestContext using the contract scope → exact versioned input schema normalization/canonical JSON → distributed rate admission → Commercial/Authorization/resource GuardPipeline → command idempotency claim → declared domain handler → exact versioned output validation → idempotency completion → transport-neutral result.

Idempotency replay still passes current context/rate/guard checks and returns an explicit replay result containing only stored safe status/reference metadata. Resource references are derived from validated input, never from a separate client-authoritative object. Domain dispatch is registry-based and limited to the OperationContract's declared domainService. Unknown exceptions after handler dispatch are mutation-ambiguous and therefore non-retryable; only an explicitly declared DomainOperationError may opt into retry.

Rate-lease cleanup failure cannot rewrite a completed command result because expiring leases provide bounded recovery and returning a false failure could provoke duplicate mutation. Concrete tRPC/REST status and envelope mapping remains outside this kernel.


## 23. Zod DTO source + shared transport projection [DD-052 / DEV-API-DTO-PROJECTION-001]

A-06's Zod mandate is now bound explicitly: an exact operation/schema-version Zod DTO definition is the common source for DD-051 executor validation and future tRPC/REST/OpenAPI projections. The generic executor schema port is not permission to create parallel transport-only schemas.

Input field errors expose only safe field paths and issue codes. Raw invalid values and Zod/internal messages do not cross the API boundary.

EXECUTED results project to the canonical DD-06 success envelope. Errors project to the four A-01 classes (USER_ERROR, POLICY_DENIAL, ENTITLEMENT_DENIAL, SYSTEM_FAULT), while Retry-After remains adapter metadata. Idempotency replay/in-progress/final-failure stays an explicit control projection because no response body is stored; transports may not fabricate an output DTO.

Concrete transport adapters must normalize request/correlation metadata first and pass the same correlation through RequestContext and projection.


## 24. First-party tRPC adapter floor [DD-053 / DEV-API-TRPC-001]

The internal tRPC plane now has one shared adapter contract over DD-051/DD-052. A procedure binds a fixed OperationContract and the exact registered Zod DTO objects, then delegates to OperationExecutor. It does not implement Commercial, Authorization, resource, idempotency, rate or domain rules.

Protected tRPC context is pre-authenticated through the existing IdentityPort before procedure execution and normalizes request/correlation/selectors. DD-02 RequestContext remains authoritative and revalidates current context/security; the preflight is not a second identity store.

Because tRPC already executes the Zod input parser, the adapter uses `OperationSchemaRegistry.prepareInput` rather than parsing the same DTO twice. Canonical JSON/resource extraction and exact operation/schema-version checks still occur before the executor can honor the prepared value.

The first concrete path is `core.identity.roles.listEffective`. Broader Core/Industry routers and the physical Next.js/fetch handler remain later slices.


## 25. Physical first-party tRPC Fetch handler [DD-054 / DEV-API-TRPC-HTTP-001]

The physical internal HTTP boundary uses the tRPC Fetch adapter behind a reusable handler factory rather than a guessed Next.js file path. Authentication and edge metadata checks occur before tRPC receives the Request, ensuring A-06's credential-verification-before-body-parsing requirement.

Locked HTTP metadata: `Authorization`, `Idempotency-Key`, and advisory `X-Correlation-Id`. Tenant/Industry selectors are never made authoritative by headers. Selector and network facts come only from server-owned metadata ports.

All responses are `no-store`; normalized correlation is echoed in `X-Correlation-Id`; shared RATE_LIMITED retry metadata becomes HTTP `Retry-After`. Batching is disabled for this first bounded handler floor. Actual Next.js route placement, allowed-origin/content-size values and Clerk/API credential parsing belong to the later web-runtime composition.


## 26. First-party Clerk Authorization composition [DD-055 / DEV-WEB-AUTH-001]

The first-party tRPC Fetch plane now has one concrete human Authorization resolver: `Authorization: Bearer <Clerk session/access token>`. This resolver performs syntax extraction only. Trust, subject mapping, live session validation and local session/device security remain inside the existing Clerk IdentityPort chain.

The official `@clerk/backend` bridge requires a JWT public key plus authorized-parties allowlist for token verification and a secret key for live session Backend API access. Custom token claims never supply Tenant/Industry/RBAC/Commercial truth.

Machine/API credentials remain a separate external/integration-plane contract and are not inferred from Bearer tokens in this slice.


## 27. Trusted web selector + edge/body controls [DD-056 / DEV-WEB-EDGE-001]

First-party web Tenant selection may be derived from an exact server-configured host binding, but the result remains only a selector: DD-02 RequestContext revalidates Tenant membership/current state and Industry ownership. Generic Tenant/Industry headers never become authority.

The web edge floor requires HTTPS, exact allowed host, GET/POST, allowlisted Origin when supplied, cross-site browser denial, bounded JSON POST metadata and a configured body ceiling. Content-Length is only an early rejection hint; after authentication, the request body is streamed through a hard byte cap before tRPC parsing.

This preserves authentication-before-body-parsing while preventing missing Content-Length from bypassing the application body limit. Cookie-based CSRF tokens are not introduced because the current first-party plane is Bearer-authenticated; any future cookie-authenticated surface must satisfy DD-16 separately.


## 28. Concrete Next.js first-party composition [DD-058 / DEV-WEB-COMPOSITION-001]

The first physical first-party web composition is now bound to the governed Next.js 15 / React 19 / Node 22 boundary. `src/server/app/first-party-web-composition.ts` is composition-only: it instantiates the existing Clerk IdentityPort chain, trusted host selector/edge/body controls, pre-context Tenant directory bootstrap, RequestContext, Commercial current-state service, Authorization PDP/PEP/audit, distributed rate limiter, idempotency service, DTO/Operation/domain registries and the shared tRPC Fetch handler. It does not add route-local business or security truth.

`src/app/api/trpc/[trpc]/route.ts` is a thin Node-runtime App Router boundary exposing the same handler for GET/POST. DD-058 originally registered only `core.identity.roles.listEffective`; DD-059/060 subsequently added `core.tenancy.workspace.resolve` and `core.commercial.entitlements.getCurrent`. These are the current three bounded queries; broader Core/Industry routers remain separate governed slices. Machine/API credentials are not inferred from Clerk Bearer tokens and are rejected by this first-party human web composition.

All secrets and deployment-specific route facts are required runtime configuration. No source fallback supplies database credentials, Clerk secrets/JWT key, authorized parties, DataHome identity, region, Tenant host bindings, body ceiling or rate-lease lifetime. The resolved DataHome/region must match the configured server cell before application-role SQL is allowed.

The Core TypeScript emit boundary remains `tsconfig.json`. Next.js uses `tsconfig.web.json` so generated `.next/types` never changes the Core compiler contract. NodeNext `.js` source imports remain canonical; `next.config.mjs` maps those source-graph imports to TypeScript through extension aliases instead of creating a second import convention.

The package/lock boundary pins Next.js 15, React/ReactDOM 19 and matching React type packages. CI is read-only and exact-head: it runs deterministic npm-lock verification, Core TypeScript compilation, the Next.js production build and a clean generated-state check. CI never auto-commits generated lock/config files back to the branch.

The next capability at the original DD-058 checkpoint was `core.tenancy.workspace.resolve`, subsequently implemented under §29. DD-02 remains authoritative: Tenant selection arrives only through trusted transport/server selector facts and RequestContext resolution; the procedure DTO must not accept tenantId or a parallel Tenant-authority field. WorkspaceService consumes an optional Industry selector only to return the sanitized ClientWorkspaceContext.


## 29. Tenant workspace bootstrap query [DD-059 / DEV-WORKSPACE-BOOTSTRAP-001]

`core.tenancy.workspace.resolve` is the second bounded first-party Core query. Its OperationContract is TENANT_CORE / QUERY with canonical permission `core.tenancy.workspace.resolve`, AUTH_STANDARD rate class, STANDARD audit class and no idempotency path.

Tenant authority does not appear in the procedure DTO. Tenant selection remains the trusted transport/server selector already carried into DD-02 RequestContext resolution. The exact v1 input is only `{industrySelector?: string}`; the selector is normalized and may choose only an ACTIVE Industry Context owned by the already-resolved Tenant.

The domain handler delegates to the existing `WorkspaceService`. Before returning data it re-reads current membership and Tenant state and, when requested, resolves the Industry Context inside that Tenant. A stale membership, unavailable Tenant, or sibling-Tenant Industry fails closed.

The v1 output is the existing sanitized `ClientWorkspaceContext`: Tenant display key/name, optional selected Industry display key/name, optional orgUnitId, entitlementSnapshotVersion and sessionVersion. It does not expose tenantId, principalId, membershipId, DataHome, role IDs, permission internals, security/risk facts or provider/session identifiers.

The production first-party router explicitly enables this bounded procedure after registering its exact OperationContract/Zod/domain definitions. Existing isolated transport fixtures may omit the capability explicitly; runtime composition registers both the previously verified Identity query and this Workspace query.

The next procedure at the original DD-059 checkpoint was `core.commercial.entitlements.getCurrent`, subsequently implemented under §30 and DD-04 §12 with its client-safe projection locked before transport binding.


## 30. Client-safe current Commercial query [DD-060 / DEV-COMMERCIAL-ENTITLEMENTS-QUERY-001]

`core.commercial.entitlements.getCurrent` is the next bounded first-party Core query. It is TENANT_CORE / QUERY with permission `core.commercial.entitlement.view`, AUTH_STANDARD rate class, STANDARD audit class, no idempotency and no `entitlementRequirement` because it is the self-view operation for the current effective entitlement snapshot.

The exact v1 input is `{}`. Tenant/Industry authority does not appear in the DTO.

The exact v1 output is the DD-04 `CommercialClientCurrentProjectionV1`: `snapshotVersion`, canonical `subscriptionState`, and sorted effective enabled entitlement entries `{code,valueType,value}`. It excludes all Commercial persistence identifiers, license records/tokens, principal bindings and raw deny-set/source metadata.

The domain service must re-read current Commercial state and require exact RequestContext snapshot id/version equality before projection. Denied/disabled/zero/empty facts are omitted, not exposed as client truth. Invalid or over-bound state fails closed.

The existing GuardPipeline remains in front of the domain call; this query does not create a bypass around current subscription, seat, RBAC, ABAC, audit or rate controls.


## 31. Historical Commercial change-plan prerequisite audit [DD-061]

The findings below describe the original DD-061 checkpoint. DD-062…068 subsequently supplied request/evidence contracts, cataloged events, the dedicated writer, atomic publication, evidence persistence and the PlanVersion baseline. Current unresolved prerequisites are maintained in `Development/COMMERCIAL_CHANGE_PLAN_PREREQUISITE_AUDIT.md`; the public command remains unbound because final preview/impact and Billing/approval producers are unfinished.

The prior one-line baseline contract was not sufficient to authorize mutation. Fresh Development audit after DEV-COMMERCIAL-ENTITLEMENTS-QUERY-001 found the following:

- **Resolved transport contradiction:** `Idempotency-Key` belongs to the shared transport/executor metadata path and is not part of the command DTO. `core.commercial.subscription.changePlan` will use `idempotencyPolicy=REQUIRED`.
- **Resolved timing vocabulary:** F-14's immediate-vs-next-cycle language is normalized to `IMMEDIATE | NEXT_RENEWAL`; no third timing mode is inferred.
- **Blocking route-resolution contract:** F-14 requires checkout/payment for self-serve paid changes or order/approval for sales-assisted changes before the Subscription plan version changes. The repository has no deterministic server-owned evidence/reference contract tying that resolution to a plan-change apply.
- **Blocking downgrade contract:** impact assessment + explicit remediation are mandatory when target-plan limits are below current use. The repository has no exact persisted impact/remediation result contract for the command.
- **Blocking proration/billing contract:** A-04 assigns proration to Billing at transition time, but no executable Billing/payment/proration runtime exists in the current repository. No monetary formula/provider behavior may be invented inside Commercial.
- **Blocking compiler boundary:** current Commercial runtime is read-only. No write-side entitlement compiler/publication service exists to atomically supersede/publish the immutable current snapshot after a plan change.
- **Blocking event contract:** DD-07 requires cataloged event/version/payload before outbox insertion. No executable `subscription.transitioned` or `entitlement.recompiled` event catalog entry/payload contract exists.
- **Blocking least-privilege write boundary:** historical `sbg_app_rw` retains broad Commercial DML inherited from migration 0009; later hardening protects immutable evidence from UPDATE/DELETE but does not create a dedicated plan-change/compiler writer role.

Therefore `core.commercial.subscription.changePlan` is **NOT IMPLEMENTATION-AUTHORIZED** at this checkpoint. The next governed work is the smallest deterministic prerequisite design/write boundary that closes these blockers without inventing payment-provider semantics.


## 32. Plan-change request orchestration contract [DD-062]

The public `core.commercial.subscription.changePlan` command starts or advances the governed plan-change request described by DD-04 §13. It is not a direct `subscription.plan_version_id` update.

External v1 intent remains `{subscriptionId,targetPlanVersionId,effectiveTiming,expectedVersion}`; `effectiveTiming=IMMEDIATE|NEXT_RENEWAL`. `Idempotency-Key` is REQUIRED transport metadata and is excluded from the DTO.

Server execution derives the current source PlanVersion, route policy, impact/remediation assessment and required Billing/approval path. Client-supplied payment/approval/remediation/effective-date proof is not accepted as authority.

The public result may expose only safe request/evaluation references and normalized state. The internal apply transition remains unavailable until DD-061's event/compiler/least-privilege write prerequisites are implemented. Request creation/evaluation must not mutate the Subscription or current entitlement snapshot.

For `NEXT_RENEWAL`, the apply timestamp is server-owned Billing/contract evidence, not a client field. For every apply attempt, the exact Subscription version and source PlanVersion are re-read and must still match the assessment.

## 33. Shared external REST Fetch adapter floor [DD-080 / DEV-API-REST-001]

The external REST plane uses one reusable Fetch handler around DD-051/DD-052. A
server-owned route resolver binds request metadata to one operationId and optional
Tenant/Industry/OrgUnit selectors. These identifiers remain selector facts only;
the OperationContract-derived scope and DD-02 RequestContext remain authoritative.

The fixed order is: transport IDs → edge metadata policy → route resolution →
Authorization syntax resolution → authenticated protected context → body policy →
route input projection → OperationExecutor → canonical transport projection.
Edge, route, authorization, context and network ports receive metadata only and
cannot consume a body. Exact DTO validation stays inside the existing executor/Zod
registry after the route input projection.

Successful execution returns the DD-052 envelope. RATE_LIMITED returns HTTP 429
with Retry-After; authentication is 401; policy/entitlement denial is 403;
not-found is 404; idempotency conflict/final failure is 409; system dependency
failure is 503; remaining safe user errors are 400. IN_PROGRESS is 202. Replay,
in-progress and final-failure responses serialize the existing explicit control
projection and never fabricate output DTO data. All responses are no-store and
echo the normalized correlation ID.

This floor exposes no live route. Concrete machine/API-key syntax, public route
catalog, route-specific input mapping, OpenAPI publication, deployment policy and
webhook authenticity remain separate registrations/implementations. First-party
surfaces continue to use tRPC.


## 35. Exact IntegrationDefinition persistence reader [DD-092]

The Wave-2 Integration registry now has a concrete read-only definition boundary.
`PersistedIntegrationDefinition` mirrors migration 0025's
`integration_definition` row: id/code/name/provider family, capability-code array,
adapter-contract version, owner scope, raw status, data-transfer class, residency
metadata and timestamps.

`PostgresIntegrationDefinitionStore` reads only by the exact primary-key UUID
through the fixed-role `PostgresIntegrationDatabase`. The reader validates the
PLATFORM/TENANT/INDUSTRY owner-scope enum, non-empty registry text, immutable string
arrays, timestamps and JSON. An absent id returns null.

The persisted `status`, data-transfer classification and adapter-contract metadata
remain raw registry evidence at this layer. They are not converted into provider
selection, Tenant enablement, health, compatibility or authorization decisions.

**Boundary:** DD-092 does not join CredentialReference, TenantIntegration,
IntegrationCapability or ProviderAdapter; does not read secret references; does not
choose/execute a provider; and does not mutate registry state or introduce a route,
migration, role, grant or policy.


## 36. Exact IntegrationCapability persistence reader [DD-093]

`PersistedIntegrationCapability` exposes one exact registry capability tuple owned
by migration 0025: id, IntegrationDefinition id, capability code, direction,
optional OperationContract id, event types, data class, idempotency class, rate
class and raw status.

`PostgresIntegrationCapabilityStore` reads only the unique
`integration_definition_id + capability_code` tuple through the fixed Integration
database role. Direction is validated against INBOUND / OUTBOUND / BIDIRECTIONAL;
arrays are immutable; all text classifications are preserved as raw registry facts.

The reader does not infer that an ACTIVE row is enabled for a TenantIntegration or
that a RETIRED row is executable/non-executable in a runtime workflow. It does not
resolve/execute OperationContract ids or event types, select a ProviderAdapter, apply
rate/idempotency/data-class policy, or access credentials.

**Boundary:** read-only exact registry persistence; no provider execution, Tenant
enablement, policy evaluation, route, migration, role, grant or registry mutation.


## 37. Exact ProviderAdapter persistence reader [DD-094]

`PersistedProviderAdapter` exposes one exact provider-adapter registry tuple:
definition id, adapter code, contract version, auth method, timeout/retry/circuit
classes, health-probe class, normalized-error-map version and raw status.

`PostgresProviderAdapterStore` reads only the unique
`definition_id + adapter_code + contract_version` tuple through the fixed
Integration database role. All classification/status values are validated only as
non-empty registry text and preserved without execution semantics.

The reader does not instantiate provider SDKs, load credentials, choose an adapter,
run health probes, apply timeout/retry/circuit behavior or dispatch callbacks/events.

**Boundary:** exact read-only adapter registry persistence; no network/provider
execution, Tenant enablement, secret access, policy evaluation, route, migration,
role, grant or registry mutation.


## 38. Exact TenantIntegration persistence reader [DD-095]

`PersistedTenantIntegration` exposes one exact RLS-visible TenantIntegration row:
Tenant/optional Industry ownership, IntegrationDefinition id, scope class, display
name, raw status, CredentialReference id, persisted config JSON, enabled capability
codes, optional permission-profile id, raw health state, optional last-health
timestamp, version and timestamps.

`PostgresTenantIntegrationStore` reads only by TenantIntegration id through the
fixed Integration service role plus `RequestScopedSql`. Migration 0025 FORCE-RLS
remains the visibility authority: sibling Industry rows are invisible from the
active Industry Context, Tenant Core rows remain same-Tenant visible, and foreign
Tenant rows are hidden.

The reader preserves ACTIVE/PAUSED/ERROR/health/capability/config facts exactly as
persistence evidence. It does not convert them into enabled/executable/healthy
authority, select a ProviderAdapter, dispatch an OperationContract, or join
CredentialReference secret metadata.

**Boundary:** DD-095 is read-only registry/state persistence. No secret-store access,
provider SDK/runtime, health evaluation, capability authorization, network call,
mutation, migration, role, grant or route is introduced.
