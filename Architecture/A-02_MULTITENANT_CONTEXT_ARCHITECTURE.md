# SBGlobal Plus — A-02 MULTI-TENANT & CONTEXT ARCHITECTURE
**Document ID:** A-02 · **Version:** 1.0 · **Status:** ARCHITECTURE BASELINE (CP-A1-001) · **Date:** 09-09-2026
**Traces to:** F-01 (tenancy model), F-03 (tenant isolation), F-11 (Regional Data Home / residency), F-00 §5 (business model chain) · **Decisions:** ADR-002 (→ A-12)

---

## 1. Tenancy Model
Canonical chain (F-00 §5): Core → Industry catalog → **Tenant** → Primary Industry → optional enabled industries → Branches/Departments → Users/Roles → Management Systems → Modules/Workflows/Transactions. A tenant is the unit of commercial contract, data ownership, configuration and isolation. Branches/departments are intra-tenant organizational units (OrgUnit tree), not tenants.

## 2. Isolation Architecture (ADR-002)
**Default: shared PostgreSQL cluster, shared schema, `tenant_id` discriminator + PostgreSQL Row-Level Security (RLS)** on every tenant-owned table. **Premium/regulated option: dedicated database** (same schema, own Postgres database/cluster) for tenants whose tier, compliance regime, or Regional Data Home (F-11) requires it. Both run the identical codebase; the tenancy module resolves each tenant to its **data home** (cluster + database) via a platform-owned tenant directory that is itself global, minimal (no business data) and replicated.

Trade-off (recorded in ADR-002): shared-RLS maximizes density and operational simplicity for the long tail; dedicated DB buys hard isolation and residency at higher cost; a schema-per-tenant middle tier was rejected (migration fan-out, connection-pool pressure at 1000s of tenants).

## 3. Tenant Context Resolution (every request)
```
1 Resolve tenant candidate: subdomain/custom domain (web) · explicit
  tenant claim (mobile/desktop) · API key binding (external API)
2 Validate: tenant exists · status ACTIVE (not SUSPENDED/ARCHIVED) ·
  user is a member of tenant · requested OrgUnit within tenant
3 Build immutable RequestContext{tenantId, dataHome, userId, orgUnitPath,
  roles, entitlementSnapshot, industryActivations}
4 Open DB connection to the tenant's data home; SET the RLS tenant
  variable from RequestContext (never from client input)
```
The context token (→ A-03 §3) carries tenant + role claims but is **re-validated server-side** each request against the tenant directory; a revoked membership or suspended tenant takes effect on next request, not token expiry.

## 4. Defense-in-Depth Isolation Guarantees
| Layer | Control |
|---|---|
| Token | Tenant claim signed, short-lived, audience-bound |
| Application | Kernel guard rejects any cross-tenant identifier before module code runs |
| ORM/query | Repository layer injects tenant scope; raw cross-tenant SQL forbidden by module boundary rules (A-01 §4) |
| Database | RLS policies as final enforcement — even a defective query cannot read another tenant's rows |
| Storage | Object-storage keys prefixed `tenant/{id}/…`; signed URLs scoped per object (→ A-05 §5) |
| Events/AI | Outbox events and RAG indexes carry tenant scope; consumers/retrievers filter by it (→ A-06, A-07) |
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
