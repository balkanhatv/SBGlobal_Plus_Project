# F-03 — IDENTITY, SECURITY & COMPLIANCE FOUNDATION
**Document ID:** F-03 · **Version:** 0.2 · **Status:** SPECIFIED · Cross-refs: F-01 (entitlement chain), F-02 (W-07), F-04 (audit data), F-07…F-09 (industry roles). **Canonical technology alignment:** User-directed Clerk identity boundary; no change to RawSourceCorpus.

---

## 1. One Core Identity & Access System `[SD: MI §13; S1 §5]` — ACTIVE

Login Entry Point ≠ Application Surface ≠ Identity System. Every entry point (Platform, Tenant Management, Industry, Staff, Student, Customer, Patient, Mobile, Desktop, API) uses the **single** Core Identity & Access system. Never separate authentication engines per surface/industry/tenant (LG-05). Centralized: users, credentials/identity links, Clerk-managed sessions and access tokens, device identity & registration, RBAC, policies, digital identity/signature providers, identity & authorization audit. **Clerk is the canonical managed identity provider for the approved stack; the Core Identity module owns the platform boundary and remains provider-isolated.**

## 2. Authentication Framework `[SD: S1 §5]`

Pluggable, configurable per Tenant, Role, Device, Platform, Subscription Plan — providers enabled/disabled by configuration only. The approved platform baseline uses a **Clerk-backed authentication boundary**; provider-specific capabilities are exposed through the Core Identity contract rather than allowing application surfaces to couple directly to an IdP.

- **Methods:** Username/Email/Mobile+Password · Mobile OTP · Email OTP · Google · Microsoft Entra ID · Apple · Passkeys (FIDO2/WebAuthn) · Authenticator TOTP · Hardware keys · Biometric (face/fingerprint/iris) · SSO · LDAP/AD · OAuth 2.0 · OIDC · SAML 2.0 · API tokens & service accounts · QR login · Magic link · Passwordless — subject to configured provider/deployment support and tenant policy.
- **Risk-based adaptive:** trusted devices, unknown-device detection, impossible travel, geo-fencing/restriction, login time restrictions, concurrent session control, MFA, step-up.
- **Digital identity/signature:** Aadhaar eSign · DigiLocker · USB eToken · DSC · PKI · government identity providers · enterprise PKI · organization certificates.
- Policies configurable per Tenant, User, Group, Department, Organization, Device, Platform, Module, Location, Plan.

## 3. Server-Authoritative Validation Chain `[SD: MI §13; S1 §4]`

Every business operation requires: **User Authentication · Tenant Validation · Subscription Validation · License Validation · Device Registration Validation · Role & Permission Validation · Clerk Session/Access-Token Validation · API Authorization** — enforcing the entitlement chain (F-01 §5) at every step. **API keys/service-account credentials are a separate machine-identity path and are scoped independently from human Clerk sessions.** Clients never access protected resources directly. Offline mode only for previously-authenticated, authorized users under the Synchronization Policy; all offline-queued operations are revalidated server-side on sync.

## 4. Authorization Model — RBAC (PRIMARY) + ABAC (COMPLEMENTARY) `[SD: MI §13]` — ACTIVE

- **RBAC:** roles, permissions, groups — the primary model. Permission verb set baseline `[SD: S2.9 P07]`: Dashboard, Create, View, Edit, Delete, Approve, Reject, Export, Print, Share, Import, Audit, Restore, Archive, Settings, Configuration — applied per module (target 1000+ permissions at Architecture phase).
- **ABAC:** complementary contextual policy layer over governed attributes: Tenant, Industry Context, Department, Branch, Location, Device, Time, Subscription, License, Data Sensitivity, Risk Context. ABAC never replaces RBAC; lives inside the one Core Identity system; server-authoritative; auditable; policy-driven.
- **Canonical decision:** `RBAC permissions + Applicable ABAC policies + Tenant/Industry Context + Security constraints + Subscription/License constraints → Final Authorization Decision`.
- **Access context resolution (post-login) `[SD: MI §14]`:** resolve User · Identity · Session · Platform/Tenant/Industry Context · Branch · Department · Role · Permissions · Subscription · License · Device · Location · Module · Policy → determine Application, Dashboard, Route, Menu, Management System, Module, Action. Ambiguity resolved only explicitly/deterministically.

**Example role→permission mapping shape (Foundation-level evidence; full matrix = Architecture phase):**

| Role (seed) | Scope | Illustrative grants |
|---|---|---|
| Super Admin | Platform | all verbs on all platform modules; no tenant business data access without recorded justification `[AC — D-DECISIONS AC-03]` |
| Tenant Owner | Tenant | all verbs on tenant modules within entitlements; billing & plan management |
| Branch Manager | Branch | View/Edit/Approve on branch-scoped modules; no cross-branch access (ABAC: Branch attribute) |
| Billing Executive | Module | Create/View/Edit on billing; Approve denied (approval routes to Accountant/Owner) |
| API Client | Tenant/API | endpoint-scoped grants; rate-limited; IP-whitelisting optional |

## 5. Security, Trust & Compliance Framework `[SD: S1 §6; S2.3 §4]` — ACTIVE

Zero Trust · Security-First · Privacy-First · server-controlled access · Everything Encrypted (at rest, in transit, field-level PII where applicable).

1. **Secrets & Key Management:** central Key Vault/HSM-backed storage; automatic key & credential rotation; **per-tenant key isolation** (no cross-tenant key reuse); encrypted secrets store for API keys, third-party keys, DB credentials.
2. **API Threat Protection:** API gateway with rate limiting & quota (per-tenant and per-endpoint), WAF, DDoS protection, bot/abuse detection at the edge.
3. **Vulnerability & Incident Response:** scheduled penetration-testing cadence; responsible disclosure/bug bounty policy; formal Security Incident Response Plan; breach-notification SLA aligned to regulatory timelines.
4. **Data Residency & Sovereignty:** per-tenant/per-region storage selection where architecture permits; regional DB instance support; documented cross-border data-flow map.
5. **Application security controls `[SD: S2.3 §4]`:** OWASP Top 10, CSRF/XSS/SQLi protection, password hashing, AES-256 for sensitive data, HTTPS-only, secure headers, brute-force protection, session security, input validation, output escaping, secure uploads, **Clerk session/access-token and API-key security**, IP whitelisting.
6. **Location/device/session security attributes** and **Trust Services** (digital identity/signature/certificate validation, timestamp validation, OCSP/CRL, certificate transparency, audit evidence, non-repudiation).

## 6. Data Privacy & Regulatory Compliance `[SD: S1 §6.4; S2.2 §35]`

Alignment roadmap: **GDPR · India DPDP Act 2023 · HIPAA-readiness (Healthcare tenants) · SOC 2 Type II · ISO 27001.** Capabilities: consent management (capture/store/honor; feeds cookie banner), DPAs per tenant, right-to-access / right-to-erasure handling, data retention policies, access logs, audit/security/compliance reports.

**Named rules:**
- **BR-SEC-01 Erasure vs audit** `[AC — D-DECISIONS AC-04]`: Trigger: erasure request; condition: record subject to legal hold or mandatory retention (e.g., financial/audit) → action: pseudonymize PII fields, preserve non-personal audit skeleton, record erasure decision; otherwise hard-erase per policy.
- **BR-SEC-02 Breach notification** `[SD]`: Trigger: confirmed breach; condition: regulated data affected; action: execute incident response plan, notify per SLA/regulatory timeline, record full timeline in audit.
- **BR-SEC-03 Consent-gated processing** `[SD]`: Trigger: processing requiring consent; condition: no valid consent on file; action: block processing, prompt for consent, log the block.

## 7. Tenant Isolation `[SD: MI §20; S2.2 §6]` — mandatory dedicated testing requirement

Two axes, both explicitly tested, never an incidental outcome of other tests:
- **Inter-tenant:** Tenant A can never read/write Tenant B data (DB-level tenant keys, query scoping, storage scoping, API scoping, AI-context scoping).
- **Intra-tenant cross-Industry-Context:** ABC Tenant's Healthcare context data/systems stay separate from its Retail context unless explicitly shared via a governed Core capability.
Test families (Engineering Standards S2.3 §5): cross-tenant access prevention, resource ownership validation, permission enforcement, subscription restriction enforcement.

## 8. Identity & Data Standards `[SD: S2.4]`

UUID primary keys · Tenant ID / Branch ID / Department ID / Industry Vertical Suite reference on scoped entities · snake_case, plural tables · audit fields (Created/Updated/Deleted By + At) · soft delete · encrypted fields for sensitive data · access logging.

**Deferred to Architecture/Detailed Design:** full permission matrix per module; ABAC policy language & evaluation order; key-rotation schedules; per-plan session policies; SIEM integration; final Clerk/web/mobile/desktop SDK wiring details and token-lifecycle implementation contracts.
