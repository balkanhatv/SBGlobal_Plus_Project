# SBGlobal Plus — A-03 IDENTITY, SECURITY & ACCESS ARCHITECTURE
**Document ID:** A-03 · **Version:** 1.0 · **Status:** ARCHITECTURE BASELINE (CP-A1-001) · **Date:** 09-09-2026
**Traces to:** F-03 (identity, RBAC+ABAC, validation chain, security & compliance framework), F-11 (residency/risk), MI v2.5 §13 (RBAC-primary/ABAC-complementary) · **Decisions:** ADR-003, ADR-004 (→ A-12)

---

## 1. Identity Architecture (ADR-003)
**AuthN provider:** **Clerk** for the managed SaaS and self-hosted deployments, subject to Clerk availability and tenant/deployment policy. Clerk provides hosted identity, MFA, social/enterprise SSO and session management. Clerk is hidden behind the Core's **Identity module contract**: `verifyIdpToken() → PlatformPrincipal`; no module or experience ever talks to the IdP directly. This keeps the IdP integration isolated behind a replaceable contract while retaining Clerk as the approved platform authentication technology.

Identity domains: (a) **Platform identities** (operator staff), (b) **Tenant identities** (tenant staff/users), (c) **End-customer identities** per industry (patients, students, guests, citizens, donors…) — all one User model with membership records binding user→tenant→roles→OrgUnits; one human may hold memberships in many tenants.

## 2. Session & Token Flow
```
Login (Clerk) → Clerk session / access token
  → Core authentication boundary: validate Clerk token → load memberships
  → establish PLATFORM CONTEXT (userId, tenantId, orgUnitPath,
    roleIds, token/session version, aud per surface)
Request → L5 verifies Clerk session/token → kernel re-validates membership
  & tenant status (A-02 §3) → RequestContext
Revocation: Clerk session revocation plus platform token/session version
  invalidation (user/tenant) prevents continued access at validation time.
```
Mobile/desktop use the same Clerk authentication boundary with refresh/session handling through the Clerk SDK or approved platform integration; external API consumers use scoped API keys bound to a tenant + role set (never a human session).

## 3. Authorization — RBAC primary, ABAC complementary (ADR-004)
**PDP (policy decision point)** lives in the Core Authorization module; **PEPs (enforcement points)** are the kernel guard (every request), the workflow engine (transition guards), and the event/webhook dispatcher (subscription scope).

1. **RBAC (primary):** permissions are named capabilities (`ms.module.action`, e.g. `hlt.lis.sample.verify`); roles are permission sets defined at platform level and cloneable/customizable per tenant within entitlement limits; users hold roles per OrgUnit subtree.
2. **ABAC (complementary):** policies refine RBAC grants with attribute conditions — tenant attributes (industry, tier), resource attributes (ownership, OrgUnit, state, sensitivity class), subject attributes (department, clearance), environment (time, channel). ABAC can **narrow, never widen** an RBAC grant.
3. Decision order: entitlement gate (→ A-04) → RBAC permission present? → applicable ABAC policies all satisfied? → allow; any deny is final, logged with reason code.

## 4. Validation Chain (F-03) — architectural placement
`Schema validation (L5 DTO) → business rules (module service) → tenant configuration rules (Config module) → authorization (PDP) → workflow state guard (Workflow module)`. Each stage has a distinct error class and audit signature, so a rejection is attributable to the exact stage (F-02 audit-per-step requirement).

## 5. Security Zones & Boundaries
| Zone | Contents | Boundary controls |
|---|---|---|
| Public | Public site, docs, status | CDN/WAF, no tenant data |
| Experience | Next.js apps, React Native/Expo, Tauri 2.0 clients | AuthN required beyond login; no direct DB access |
| API edge | tRPC termination + REST interoperability endpoints where required | TLS 1.2+, rate limits, token verification, input validation |
| Core | Next.js 15 / Node.js 22 application + workers | Private network where deployed; egress allow-list (IdP, payment, AI, mail) |
| Data | PostgreSQL, object storage, backups | Private network; RLS; encryption at rest; no public endpoints |
| AI egress | AI Gateway → providers | Redaction/guardrails (→ A-07 §6); provider allow-list per tenant/residency |
Secrets: platform secrets in the VPS/deployment secret store; tenant-scoped integration credentials encrypted per-tenant (envelope encryption) in the Config module; never in code or logs. Transport: TLS everywhere, mTLS/private networking between application and data zone where supported. Data at rest: storage-level encryption + column-level encryption for designated sensitive classes (F-04 sensitivity taxonomy).

## 6. Platform-Operator Access & Compliance Boundaries
Operator access to tenant data is: role-gated (dedicated operator roles), purpose-bound (reason captured), time-boxed (elevation expires), fully audited (→ A-11 §4), and tenant-visible where the compliance regime requires disclosure. Compliance framework (F-03 §5–§8) maps to architecture as: per-industry compliance profiles activated with the industry (e.g. health-data handling for Healthcare, PCI-scope minimization by delegating card data to the payment gateway, public-sector audit retention), enforced via sensitivity classes (A-05 §7), residency pinning (A-02 §5) and audit retention policies (A-11 §4).

## 7. Deferred to Detailed Design
Full permission catalog (1000+ target, F-00 §6); role templates per industry; ABAC policy language/schema; API-key scope catalog; per-compliance-profile control-by-control test scenarios.
