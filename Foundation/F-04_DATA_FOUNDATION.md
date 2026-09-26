# F-04 — DATA FOUNDATION
**Document ID:** F-04 · **Version:** 0.2 · **Status:** SPECIFIED (partial) · Cross-refs: F-01 (tenancy), F-03 (isolation, audit fields), F-05 (AI knowledge), F-07…F-09 (industry data).

Format per category: **Definition · Ownership · Lifecycle · Tenancy · Relationships · Governance.** No application migrations are created at Foundation (explicitly deferred to Architecture/Database phase).

---

## 1. Master Data `[SD: MI §18; S2.2 §10A]`

- **Definition/graph:** Platform masters → Reference → Lookup/Dropdown → Industry masters → Tenant masters → Organization/Branch/Department → Localization/Country Packs. General masters (countries, states, districts, cities, languages, time zones, currencies, nationalities, sessions 2026–2100), identity masters (titles, gender, marital status, blood groups, religion, category, occupations, education), organization masters (departments, designations, roles, permissions, branch types, shifts, holiday calendars), plus industry-specific master families owned by their Suites (F-07…F-09 — e.g., Healthcare laboratory/billing/workflow masters stay in the Healthcare Suite layer).
- **Ownership:** Super Admin owns platform/reference masters; Tenant Admin owns tenant masters within entitlements; Industry Suites own industry master families.
- **Lifecycle:** draft → active → inactive → archived (soft delete; restore supported). Versioned; changes audited.
- **Tenancy:** platform masters global-read; tenant masters tenant-scoped; industry masters bound to Tenant+Industry Context.
- **Standard columns `[SD: S2.7]`:** UUID · Code · Name · Description · Status · Sort Order · Tenant ID · Created/Updated/Deleted By · Created/Updated/Deleted At.
- **Governance:** validation rules, referential integrity, no orphan records, migration/seeder standards, schema versioning `[SD: S2.4]`. Volume targets (250+ masters, 1000+ dropdown values) are Roadmap volume authority only `[SD: S2.9]`.

## 2. Reference/Lookup Data
Subset of §1 optimized for dropdown consumption; default installation seed subset per Enterprise Default Standards `[SD: S2.7 Master Dropdowns]`; canonical status vocabulary: Active, Inactive, Draft, Pending, Approved, Rejected, Completed, Cancelled, Deleted (color mapping owned by UI Design System `[SD: S2.8]`).

## 3. Tenant Data
All business records owned by a tenant. Ownership: Tenant Owner (legal), Tenant Admin (operational). Lifecycle: create → active use → retention window → archive → erase/pseudonymize (BR-SEC-01). Tenancy: hard isolation (F-03 §7); configurable residency/region. Relationships: every scoped entity carries Tenant ID (+ Branch/Department where applicable). Governance: retention policy per tenant, legal hold, GDPR-style deletion readiness, backup-aware deletion `[SD: S2.2 §51]`. **No tenant data deleted on subscription expiry** (BR-SUB-02).

## 4. Industry Context Data
Binding layer between a Tenant and each enabled Industry Suite: enabled management systems, industry configuration, industry master selections, industry AI context. Bound to Tenant+Industry Context; never shared across contexts except via governed Core capability (F-01 §1). Carries Industry Vertical Suite reference identifier `[SD: S2.4]`.

## 5. Transaction Data
Domain events/records produced by W-08 operations (appointments, orders, invoices, samples, work orders, cases, donations… — defined per Suite). Lifecycle: workflow-state-driven (F-02); append-heavy; soft delete only where legally permitted; archival strategy per retention policy. Relationships: transactions → masters (FK), → workflow instances, → audit trail. Governance: audit fields mandatory; financial transactions immutable post-approval `[AC — D-DECISIONS AC-05: correction via reversal entries, never in-place edit]`.

## 6. Configuration & Seed Data
- **Configuration data:** all F-01 §6 domains; DB-stored, versioned (configuration version history `[SD: S2.2 §46]`), auditable, environment-scoped (never mixed across Dev/Staging/Prod).
- **Seed data `[SD: MI §18]`:** reproducible system data — roles, permissions, system settings, default plans/policies/templates, required reference data. Rule BR-DATA-01: seeds are idempotent and re-runnable; a re-run never duplicates or overwrites tenant-customized values.
- **System defaults `[SD: S2.7]`:** Timezone Asia/Kolkata · Date dd-MM-yyyy · Currency INR (per-tenant configurable) · Languages English/Hindi (+configurable) · OTP enabled · 2FA optional · audit/soft-delete/UUID/multi-tenant/API-first/white-label/AI/feature-flags enabled. Country/localization packs provide governed country/region-specific reference/default configuration without hard-coding one country's business semantics into global Core.

## 7. Audit Data
Append-only event fabric (F-02 W-13): identity, authorization, configuration, entity change history, financial, AI, API, security, communication logs. Ownership: platform (fabric) + tenant (visibility of own events). Retention/rotation per logging policy `[SD: S2.2 §53]`; searchable, exportable, alert rules; complete audit preservation survives data lifecycle actions (F-03 BR-SEC-01).

## 8. AI Knowledge / Context Data
Knowledge bases, vector stores, embedding stores, document indexes, prompt libraries, conversation/tenant/user/session memory `[SD: S2.6]`. Tenancy: strictly tenant- and industry-context-isolated; AI never reads across contexts (F-05 §6). Lifecycle: ingest → index → serve → refresh → purge with source document lifecycle. Governance: PII protection, sensitive-data detection, provenance recorded per knowledge item.

## 9. Demo Data `[SD: MI §18; S2.2 §10A]`
Realistic, synthetic, resettable, rebuildable, tenant-scoped, **DEMO-flagged**; never real customer/patient/student PII; must cover **every** current Industry (not just Healthcare); Super Admin can enable/disable/regenerate/import/remove; never interferes with production records. Rule BR-DATA-02: any record created from demo generation carries the DEMO flag through all downstream artifacts (reports, invoices, analytics excluded from production KPIs by default).

## 10. Media Assets `[SD: MI §18; S2.2 §10A]`
Governed domain: brand, UI, icons, SVG, illustrations, images, animations, videos, industry/website/mobile/desktop assets, AI-generated assets. Governance: provenance, licensing, attribution, versioning, ownership, permissions, lifecycle, CDN, backup/recovery. Source policy preserved: AI-generation first (original, commercially usable, brand-matched, optimized WebP/SVG/PNG); copyright-free fallback libraries only (Unsplash, Pexels, Pixabay, Openverse, commercially-compatible Wikimedia, Coverr, Mixkit); approved icon sets only (Lucide, Heroicons, Tabler, Material Symbols); prohibited sources list retained verbatim in Suite/marketing docs; no placeholders or watermarked assets in production.

## 11. Data Lifecycle & Retention (cross-category) `[SD: S2.2 §51; S1 §6.4]`
Soft delete → hard delete → archive policy → retention policy → legal hold → restoration → historical archive → automatic purge rules → tenant-wise retention → backup-aware deletion → GDPR-style deletion readiness → complete audit preservation.

**Data-subject / tenant data access lifecycle:** governed access/export/portability and right-to-access requests must preserve Tenant + Industry Context, authorization, sensitivity/residency rules and audit. Import/export is never a bypass around normal authorization. Erasure remains subject to legal hold/retention and the F-03 privacy rules.

## 12. Foundation-level entity shape examples (§9A evidence; full catalog = Architecture phase)

**Entity: Tenant** — id (UUID, req) · name (string, req) · legal_name (string, opt) · status (enum: pending/provisioning/active/suspended/expired, req) · primary_industry_id (FK, req) · region (enum, req) · subscription_id (FK, req) · owner_user_id (FK, req) · audit fields. Relations: 1-N Branch, 1-N TenantIndustryContext, 1-1 Subscription, 1-N User(membership).

**Entity: TenantIndustryContext** — id (UUID) · tenant_id (FK, req) · industry_suite_code (enum of 9, req) · is_primary (bool, req; exactly one true per tenant — BR-W04-1) · status (enum) · enabled_management_systems (relation) · audit fields. Relations: 1-N enabled MS, 1-N industry configs.

**Entity: Subscription** — id (UUID) · tenant_id (FK) · plan (enum: Free/Starter/Pro/Premium/Enterprise) · state (enum: Pending/Trial/Active/Grace/Suspended/Expired/Cancelled; Renewed is an event) · period_start/end (datetime) · limits (structured per F-01 §5 dimensions) · audit fields.

**Entity: MasterItem (pattern)** — standard columns (§1) applied to every master family.

**Deferred:** full 500+-table catalog, index/partition strategy, per-entity field dictionaries — Architecture/Database phase per §26B.
