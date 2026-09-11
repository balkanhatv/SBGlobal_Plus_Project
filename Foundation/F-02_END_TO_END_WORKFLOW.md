# F-02 — END-TO-END PLATFORM WORKFLOW
**Document ID:** F-02 · **Version:** 0.1 · **Status:** SPECIFIED · Cross-refs: F-01 (surfaces, entitlements), F-03 (authN/authZ), F-05 (AI), F-06 (experiences).

Lifecycle covered: Visitor → Public SaaS Website → Discovery → Pricing/Demo → Signup → Trial/Subscription → Tenant Creation → Primary Industry Selection → Optional Enabled Industries → Provisioning → Tenant Experience Configuration → Published Tenant Experience → User/Role Setup → Management System Enablement → Module/Feature Entitlements → Authentication → Context Resolution → RBAC+ABAC Authorization → Business Operations → Workflow/Approval → Notifications → Reporting/Analytics → AI/RAG/Automation → Billing/Licensing → Audit → Backup/Recovery → Operations.

Format per step: **Actors · Trigger · Inputs · Outputs · Rules · Authorization · States · Audit.** All rules `[SD]` unless labelled.

---

## W-01 Visitor → Public SaaS Website
- **Actors:** anonymous visitor. **Trigger:** site visit. **Inputs:** none. **Outputs:** rendered marketing pages, Trust Center, legal pages, cookie consent state.
- **Rules:** BR-W01-1: on first visit → show Cookie Consent Banner; condition: no stored consent; action: block non-essential trackers until consent recorded (feeds compliance, F-03 §6). BR-W01-2: announcement bar renders per schedule/priority; expired announcements auto-hide.
- **Authorization:** public; no platform login button on public site (LG-11). **States:** session: anonymous → consented/declined. **Audit:** consent record (who/when/choice), analytics impressions.

## W-02 Industry/Solution Discovery → Pricing/Demo
- **Actors:** visitor; sales (for demo). **Trigger:** navigation to Industries/Solutions/Pricing. **Inputs:** industry interest, plan interest. **Outputs:** industry pages (9 suites), plan comparison, demo booking, or self-serve path.
- **Rules:** BR-W02-1 Dual CTA: both *Book Demo* and *Start Free / Self-Serve Signup* must be present (5-tier model, CR-01); condition: visitor selects Free/Starter → self-serve; Enterprise → sales-assisted; Pro/Premium → route resolved from the versioned commercial route policy (self-serve and/or sales-assisted). BR-W02-2: live chat/AI chatbot widget available site-wide.
- **States:** lead: none → demo_requested | signup_started. **Audit:** lead capture events.

## W-03 Signup → Trial/Subscription
- **Actors:** prospective Tenant Owner; billing service. **Trigger:** signup form submit or sales-assisted provisioning. **Inputs:** organization info, owner identity, chosen plan, billing details (paid tiers). **Outputs:** platform account (Tenant Owner identity), subscription record.
- **Rules:** BR-W03-1: email/mobile verification required before tenant creation. BR-W03-2: trial creation per plan policy; lifecycle per BR-SUB-01 (F-01 §5). BR-W03-3: consent + DPA acceptance recorded for paid tiers.
- **Authorization:** identity created in the one Core Identity system (LG-05). **States:** subscription: none → Trial|Active. **Audit:** signup, verification, consent, subscription events.

## W-04 Tenant Creation → Industry Selection → Provisioning
- **Actors:** Tenant Owner; Super Admin (sales-assisted/exceptions); provisioning service. **Trigger:** verified signup. **Inputs:** tenant name, region/residency selection, **Primary Industry (exactly one)**, optional Enabled Industries (per plan). **Outputs:** provisioned tenant: isolated data scope, default roles seeded, industry contexts bound, subdomain issued, Tenant Management Application access.
- **Rules:** BR-W04-1: exactly one Primary Industry required; condition: none/multiple selected → block with selection prompt. BR-W04-2: optional industries only if plan/license permits (entitlement chain). BR-W04-3: residency selection binds storage region where architecture permits `[SD: S2.4]`. BR-W04-4 `[AC — provisioning idempotency; D-DECISIONS AC-02]`: provisioning is idempotent and resumable; partial failure never leaves a half-visible tenant.
- **States:** tenant: pending → provisioning → active. **Audit:** creation, industry binding, region binding, seed application.

## W-05 Tenant Experience Configuration → Published Tenant Experience
- **Actors:** Tenant Owner/Admin. **Trigger:** first login to Tenant Management App. **Inputs:** branding, domain/subdomain, theme, navigation, content, enabled public modules, languages. **Outputs:** Published Tenant Experience Instances per surface (F-06 3-layer model).
- **Rules:** BR-W05-1: configuration only — never a per-tenant codebase (LG-08). BR-W05-2: publish is an explicit action; condition: draft config valid → action: versioned publish with rollback point.
- **States:** experience: draft → published → republished (versioned). **Audit:** config change history + publish events.

## W-06 User/Role Setup → MS Enablement → Module Entitlements
- **Actors:** Tenant Admin. **Trigger:** onboarding or ongoing administration. **Inputs:** users, role assignments, branch/department structure, MS/module toggles. **Outputs:** operating org structure with least-privilege roles.
- **Rules:** BR-W06-1: role assignment only from roles the plan/industry allows. BR-W06-2: enabling an MS requires its industry licensed (chain, F-01 §5). BR-W06-3: default role seeds applied per industry (F-04 §6); Tenant Admin may extend within RBAC governance.
- **States:** user: invited → active → suspended → deactivated. **Audit:** all identity/role/entitlement changes (identity & authorization audit, F-03).

## W-07 Authentication → Context Resolution → Authorization
- **Actors:** any user; identity service. **Trigger:** login on any surface. **Inputs:** credentials/factor per configured method (F-03 §2). **Outputs:** session + JWT/refresh token + resolved context.
- **Rules:** BR-W07-1 validation chain: Authentication → Tenant Validation → Subscription Validation → License Validation → Device Registration Validation → Role & Permission Validation → JWT → API Authorization; any failure denies with audited reason. BR-W07-2: multi-tenant/multi-industry ambiguity resolved only by explicit selection or deterministic surface binding (F-01 §4). BR-W07-3: risk-based adaptive rules (unknown device, impossible travel, geo/time restriction, concurrent sessions) may require step-up MFA.
- **States:** session: unauthenticated → authenticated → context-resolved → active → expired/revoked. **Audit:** login success/failure, risk events, step-ups, token issuance.

## W-08 Business Operations → Workflow/Approval
- **Actors:** tenant business users; workflow engine. **Trigger:** domain transactions (per Industry Suite, F-07…F-09). **Inputs:** transaction data. **Outputs:** domain records, workflow instances.
- **Rules:** BR-W08-1: every business operation passes the server-authoritative chain (BR-W07-1) — offline clients queue locally and sync under the Synchronization Policy (F-01 §6), revalidated server-side on sync. BR-W08-2: approvals per configured workflow definitions; condition: approval required → action: route to approver role, hold state until decision.
- **States:** generic workflow instance: draft → submitted → in-review → approved|rejected → executed → closed (industry workflows specialize this, e.g. Healthcare sample lifecycle F-07 §1). **Audit:** every action creates an audit log entry.

## W-09 Notifications
- **Actors:** notification engine. **Trigger:** domain/workflow events, schedules. **Inputs:** template + variables + recipient + channel policy. **Outputs:** delivered messages (Email/SMS/WhatsApp/Push/In-App).
- **Rules:** BR-W09-1 failover: provider failure → retry per policy → failover provider by priority → DLQ after exhaustion, failure logged. BR-W09-2: templates/providers configurable without code (F-01 §6).
- **States:** message: queued → sending → delivered|failed → retried|dead-lettered. **Audit:** delivery status, failure logs, usage logs.

## W-10 Reporting/Analytics · W-11 AI/RAG/Automation
- **W-10:** dashboards & reports per role/tenant/industry context; tenant-isolated analytics; export CSV/Excel/PDF; scheduled reports. Authorization: RBAC+ABAC scoped. Audit: report access/export events.
- **W-11:** AI assistance under full context guardrails — AI always obeys Tenant, Industry, Role, Permission, Subscription, License, Security, Compliance, Residency, AI Policy (F-05). States: AI job: requested → routed (model routing) → executed → delivered|fallback|failed. Audit: every AI operation logged with usage/cost metering.

## W-12 Billing/Licensing (recurring)
- **Actors:** billing engine, Tenant Owner, Super Admin. **Trigger:** billing cycle, plan changes, usage thresholds. **Rules:** BR-SUB-01…04 (F-01 §5); invoices/receipts/credit-debit notes per configured templates; commission/payout runs per affiliate engine policy. **Audit:** immutable financial event log.

## W-13 Audit · W-14 Backup/Recovery · W-15 Operations
- **W-13:** platform-wide audit fabric — identity, authorization, configuration, data changes (created/updated/deleted by/at), financial, AI, API, security events; retention per policy; audit data is append-only `[SD: S2.2 §46, S2.4]`.
- **W-14:** automatic + manual backups (database/files/media/configuration), scheduled, verified, restore-tested; tenant-aware where applicable; RPO/RTO defined per plan at Architecture phase; recovery logs kept.
- **W-15:** monitoring (system health, queues, scheduler, failed jobs, errors, performance, API/AI/communication usage), alerts, maintenance windows, support workflow with severity/SLA classification `[SD: S2.2 §36, §56]`.

---

**Deferred to Detailed Design (§26B):** endpoint-level API contracts per step; screen-level UX; per-industry workflow state machines beyond those specified in F-07…F-09.
