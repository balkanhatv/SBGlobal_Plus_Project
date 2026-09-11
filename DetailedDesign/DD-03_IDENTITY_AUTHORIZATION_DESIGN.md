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
`id, tenant_id, industry_context_id?, membership_id/principal_id, role_id, org_unit_id?, valid_from?, valid_until?, status, created_by, created_at`. Scope must match role template scope.

### APICredential
`id, tenant_id?, industry_context_id?, principal_id, key_prefix, secret_hash, status, permission_profile_id, expires_at?, last_used_at?, allowed_cidrs?, credential_version, created_at, revoked_at?`. Secret plaintext never persisted.

### ServicePrincipal
represented by PlatformPrincipal principal_type SERVICE plus service metadata: service_code, owning_module, allowed_scope_classes, status.

### DeviceRegistration
`id, tenant_id, principal_id, device_fingerprint_hash, platform, status(PENDING/TRUSTED/REVOKED/RISK_HOLD), public_key?, app_instance_id?, last_seen_at, risk_level, registration_version`.

### SessionVersion
`principal_id, tenant_id?, version bigint, changed_at, reason_code`. Session/token must present version >= required exact version per policy; mismatch denies.

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
