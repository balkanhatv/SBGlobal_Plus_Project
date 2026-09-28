# F-11 — TENANT DATA RESIDENCY MODEL
**Document ID:** F-11 · **Version:** 1.2 · **Status:** SPECIFIED — REMEDIATION REVALIDATED (CERTIFICATION PENDING) · Historical RR-02 resolution / decision **D-DECISIONS DR-01** retained. Provenance: requirement `[SD: S1 §6.7, S2.4]`; mechanism `[AC + UD]`. Cross-refs: F-03 §5–§6, F-01 §4, F-02 W-04/W-14, F-15.

## 1. Decision (DR-01) — Regional Data Home model — ACTIVE

**Context:** the corpus requires per-tenant/per-region data storage "where architecture permits" and regional DB instance support, without defining the mechanism. The mechanism materially affects tenant data boundaries; the historical user authorization is retained.

**Decision:** the platform adopts a **Regional Data Home** model: one logical Core Platform (single codebase/logical control plane) operating over one or more Regional Data Homes — regional PostgreSQL database plus file/media/object-storage locations. Every Tenant is assigned exactly one Data Residency Region at tenant creation (F-02 W-04, BR-W04-3); tenant-owned data classes (business/transaction data, documents/media, AI knowledge/memory and residency-bound backups) reside according to that region's policy.

**Alternatives considered:** (a) single-region only — rejected as the permanent model because it cannot satisfy regional-residency requirements; (b) per-tenant database everywhere — rejected as a universal requirement because isolation/residency can be achieved without forcing one operational topology for every tenant; (c) fully independent regional platform forks — rejected because they violate the one-Core architecture.

**Trade-offs / consequences:** control-plane metadata must be explicitly minimized; cross-region platform analytics must use governed non-residency-bound or anonymized data where legally/contractually permitted; region migration is a governed procedure; deployment topology must support incremental regional expansion without a code fork.

**Current technology/deployment qualification `[UD-TECH-01]`:** the model is deployment-portable. Suitable web/control-plane workloads may use Vercel; self-hosted/regional application and data workloads may use Coolify + Dockerized VPS or equivalent approved infrastructure. No PM2/cPanel-specific assumption is part of the current residency model. Exact provider/region topology belongs to Architecture/Detailed Design.

## 2. Residency policy & metadata
- **Tenant residency policy:** region chosen at signup/provisioning from the platform's offered region catalog; recorded as immutable residency metadata (tenant_id → region_code, effective date, chosen-by, plan/contract basis). Change only via governed Region Migration (§6).
- **Control plane (global/region-neutral, minimized):** tenant directory/routing metadata, subscription/entitlement state needed for routing/control, and platform-level identity/operations metadata. It contains no tenant business records, tenant documents or tenant AI knowledge unless a specific legal/contractual basis and architecture decision says otherwise.

## 3. Regional routing & storage placement
Every authenticated request resolves Tenant Context → residency metadata → permitted Regional Data Home/storage scope. Clients do not select a physical data region directly. Business data, uploaded/generated documents/media, AI vectors/embeddings/memory and logs containing tenant PII follow the tenant residency policy. Aggregated/anonymized platform metrics may leave a region only when policy permits.

## 4. Cross-region rules
- **Access:** cross-region tenant-data access denied by default.
- **Transfers:** only via governed export/import or migration with Tenant Owner request or documented legal basis, required approval, and full audit of what/why/source/destination/approver.
- **Administrative access:** platform staff access follows the tenant's residency/security rules, requires justification (AC-03) and is audited with region attribution.

## 5. Backup, DR & failover
Backups remain in-region by default; cross-region replication/failover requires explicit tenant policy/contract/legal allowance because it is itself a residency event. RPO/RTO and physical replication mechanisms are Architecture/Detailed Design concerns. Backup-aware deletion (F-04 §11) applies per region.

## 6. Region migration (governed procedure)
Trigger: Tenant Owner request or regulatory/contractual requirement. Foundation behavior: approval → governed freeze/cutover window → verified export/copy → target-region integrity validation → routing switch → source-region retention/destruction action according to policy → audit record. Exact migration tooling belongs to later design.

## 7. Auditability, compliance & expansion
Every residency-relevant event (assignment, access, transfer, migration, backup replication, failover) carries region attribution in the audit fabric. Compliance posture is configurable by jurisdiction/contract; do not claim a regulation or certification is automatically satisfied merely because this model exists. Adding a region must preserve one Core and require infrastructure/configuration rather than a tenant/industry code fork.

## 8. Truth-revalidation qualification
DR-01 remains an active architectural-completion decision unless later evidence contradicts it, but the historical RR-02 “resolved” label is not standalone Foundation-certification evidence. Current remediation reverified the underlying WHAT/WHY/WHO residency requirements and decision provenance against source/user authority; final Foundation certification remains governed by the fresh project-wide No-Loss/adversarial gate.
