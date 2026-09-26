# F-06 — EXPERIENCE LAYER (WEB · MOBILE · DESKTOP)
**Document ID:** F-06 · **Version:** 0.3 · **Status:** SPECIFIED · Cross-refs: F-01 §3 (surfaces), F-03 (identity), F-07…F-09 (industry experiences). **Canonical technology alignment:** React Native + Expo mobile baseline; no change to RawSourceCorpus.

---

## 1. Reusable Industry Experience Model `[SD: MI §11]` — ACTIVE, 3 explicit layers, never collapsed

```
1. INDUSTRY EXPERIENCE DEFINITION        (reusable, Industry-level)
2. TENANT EXPERIENCE CONFIGURATION       (per-Tenant configuration of the Definition)
3. PUBLISHED TENANT EXPERIENCE INSTANCE  (live, branded, configured result)
```
Applies to: Industry Website · Industry Web Application · Industry Staff Mobile · Industry User/Student/Customer Mobile · optional Industry Desktop. Specialized source capabilities (Laboratory Website, Hospital/Clinic Website, School Website, Retail Store Experience…) are specialized reusable Industry experiences — never Core components, never per-tenant codebases (LG-08).

## 2. Public SaaS Website `[SD: S1 §11; S2.2 §9]`

**Required public capabilities / sitemap ownership:** Home/Homepage · Hero · Features · Solutions · Industries · Pricing · Trial Plans · Subscription Plans · Free Trial/Self-Serve Signup · About Us · Why Choose Us · Company Story · Team · Careers · Contact · FAQ · Testimonials · Customer Reviews · Success Stories · Case Studies · Blog · Articles · Knowledge Base · Documentation · Downloads · Resources · Help Center · Privacy Policy · Terms · Cookie Policy · Refund Policy · SLA · DPA · Trust Center · Status/Uptime · Compliance Badges · Media Gallery · Image Gallery · Videos · Events · Newsletter · Contact Forms · Landing Pages · Dynamic CMS · Cookie Consent Banner · Live Chat/AI Chatbot · Enterprise Announcement Bar. Platform/Architecture/AI/Security/API, Book Demo/Request Quote, Customers/Partners/Marketplace and Compare may be composed within these public capabilities where applicable. `[SD: S1 §11; S2.2 §9]`

**Production-content requirement:** relevant pages/sections/components must be populated with production-ready headings, subheadings, paragraphs, marketing copy, CTA buttons, icons, hero content, statistics, feature cards, pricing/comparison content, FAQ content, testimonials, customer/company information, SEO metadata, OpenGraph metadata, structured data and commercially usable original/licensed visual assets (images, illustrations, icons, background graphics and banners). No Lorem Ipsum, placeholder text, empty required section or dummy public content is allowed. `[SD: S2.2 §9]`

**Experience components:** loader animation ("Enterprise Core Initialization" sequence), hero with dual CTA, announcement bar, pricing/comparison surfaces, AI chatbot/live chat, cookie consent, dark/light mode, language toggle, newsletter and app-download entry points. Exact page composition, wireframes, copy and asset placement are later design/content work; this Foundation section owns the required public capabilities and production-content intent.

## 3. Platform & Tenant Management Applications
Per F-01 §3: Tenant Management covers: tenant profile, primary/enabled industries, subscription/plans/upgrade/downgrade, billing, usage, licensing, services, management systems, modules, domains/subdomains, branding, users/roles/permissions, API, AI, integrations, notifications, configuration, security, settings.

## 4. Mobile Architecture `[SD: MI §15; S2.5 — single technical owner]`
- **Tenant mobile product rule:** for each Tenant and each enabled Industry Experience, exactly two logical Tenant mobile apps are exposed — **Tenant Staff App** for internal roles and **Tenant User App** for external users/customers. Patient, Doctor, Teacher, Student, Cashier, Guard, etc. are roles/experiences inside these apps, never separate role-specific binaries. The **Platform Mobile / Platform Application** for Platform Owner/Super Admin/Platform Staff is platform-level and is not counted as a Tenant mobile app. Reusable React Native/Expo shells/codebases may serve many Tenants/Industries; branding, navigation, menus, dashboards, modules and feature visibility are context/configuration driven, not per-Tenant forks.
- **Stack: React Native + Expo for Android/iOS; Expo Push Notifications / OneSignal for push delivery; Expo-compatible secure/local persistence; offline-first architecture with local operation queue, conflict resolution, incremental synchronization and retry; SSL/certificate pinning posture; device binding/registration; root/jailbreak detection where platform capability permits; QR/barcode; deep linking.** Distribution: app stores + enterprise APK + MDM distribution as applicable; force-update policy.
- **Authentication/API boundary:** Clerk-backed identity via the Core Identity boundary (F-03); **tRPC is the primary internal application API** and REST/OpenAPI is used only for external interoperability. No direct database access from the mobile client.
- Dynamic mobile platform `[SD: S2.2 §31]`: Super Admin manages branding/navigation/endpoints/version control/maintenance mode without rebuild (native package changes excepted).

## 5. Desktop Architecture `[SD: MI §15; S2.1 §18]`
Platform Desktop (platform-level) · optional Industry Desktop Experience enabled by plan/license/tenant/industry need. **Current cross-platform target: Tauri 2.0 for Windows/macOS/Linux**, with OS-appropriate packaging/update behavior, offline-ready secure local storage, and the same Core Identity/APIs/security/contexts. Historical Windows/.exe/.msi emphasis remains source history only; it is not an active platform restriction. Desktop interaction patterns may remain desktop-optimized where useful without becoming Windows-only. Foundation-level Desktop requirements are owned by F-10; implementation/package mechanics remain Architecture/Detailed Design.

## 6. UI/UX Layer Model `[SD: MI §19]`
**Core Design System → Industry Experience Layer → Tenant Branding Layer → Application Surface Layer.** Component library, grid (12/8/4), spacing scale (4…96), radius scale, status colors, breakpoints owned by Enterprise UI Design System `[SD: S2.8]`; brand tokens/typography/table/form defaults owned by Enterprise Default Standards `[SD: S2.7]` (baseline: Asia/Kolkata · dd-MM-yyyy · INR · English/Hindi); industry-specific defaults (LIS report flags, invoice defaults…) scoped to their Suites. Accessibility: keyboard navigation, ARIA, high contrast, screen reader, reduced-motion respect. Never a completely different design system per Tenant.

### 6.1 Platform Brand Default `[SD: S1 §12–13; S2.7; UD: CR-02]`

The active Platform brand is **SBGlobal Plus**. Canonical primary tagline is the USER-DIRECTED decision **“One Intelligent Platform. Every Industry. Infinite Possibilities.”** S1’s “Guided by Trust. Built for Tomorrow.” and S2.7’s “AI-Powered Enterprise Intelligence. One Core. Unlimited Possibilities.” remain preserved as historical/alternative source taglines, not competing active primaries.

**Default brand tokens from Enterprise Default Standards:** Primary `#06B6D4` · Primary Hover `#2563EB` · Secondary `#0F766E` · Accent `#7C3AED` · Success `#16A34A` · Warning `#F59E0B` · Danger `#DC2626` · Info `#0284C7`; backgrounds White `#FFFFFF`, Gray `#F8FAFC`, Sidebar `#0F172A`, Card `#FFFFFF`; text Heading `#0F172A`, Body `#475569`, Muted `#64748B`, Border `#E2E8F0`.

**Typography defaults:** Inter primary · Poppins secondary · Roboto report/PDF; semantic product radii Card 12px · Button 10px · Input 8px; Light default / Dark optional; platform spacing scale and detailed component tokens remain owned by S2.8.

**Company identity source default:** SBGlobal Plus Pvt Ltd.; organization/contact metadata is CMS/configuration-managed and may be updated through governed company-profile configuration without changing application code. Source-supplied company/contact values remain traceable to S1 §13 / S2.7 rather than being duplicated across unrelated Foundation files.

Tenant branding/white-label may override allowed presentation tokens within entitlement and accessibility/security floors; it never changes the Platform product identity, canonical audit/security semantics, or creates a code fork.

**Deferred:** per-surface screen inventories, navigation maps, design-token instantiation — Architecture/Detailed Design.
