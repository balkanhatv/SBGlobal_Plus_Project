# SBGlobal Plus — A-05 DATA ARCHITECTURE
**Document ID:** A-05 · **Version:** 1.0 · **Status:** ARCHITECTURE BASELINE (CP-A1-002) · **Date:** 09-09-2026
**Traces to:** F-04 (11 data categories, demo/media governance), F-11 (Regional Data Homes), F-00 §6 (scale ledger), F-03 §6 (erasure/retention, sensitivity) · **Decisions:** ADR-009 (→ A-12)

---

## 1. Canonical Store & Topology (ADR-009)
**PostgreSQL is the single canonical store.** Every Regional Data Home (→ A-02 §5) runs its own Postgres (primary + streaming replicas) plus object storage. In-database capabilities are preferred over new infrastructure at v1: **pgvector** for embeddings (→ A-07 §4), Postgres full-text search for tenant search, transactional outbox table for events (→ A-06 §3), advisory-locked counters for limits (→ A-04 §4). Trade-off recorded in ADR-009: one engine maximizes operational simplicity and transactional integrity on VPS-class hosting; dedicated search/vector/queue engines remain named extraction seams if scale demands.

## 2. Data Category Mapping (F-04 §1–§12)
| F-04 category | Store | Home | Lifecycle owner |
|---|---|---|---|
| Platform/system data | Postgres (global directory) | Region-neutral | Platform modules |
| Tenant master & config | Postgres | Tenant data home | Tenancy/Config |
| Industry reference data | Postgres (platform-seeded) | Replicated to homes | Industry modules |
| Transactional business data | Postgres | Tenant data home | Owning MS module |
| Financial records | Postgres (immutable + reversals, AC-05) | Tenant data home | Billing/MS finance |
| Documents & media | Object storage (metadata in Postgres) | Tenant data home | Document module |
| Demo data | Postgres, `DEMO`-flagged | Tenant data home | Config (reset service) |
| Audit & security events | Postgres append-only (→ A-11 §4) | Tenant data home | Audit module |
| AI/derived data (embeddings, indexes) | pgvector/projection tables | Tenant data home | AI Gateway |
| Analytics/read models | Postgres projection schemas | Tenant data home | Projection consumers |
| Backups/exports | Encrypted object storage | Same jurisdiction | Ops (→ A-11) |

## 3. Ownership & Boundaries
Each module owns a schema namespace; **tables belong to exactly one module** (A-01 §4). Cross-module data needs are met by (a) the owner's typed contract or (b) **event-projected read models** — never foreign joins across ownership boundaries. Industry modules own their MS tables; platform modules never reference industry tables. Every tenant-owned table carries `tenant_id` + RLS policy (A-02 §4); OrgUnit-scoped tables additionally carry the OrgUnit path.

## 4. Master, Reference & Demo Data
Three seed layers at provisioning (F-04, A-02 §6): platform masters → industry reference packs (activated suites only) → tenant-editable masters cloned from templates. **Demo data is `DEMO`-flagged at row level**; the reset service deletes by flag within tenant scope, never touching real data (F-04 §9). Master changes are versioned and audited.

## 5. Documents & Media
Object storage per data home; keys `tenant/{tenantId}/{module}/{uuid}`; access only via short-lived signed URLs issued after the full guard chain. Upload pipeline: quarantine → scan → metadata commit (Postgres) → available. Media governance per F-04 §10: type/size policies per tenant config, storage counted against entitlement limits (→ A-04 §4).

## 6. Read Models, Search & Metering Stores
Projection consumers (→ A-06 §3) maintain denormalized read models: tenant search indexes (Postgres FTS), dashboards/KPI aggregates (per-MS definitions from F-12), metering aggregates (→ A-04 §7). Projections are rebuildable from the event log + canonical tables; they are cache, not truth.

## 7. Lifecycle, Retention & Erasure
Every entity class maps to a **sensitivity class** (F-04 taxonomy) and a **retention class** (per compliance profile, per industry — F-03 §5–§8). Architecture rules: financial data immutable post-approval, corrections by reversal (AC-05); erasure requests satisfied by **pseudonymization + audit skeleton** where retention law forbids deletion (AC-04); retention expiry drives archival → purge with destruction certificate (A-02 §6). Column-level encryption for designated sensitive classes on top of at-rest encryption (A-03 §5).

## 8. Migrations & Evolution
Forward-only, **expand-and-contract** migrations (add → backfill → switch → remove) so replicas and rolling deploys never break; one migration stream applied per data home with a version gate — a Core replica refuses to serve a database whose schema version it does not support. RLS policies ship inside the same migration as the table they protect.

## 9. Backup & Recovery
Per data home: WAL-based PITR + daily encrypted full backups to jurisdiction-local object storage; restore verification drills are an operations requirement (→ A-11 §6). RPO ≤ 5 min (WAL shipping), RTO tiered by plan (Enterprise cells first). Tenant export (offboarding, A-02 §6) reuses the same export pipeline.

## 10. Deferred to Detailed Design
Full table catalog (F-00 §6 ledger targets, 500+ tables), index/partitioning plans, RLS policy catalog, per-industry retention schedules, projection schemas, backup sizing/runbooks.