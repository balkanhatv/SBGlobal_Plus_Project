# F-01 — PLATFORM FOUNDATION
**Document ID:** F-01 · **Version:** 0.5 · **Status:** SPECIFIED — PHASE 1 RAWSOURCE RECONCILED · Cross-refs: F-00 (authority/current status), F-02 (lifecycle), F-03 (identity/security), F-04 (data), F-05 (AI), F-06 (experiences), F-15 (truth revalidation).

---

## 1. Canonical Business Model `[SD: MI Part II §7]`

One Core Platform serves every Industry Suite and every Tenant. **Industry** = reusable business/solution framework; **Tenant** = actual customer organization. Every Tenant has exactly one Primary Industry Suite and may enable additional Industry Suites (e.g., ABC Group: Primary = Healthcare; Enabled = Retail, Education — one Tenant, one Core Platform). Every Industry-specific Management System, Module, Workflow, Data, Report, AI Context, and Application Experience remains bound to its Tenant + Industry Context unless explicitly shared through a governed Core capability. Never a separate backend per Industry or per Tenant (LG-06, LG-07).

### 1A. Future Industry Framework `[SD: MI §8; S1 §7 initial-industry framing]`

The nine Current Supported Industries are the active certified catalog and remain equal first-class suites. **Future Industry Framework** is a separate extension mechanism for industries beyond the current nine; it is not itself a tenth Current Supported Industry and may not be enabled for live Tenants merely because a future concept is documented. Promotion requires explicit user direction plus completion of the same governed Industry Specification/Management-System evidence standard that applies to current industries. New industries extend the shared Core through configuration, metadata, APIs, events, plugins, workflows and governed new Industry capabilities — never through a new Core or copied sibling-industry semantics.

## 2. Platform Actors `[SD: S1 §8, S2.2 §5, §11]`

| Actor | Primary scope | Core responsibilities |
|---|---|---|
| **Platform Owner** | Platform-wide | Ultimate commercial/legal ownership; approves governance-level changes; appoints Super Admins |
| **Super Admin** | Platform-wide | Governs platform, marketplace, subscription, branding standards, security policies, tenant lifecycle, module/AI/API ecosystems, deployment policies, identity/authN/authZ policies, license & device management, session management, affiliate program (commission rules, referral policies, payouts) |
| **Platform Staff** | Platform-wide (role-scoped) | Support, billing operations, compliance operations, content/CMS operations via RBAC |
| **Platform Developer** | Platform-wide (role-scoped) | Technical operations, integration support, AI Development Center review workflows (recommendations always require Super Admin approval `[SD: S2.2 §33]`) |
| **Tenant Owner** | Tenant-wide | Signs subscription; owns tenant data; delegates to Tenant Admins; controls industry enablement requests |
| **Tenant Admin** | Tenant-wide | Configures branding, domains, users, roles, modules, workflows, notifications, integrations, sync policy, affiliate/payout settings within plan entitlements `[SD: S1 §9]` |
| **Tenant business users** | Industry/Module/Role | Defined per Industry Suite (F-07…F-09); full authoritative platform user-type list preserved from S2.2 §5 |
| **End customers** (Patient/Student/Customer/Citizen/Donor/Guest…) | User-scoped | Consume Published Tenant Experiences (F-06) |
| **API Client / Service Account** | Tenant- or Platform-scoped | Machine access via scoped API credentials under the same Core identity boundary (F-03); not a human session |

## 3. Application Surface Model `[SD: MI §12]` — ACTIVE

| Surface | Purpose | Entry |
|---|---|---|
| Public SaaS Website (www.sbglobalplus.com) | Marketing, industries, pricing, docs, demo, trust center, legal, tenant signup | Public; no platform login button |
| Platform Application (Web·Mobile·Desktop) | Platform Owner/Super Admin/Staff/Developer operations | platform.sbglobalplus.com/login |
| Tenant Management Application (Web) | Tenant profile, industries, subscription, billing, licensing, users/roles/permissions, domains, branding, API/AI/integrations, configuration | manage.sbglobalplus.com/login |
| Industry Experiences | Industry website/web app, Tenant Staff Mobile, Tenant User/Customer Mobile, optional Industry Desktop — reusable at Industry level, instantiated per Tenant | Tenant domain/subdomain |

Hard separations (LG-10…LG-12): Login Entry Point ≠ Application Surface ≠ Identity System · Public Website ≠ Platform Admin · Tenant Management ≠ Industry Operations.

## 4. Tenancy Model

- **Isolation `[SD: S2.2 §6]`:** each tenant receives complete data isolation and independent users, branches, staff, domain/website, mobile configuration, branding, API access, AI usage, storage, configuration, plus configurable data residency/region. Cross-tenant access is never permitted; verified by dedicated tenant-isolation tests (inter-tenant AND intra-tenant cross-Industry-Context — F-03 §7).
- **Structure:** Tenant → Branches → Departments → Users/Roles `[SD: S2.2 §13–§15]`; identifiers UUID + Tenant ID + Branch ID + Department ID + Industry Vertical Suite reference `[SD: S2.4]`.
- **Context binding rule `[SD: MI §7/§14]`:** where a user belongs to multiple tenants or a tenant has multiple enabled industries, Tenant Context and Industry Context resolve only through explicit user selection or deterministic surface binding — never implicit inference.

## 5. Subscription, Billing, Licensing & Entitlements

**Tiers (ACTIVE, CR-01 + current user direction):** Free · Starter · Pro · Premium · Enterprise. **Free/Starter = self-serve; Enterprise = sales-assisted; Pro/Premium = governed configurable dual-route** (self-serve and/or sales-assisted) resolved by versioned commercial route policy. F-14 is the canonical commercial owner; older “sales-assisted above Starter” source wording remains source history, not active route policy.

**Entitlement chain (enforced server-authoritatively at every surface):**
`Tenant → Subscription Plan → Enabled/Licensed Industries → Enabled Management Systems → Enabled Modules/Features → Roles/Permissions → Application Access`

**Plan limit dimensions `[SD: S2.2 §26]`:** tenant/branch/user limits, API limits, AI limits (tokens/credits/media — F-05 §8), storage, SMS/WhatsApp/Email limits, mobile & tenant-portal access, reports, inventory, billing, website, integrations, feature permissions.

**Named business rules (trigger → condition → action):**
- **BR-SUB-01 Lifecycle** `[SD + canonicalized by F-14]`: Subscription resting states **Pending → Trial → Active → Grace → Suspended → Expired → Cancelled**. **Renewed is an Active re-entry event, not a resting state; failed renewal is the Active→Grace trigger, not a separate PAST_DUE state.** Trigger: commercial lifecycle event; condition: plan/payment/effective-date policy; action: transition only along F-14 §2, notify Tenant Owner, write audit event.
- **BR-SUB-02 No-deletion-on-expiry** `[SD]`: Trigger: state = Expired; condition: any tenant data exists; action: block all business operations except billing/renewal and data-export requests; never delete tenant data.
- **BR-SUB-03 Entitlement enforcement** `[SD/PR]`: Trigger: any business operation; condition: full chain valid (plan active, industry licensed, MS enabled, module enabled, role permits); action: allow; otherwise deny with entitlement error + audit entry (no partial bypass on any surface, including offline clients — F-03 §3).
- **BR-SUB-04 Downgrade guard** `[AC — rationale: chain integrity on plan change; logged D-DECISIONS AC-01]`: Trigger: plan downgrade; condition: current usage exceeds target-plan limits; action: require Tenant Admin remediation choice (disable modules/archive excess) before downgrade takes effect; nothing silently deleted.
- **BR-AFF-01 Affiliate engine** `[SD: S1 §8–9, S2.2 §26A]`: Core Platform affiliate/referral/commission/payout engine; governed by Super Admin, configured per Tenant/Industry; models: SaaS affiliate, tenant referral, doctor/user/business-partner referral, channel partner, reseller, franchise, agent network, commission & incentive management. Industry applications (e.g., Healthcare doctor referral commission) bind to the engine, never re-implement it.

## 6. Configuration-First Platform `[SD: S1 §10, S2.2 §7–8, §39; MI §17]`

Preference order: **Configuration → Metadata → Templates → Rules → Policies → Plugins → Automation → AI** — never hardcoding. Target: 20–25 years maintainability without developer dependency for business-rule changes. Developer intervention only for: framework changes, schema changes, core architecture, security enhancements, performance optimization, unsupported integrations, new features.

Configurable domains (Super Admin platform-wide; Tenant Admin tenant-scope within entitlements): branding, themes, typography, UI, menus, navigation, dashboards, widgets, **form definitions/form builder**, validation rules, **rules/policy definitions**, workflows, report/invoice/print/QR/PDF/email/SMS/WhatsApp/notification templates, mobile configuration & branding, APIs, integrations, feature flags, subscription/trial plans, roles, permissions, master data, lookups, custom/dynamic fields, communication/payment/storage/AI providers, **country/localization packs**, security policies, maintenance, enterprise configuration. All configuration DB-stored, versioned, auditable `[SD: S2.2 §7–8, §39, §46; S2.6 AI Provisioning]`.

**Synchronization Policy (single canonical policy — CR/S1 Rec #9):** offline/online rules, automatic background sync, real-time sync, conflict resolution, local storage policy — one policy consumed by Web, Mobile, Desktop; never restated per surface.

## 7. Core Platform Capability Catalog (industry-neutral only `[SD: MI §6]`)

Identity & Access (F-03) · Workflow Engine · **Rules/Policy Engine** · **Form Builder/Dynamic Field Engine** · Notification/Communication Engine (channels: Email/SMS/WhatsApp/Push/In-App; provider registry with priority & failover; retry, queues, DLQ, delivery tracking `[SD: S2.2 §25, §54]`) · Document Management (categories, versioning, OCR-ready, secure storage `[SD: S2.2 §48]`) · Reporting & BI (report builder, dashboard builder, scheduled reports, pivot, KPI builder, exports `[SD: S2.2 §42]`) · AI Services (F-05) · Audit & Versioning (entity change history, config version history, soft delete/restore, activity history `[SD: S2.2 §46]`) · Configuration & Metadata Platform (§6) · **API Platform (tRPC primary for internal first-party application operations; REST/OpenAPI compatibility surface for external interoperability; versioning, scoped API credentials, webhooks, sandbox/production, analytics/logs/health `[SD: S2.2 §28]`)** · Integration Management (profiles, credentials, mapping/sync/import/export/retry rules, IP whitelisting, rate limits, logs, connectivity testing `[SD: S2.2 §29]`) · Automation & Scheduler · Analytics (§7A) · Billing/Subscription/Licensing (§5) · Affiliate/Referral/Commission engine (§5) · Master/Seed/Demo/Media data frameworks (F-04) · Search & Productivity (global search, saved filters, bulk ops, import/export wizards `[SD: S2.2 §47]`) · **Localization & Country-Pack Framework** (multi-language/currency/timezone, RTL, regional formats, country/localization packs and tenant-selectable defaults `[SD: S2.2 §49; S2.6 AI Provisioning; F-04]`) · Monitoring & Diagnostics (`[SD: S2.2 §36]`) · Backup & DR (RPO/RTO, retention, verification, recovery testing `[SD: S2.2 §37, §43]`).

**Zero industry-specific content rule:** anything Healthcare/Education/etc.-specific lives only in F-07…F-09. Verified in this build's No-Loss audit scope check.

## 7A. Analytics & Dashboard Capability `[SD: S2.2 §34]`

Analytics is an **industry-neutral Core reporting/BI capability** consumed by platform and Industry Suites; it does not own industry business semantics. Required analytics families are: Revenue · Patient (Healthcare-context only) · Test (Healthcare-context only) · Doctor (Healthcare-context only) · Branch · Inventory · AI Usage · API · Communication · Financial · Subscription · Growth · Performance KPIs, plus tenant-authorized custom widgets and exportable charts. Industry-specific analytic meaning remains owned by the relevant suite while the Core provides dashboard/report/KPI composition.

**Isolation:** every tenant/industry-scoped analytic query, projection, widget and export preserves Tenant + Industry Context and applicable RBAC/ABAC/entitlement/security policy; platform-wide analytics may aggregate only data explicitly classified/authorized for platform scope. Same-tenant sibling Industry Contexts are not merged merely because tenantId matches.

**Foundation boundary:** required analytics capability, families, ownership and isolation are defined here. Exact metric formulas, projection schemas, dashboard layouts, widget catalogs, chart rendering and performance implementation belong to Architecture/Detailed Design.

## 8. Current Technology Direction `[UD: UD-TECH-01]`

The RawSourceCorpus contains historical technology requirements, but current explicit user direction supersedes those as the active Architecture technology baseline. Foundation records the constraint only; implementation HOW belongs to Architecture/Detailed Design.

**Active baseline:** Next.js 15 · TypeScript 5.x · Node.js 22+ · React 19 + Tailwind CSS + Shadcn UI · PostgreSQL · Payload CMS 3 · Refine where an internal CRUD/admin console is more appropriate · Next.js server capabilities, with NestJS where a dedicated backend/service boundary is architecturally justified · React Native + Expo · Tauri 2.0 for Windows/macOS/Linux · tRPC for first-party typed APIs where appropriate · REST/OpenAPI for external interoperability · Clerk as preferred managed identity boundary, Auth.js where Clerk is unsuitable · Webhooks · Expo Push Notifications / OneSignal · Vercel for suitable web workloads · Coolify + Dockerized VPS for self-hosted workloads.

**Supersession rule:** Laravel/PHP/Filament/MySQL-primary/Flutter/PM2/cPanel-centric assumptions are not active architecture. They remain immutable only where they occur in RawSourceCorpus or explicitly historical records. Any alternative selected inside current Architecture must record rationale/trade-offs in the Architecture decision record.

## 9. Non-Functional Baseline `[SD: S2.3 §1, S2.2 §50]`

99.9% availability target · API/dashboard response-time targets (quantified at Architecture phase) · horizontal scalability ready · queue-first background processing · caching (config/route/view/query; Redis-ready) · CDN & auto-scaling ready · observability (tracing-ready, metrics) · capacity planning & performance SLA documentation. Environments Development/Staging/Production strictly separated; no data/secret mixing.

## 10. Truth-Revalidation qualification `[UD: 2026-09-10 Project Truth Audit]`
This document contains substantive Foundation content and remains the canonical Platform Foundation owner. Its prior SPECIFIED label is not itself evidence of complete source coverage. During F-15 revalidation, each source requirement mapped here must be checked against the actual canonical content above; a summary/reference or generic inherited statement does not satisfy a requirement that needs additional WHAT/WHY/WHO detail.
