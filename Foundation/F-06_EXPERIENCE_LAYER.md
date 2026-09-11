# F-06 — EXPERIENCE LAYER (WEB · MOBILE · DESKTOP)
**Document ID:** F-06 · **Version:** 0.2 · **Status:** SPECIFIED · Cross-refs: F-01 §3 (surfaces), F-03 (identity), F-07…F-09 (industry experiences). **Canonical technology alignment:** React Native + Expo mobile baseline; no change to RawSourceCorpus.

---

## 1. Reusable Industry Experience Model `[SD: MI §11]` — ACTIVE, 3 explicit layers, never collapsed

```
1. INDUSTRY EXPERIENCE DEFINITION        (reusable, Industry-level)
2. TENANT EXPERIENCE CONFIGURATION       (per-Tenant configuration of the Definition)
3. PUBLISHED TENANT EXPERIENCE INSTANCE  (live, branded, configured result)
```
Applies to: Industry Website · Industry Web Application · Industry Staff Mobile · Industry User/Student/Customer Mobile · optional Industry Desktop. Specialized source capabilities (Laboratory Website, Hospital/Clinic Website, School Website, Retail Store Experience…) are specialized reusable Industry experiences — never Core components, never per-tenant codebases (LG-08).

## 2. Public SaaS Website `[SD: S1 §11; S2.2 §9]`
Sitemap: Home · Vision/Company · Platform (Architecture/AI/Security/API) · Industries (all 9) · Solutions (Web/Mobile/Desktop) · Subscription/Pricing (5 tiers) · Book Demo · Request Quote · **Start Free/Self-Serve Signup** · Customers/Partners/Marketplace · Compare · Resources (Docs/Blog/FAQ) · **Trust Center** (security status, compliance certifications, uptime/status page) · **Legal** (ToS, Privacy, Cookie, SLA, DPA, Refund). Components: loader animation ("Enterprise Core Initialization" sequence), hero with dual CTA, announcement bar (priorities, scheduling, analytics), testimonials, pricing/comparison tables, FAQ, demo popup, AI chatbot/live chat widget, cookie consent banner, dark/light mode, language toggle, newsletter, app download, SEO/OpenGraph/structured data. No placeholder or dummy filler text anywhere `[SD: S2.2 §9]`.

## 3. Platform & Tenant Management Applications
Per F-01 §3: Tenant Management covers: tenant profile, primary/enabled industries, subscription/plans/upgrade/downgrade, billing, usage, licensing, services, management systems, modules, domains/subdomains, branding, users/roles/permissions, API, AI, integrations, notifications, configuration, security, settings.

## 4. Mobile Architecture `[SD: MI §15; S2.5 — single technical owner]`
- Apps: **Platform Mobile (Super Admin)** · **Tenant Staff Mobile** (all internal roles via RBAC) · **Tenant User/Customer Mobile** — reusable frameworks configured per Tenant (name, logo, colors, theme, splash, navigation, menus, dashboard, widgets, enabled modules, notifications, content, feature visibility). No per-tenant codebase for configuration.
- **Stack: React Native + Expo for Android/iOS; Expo Push Notifications / OneSignal for push delivery; Expo-compatible secure/local persistence; offline-first architecture with local operation queue, conflict resolution, incremental synchronization and retry; SSL/certificate pinning posture; device binding/registration; root/jailbreak detection where platform capability permits; QR/barcode; deep linking.** Distribution: app stores + enterprise APK + MDM distribution as applicable; force-update policy.
- **Authentication/API boundary:** Clerk-backed identity via the Core Identity boundary (F-03); **tRPC is the primary internal application API** and REST/OpenAPI is used only for external interoperability. No direct database access from the mobile client.
- Dynamic mobile platform `[SD: S2.2 §31]`: Super Admin manages branding/navigation/endpoints/version control/maintenance mode without rebuild (native package changes excepted).

## 5. Desktop Architecture `[SD: MI §15; S2.1 §18]`
Platform Desktop (platform-level) · optional Industry Desktop Experience enabled by plan/license/tenant/industry need. **Current cross-platform target: Tauri 2.0 for Windows/macOS/Linux**, with OS-appropriate packaging/update behavior, offline-ready secure local storage, and the same Core Identity/APIs/security/contexts. Historical Windows/.exe/.msi emphasis remains source history only; it is not an active platform restriction. Desktop interaction patterns may remain desktop-optimized where useful without becoming Windows-only. Foundation-level Desktop requirements are owned by F-10; implementation/package mechanics remain Architecture/Detailed Design.

## 6. UI/UX Layer Model `[SD: MI §19]`
**Core Design System → Industry Experience Layer → Tenant Branding Layer → Application Surface Layer.** Component library, grid (12/8/4), spacing scale (4…96), radius scale, status colors, breakpoints owned by Enterprise UI Design System `[SD: S2.8]`; brand tokens/typography/table/form defaults owned by Enterprise Default Standards `[SD: S2.7]` (baseline: Asia/Kolkata · dd-MM-yyyy · INR · English/Hindi); industry-specific defaults (LIS report flags, invoice defaults…) scoped to their Suites. Accessibility: keyboard navigation, ARIA, high contrast, screen reader, reduced-motion respect. Never a completely different design system per Tenant.

**Deferred:** per-surface screen inventories, navigation maps, design-token instantiation — Architecture/Detailed Design.
