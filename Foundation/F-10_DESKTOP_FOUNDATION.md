# F-10 — DESKTOP FOUNDATION
**Document ID:** F-10 · **Version:** 1.2 · **Status:** SPECIFIED — SUBSTANTIVE REVALIDATION REQUIRED · Provenance: `[SD]` where sourced (S1 §2/§12, S2.1 §18, MI §15); structural completion `[AC — logged D-DECISIONS AC-15]`. **Current technology alignment:** Tauri 2.0 for Windows/macOS/Linux + Clerk identity boundary + tRPC first-party APIs; RawSourceCorpus remains unchanged. Cross-refs: F-01 §3, F-03, F-06, F-15.

## 1. Desktop role in the Application Surface Model `[SD]`
Desktop is a **client surface**, never a separate platform: same Core Identity, same first-party API platform, same tenant/industry context, same entitlement chain. tRPC is preferred for typed first-party application contracts where appropriate; REST/OpenAPI remains the external-interoperability surface. Two desktop surfaces exist:
- **Platform Desktop** — platform-level application for Platform Owner / Super Admin / Platform Staff operations (part of the Platform Application surface).
- **Industry Desktop Experience** — optional, reusable at Industry level, instantiated per Tenant via the 3-layer model (Definition → Tenant Configuration → Published Instance). Enabled by plan, license, tenant need, industry need. Foundation-identified candidates: Retail POS Desktop, Hospitality front-desk/POS, Manufacturing plant/shop-floor station, Government counter Desktop, NGO donation-counter Desktop, Healthcare lab workstation.
- **Tenant Management** remains a Web surface only `[SD: MI §12]` — no Tenant Management Desktop is defined.

## 2. Platform & packaging `[UD + SD historical anchor]`
**Current platform target: Tauri 2.0 desktop for Windows, macOS and Linux.** Packaging/distribution is OS-appropriate (for example Windows installers, macOS application/package distribution, Linux packages/bundles) and remains a Detailed Design/build-pipeline decision. Auto-update readiness, semantic versioning, minimum-supported-version and force-update policy are shared release-management concerns. Historical source text that emphasized Windows/.exe/.msi remains source history, not a current cross-platform limitation.

## 3. Authentication, session & context
Same Core Identity & Access system (LG-05): Clerk-backed login/session boundary with configured methods (F-03 §2), session/access-token validation, device registration, and risk-based adaptive rules. Desktop device identity is installation/device-bound according to platform capability. Tenant/Industry context resolution per F-01 §4 — explicit selection or deterministic surface binding; a Published Industry Desktop Instance is deterministically bound to its Tenant + Industry Context.

## 4. Authorization
RBAC (primary) + ABAC (complementary) evaluated **server-side** per F-03 §4; the desktop client renders only what the resolved permission set allows and never becomes the authorization source of truth. Offline capability never bypasses the entitlement chain: offline access is limited to data/actions already authorized in the last valid server session, per policy (§6).

## 5. Configuration & the reusable Experience model
Tenant-configurable per instance (no per-tenant codebase, LG-08): app name, logo, colors, theme, splash, navigation, menus, dashboard, widgets, enabled modules, notifications, content, feature visibility — served from the same Tenant Experience Configuration layer used by other experiences.

## 6. Offline & synchronization `[SD: single Synchronization Policy, F-01 §6]`
Offline mode only for previously-authenticated, authorized users. Encrypted secure local storage; local operation queue; automatic background sync on reconnect; conflict resolution per the one canonical Synchronization Policy shared with Mobile. All offline-queued operations are revalidated server-authoritatively on sync (F-03 §3). Local data is purged on tenant/device deregistration or governed remote-wipe instruction according to platform capability.

## 7. Notifications & integrations
In-app notification center backed by the Core notification engine; native OS notifications where the platform permits; delivery/read status reported to the Core engine (F-02 W-09). Device features such as printers, barcode/QR scanners or POS peripherals are accessed through governed device-capability adapters. First-party business API I/O uses the Core API platform (tRPC where appropriate); REST/OpenAPI is for external interoperability. Desktop never connects directly to the database or another tenant system.

## 8. Security
Secure local storage encrypted at rest; OS-protected credential/storage mechanisms for identity tokens where supported; session lock per policy; remote sign-out/device revocation from the Tenant Management App; audit events (login, sync, offline actions) reported to the audit fabric with tenant/context/device identity. Platform-specific hardening and certificate-pinning feasibility are Detailed Design concerns and must not be falsely generalized across all three desktop OSs.

## 9. Testing & acceptance requirements
Applicable test families: authentication/device registration; offline→sync round-trip integrity; entitlement enforcement on reconnect; tenant + industry-context isolation on shared devices; OS-specific packaging/update/rollback; notification delivery; applicable device-capability adapters. Acceptance must be defined per supported desktop experience and target OS rather than assuming a Windows-only installer model.

## 10. Dependency boundaries & deferrals
Depends on Core Identity (F-03), API platform (F-01 §7), Synchronization Policy (F-01 §6), Experience model (F-06 §1). **Selected framework: Tauri 2.0 across Windows/macOS/Linux.** Deferred to Architecture/Detailed Design: local persistence engine, OS-specific packaging/signing/notarization, update transport/configuration, native device adapters, detailed Clerk/Tauri integration, and exact offline conflict implementation.

## 11. Truth-revalidation qualification
Prior RR-01 resolution remains useful history, but its closure label is not standalone evidence. F-15 revalidation must verify the desktop WHAT/WHY/WHO requirements against the source corpus and current user direction; implementation mechanics remain later-phase work.
