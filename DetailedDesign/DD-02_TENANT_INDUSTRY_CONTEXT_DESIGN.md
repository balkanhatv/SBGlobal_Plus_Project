# DD-02 — TENANT + INDUSTRY CONTEXT DESIGN
**Wave:** 1 · **Status:** DETAILED DESIGN COMPLETE  
**Traces:** F-01 §1/§4 · F-03 §3–§4/§7 · A-01 §3/§5 · A-02 §2–§4 · ADR-002/004/012

## 1. RequestContext exact contract
| Field | Type | Required | Source | Client claim? | Server-only authority | Cache/invalidation |
|---|---|---:|---|---:|---:|---|
| requestId | UUID | Yes | edge generated | No | Yes | per request |
| correlationId | UUID/string | Yes | incoming trusted header or generated | advisory | Yes normalized | request chain |
| tenantId | UUID | protected tenant scopes | verified membership/API credential/domain binding | selector only | Yes | invalidate membership/tenant state change |
| industryContextId | UUID | TENANT_INDUSTRY / EXPLICIT_CROSS_CONTEXT | server resolves enabled activation + selector/route | selector only | Yes | invalidate activation/license change |
| dataHomeId | UUID/code | tenant scopes | tenant directory | No | Yes | invalidate residency migration/routing change |
| regionCode | text | tenant scopes | data-home metadata | No | Yes | same as dataHome |
| principalId | UUID | authenticated scopes | IdentityPort→PlatformPrincipal | No | Yes | session/credential revocation |
| principalType | enum HUMAN/API_CLIENT/SERVICE/PLATFORM_OPERATOR | Yes auth scopes | Identity | No | Yes | principal state |
| membershipId | UUID | tenant human/service membership | membership record | No | Yes | membership change |
| orgUnitId | UUID nullable | operation-dependent | membership/workspace selection | selector | Yes validated | org-unit assignment change |
| orgUnitPath | UUID[] | operation-dependent | tenancy tree | No | Yes | org hierarchy change |
| roleIds | UUID[] | auth scopes | active role assignments | No | Yes | role assignment/version change |
| permissionVersion | bigint | auth scopes | Authorization compiled permission set | No | Yes | permission/role change |
| entitlementSnapshotId | UUID | tenant protected scopes | Entitlement current pointer | No | Yes | snapshot recompile |
| entitlementSnapshotVersion | bigint | same | Entitlement | No | Yes | snapshot recompile |
| deviceId | UUID nullable | human device policy paths | verified device registration | selector/SDK id | Yes validated | revoke/device-risk change |
| credentialId | UUID nullable | API/service path | credential lookup | prefix/key id only | Yes | rotate/revoke |
| sessionVersion | bigint nullable | human session | Identity record | token carries comparison value | Yes compare | increment on revoke/security event |
| authStrength | enum | human path | provider/session evidence | No | Yes | login/step-up |
| securityContext | object | Yes protected | risk/device/region/policy resolver | No | Yes | policy/risk refresh |
| scopeClass | enum | Yes | procedure/resource metadata | No | Yes | design metadata |
| actorIpHash / networkContext | privacy-safe value | policy-dependent | edge | No | Yes | request-only |

## 2. Scope resolution
`PLATFORM_GLOBAL`: tenantId and industryContextId null; only platform principal/explicit public policy.  
`TENANT_CORE`: tenantId required; industryContextId null by design.  
`TENANT_INDUSTRY`: both required.  
`EXPLICIT_CROSS_CONTEXT`: tenantId required; active source context + explicit target context in command contract; dedicated permission/policy required.  
`PUBLIC`: no private context.

Null `industryContextId` is never interpreted as "all industries."

## 3. Resolution order
1. Verify authentication/credential authenticity.
2. Determine candidate tenant from deterministic surface/domain/membership/API-key binding.
3. Validate tenant status and principal membership.
4. Resolve scopeClass from server procedure metadata.
5. Resolve Industry Context if scope requires it; validate enabled activation.
6. Resolve org-unit selection within tenant.
7. Resolve data home/region.
8. Load roles/permission version.
9. Validate subscription/licenses and current entitlement snapshot.
10. Resolve device/session/security context.
11. Freeze immutable RequestContext for the operation.

## 4. Selector rules
A client may send `X-Tenant-Selector` / equivalent typed selector only for a principal already entitled to multiple memberships; server resolves to tenant ID.  
A client may send an industry selector only from enabled contexts; resource IDs never auto-switch context.  
Wrong selector returns `INDUSTRY_CONTEXT_MISMATCH` or `TENANT_INVALID`; it does not reveal existence of foreign resources.

## 5. Serialization boundary
The full RequestContext is never serialized to untrusted clients. Clients receive a sanitized `ClientWorkspaceContext`: tenant display ID/name, selected industry display key/name, org workspace, feature/navigation hints, snapshot version, session expiry. Security/risk/internal policy fields remain server-only.

## 6. Cross-context transfer contract
Any legitimate cross-industry/core transfer must declare:
- sourceContextId;
- targetContextId or TENANT_CORE target;
- transferPurposeCode;
- resource type/id;
- allowed field projection;
- explicit permission;
- legal/consent basis if sensitive;
- audit correlation;
- idempotency key.

No generic "read all tenant industries" transfer permission.

## 7. Background workers
Worker execution constructs `WorkerContext` from persisted job/event scope, not from ambient process state. It must include tenantId, industryContextId where applicable, servicePrincipalId, correlation/causation IDs, dataHomeId and scopeClass.

## 8. Context-invalidating events
`tenant.status.changed`, `membership.changed`, `role.assignment.changed`, `permission.catalog.changed`, `industry.activation.changed`, `license.changed`, `entitlement.recompiled`, `device.revoked`, `session.version.changed`, `datahome.changed`, `security.policy.changed`.

## 9. Negative acceptance
- Retail resource ID under Healthcare context → deny.
- Missing industry context on industry command → deny.
- Disabled industry activation → deny even if old token/cache lists it.
- Cross-tenant membership spoof → deny.
- Worker with missing persisted context → dead-letter/deny, never default context.


## 10. Executable pre-context directory boundary [DD-057 / DEV-CONTEXT-BOOTSTRAP-001]

The concrete TenantContextPort uses a dedicated SELECT-only pre-context PostgreSQL role. It may read only the minimum directory data required to resolve Tenant membership, active Industry Context, OrgUnit ancestry and DataHome routing. It cannot read provider/API credential secrets and cannot write directory state.

Human Tenant resolution without a selector is valid only when one effective ACTIVE membership exists. Multiple memberships require explicit deterministic selection. Machine identity remains pinned to its verified bound Tenant. Industry/OrgUnit selectors are always re-resolved inside the selected Tenant; null Industry never means all.

This bootstrap boundary ends once RequestContext has a verified DataHome. Business data access then uses the normal transaction-local RLS application role.
