# SBGlobal Plus — A-02 MULTI-TENANT & CONTEXT ARCHITECTURE
**Document ID:** A-02 · **Version:** 1.0 · **Status:** ARCHITECTURE BASELINE (CP-A1-001) · **Date:** 09-09-2026
**Traces to:** F-01 (tenancy model), F-03 (tenant isolation), F-11 (Regional Data Home / residency), F-00 §5 (business model chain) · **Decisions:** ADR-002 (→ A-12)

---

## 1. Tenancy Model
Canonical chain (F-00 §5): Core → Industry catalog → **Tenant** → Primary Industry → optional enabled industries → Branches/Departments → Users/Roles → Management Systems → Modules/Workflows/Transactions. A tenant is the unit of commercial contract, data ownership, configuration and isolation. Branches/departments are intra-tenant organizational units (OrgUnit tree), not tenants.

## 2. Isolation Architecture (ADR-002)
**Default tenant topology:** shared PostgreSQL cluster/schema with `tenant_id` + PostgreSQL RLS on every tenant-owned table. **Industry-owned data additionally carries active Industry Context ownership**; an industry-scoped resource is addressable only when both Tenant and Industry Context match the immutable RequestContext. Premium/regulated tenants may use a dedicated database with the identical logical contracts; dedicated topology never weakens Industry Context isolation.

Trade-off: shared-RLS maximizes density; dedicated DB increases hard tenant isolation at higher operational cost. Industry Context remains a logical security/ownership boundary in either topology. Exact table-by-table RLS policy expressions remain Detailed Design.

## 3. Tenant + Industry Context Resolution (every request)
```
1 Resolve tenant candidate: domain/subdomain · explicit mobile/desktop membership
  selection · API-key binding.
2 Validate tenant status + membership + OrgUnit.
3 Resolve requested/route-bound Industry Context against the tenant's enabled
  industry activations and the principal's permitted memberships.
4 Build immutable RequestContext{
    tenantId, industryContextId?, dataHome, principalId, principalType,
    orgUnitContext, roles, permissions, entitlementSnapshot,
    deviceOrCredentialContext, securityContext, correlationContext
  }.
5 For industry-scoped operations, industryContextId is REQUIRED.
   It may be absent only for explicitly classified Core/shared/global resources.
6 Open the permitted data home; establish Tenant and, where applicable,
  Industry Context enforcement variables from server-resolved context —
  never from an untrusted resource identifier alone.
```
A resource identifier never causes the server to silently switch Industry Context. If a supplied resource belongs to another enabled industry of the same tenant, the request is denied unless an explicit governed cross-context workflow is authorized. Identity/session claims are revalidated server-side on every request; revoked membership, disabled industry activation or suspended tenant takes effect at validation time.

## 4. Defense-in-Depth Isolation Guarantees
| Layer | Control |
|---|---|
| Token/credential | Tenant membership plus permitted context binding; short-lived/audience-scoped where applicable |
| Application | Kernel guard rejects cross-tenant **and wrong-Industry-Context** resource access before module logic |
| Repository/query | Industry repositories receive immutable active context and inject Tenant + Industry Context scope; omission cannot widen access |
| Database | Tenant RLS is mandatory; industry-owned rows are additionally constrained by Industry Context ownership. Exact RLS expressions are Detailed Design |
| Storage | Document/object authorization validates canonical ownership metadata (tenant, industry context where applicable, module/resource, ACL, residency) before signed URL issuance |
| Events | Industry events carry explicit Tenant + Industry Context; consumers/projectors preserve it and may not process under a different context |
| AI/RAG | Tenant + Industry Context + resource ACL + entitlement/security/residency filters (A-07) |

Platform-Operator (cross-tenant) access is a distinct, explicitly-granted capability with dedicated roles, reason-capture and audit (→ A-03 §6); it bypasses nothing at the DB layer — operator sessions use dedicated RLS policies.

## 5. Residency — Regional Data Homes (F-11)
A **Regional Data Home** is a deployment cell: Postgres (+ replicas), object storage bucket, and optionally a Core replica set, pinned to a jurisdictional region. Tenant onboarding selects the data home; all tenant-owned data categories (→ A-05 §2) live only there. Global directory data (tenant registry, routing, platform config) is region-neutral by design and contains no tenant business data. Cross-region moves are an operator-run migration workflow (export → verify → cutover → attest), audit-logged end to end.

## 6. Tenant Lifecycle
`PROSPECT → PROVISIONING → ACTIVE → (SUSPENDED ⇄ ACTIVE) → OFFBOARDING → ARCHIVED → PURGED`
- **Provisioning:** create directory entry → assign data home → seed reference/config data (F-04 seed categories) → activate primary industry + subscribed MS per entitlements → invite tenant admin. Idempotent, resumable, fully audited.
- **Suspension** (non-payment/policy): logins blocked except tenant-admin billing scope; data retained; webhooks paused.
- **Offboarding:** export package (tenant-owned data, documents, audit extract) → retention hold per compliance class (F-11) → purge with certificate of destruction recorded in audit.

## 7. Deferred to Detailed Design
Tenant directory entity fields; RLS policy catalog per table; data-home migration runbook; per-industry seed catalogs; suspension-scope matrix per module.

## 8. Residency-qualified resilience
Regional Data Home resilience follows F-11: local replicas, backups and failover remain inside the tenant's allowed residency boundary by default. **Cross-region replication, backup copies or failover are permitted only when tenant policy, contract or legal basis explicitly allows that residency event.** Resilience never silently overrides residency. A-10 owns the physical topology and recovery orchestration.
