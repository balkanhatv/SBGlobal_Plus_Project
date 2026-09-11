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
OperationContract references symbolic rate class only: `PUBLIC_LOW`, `AUTH_STANDARD`, `AUTH_HIGH_COST`, `EXTERNAL_WRITE`, `AI_COSTED`, `WEBHOOK_ADMIN`. Numeric thresholds are later approved plan/security configuration, never hard-coded by DD Wave 1.

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
