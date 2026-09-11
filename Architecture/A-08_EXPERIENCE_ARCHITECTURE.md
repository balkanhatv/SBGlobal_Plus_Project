# SBGlobal Plus — A-08 EXPERIENCE ARCHITECTURE
**Document ID:** A-08 · **Version:** 1.0 · **Status:** ARCHITECTURE COMPLETE (CP-A1-002) · **Date:** 09-09-2026
**Traces to:** F-06 (surfaces, 3-layer experience model, UI/UX standards), F-10 (Desktop Foundation), F-02 (actor journeys), LG-01/LG-02 (Application Surface Model + Reusable Industry Experiences) · **Decisions:** ADR-011, ADR-015, ADR-016 (→ A-12)

---

## 1. Canonical Application Surface Catalog

| Surface | Channels / Technology | Audience | Responsibility |
|---|---|---|---|
| Public SaaS Website | Next.js 15 + Payload CMS 3 | Visitors/prospects | marketing, platform/industry/solution/pricing content, docs/resources, trust/legal, signup/demo/quote; no tenant operations |
| Platform Application | Web; Mobile/Desktop where justified | Platform Owner, Super Admin, authorized platform staff/developers | platform-wide operations/administration; same Core Identity/API, no separate backend |
| Tenant Management Application | Web | Tenant owner/admin | tenant profile, subscriptions/billing, industries/licenses/MS/modules, users/roles, branding, API/integrations/AI, configuration/security |
| Reusable Industry Experiences | Web · Staff Mobile · User/Customer/Student/Patient Mobile · optional Tauri Desktop | tenant-bound staff/end users | actual industry-domain operations instantiated from Industry Definition → Tenant Configuration → Published Instance |

All authenticated surfaces consume the same Core Identity, Tenant + Industry Context, effective-access and API services. Surface separation is responsibility/UX separation, never a new identity system or backend Core.

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
Tauri 2.0 app = system webview hosting the Tenant App + a local Rust-side capability layer: encrypted local store (SQLite) for offline datasets, hardware integrations (receipt printers, barcode scanners — POS per AC-06), background sync agent. **Offline model:** designated offline-capable modules (per suite, A-09 §6) work against the local store with queued mutations tagged with originating Tenant Context, Industry Context, principal, module/MS, source resource and operation metadata; sync replays mutations through the normal tRPC endpoints; the kernel independently re-resolves and revalidates current context, commercial validity, entitlements and authorization (A-04 §7). A queued Healthcare mutation replayed under an active Retail context is denied unless an explicit governed cross-context workflow exists; conflict resolution remains per module policy (last-write-wins only for non-financial data; financial/stock movements use reservation or reconciliation patterns per suite spec). Entitlement snapshot caching and offline validity per A-04 §7.

## 8. Mobile Architecture
Expo managed workflow; Expo Router file-based navigation mirroring shell/package structure; secure token storage via platform keychain through Clerk SDK; offline: read-cache + queued mutations for designated modules carrying the same originating Tenant Context, Industry Context, principal, module/MS and source-resource metadata as desktop (one sync architecture, two clients); push tokens registered per device+tenant membership through PushPort; OTA updates via Expo Updates within store policy.

## 9. Deferred to Detailed Design
Screen inventories per surface and per suite (§26B); design-token dictionary; form-engine schema; navigation trees; offline dataset definitions per module; sync conflict matrices; accessibility test plans.

## 9A. Surface-model invariant
The §1 catalog is the sole canonical surface model. Channel-specific shells/packages do not create additional application authorities. Public Website ≠ Platform Application ≠ Tenant Management ≠ Industry Operations.