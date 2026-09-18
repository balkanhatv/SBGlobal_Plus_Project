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
Query; TENANT_CORE; input tenant selector + optional industry selector; output sanitized ClientWorkspaceContext; permission membership-derived; no client authority.

### core.identity.roles.listEffective
Query; TENANT_CORE; input membership/principal reference; output effective role/permission version summary; permission `core.identity.role.view`.

### core.commercial.entitlements.getCurrent
Query; TENANT_CORE; output current snapshot projection safe for UI; permission tenant membership + entitlement self-view policy.

### core.commercial.subscription.changePlan
Command; TENANT_CORE; exact input: subscriptionId, targetPlanVersionId, effectiveTiming enum, expectedVersion, idempotencyKey; output change request/result + entitlement diff reference; permission `core.commercial.subscription.change_plan`; emits commercial events.

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
