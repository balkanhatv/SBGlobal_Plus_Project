# DD-03 — IDENTITY & AUTHORIZATION DESIGN
**Wave:** 1 · **Status:** DETAILED DESIGN COMPLETE  
**Traces:** F-03 · F-14 §5 · A-03 · A-04 §5 · ADR-003/004

## 1. Core identity entities
### PlatformPrincipal
| Field | Type | Null | Rule |
|---|---|---:|---|
| id | uuid | No | PK |
| principal_type | enum | No | HUMAN/API_CLIENT/SERVICE/PLATFORM_OPERATOR |
| status | enum | No | PENDING/ACTIVE/SUSPENDED/REVOKED |
| display_name | text | Yes | no provider authority |
| primary_email_norm | text | Yes | indexed where present |
| primary_mobile_norm | text | Yes | indexed where present |
| auth_epoch | bigint | No | increments on global identity invalidation |
| created_at/updated_at | timestamptz | No | audit timestamps |

Provider IDs never serve as principal PK.

### IdentityProviderLink
`id, principal_id, provider(CLerk/AuthJS/other-approved), provider_subject, tenant_hint?, created_at, last_verified_at, status`. Unique `(provider, provider_subject)`.

### TenantMembership
`id, tenant_id, principal_id, status(INVITED/ACTIVE/SUSPENDED/REVOKED), default_org_unit_id?, valid_from?, valid_until?, membership_version bigint, created_at, updated_at`. Unique active membership per `(tenant_id, principal_id)`.

### RoleAssignment
`id, tenant_id, industry_context_id?, membership_id/principal_id, role_id, org_unit_id?, valid_from?, valid_until?, status, created_by, created_at`. Scope must match the active role template. Human assignments require the same active `(tenant_id, principal_id)` membership; service assignments require the matching `allowed_scope_classes` entry; Platform Operators never receive persistent tenant roles and instead use DD-05 time-bounded elevation. The creator is an active principal for the assignment tenant.

### APICredential
`id, tenant_id?, industry_context_id?, principal_id, key_prefix, secret_hash, status, permission_profile_id, expires_at?, last_used_at?, allowed_cidrs?, allowed_industry_context_ids uuid[] NOT NULL DEFAULT '{}', credential_version, created_at, revoked_at?`. Secret plaintext never persists. Every allowed Industry Context is a unique context of `tenant_id`; an industry-scoped credential cannot widen to a sibling context. Active human and API-client credentials are tenant-bound; a null-tenant credential is invalid for HUMAN/API_CLIENT. Service credentials require the matching service `allowed_scope_classes`; an unbound SERVICE credential may be PLATFORM_GLOBAL only when `PLATFORM_GLOBAL` is explicitly allowlisted. Platform Operators cannot substitute API credentials for interactive platform identity/elevation.

### ServicePrincipal
represented by PlatformPrincipal principal_type SERVICE plus service metadata: service_code, owning_module, allowed_scope_classes, status.

The verified machine evidence scope allowlist is enforced again during RequestContext
resolution for every protected Tenant scope, before any Tenant lookup. An Industry
allowlist does not grant TENANT_CORE, and TENANT_CORE does not grant TENANT_INDUSTRY.
The generic machine evidence contract grants no EXPLICIT_CROSS_CONTEXT authority.
Validated Core sessionVersion is projected into human Tenant RequestContext just as
it is for PLATFORM_GLOBAL; provider metadata does not replace current Core truth.

### DeviceRegistration
`id, tenant_id, principal_id, device_fingerprint_hash, platform, status(PENDING/TRUSTED/REVOKED/RISK_HOLD), public_key?, app_instance_id?, last_seen_at, risk_level, registration_version`.

### SessionVersion
`principal_id, tenant_id?, version bigint, changed_at, reason_code`. Session/token must present version >= required exact version per policy; mismatch denies.

The nullable `tenant_id` distinguishes one platform-global version from tenant-specific versions. Database uniqueness is `UNIQUE NULLS NOT DISTINCT (principal_id, tenant_id)`; a composite primary key must not accidentally make the platform-global form impossible.

## 2. IdentityPort
Contract:
- verifyHumanSession(credential) → VerifiedIdentityEvidence
- verifyMachineCredential(credential) → VerifiedMachineEvidence
- revokeProviderSession(reference)
- getAuthStrength(evidence)
- getProviderSubject(evidence)

Adapters: Clerk preferred; Auth.js fallback. Domain modules receive only Core principal/context, never provider objects.

## 3. Permission catalog
Permission grammar: `<domain>.<ms-or-core>.<capability>.<action>`.  
Examples:
- `core.tenancy.industry.activate`
- `core.identity.role.assign`
- `core.billing.refund.approve`
- `hlt.lis.sample.collect`
- `edu.ems.result.publish`
- `rtl.pos.refund.approve`

Permission definition fields:
`id, code, domain, module, resource_or_capability, action, scope_class, sensitivity_ceiling, description, status, version`.

## 4. Role templates
RoleTemplate:
`id, code, owner_scope(PLATFORM/TENANT/INDUSTRY), industry_code?, name, description, immutable_seed, version, status`.
RolePermission:
`role_id, permission_id, effect(ALLOW/DENY), constraints_json?, version`.
Tenant-custom roles clone/reference seeds; upgrades never silently add high-risk permissions.

## 5. ABAC policy contract
Policy fields:
`id, code, tenant_id?, industry_context_id?, applies_to_permission_pattern, priority, effect(DENY/RESTRICT), expression_version, expression_ast_json, valid_from?, valid_until?, status`.

Allowed attribute namespaces:
- subject: principalId/type, roles, org units, clearance, membership status;
- resource: tenantId, industryContextId, owner, orgUnitId, state, sensitivity;
- environment: time, channel, device trust, region, auth strength, risk;
- commercial: subscription state, license set, entitlement facts.

ABAC may DENY or RESTRICT an RBAC allow. It cannot create ALLOW where RBAC denied.

## 6. AccessDecision input
`AccessDecisionInput{requestContext, permissionCode, resourceDescriptor?, operationDescriptor, entitlementRequirement?, workflowState?, requestedFields?}`

ResourceDescriptor includes: resourceType, resourceId, tenantId, industryContextId?, orgUnitId?, ownerPrincipalId?, state?, sensitivityClass?, residencyClass?.

## 7. Canonical evaluation
1 Auth evidence valid.
2 Tenant/membership valid.
3 Industry Context valid if required.
4 Subscription state permits operation class.
5 All applicable licenses valid.
6 Session/device/API credential valid.
7 Current entitlement snapshot grants capability/limit.
8 RBAC allows permission.
9 ABAC/security/residency policies all pass.
10 Resource ownership/org/workflow business rules pass.
11 Return decision.

## 8. AccessDecision output
`decision: ALLOW|DENY|RESTRICT|UPGRADE_CTA`
`reasonCode`
`policyIds[]`
`permissionCode`
`restrictionSet?`
`upgradeTarget?`
`decisionId`
`auditRequired`
`evaluatedAt`
`permissionVersion`
`entitlementSnapshotVersion`

## 9. Deny reason baseline
`AUTH_REQUIRED, TENANT_INVALID, MEMBERSHIP_INVALID, INDUSTRY_CONTEXT_REQUIRED, INDUSTRY_CONTEXT_MISMATCH, SUBSCRIPTION_RESTRICTED, LICENSE_INVALID, SESSION_INVALID, DEVICE_UNTRUSTED, CREDENTIAL_REVOKED, ENTITLEMENT_MISSING, LIMIT_EXCEEDED, RBAC_DENY, ABAC_DENY, RESIDENCY_DENY, SENSITIVITY_DENY, RESOURCE_SCOPE_DENY, WORKFLOW_STATE_DENY, STEP_UP_REQUIRED`.

## 10. Caching
Permission sets cache by `(principal/membership, permissionVersion)`.  
Entitlements cache by `(tenantId, entitlementSnapshotVersion)`.  
ABAC policy cache by tenant/context + policy version.  
Resource ownership is never trusted from client cache.

## 11. Audit
Every high-risk allow and every deny writes/streams an authorization audit fact containing decisionId, principal, tenant/context, permission, resource reference, outcome/reason, policy versions, correlationId, timestamp. Sensitive resource content is excluded.

## 12. Acceptance
No provider ID becomes business identity; no ABAC grant expansion; no client-computed access truth; stale role/session/license/entitlement changes invalidate by version/event.

## 13. Current-state database audit reconciliation

Migration `0029` places Tenant, PlatformPrincipal and IdentityProviderLink behind forced RLS and assigns sensitive credential/provider-link writes to the Identity service. Migrations `0030`–`0031` enforce role/credential/device/session principal-to-tenant integrity, restore nullable platform SessionVersion uniqueness, and persist the operator-elevation boundary. Verification IDs `DBA-001`…`DBA-006` and the corresponding `0029`–`0031` executable SQL are the Development evidence; this note records propagation into DD and does not retroactively claim runtime success.


## 14. Compiled permission physical contract
DD-041 in DD-18 is the authoritative persistence owner for `permissionVersion`. The Authorization compiler owns a scoped subject plus immutable compiled snapshots; RequestContext and `roles.listEffective` may read only the subject's exact CURRENT snapshot. `MAX(role.version)`, `auth_epoch`, constants, or ad-hoc hashes are not substitutes. A missing/current-invalid snapshot fails closed with `DEPENDENCY_UNAVAILABLE`. The current Development slice implements read adapters only; a future Authorization compiler writer must use the DD-041 locked monotonic publication protocol and a dedicated governed writer role.


## 15. Fail-closed PDP evaluator implementation floor [DD-045 / DEV-AUTHZ-EVAL-001]

The current persisted `core_authz.abac_policy` contract carries `DENY|RESTRICT`, expression, scope, priority and validity, but no versioned restriction payload/reducer contract. A bare `RESTRICT` result without an enforceable `restrictionSet` would be allow-like at the current PEP and is therefore prohibited.

Until a dedicated governed restriction-payload/reducer contract is designed and independently verified:
- a matching persisted `DENY` policy returns `DENY / ABAC_DENY`;
- a matching persisted `RESTRICT` policy also fails closed as `DENY / ABAC_DENY`; it must never be treated as ALLOW merely because no restriction payload exists;
- no generic/opaque restriction key is invented by the PDP;
- tenant decisions require the exact server-resolved `entitlementSnapshotVersion`; PLATFORM_GLOBAL decisions have no tenant commercial snapshot and therefore omit that field rather than inventing a sentinel value;
- the evaluator consumes only the verified Authorization read store plus server-derived supplemental policy facts; client claims are never policy facts;
- base evaluation may evaluate only policies that do not require `resource.*` attributes before resource lookup; resource evaluation re-reads current Authorization state and evaluates the complete applicable policy set with the resolved resource;
- `exists` may test an absent attribute; every other operator that requires an unavailable attribute fails closed as `DEPENDENCY_UNAVAILABLE`;
- tenant RequestContext `permissionVersion` and role set must match the exact CURRENT compiled snapshot consumed by the evaluator; mismatch is stale context and fails closed;
- every returned decision sets `auditRequired=true` in this bounded floor; concrete durable audit emission remains a separate enforcement/integration responsibility.

This floor preserves RBAC-primary / ABAC-narrowing-only semantics and resolves the unsafe ambiguity without widening persistence, adding a compiler writer, or inventing Commercial/transport behavior.


## 16. Resource/workflow business-rule enforcement floor [DD-046 / DEV-AUTHZ-RESOURCE-RULE-001]

Canonical evaluation step 10 is implemented through a server-owned, module-supplied `ResourceBusinessRulePort` for resource-bound operations. It runs only after the resource has been resolved, Tenant/Industry scope has been checked, and the resource-level Authorization PDP has passed.

The port is narrowing-only. It may allow the already-authorized operation or deny it with `RESOURCE_SCOPE_DENY` or `WORKFLOW_STATE_DENY`. Missing adapters, dependency failures and malformed results fail closed. Resource scope denial is normalized to non-disclosing `RESOURCE_NOT_FOUND`; workflow-state denial is normalized to `RESOURCE_STATE_INVALID`. No client workflow state, generic executable rule DSL or cross-industry rule interpretation is introduced by Core.

Concrete ownership/org/workflow adapters remain the responsibility of their authoritative Core/Industry modules and must re-read current server-owned state where their rule requires it. This bounded floor does not claim that all module adapters are implemented.


## 17. Durable final decision audit [DD-047 / DEV-AUTHZ-AUDIT-001]

Protected GuardPipeline requests emit one final authorization audit after the complete Commercial → PDP → resource → resource-rule chain. Intermediate base/resource ALLOW results are not separately recorded as successful access when later checks may still deny.

Every normalized deny is audited; successful access is returned only after required audit persistence succeeds. Direct PDP denials preserve decision/policy/version metadata. Denials before a PDP decision do not fabricate `access_decision_id`. Audit evidence is deliberately minimal and excludes request bodies, tokens, entitlement values, restriction contents and resource/workflow payloads.

The physical owner remains the existing append-only `core_audit` model under exact RequestContext RLS. PUBLIC and EXPLICIT_CROSS_CONTEXT need their own governed audit entry paths and are not widened through the single-context application writer.


## 18. RBAC source-to-snapshot compiler [DD-048 / DEV-AUTHZ-SOURCE-COMPILER-001]

Effective RBAC Permission Set v1 is server-compiled from governed active/effective role assignments, active exact-version role templates/permissions and active permission definitions. Compilation is exact-scope: Tenant Core null Industry assignments never flow into Tenant Industry snapshots, and sibling Industry assignments never participate.

Explicit DENY wins across all participating roles. Because Permission Set v1 has no constraint payload, any non-empty RolePermission constraints compile as DENY rather than dropping the constraint. Permission-definition scope mismatch or role-version ambiguity fails closed. ABAC and Commercial do not create grants in this compiler.

The resulting sorted role set + Permission Set v1 + SHA-256 source fingerprint are sent only to the existing monotonic compiler publication boundary.
