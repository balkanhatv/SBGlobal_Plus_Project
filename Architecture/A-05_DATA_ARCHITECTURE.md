# SBGlobal Plus — A-05 DATA ARCHITECTURE
**Document ID:** A-05 · **Version:** 1.0 · **Status:** ARCHITECTURE COMPLETE (CP-A1-002) · **Date:** 09-09-2026
**Traces to:** F-04 (11 data categories, master/demo/media governance), F-11 (Regional Data Home), F-00 §6 (scale ledger targets), F-03 §6 (erasure/retention, AC-04) · **Decisions:** ADR-008 (→ A-12)

---

## 1. Canonical Store & Topology (ADR-008)
**PostgreSQL is the single canonical store** for all structured data. Per Regional Data Home (A-02 §5): one primary + streaming replicas; the platform directory (tenants, routing, plan catalog) lives in a small global cluster containing no tenant business data. Within one data home, the default is one shared database (RLS isolation, ADR-002); dedicated-DB tenants get their own database with the identical schema. Full-text search uses Postgres FTS; vector search uses **pgvector** in the same cluster (→ A-07 §4). A separate search/vector engine is deliberately not introduced at v1 — trade-off recorded in ADR-008 with the extraction seam (Search module facade, A-01 §2) that permits one later without consumer change.

## 2. Data Category → Storage Class Mapping (F-04)
| F-04 category | Storage class | Notes |
|---|---|---|
| Platform reference data | Global directory DB | Region-neutral, replicated read-only to data homes |
| Industry reference/master data | Tenant data home, `master` class tables | Seeded at activation (A-02 §6), tenant-extensible per config |
| Tenant configuration | Tenant data home | Layered resolution via Config module |
| Operational/transactional data | Tenant data home | RLS, workflow-bound, audit-linked |
| Financial records | Tenant data home, append-only posting tables | Immutable post-approval, reversal-only correction (AC-05) |
| Documents/media | Object storage `tenant/{id}/…` + `DocumentMeta` in DB | Signed scoped URLs (A-02 §4) |
| Demo data | Same tables, `is_demo` flag | F-04 §9 reset rules: demo purge is a governed bulk operation, never touches non-demo rows |
| Audit events | Tenant data home, append-only partitioned tables | Retention per compliance profile (→ A-11 §4) |
| AI/RAG derived data | pgvector tables + AI usage ledger | Derived → rebuildable; tenant + source ACL scoped (→ A-07 §4) |
| Search indexes | Postgres FTS (generated columns/tsvector) | Derived → rebuildable |
| Analytics/read models | Projection tables per data home | Event-sourced from outbox (§6) |

## 3. Schema Organization & Ownership
- Postgres schemas partition by ownership: `core_*` (platform modules) and `ind_<suite>_*` (nine industry suites, e.g. `ind_hlt`, `ind_edu`, `ind_rtl`, `ind_hsp`, `ind_mfg`, `ind_psv`, `ind_gov`, `ind_ngo`, `ind_sfm`). Ownership follows the module catalog (A-01 §2): the owning module is the only writer; cross-module access is via contracts or projections, never cross-schema joins across ownership boundaries (A-01 §4).
- Every tenant-owned table carries `tenant_id` (RLS), standard audit columns, and optimistic-concurrency versioning. `is_demo` is present on demo-capable operational tables (F-04 §9).
- All nine industry schemas follow one **structural convention** (masters / operational / posting / projection table classes); the convention is structural only — each suite's entities derive from its own F-07…F-09/F-12/F-13 specification, never from Healthcare's (LG-03 preserved at architecture level).

## 4. Migration Architecture
One ordered, forward-only migration stream per schema-owning module, composed into a single release migration set. **Expand–contract** discipline: additive change → deploy code reading both → backfill → contract. Migrations run per data home (and per dedicated-DB tenant) by the deployment pipeline (→ A-10 §6) with pre-flight RLS-policy verification: a release fails closed if any tenant-owned table lacks its RLS policy — this makes ADR-002's guarantee mechanically enforced rather than review-dependent.

## 5. Object Storage & Media
Object storage per data home (residency-pinned). Keys: `tenant/{tenantId}/{module}/{docId}`. All access via the Document module: upload → virus/type scan → `DocumentMeta` row (owner, sensitivity class, retention class) → storage write, in that order (no orphan objects). Downloads use short-lived signed URLs scoped to a single object. Media governance rules of F-04 §10 (formats, size classes, derivative generation) execute as Document-module pipelines; derivatives are cache-class data (rebuildable).

## 6. Read Models & Projections
Cross-module read needs (dashboards, lists spanning ownership boundaries, analytics) are served by **projection tables** built from outbox events (A-06 §4): at-least-once delivery + idempotent projectors keyed by event id. Projections are per data home, tenant-scoped, and rebuildable from the event log + owning tables. This is the only sanctioned way one module reads another's data shape (A-01 §4).

## 7. Sensitivity, Encryption, Retention & Erasure
- **Sensitivity classes** (F-04 taxonomy) are declared per column/entity in the module's data contract; classes drive column-level encryption (A-03 §5), masking in logs (→ A-11 §2), AI-egress redaction (→ A-07 §6) and export handling.
- **Retention classes** per entity: operational / financial / audit / regulated-industry profiles; retention values are per-tenant-compliance-profile configuration (A-03 §6).
- **Erasure vs retention** (AC-04): evaluate legal hold / mandatory retention first. **If retention applies**, pseudonymize personal fields while preserving only the required non-personal audit/financial skeleton; **if it does not apply**, hard-erase the governed personal data according to policy. In both paths, the erasure decision/action is audited without retaining erased personal content unnecessarily. Architecture therefore does not impose universal pseudonymization.

## 8. Backup & Recovery
Per data home: continuous WAL archiving (PITR) + scheduled base backups + object-storage versioning; backup encryption keys are residency-scoped. **Backups remain in-region by default; cross-region backup/replication/failover is allowed only when tenant policy, contract or legal basis permits it (F-11).** Restore classes: single-tenant logical export/restore (also serves offboarding export, A-02 §6) and full-cell PITR. Recovery objectives are set per plan tier in F-14 dimensions; verification restores are an operations-calendar duty (→ A-11 §5).

## 9. Deferred to Detailed Design
Full entity catalogs per module (F-00 §6 ledger: 500+ tables target); RLS policy catalog; partition/index strategy per high-volume table; projector catalog; per-industry seed packs; sensitivity/retention class assignment tables; backup runbooks.
