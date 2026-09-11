# SBGlobal Plus — A-08 EXPERIENCE ARCHITECTURE
**Document ID:** A-08 · **Version:** 1.0 · **Status:** ARCHITECTURE COMPLETE (CP-A1-002) · **Date:** 09-09-2026
**Traces to:** F-06 (surfaces, 3-layer experience model, UI/UX standards), F-10 (Desktop Foundation), F-02 (actor journeys), LG-01/LG-02 (Application Surface Model + Reusable Industry Experiences) · **Decisions:** ADR-011, ADR-015, ADR-016 (→ A-12)

---

## 1. Surface Catalog
| Surface | Technology | Audience | Notes |
|---|---|---|---|
| Public Site | Next.js 15 + **Payload CMS 3** | Visitors | Marketing/docs/status; CMS-driven; no tenant data (A-03 §5 public zone) |
| Platform App | Next.js 15 | Prospects → tenants | Signup, plan selection, tenant provisioning (F-02 W-01…W-04) |
| Tenant App | Next.js 15 (App Router, RSC) | Tenant staff + end-customers | The operational product; industry experiences mount here (§4) |
| Ops Admin | Next.js 15 + **Refine** + Shadcn UI | Platform operators | Refine adopted for CRUD-dense internal console (ADR-011); operator access rules per A-03 §6 |
| Mobile | **React Native + Expo** | Tenant staff + end-customers | Expo Router; push via **Expo Push primary, OneSignal optional** (ADR-016) |
| Desktop | **Tauri 2.0** | Tenant staff (POS/offline-first roles) | Wraps the Tenant App + local capability layer (§7); F-10/AC-06 |
All surfaces consume the Core exclusively via tRPC (A-06 §1); none holds business logic or direct DB access (A-03 §5 experience zone).

## 2. Application Shell Architecture
Each authenticated surface is a **shell + mounted experience packages**: the shell owns session (Clerk SDK → Core boundary, A-03 §2), tenant/OrgUnit context switcher, navigation composition, notification center, theming and error surfaces. Navigation and feature visibility are computed from the entitlement snapshot (A-04 §5) + RBAC permissions — the shell renders only what the tenant's activations and the user's roles allow, and the server re-checks regardless (UI is advisory).

## 3. Design System (ADR-011)
One platform design system: Tailwind CSS + Shadcn UI primitives + platform tokens (spacing, type, semantic colors) + composed patterns (data tables, form engine, workflow task UI, dashboard grid). Design tokens support **per-tenant theming** (logo, palette within accessibility constraints) resolved from tenant configuration. React Native consumes the same token set through a native mapping layer, keeping mobile visually coherent without forking the design language. F-06's UI/UX standards (density modes, accessibility WCAG 2.1 AA, i18n/RTL readiness) bind at the primitive level so every experience inherits them.

## 4. Reusable Industry Experiences (LG-01/LG-02)
Each industry suite ships **experience packages**: routed feature modules (React) that mount into the Tenant App shell when the suite/MS is entitlement-activated (A-09 §4). Packages depend only on: design system + shell contracts + their suite's tRPC routers. The same packages compose the mobile app's feature surface (React Native screens per package where the suite defines mobile scope). This realizes “one common tenant application, many industry experiences” — no per-industry app forks (CR-06 resolution).

## 5. Rendering & Data Strategy (web)
RSC-first for read-heavy views (server components fetch via Core service layer in the same deployment when co-located, else tRPC), client components for interactive workflows; optimistic updates only where the workflow state machine tolerates them (A-01 §3 guard remains authoritative). Payload CMS content is statically rendered with ISR on the public site. Web push and in-app notification streams ride the Notification module (A-06 §6 PushPort).

## 6. Session, Multi-Tenancy & Context in the UI
Tenant resolution per A-02 §3: subdomain/custom domain on web; explicit tenant claim on mobile/desktop. Users with multiple memberships get an explicit tenant switcher (context change = new RequestContext, never mixed). OrgUnit scoping surfaces as a workspace selector where a role spans subtrees. Suspension state (A-02 §6) renders the billing-only shell for tenant admins and a block screen for others.

## 7. Desktop & Offline Architecture (F-10)
Tauri 2.0 app = system webview hosting the Tenant App + a local Rust-side capability layer: encrypted local store (SQLite) for offline datasets, hardware integrations (receipt printers, barcode scanners — POS per AC-06), background sync agent. **Offline model:** designated offline-capable modules (per suite, A-09 §6) work against the local store with queued mutations; sync replays mutations through the normal tRPC endpoints where the kernel guard re-validates everything server-side (A-04 §7) with conflict resolution per module policy (last-write-wins only for non-financial data; financial/stock movements use reservation or reconciliation patterns per suite spec). Entitlement snapshot caching and offline validity per A-04 §7.

## 8. Mobile Architecture
Expo managed workflow; Expo Router file-based navigation mirroring shell/package structure; secure token storage via platform keychain through Clerk SDK; offline: read-cache + queued mutations for designated modules (same sync contract as desktop — one sync architecture, two clients); push tokens registered per device+tenant membership through PushPort; OTA updates via Expo Updates within store policy.

## 9. Deferred to Detailed Design
Screen inventories per surface and per suite (§26B); design-token dictionary; form-engine schema; navigation trees; offline dataset definitions per module; sync conflict matrices; accessibility test plans.

## 1A. Canonical application-surface separation
The experience architecture preserves four non-competing surfaces:
1. **Public SaaS Website** — public marketing/docs/pricing/trust/legal; no admin identity core.
2. **Platform Application — Web/Mobile/Desktop** — Platform Owner, Super Admin and authorized platform staff.
3. **Tenant Management Application — Web** — tenant administration, commercial/configuration/identity management.
4. **Reusable Industry Experiences — Web/Mobile/optional Desktop** — tenant-bound operational/customer experiences instantiated from Industry definitions.

All authenticated surfaces use the same Core Identity, Tenant/Industry Context and entitlement services. Surface separation is UX/application responsibility separation, never separate identity or backend cores.
