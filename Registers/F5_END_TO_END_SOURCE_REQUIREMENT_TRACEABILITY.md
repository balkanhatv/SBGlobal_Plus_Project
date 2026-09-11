# FABLE 5 — END-TO-END SOURCE REQUIREMENT TRACEABILITY
**Date:** 2026-09-11 · **Status:** REMEDIATION EVIDENCE
**Scope:** all 2,962 child requirement IDs from the immutable-source child matrix.

This artifact does not claim every source row is an active DD requirement. It gives each source ID an explicit current chain/disposition. Source-history, superseded, and future Development/Test requirements are visibly separated from active DD requirements.

| Source Requirement ID | Requirement | Foundation/current owner | Architecture owner | ADR | DD/current disposition | Acceptance owner | Kind |
|---|---|---|---|---|---|---|---|
| S1-U002-R001 | Purpose & Consolidation Note | RawSourceCorpus | N/A | — | N/A — source/history | N/A | SOURCE_HISTORY |
| S1-U002-R002 | Architect's Gap Analysis — Additions, Replacements & Deletions | RawSourceCorpus | N/A | — | N/A — source/history | N/A | SOURCE_HISTORY |
| S1-U002-R003 | Target Vision | RawSourceCorpus | N/A | — | N/A — source/history | N/A | SOURCE_HISTORY |
| S1-U002-R004 | Core Principles | RawSourceCorpus | N/A | — | N/A — source/history | N/A | SOURCE_HISTORY |
| S1-U002-R005 | Platform Scope & Access Flow | RawSourceCorpus | N/A | — | N/A — source/history | N/A | SOURCE_HISTORY |
| S1-U002-R006 | Identity, Authentication & Authorization Framework | RawSourceCorpus | N/A | — | N/A — source/history | N/A | SOURCE_HISTORY |
| S1-U002-R007 | Security, Trust & Compliance Framework | RawSourceCorpus | N/A | — | N/A — source/history | N/A | SOURCE_HISTORY |
| S1-U002-R008 | Supported Core Industries | RawSourceCorpus | N/A | — | N/A — source/history | N/A | SOURCE_HISTORY |
| S1-U002-R009 | Super Admin Philosophy | RawSourceCorpus | N/A | — | N/A — source/history | N/A | SOURCE_HISTORY |
| S1-U002-R010 | Tenant Philosophy | RawSourceCorpus | N/A | — | N/A — source/history | N/A | SOURCE_HISTORY |
| S1-U002-R011 | Dynamic / Configuration Philosophy | RawSourceCorpus | N/A | — | N/A — source/history | N/A | SOURCE_HISTORY |
| S1-U002-R012 | Website, Landing Page & Marketing Layer | RawSourceCorpus | N/A | — | N/A — source/history | N/A | SOURCE_HISTORY |
| S1-U002-R013 | Branding & Visual Identity Direction | RawSourceCorpus | N/A | — | N/A — source/history | N/A | SOURCE_HISTORY |
| S1-U002-R014 | Company Information | RawSourceCorpus | N/A | — | N/A — source/history | N/A | SOURCE_HISTORY |
| S1-U002-R015 | Implementation Roadmap | RawSourceCorpus | N/A | — | N/A — source/history | N/A | SOURCE_HISTORY |
| S1-U002-R016 | Expected Outcome | RawSourceCorpus | N/A | — | N/A — source/history | N/A | SOURCE_HISTORY |
| S1-U005-R001 | # — Action — Recommendation — Why it's needed | F-03 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S1-U005-R002 | 1 — **ADD** — Data Privacy & Regulatory Compliance Framework (GDPR, India DPDP Act 2023, HIPAA-readiness for Healthcare tenants, SOC 2 Type II / ISO 27001 alignment, Consent Management, Data Processing Agreements) — The current draft says "Privacy First" as an adjective but has no dedicated compliance framework, consent tracking, or certification roadmap — a hard requirement for enterprise buyers and for any tenant operating in regulated industries (Healthcare, Government). | F-03 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S1-U005-R003 | 2 — **ADD** — Secrets & Key Management (centralized Key Vault / HSM, automatic key rotation, encrypted secrets store, per-tenant key isolation) — "Everything Encrypted" is listed as a principle, but there is no mechanism defined for how encryption keys and API/service secrets are generated, rotated, or isolated per tenant. Without this, "Encrypted" is just a slogan. | F-03 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S1-U005-R004 | 3 — **ADD** — API Threat Protection Layer (Rate Limiting, API Gateway, WAF, DDoS Protection, Bot/Abuse Protection) — The document defines API Authorization thoroughly but has no layer addressing volumetric/API abuse attacks — essential for a platform that is explicitly "API First" and exposes REST APIs + Webhooks to every tenant. | F-03 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S1-U005-R005 | 4 — **ADD** — Vulnerability & Incident Response Program (scheduled penetration testing, responsible disclosure / bug bounty policy, security incident response plan, breach notification SLA) — Zero Trust and Security-First are stated as goals, but there is no operational program to discover or respond to vulnerabilities — this is what enterprise security questionnaires actually check for. | F-03 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S1-U005-R006 | 5 — **ADD** — Data Residency & Sovereignty Controls (per-tenant/per-region data storage selection) — For a Multi-Tenant, Multi-Industry, global-facing SaaS, several prospective enterprise/government tenants will require contractual guarantees about which country/region their data is stored in. Not addressed in the current tenant isolation language. | F-03 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S1-U006-R001 | # — Action — Recommendation — Why it's needed | F-06/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S1-U006-R002 | 6 — **ADD** — Trust Center / Public Status Page + Compliance Badge section on homepage (SOC 2, ISO 27001, GDPR, uptime SLA badges), plus a Live Chat / AI Chatbot widget site-wide — The site plans a "Security showcase" section but nothing that proves it — enterprise buyers expect a live uptime/status page and visible certification badges before booking a demo. Self-serve visitors (see Recommendation #8) also need an immediate way to get answers instead of waiting on a sales callback. | F-06/F-01 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S1-U006-R003 | 7 — **ADD** — Legal & Compliance page set in sitemap (Terms of Service, Privacy Policy, Cookie Policy, SLA, Data Processing Agreement) + Cookie Consent Banner — The sitemap has Resources → Documentation/Blog/FAQ but no legal footer pages at all. This is both a compliance gap (tied to Security Recommendation #1) and a standard expectation for any SaaS homepage. | F-06/F-01 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S1-U006-R004 | 8 — **REPLACE** — Add a **self-serve signup / ROI calculator path** alongside the existing "Book Demo / Request Quote" CTA structure — Conflict identified: the Subscription plans explicitly include **Free** and **Starter** tiers, but every CTA in the current homepage/loader plan (Book Demo, Request Quote, Start Enterprise Journey) is enterprise-sales-gated. A Free/Starter tenant should be able to self-serve sign up without talking to sales — otherwise the pricing tier structure and the conversion funnel contradict each other. | F-06/F-01 | A-04 | ADR-007 | DD-04 | DD-17 COM family | MATERIAL_SHARED |
| S1-U006-R005 | 9 — **DELETE / CONSOLIDATE** — Remove the literal duplicated line under Tenant Philosophy ("Referral Rules Reward / Policies Payout Methods" appears twice) and collapse the 5+ separate restatements of "Automatic Background Synchronization" (Target Vision, Core Principles, Mobile Theme, Desktop Theme, Tenant Philosophy) into a single canonical **Synchronization Policy** referenced wherever needed — Improves readability and removes internal duplication/conflict risk when this becomes structured documentation — duplicated bullets create maintenance drift when one copy is updated and the others are not. | F-06/F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S1-U007-R001 | AI Ready · AI Extensible · AI Powered | F-00/F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S1-U007-R002 | API First · Event Driven · Configuration & Metadata Driven | F-00/F-01 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S1-U007-R003 | Modular · Plugin Ready | F-00/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S1-U007-R004 | Cloud Native · Hybrid Cloud Ready | F-00/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S1-U007-R005 | Cross Platform — Web Ready, Mobile Ready, Windows Desktop Ready (native `.exe` / `.msi`) | F-00/F-01 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S1-U007-R006 | Offline First with a single **Synchronization Policy** governing Automatic Background Sync, Real-Time Sync and Conflict Resolution across Web, Mobile and Desktop | F-00/F-01 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S1-U007-R007 | Security First, Privacy First, Zero Trust Ready (now backed by a dedicated Compliance Framework 🆕 — see §6.4) | F-00/F-01 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S1-U007-R008 | Authentication First, Authorization First, Identity Driven Security, Server Controlled Access | F-00/F-01 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S1-U007-R009 | License & Subscription Controlled, Long-Term Maintainable (target: 20–25 years without developer dependency for business-rule changes) | F-00/F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S1-U007-R010 | Affiliate Ready, Referral Ready, Commission Engine Ready, Incentive Management Ready | F-00/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S1-U014-R001 | Centralized Key Vault / HSM-backed key storage | F-03 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S1-U014-R002 | Automatic key & credential rotation | F-03 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S1-U014-R003 | Per-tenant key isolation (no cross-tenant key reuse) | F-03 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S1-U014-R004 | Encrypted secrets store for API keys, third-party service keys, database credentials | F-03 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S1-U015-R001 | Compliance alignment roadmap: GDPR, India's Digital Personal Data Protection (DPDP) Act 2023, HIPAA-readiness for Healthcare-vertical tenants, SOC 2 Type II, ISO 27001 | F-03/F-04 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S1-U015-R002 | Consent Management (capture, store, and honor user consent — feeds the website Cookie Consent Banner, see §11.4) | F-03/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S1-U015-R003 | Data Processing Agreements (DPA) available per tenant | F-03/F-04 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S1-U015-R004 | Right-to-access / right-to-erasure request handling | F-03/F-04 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S1-U016-R001 | API Gateway with Rate Limiting and quota enforcement | F-03 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S1-U016-R002 | Web Application Firewall (WAF) | F-03 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S1-U016-R003 | DDoS Protection | F-03 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S1-U016-R004 | Bot / abuse detection at the API edge | F-03 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S1-U017-R001 | Scheduled penetration testing cadence | F-03 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S1-U017-R002 | Responsible disclosure / bug bounty policy | F-03 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S1-U017-R003 | Formal Security Incident Response Plan | F-03 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S1-U017-R004 | Breach notification SLA (aligned with regulatory timelines under §6.4) | F-03 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S1-U018-R001 | Per-tenant / per-region data storage selection where architecture permits | F-11 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S1-U018-R002 | Documented data-flow map for cross-border transfers | F-11 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S1-U021-R001 | Each Vertical Industry Suite shall define a focused set of **Enterprise-Critical Management Systems** that collectively establish the industry's operational foundation and represent the minimum complete enterprise operational capability required for that industry. | F-07/F-08/F-09/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S1-U021-R002 | As an architectural governance principle, each Industry Suite shall normally consist of **2–8 foundational Management Systems**. A Management System represents a major operational domain of the industry rather than an individual feature or module. This range serves as a governance guideline to encourage architectural simplicity while ensuring complete enterprise coverage. | F-07/F-08/F-09/F-13 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S1-U021-R003 | Illustrative examples include (but are not limited to): | F-07/F-08/F-09/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S1-U021-R004 | Vertical Industry Suite — Typical Foundational Management Systems | F-07/F-08/F-09/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S1-U021-R005 | **Healthcare** — Hospital Management System (HMS), Laboratory Information System (LIS/Pathology), Radiology Information System (RIS), Pharmacy Management System, Clinic Management System | F-07/F-08/F-09/F-13 | A-09 + A-02/A-03/A-05/A-06/A-07/A-08 | ADR-002/004/005/006/008/010/012 | DD-13 + HLT-HMS canonical industry DD + DD-21/DD-22/DD-23/DD-24/DD-25 | HLT-HMS-T001…T014 + applicable KPI T01/T02 | MATERIAL_MS |
| S1-U021-R006 | **Education** — School Management System (SMS), College & University Management System, Coaching & Training Management System, Learning Management System (LMS), Examination Management System | F-07/F-08/F-09/F-13 | A-09 + A-02/A-03/A-05/A-06/A-07/A-08 | ADR-002/004/005/006/008/010/012 | DD-13 + EDU-SMS canonical industry DD + DD-21/DD-22/DD-23/DD-24/DD-25 | EDU-SMS-T001…T014 + applicable KPI T01/T02 | MATERIAL_MS |
| S1-U021-R007 | **eCommerce & Retail** — Retail Store Management System, Point of Sale (POS) Management System, Inventory & Warehouse Management System, Order Management System (OMS), Marketplace Management System | F-07/F-08/F-09/F-13 | A-09 + A-02/A-03/A-05/A-06/A-07/A-08 | ADR-002/004/005/006/008/010/012 | DD-13 + RTL-RSM canonical industry DD + DD-21/DD-22/DD-23/DD-24/DD-25 | RTL-RSM-T001…T014 + applicable KPI T01/T02 | MATERIAL_MS |
| S1-U021-R008 | **Manufacturing** — Production Management System, Inventory & Warehouse Management System, Quality Management System (QMS), Procurement Management System, Maintenance Management System | F-07/F-08/F-09/F-13 | A-09 + A-02/A-03/A-05/A-06/A-07/A-08 | ADR-002/004/005/006/008/010/012 | DD-13 + MFG-PMS canonical industry DD + DD-21/DD-22/DD-23/DD-24/DD-25 | MFG-PMS-T001…T014 + applicable KPI T01/T02 | MATERIAL_MS |
| S1-U021-R009 | **Hospitality** — Hotel Management System, Restaurant Management System, Banquet & Event Management System, Reservation & Booking Management System | F-07/F-08/F-09/F-13 | A-09 + A-02/A-03/A-05/A-06/A-07/A-08 | ADR-002/004/005/006/008/010/012 | DD-13 + HSP-HMS canonical industry DD + DD-21/DD-22/DD-23/DD-24/DD-25 | HSP-HMS-T001…T014 + applicable KPI T01/T02 | MATERIAL_MS |
| S1-U021-R010 | **NGO / Temple / Trust** — Donor Management System, Donation & Fund Management System, Temple Administration Management System, Membership & Volunteer Management System | F-07/F-08/F-09/F-13 | A-09 + A-02/A-03/A-05/A-06/A-07/A-08 | ADR-002/004/005/006/008/010/012 | DD-13 + NGO-DMS canonical industry DD + DD-21/DD-22/DD-23/DD-24/DD-25 | NGO-DMS-T001…T014 + applicable KPI T01/T02 | MATERIAL_MS |
| S1-U021-R011 | **Security & Facility Management** — Security Guard Management System, Patrol Management System, Visitor Management System, Facility Maintenance Management System | F-07/F-08/F-09/F-13 | A-09 + A-02/A-03/A-05/A-06/A-07/A-08 | ADR-002/004/005/006/008/010/012 | DD-13 + MFG-MMS canonical industry DD + DD-21/DD-22/DD-23/DD-24/DD-25 | MFG-MMS-T001…T014 + applicable KPI T01/T02 | MATERIAL_MS |
| S1-U021-R012 | **Professional Services** — CRM Management System, Project Management System, Service Delivery Management System, Resource & Timesheet Management System, PG/VG Studio Management System (PG-Photography VG-Videography) | F-07/F-08/F-09/F-13 | A-09 + A-02/A-03/A-05/A-06/A-07/A-08 | ADR-002/004/005/006/008/010/012 | DD-13 + PSV-CRM canonical industry DD + DD-21/DD-22/DD-23/DD-24/DD-25 | PSV-CRM-T001…T014 + applicable KPI T01/T02 | MATERIAL_MS |
| S1-U021-R013 | **Government & Public Sector** — Citizen Service Management System, Case & File Management System, Permit & License Management System, Revenue & Tax Management System | F-07/F-08/F-09/F-13 | A-09 + A-02/A-03/A-05/A-06/A-07/A-08 | ADR-002/004/005/006/008/010/012 | DD-13 + GOV-CSM canonical industry DD + DD-21/DD-22/DD-23/DD-24/DD-25 | GOV-CSM-T001…T014 + applicable KPI T01/T02 | MATERIAL_MS |
| S1-U021-R014 | The foundational Management Systems shall be selected based on: | F-07/F-08/F-09/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S1-U021-R015 | Business criticality | F-07/F-08/F-09/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S1-U021-R016 | Daily operational usage | F-07/F-08/F-09/F-13 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S1-U021-R017 | Enterprise-wide applicability | F-07/F-08/F-09/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S1-U021-R018 | Functional dependency | F-07/F-08/F-09/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S1-U021-R019 | Strategic business value | F-07/F-08/F-09/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S1-U021-R020 | Regulatory and compliance requirements | F-07/F-08/F-09/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S1-U021-R021 | Long-term architectural sustainability | F-07/F-08/F-09/F-13 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S1-U021-R022 | Their ability to collectively represent the complete operational foundation of the industry | F-07/F-08/F-09/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S1-U021-R023 | The foundational Management Systems shall maintain a strict separation between **Core Platform capabilities** and **Industry-Specific functionality**. | F-07/F-08/F-09/F-13 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S1-U021-R024 | Any capability that is reusable across multiple industries—including Identity & Access Management, Workflow Engine, Notifications, Document Management, Reporting, AI Services, Audit, Configuration, Metadata, APIs, Integration, Automation, Analytics, Billing, and other shared services—shall reside within the **Core Platform** and be consumed by Industry Suites through configuration, metadata, APIs, events, plugins, workflows, or other shared platform capabilities rather than being reimplemented. | F-07/F-08/F-09/F-13 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S1-U021-R025 | Any additional industry capabilities beyond the foundational Management Systems shall be implemented as **optional, modular, configurable, extensible, or plugin-based Management Systems** within the respective Industry Suite without affecting the Core Platform Architecture. | F-07/F-08/F-09/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S1-U021-R026 | Where exceptional business, regulatory, or operational requirements justify additional foundational Management Systems beyond the recommended governance range, such exceptions shall require formal approval through the Enterprise Architecture Governance process, supported by documented business justification, architectural impact assessment, dependency analysis, and long-term maintainability evaluation. | F-07/F-08/F-09/F-13 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S1-U021-R027 | Each foundational Management System shall itself be designed as a complete enterprise-grade business domain, containing all required modules, workflows, business rules, master data, transactional processes, reporting, analytics, integrations, AI capabilities, security, compliance, and lifecycle management necessary to operate independently as a mature Enterprise Management System, while remaining fully integrated with the SBGlobal Plus Core Platform. | F-07/F-08/F-09/F-13 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S1-U026-R001 | SBGlobal Plus logo appears | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S1-U026-R002 | Digital core particle animation | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S1-U026-R003 | AI network / data-flow animation | F-06 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S1-U026-R004 | Platform layers reveal: Enterprise Core → AI Engine → API Layer → Web → Mobile → Desktop | F-06 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S1-U026-R005 | Smooth transition to homepage | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S1-U037-R001 | Term — Meaning | RawSourceCorpus | N/A | — | N/A — source/history | N/A | SOURCE_HISTORY |
| S1-U037-R002 | RBAC — Role-Based Access Control | RawSourceCorpus | N/A | — | N/A — source/history | N/A | SOURCE_HISTORY |
| S1-U037-R003 | JWT — JSON Web Token | RawSourceCorpus | N/A | — | N/A — source/history | N/A | SOURCE_HISTORY |
| S1-U037-R004 | MFA — Multi-Factor Authentication | RawSourceCorpus | N/A | — | N/A — source/history | N/A | SOURCE_HISTORY |
| S1-U037-R005 | SSO — Single Sign-On | RawSourceCorpus | N/A | — | N/A — source/history | N/A | SOURCE_HISTORY |
| S1-U037-R006 | OIDC — OpenID Connect | RawSourceCorpus | N/A | — | N/A — source/history | N/A | SOURCE_HISTORY |
| S1-U037-R007 | SAML — Security Assertion Markup Language | RawSourceCorpus | N/A | — | N/A — source/history | N/A | SOURCE_HISTORY |
| S1-U037-R008 | FIDO2 / WebAuthn — Fast Identity Online 2 / Web Authentication (passkey standard) | RawSourceCorpus | N/A | — | N/A — source/history | N/A | SOURCE_HISTORY |
| S1-U037-R009 | TOTP — Time-based One-Time Password | RawSourceCorpus | N/A | — | N/A — source/history | N/A | SOURCE_HISTORY |
| S1-U037-R010 | PKI — Public Key Infrastructure | RawSourceCorpus | N/A | — | N/A — source/history | N/A | SOURCE_HISTORY |
| S1-U037-R011 | DSC — Digital Signature Certificate | RawSourceCorpus | N/A | — | N/A — source/history | N/A | SOURCE_HISTORY |
| S1-U037-R012 | OCSP / CRL — Online Certificate Status Protocol / Certificate Revocation List | RawSourceCorpus | N/A | — | N/A — source/history | N/A | SOURCE_HISTORY |
| S1-U037-R013 | HSM — Hardware Security Module | RawSourceCorpus | N/A | — | N/A — source/history | N/A | SOURCE_HISTORY |
| S1-U037-R014 | WAF — Web Application Firewall | RawSourceCorpus | N/A | — | N/A — source/history | N/A | SOURCE_HISTORY |
| S1-U037-R015 | DDoS — Distributed Denial of Service | RawSourceCorpus | N/A | — | N/A — source/history | N/A | SOURCE_HISTORY |
| S1-U037-R016 | GDPR — General Data Protection Regulation (EU) | RawSourceCorpus | N/A | — | N/A — source/history | N/A | SOURCE_HISTORY |
| S1-U037-R017 | DPDP Act — Digital Personal Data Protection Act, 2023 (India) | RawSourceCorpus | N/A | — | N/A — source/history | N/A | SOURCE_HISTORY |
| S1-U037-R018 | HIPAA — Health Insurance Portability and Accountability Act (US) | RawSourceCorpus | N/A | — | N/A — source/history | N/A | SOURCE_HISTORY |
| S1-U037-R019 | SOC 2 — System and Organization Controls 2 (audit standard) | RawSourceCorpus | N/A | — | N/A — source/history | N/A | SOURCE_HISTORY |
| S1-U037-R020 | ISO 27001 — International standard for information security management | RawSourceCorpus | N/A | — | N/A — source/history | N/A | SOURCE_HISTORY |
| S1-U037-R021 | DPA — Data Processing Agreement | RawSourceCorpus | N/A | — | N/A — source/history | N/A | SOURCE_HISTORY |
| S1-U037-R022 | SLA — Service Level Agreement | RawSourceCorpus | N/A | — | N/A — source/history | N/A | SOURCE_HISTORY |
| S1-U037-R023 | PII — Personally Identifiable Information | RawSourceCorpus | N/A | — | N/A — source/history | N/A | SOURCE_HISTORY |
| S1-U037-R024 | CMS — Content Management System | RawSourceCorpus | N/A | — | N/A — source/history | N/A | SOURCE_HISTORY |
| S1-U037-R025 | CI/CD — Continuous Integration / Continuous Deployment | RawSourceCorpus | N/A | — | N/A — source/history | N/A | SOURCE_HISTORY |
| S2.1-U003-R001 | Development shall always follow this order: | Governing/MASTER_INSTRUCTION_v2_5.md | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.1-U003-R002 | User Explicit Instructions (Current Task) | Governing/MASTER_INSTRUCTION_v2_5.md | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.1-U003-R003 | SBGlobal Plus Master Development Instruction | Governing/MASTER_INSTRUCTION_v2_5.md | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.1-U003-R004 | SBGlobal Plus Production Product Specification / Business Requirement | Governing/MASTER_INSTRUCTION_v2_5.md | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.1-U003-R005 | Engineering Standards | Governing/MASTER_INSTRUCTION_v2_5.md | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.1-U003-R006 | Approved Phase Specifications | Governing/MASTER_INSTRUCTION_v2_5.md | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.1-U003-R007 | Higher-priority documents always override lower-priority documents. | Governing/MASTER_INSTRUCTION_v2_5.md | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.1-U013-R001 | When development resumes in a new conversation or after context loss, AI shall verify: | Governing/MASTER_INSTRUCTION_v2_5.md | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.1-U013-R002 | Actual Source Code is authoritative. | Governing/MASTER_INSTRUCTION_v2_5.md | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.1-U013-R003 | Update documentation to match. | Governing/MASTER_INSTRUCTION_v2_5.md | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.1-U013-R004 | Continue from the verified implementation. | Governing/MASTER_INSTRUCTION_v2_5.md | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.1-U013-R005 | Completed work shall never be recreated unnecessarily. | Governing/MASTER_INSTRUCTION_v2_5.md | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.1-U017-R001 | The default deployment method shall remain simple and suitable for cPanel, shared hosting and single-server VPS deployments. | F-01/A-10 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.1-U017-R002 | Project Download / Build | F-01/A-10 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.1-U017-R003 | Upload Project to Server | F-01/A-10 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.1-U017-R004 | Create Database | F-01/A-10 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.1-U017-R005 | Import Database (or Fresh Install) | F-01/A-10 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.1-U017-R006 | Configure .env | F-01/A-10 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.1-U017-R007 | Enter Database Credentials | F-01/A-10 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.1-U017-R008 | Run Migration / Seeder (if required) | F-01/A-10 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.1-U017-R009 | Create Storage Link | F-01/A-10 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.1-U017-R010 | Clear & Optimize Cache | F-01/A-10 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.1-U017-R011 | Project Website Live | F-01/A-10 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.1-U017-R012 | shall remain OPTIONAL and shall never become mandatory for standard deployment. | F-01/A-10 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.1-U017-R013 | The platform shall remain fully functional without implementing these optional enterprise features. | F-01/A-10 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.1-U032-R001 | The following repositories are approved as architecture, workflow and best-practice references only. | F-01/A-00/A-01/A-10 | N/A — superseded | UD-TECH-01 | N/A — superseded active interpretation | N/A | SUPERSEDED |
| S2.1-U032-R002 | AI shall NEVER: | F-01/A-00/A-01/A-10 | N/A — superseded | UD-TECH-01 | N/A — superseded active interpretation | N/A | SUPERSEDED |
| S2.1-U032-R003 | AI shall use these references only for inspiration on architecture, workflow, feature ideas and best practices. All project code shall remain freshly written and original. | F-01/A-00/A-01/A-10 | N/A — superseded | UD-TECH-01 | N/A — superseded active interpretation | N/A | SUPERSEDED |
| S2.1-U032-R004 | Purpose — Repository — Use For | F-01/A-00/A-01/A-10 | N/A — superseded | UD-TECH-01 | N/A — superseded active interpretation | N/A | SUPERSEDED |
| S2.1-U032-R005 | Laboratory Information System — OpenELIS Global — https://github.com/DIGI-UW/OpenELIS-Global-2 — Patient workflow, sample lifecycle, laboratory workflow, result management, reporting concepts | F-01/A-00/A-01/A-10 | N/A — superseded | UD-TECH-01 | N/A — superseded active interpretation | N/A | SUPERSEDED |
| S2.1-U032-R006 | Multi-Tenant Architecture — https://github.com/michaelnabil230/laravel-multi-tenancy — Tenant isolation, multiple labs, secure data separation | F-01/A-00/A-01/A-10 | N/A — superseded | UD-TECH-01 | N/A — superseded active interpretation | N/A | SUPERSEDED |
| S2.1-U032-R007 | Admin Dashboard — Filament — https://github.com/filamentphp/filament — Super Admin, Lab Admin, CRUD, analytics, settings | F-01/A-00/A-01/A-10 | N/A — superseded | UD-TECH-01 | N/A — superseded active interpretation | N/A | SUPERSEDED |
| S2.1-U032-R008 | SaaS Foundation — https://github.com/mohammedelkarsh/laravel-tenant-kit — SaaS foundation patterns | F-01/A-00/A-01/A-10 | N/A — superseded | UD-TECH-01 | N/A — superseded active interpretation | N/A | SUPERSEDED |
| S2.1-U032-R009 | PDF Generation — https://github.com/barryvdh/laravel-dompdf — PDF report generation | F-01/A-00/A-01/A-10 | N/A — superseded | UD-TECH-01 | N/A — superseded active interpretation | N/A | SUPERSEDED |
| S2.1-U032-R010 | QR Codes — https://github.com/SimpleSoftwareIO/simple-qrcode — QR generation and verification | F-01/A-00/A-01/A-10 | N/A — superseded | UD-TECH-01 | N/A — superseded active interpretation | N/A | SUPERSEDED |
| S2.1-U032-R011 | Inventory — https://github.com/akaunting/akaunting — Inventory and accounting concepts | F-01/A-00/A-01/A-10 | N/A — superseded | UD-TECH-01 | N/A — superseded active interpretation | N/A | SUPERSEDED |
| S2.1-U033-R001 | Development shall proceed through the following phases in order. Each phase shall follow the Completion Policy (Section 16) before the next phase begins, unless the user has explicitly instructed continuous/autonomous progress through multiple phases. | Governing/MASTER_INSTRUCTION_v2_5.md | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.1-U033-R002 | Project Foundation | Governing/MASTER_INSTRUCTION_v2_5.md | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.1-U033-R003 | Database Architecture | Governing/MASTER_INSTRUCTION_v2_5.md | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.1-U033-R004 | Authentication | Governing/MASTER_INSTRUCTION_v2_5.md | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.1-U033-R005 | Super Admin Dashboard | Governing/MASTER_INSTRUCTION_v2_5.md | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.1-U033-R006 | SaaS Website CMS | Governing/MASTER_INSTRUCTION_v2_5.md | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.1-U033-R007 | Multi Tenant | Governing/MASTER_INSTRUCTION_v2_5.md | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.1-U033-R008 | 🆕 Tenant Web Portal – Core Modules | Governing/MASTER_INSTRUCTION_v2_5.md | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.1-U033-R009 | 🆕 Tenant Web Portal – Customer/User Modules | Governing/MASTER_INSTRUCTION_v2_5.md | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.1-U033-R010 | 🆕 Tenant Web Portal – Staff Modules | Governing/MASTER_INSTRUCTION_v2_5.md | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.1-U033-R011 | LIS Core | Governing/MASTER_INSTRUCTION_v2_5.md | A-09 + A-02/A-03/A-05/A-06/A-07/A-08 | ADR-002/004/005/006/008/010/012 | DD-13 + HLT-LIS canonical industry DD + DD-21/DD-22/DD-23/DD-24/DD-25 | HLT-LIS-T001…T014 + applicable KPI T01/T02 | MATERIAL_MS |
| S2.1-U033-R012 | Reports + PDF + QR | Governing/MASTER_INSTRUCTION_v2_5.md | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.1-U033-R013 | Billing | Governing/MASTER_INSTRUCTION_v2_5.md | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.1-U033-R014 | Inventory | Governing/MASTER_INSTRUCTION_v2_5.md | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.1-U033-R015 | Communication | Governing/MASTER_INSTRUCTION_v2_5.md | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.1-U033-R016 | AI Core | Governing/MASTER_INSTRUCTION_v2_5.md | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.1-U033-R017 | AI Advanced | Governing/MASTER_INSTRUCTION_v2_5.md | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.1-U033-R018 | Enterprise & Integration (Branch/Department/Appointment Management, Enterprise Integration, API & Interoperability, Analytics, Localization, Document Management — per the Business Requirement) | Governing/MASTER_INSTRUCTION_v2_5.md | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.1-U033-R019 | Security | Governing/MASTER_INSTRUCTION_v2_5.md | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.1-U033-R020 | Performance | Governing/MASTER_INSTRUCTION_v2_5.md | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.1-U033-R021 | Testing | Governing/MASTER_INSTRUCTION_v2_5.md | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.1-U033-R022 | Final Production Release | Governing/MASTER_INSTRUCTION_v2_5.md | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.1-U033-R023 | > This Section 20 sequence is authoritative for phase order and phase gating. Thematic construction checklists and expected deliverable volumes supporting these phases (e.g., expected table counts, master data counts, dropdown values, settings pages, permission counts) are maintained in `SBGlobal_Plus_Enterprise_Development_Roadmap.md`. Where that document's thematic groupings (its own "Phase 01–14" labels) differ in numbering from the sequence above, this Section 20 remains authoritative for sequencing; the Roadmap document is authoritative only for volume/deliverable targets. | Governing/MASTER_INSTRUCTION_v2_5.md | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U040-R001 | 🆕 Healthcare & Diagnostics is the platform's flagship Industry Vertical Suite: the platform shall provide an end-to-end ecosystem for pathology laboratories, diagnostic centers, hospitals, clinics, healthcare organizations, patients, doctors, and enterprise integrations. 🆕 See Section 4 for the full list of supported Industry Vertical Suites. | F-00/F-01 | A-09 + A-02/A-03/A-05/A-06/A-07/A-08 | ADR-002/004/005/006/008/010/012 | DD-13 + HLT-LIS canonical industry DD + DD-21/DD-22/DD-23/DD-24/DD-25 | HLT-LIS-T001…T014 + applicable KPI T01/T02 | MATERIAL_MS |
| S2.2-U040-R002 | The platform shall be: | F-00/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U040-R003 | AI Powered | F-00/F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U040-R004 | Multi-Tenant | F-00/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U040-R005 | 🆕 Multi-Industry Ready | F-00/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U040-R006 | Modular | F-00/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U040-R007 | Scalable | F-00/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U040-R008 | Secure | F-00/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U040-R009 | Enterprise Ready | F-00/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U040-R010 | Cloud Ready | F-00/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U040-R011 | API First | F-00/F-01 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U040-R012 | Mobile First | F-00/F-01 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.2-U040-R013 | Configuration Driven | F-00/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U040-R014 | Database Driven | F-00/F-01 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U040-R015 | Production Ready | F-00/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U040-R016 | No module shall require source code modification for routine business operations wherever reasonably possible. | F-00/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U041-R001 | 🆕 Core Platform Objectives — the platform shall enable: | F-00/F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U041-R002 | SaaS Business Management | F-00/F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U041-R003 | Multi-Tenant SaaS | F-00/F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U041-R004 | Enterprise APIs | F-00/F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U041-R005 | AI Assisted Operations | F-00/F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U041-R006 | Mobile Applications | F-00/F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U041-R007 | 🆕 Multi-Industry Vertical Enablement | F-00/F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U041-R008 | 🆕 Healthcare & Diagnostics Vertical Objectives — the platform shall enable: | F-00/F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U041-R009 | Laboratory Information System (LIS) | F-00/F-01 | A-09 + A-02/A-03/A-05/A-06/A-07/A-08 | ADR-002/004/005/006/008/010/012 | DD-13 + HLT-LIS canonical industry DD + DD-21/DD-22/DD-23/DD-24/DD-25 | HLT-LIS-T001…T014 + applicable KPI T01/T02 | MATERIAL_MS |
| S2.2-U041-R010 | Laboratory Management System (LMS) | F-00/F-01 | A-09 + A-02/A-03/A-05/A-06/A-07/A-08 | ADR-002/004/005/006/008/010/012 | DD-13 + EDU-LMS canonical industry DD + DD-21/DD-22/DD-23/DD-24/DD-25 | EDU-LMS-T001…T014 + applicable KPI T01/T02 | MATERIAL_MS |
| S2.2-U041-R011 | Enterprise Laboratory Operations | F-00/F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U041-R012 | Hospital Integration | F-00/F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U041-R013 | Clinic Integration | F-00/F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U041-R014 | Doctor Collaboration | F-00/F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U041-R015 | Patient Self-Service | F-00/F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U041-R016 | Corporate Healthcare Management | F-00/F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U041-R017 | Digital Healthcare Services | F-00/F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U042-R001 | The platform shall be: | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U042-R002 | Configuration Driven | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U042-R003 | Database Driven | F-01 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U042-R004 | Tenant Isolated | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U042-R005 | API First | F-01 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U042-R006 | Mobile Ready | F-01 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.2-U042-R007 | AI Ready | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U042-R008 | Enterprise Ready | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U042-R009 | Integration Ready | F-01 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U042-R010 | Secure by Design | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U042-R011 | Performance Optimized | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U042-R012 | Commercial SaaS Ready | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U043-R001 | 🆕 The platform shall support the following Industry Vertical Suites (not limited to): | F-01/F-02 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U043-R002 | 🆕 Healthcare & Diagnostics | F-01/F-02 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U043-R003 | 🆕 Education | F-01/F-02 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U043-R004 | 🆕 Retail & Commerce | F-01/F-02 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U043-R005 | 🆕 Hospitality | F-01/F-02 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U043-R006 | 🆕 Manufacturing | F-01/F-02 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U043-R007 | 🆕 Professional Services | F-01/F-02 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U043-R008 | 🆕 Government | F-01/F-02 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U043-R009 | 🆕 NGO | F-01/F-02 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U043-R010 | 🆕 Future Vertical Suites | F-01/F-02 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U043-R011 | The platform shall support: | F-01/F-02 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U043-R012 | Pathology Laboratories | F-01/F-02 | A-09 + A-02/A-03/A-05/A-06/A-07/A-08 | ADR-002/004/005/006/008/010/012 | DD-13 + HLT-LIS canonical industry DD + DD-21/DD-22/DD-23/DD-24/DD-25 | HLT-LIS-T001…T014 + applicable KPI T01/T02 | MATERIAL_MS |
| S2.2-U043-R013 | Diagnostic Centers | F-01/F-02 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U043-R014 | Multi-Speciality Laboratories | F-01/F-02 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U043-R015 | Hospital Laboratories | F-01/F-02 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U043-R016 | Independent Laboratories | F-01/F-02 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U043-R017 | Collection Centers | F-01/F-02 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U043-R018 | Imaging Centers | F-01/F-02 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U043-R019 | Radiology Centers | F-01/F-02 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U043-R020 | Blood Banks | F-01/F-02 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U043-R021 | Clinics | F-01/F-02 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U043-R022 | Hospitals | F-01/F-02 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U043-R023 | Corporate Healthcare Networks | F-01/F-02 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U043-R024 | Medical Colleges | F-01/F-02 | A-09 + A-02/A-03/A-05/A-06/A-07/A-08 | ADR-002/004/005/006/008/010/012 | DD-13 + EDU-CUM canonical industry DD + DD-21/DD-22/DD-23/DD-24/DD-25 | EDU-CUM-T001…T014 + applicable KPI T01/T02 | MATERIAL_MS |
| S2.2-U043-R025 | Government Healthcare Programs | F-01/F-02 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U043-R026 | Insurance Providers | F-01/F-02 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U043-R027 | Third-party Healthcare Platforms | F-01/F-02 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U045-R001 | The platform shall support: | F-01 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U045-R002 | Super Admin | F-01 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U045-R003 | Tenant Owner | F-01 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U045-R004 | Lab Admin | F-01 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U045-R005 | Branch Manager | F-01 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U045-R006 | Department Manager | F-01 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U045-R007 | Pathologist | F-01 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U045-R008 | Doctor | F-01 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U045-R009 | Technician | F-01 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U045-R010 | Receptionist | F-01 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U045-R011 | Collection Staff | F-01 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U045-R012 | Phlebotomist | F-01 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U045-R013 | Billing Executive | F-01 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U045-R014 | Accountant | F-01 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U045-R015 | Inventory Manager | F-01 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U045-R016 | Store Manager | F-01 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U045-R017 | Corporate User | F-01 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U045-R018 | Insurance User | F-01 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U045-R019 | Referral Doctor | F-01 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U045-R020 | Patient | F-01 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U045-R021 | API Client | F-01 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U045-R022 | Mobile Application Users | F-01 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U045-R023 | > This is the authoritative, complete, platform-wide User Types list. Enterprise Default Standards — User Roles defines only the smaller subset of roles pre-seeded by default at installation, and cross-references this section instead of repeating the full list. | F-01 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U046-R001 | Each tenant shall receive: | F-01/F-03/F-11 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U046-R002 | Complete Data Isolation | F-01/F-03/F-11 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U046-R003 | Independent Users | F-01/F-03/F-11 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U046-R004 | Independent Branches | F-01/F-03/F-11 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U046-R005 | Independent Staff | F-01/F-03/F-11 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U046-R006 | Independent Patients | F-01/F-03/F-11 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U046-R007 | Independent Doctors | F-01/F-03/F-11 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U046-R008 | Independent Inventory | F-01/F-03/F-11 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U046-R009 | Independent Billing | F-01/F-03/F-11 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U046-R010 | Independent Reports | F-01/F-03/F-11 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U046-R011 | Independent Website | F-01/F-03/F-11 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U046-R012 | Independent Mobile Configuration | F-01/F-03/F-11 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U046-R013 | Independent Branding | F-01/F-03/F-11 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U046-R014 | Independent API Access | F-01/F-03/F-11 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U046-R015 | Independent AI Usage | F-01/F-03/F-11 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U046-R016 | Independent Storage | F-01/F-03/F-11 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U046-R017 | Independent Configuration | F-01/F-03/F-11 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U046-R018 | 🆕 Configurable Data Residency / Region Selection | F-01/F-03/F-11 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U046-R019 | Cross-tenant data access shall never be permitted. | F-01/F-03/F-11 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U047-R001 | The platform shall be fully configuration driven. | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U047-R002 | Any configurable business feature shall be manageable through the Admin Panel without modifying source code. | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U047-R003 | Only the following require developer intervention: | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U047-R004 | Framework Changes | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U047-R005 | Database Schema Changes | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U047-R006 | Core Architecture | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U047-R007 | Security Enhancements | F-01 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U047-R008 | Performance Optimizations | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U047-R009 | Unsupported Integrations | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U047-R010 | New Features | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U048-R001 | Super Admin shall dynamically manage: | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U048-R002 | Branding | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U048-R003 | Themes | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U048-R004 | UI | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U048-R005 | Menus | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U048-R006 | Navigation | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U048-R007 | Dashboards | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U048-R008 | Widgets | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U048-R009 | Forms | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U048-R010 | Validation Rules | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U048-R011 | Workflows | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U048-R012 | Report Templates | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U048-R013 | Invoice Templates | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U048-R014 | Print Templates | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U048-R015 | QR Templates | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U048-R016 | PDF Templates | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U048-R017 | Email Templates | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U048-R018 | SMS Templates | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U048-R019 | WhatsApp Templates | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U048-R020 | Notification Templates | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U048-R021 | Mobile Configuration | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U048-R022 | Mobile Branding | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U048-R023 | APIs | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U048-R024 | Integrations | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U048-R025 | Feature Flags | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U048-R026 | Subscription Plans | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U048-R027 | Trial Plans | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U048-R028 | Roles | F-01 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U048-R029 | Permissions | F-01 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U048-R030 | Master Data | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U048-R031 | Lookup Values | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U048-R032 | Custom Fields | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U048-R033 | Dynamic Fields | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U048-R034 | Communication Providers | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U048-R035 | Payment Providers | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U048-R036 | Storage Providers | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U048-R037 | AI Providers | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U048-R038 | Enterprise Configuration | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U048-R039 | All configuration shall be stored in the database wherever reasonably possible. | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U049-R001 | The SaaS Website shall be delivered as a fully populated production-ready website. | F-06 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U049-R002 | Every page, section, component and media asset shall include AI-generated, realistic, human-quality, commercially usable, copyright-free production content. | F-06 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U049-R003 | The SaaS Website shall include: | F-06 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U049-R004 | Homepage | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R005 | Hero Section | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R006 | Features | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R007 | Solutions | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R008 | Industries | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R009 | Pricing | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R010 | Trial Plans | F-06 | A-04 | ADR-007 | DD-04 | DD-17 COM family | MATERIAL_SHARED |
| S2.2-U049-R011 | Subscription Plans | F-06 | A-04 | ADR-007 | DD-04 | DD-17 COM family | MATERIAL_SHARED |
| S2.2-U049-R012 | 🆕 Free Trial / Self-Serve Signup | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R013 | About Us | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R014 | Why Choose Us | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R015 | Company Story | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R016 | Team | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R017 | Careers | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R018 | Contact | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R019 | FAQ | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R020 | Testimonials | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R021 | Customer Reviews | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R022 | Success Stories | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R023 | Case Studies | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R024 | Blog | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R025 | Articles | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R026 | Knowledge Base | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R027 | Documentation | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R028 | Downloads | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R029 | Resources | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R030 | Help Center | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R031 | Privacy Policy | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R032 | Terms | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R033 | Cookie Policy | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R034 | Refund Policy | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R035 | 🆕 Service Level Agreement (SLA) | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R036 | 🆕 Data Processing Agreement (DPA) | F-06 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U049-R037 | 🆕 Trust Center | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R038 | 🆕 Status / Uptime Page | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R039 | 🆕 Compliance Badges | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R040 | Media Gallery | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R041 | Image Gallery | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R042 | Videos | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R043 | Events | F-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U049-R044 | Newsletter | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R045 | Contact Forms | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R046 | Landing Pages | F-06 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U049-R047 | Dynamic CMS | F-06 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U049-R048 | 🆕 Cookie Consent Banner | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R049 | 🆕 Live Chat / AI Chatbot Widget | F-06 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U049-R050 | 🆕 Enterprise Announcement Bar | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R051 | Every section shall include realistic production-ready: | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R052 | Headings | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R053 | Subheadings | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R054 | Paragraphs | F-06 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U049-R055 | Marketing Copy | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R056 | CTA Buttons | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R057 | Icons | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R058 | Hero Content | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R059 | Statistics | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R060 | Feature Cards | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R061 | Pricing Tables | F-06 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U049-R062 | Comparison Tables | F-06 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U049-R063 | FAQ Content | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R064 | Testimonials | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R065 | Customer Profiles | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R066 | Company Information | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R067 | SEO Metadata | F-06 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U049-R068 | OpenGraph Metadata | F-06 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U049-R069 | Structured Data | F-06 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U049-R070 | Copyright-free Images | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R071 | Copyright-free Illustrations | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R072 | Copyright-free Icons | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R073 | Copyright-free Background Graphics | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R074 | Copyright-free Banners | F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U049-R075 | No Lorem Ipsum, placeholder text, empty sections or dummy website content shall exist anywhere. | F-06 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R001 | Each tenant shall receive a fully populated production-ready laboratory website. | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R002 | The website shall support: | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R003 | Custom Domain | F-07/F-04 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U050-R004 | Subdomain | F-07/F-04 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U050-R005 | SSL | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R006 | Branding | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R007 | Logo | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R008 | Favicon | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R009 | Hero Banner | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R010 | About | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R011 | Vision | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R012 | Mission | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R013 | Certifications | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R014 | NABL Information | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R015 | Departments | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R016 | Doctors | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R017 | Pathologists | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R018 | Services | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R019 | Test Categories | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R020 | Individual Tests | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R021 | Health Packages | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R022 | Offers | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R023 | Gallery | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R024 | Videos | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R025 | Branches | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R026 | Collection Centers | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R027 | Contact Information | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R028 | Social Media | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R029 | Maps | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R030 | Appointment Booking | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R031 | Home Collection Request | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R032 | Patient Login | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R033 | Doctor Login | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R034 | Report Verification | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R035 | QR Verification | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R036 | Careers | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R037 | Blog | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R038 | News | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R039 | Events | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R040 | Dynamic CMS | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R041 | Every laboratory website shall include realistic AI-generated production content including: | F-07/F-04 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U050-R042 | Hero Content | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R043 | Laboratory Description | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R044 | Services | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R045 | Department Details | F-07/F-04 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U050-R046 | Test Descriptions | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R047 | Health Package Descriptions | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R048 | Doctor Profiles | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R049 | Pathologist Profiles | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R050 | Branch Information | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R051 | FAQs | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R052 | Testimonials | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R053 | Gallery Images | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R054 | Promotional Banners | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R055 | SEO Content | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R056 | Meta Tags | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R057 | OpenGraph Tags | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R058 | Structured Data | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U050-R059 | No placeholder content, empty pages or unfinished sections shall exist. | F-07/F-04 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U053-R001 | Homepage | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U053-R002 | Hero Sections | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U053-R003 | Features | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U053-R004 | Solutions | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U053-R005 | Industries | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U053-R006 | Pricing | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U053-R007 | Blog | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U053-R008 | Articles | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U053-R009 | FAQs | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U053-R010 | Testimonials | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U053-R011 | Success Stories | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U053-R012 | Case Studies | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U053-R013 | SEO Content | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U053-R014 | Landing Pages | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U053-R015 | Media Gallery | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U053-R016 | Icons | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U053-R017 | Illustrations | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U053-R018 | Banners | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U054-R001 | Laboratory Profiles | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U054-R002 | Departments | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U054-R003 | Doctors | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U054-R004 | Pathologists | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U054-R005 | Services | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U054-R006 | Test Categories | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U054-R007 | Individual Tests | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U054-R008 | Health Packages | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U054-R009 | Offers | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U054-R010 | Branches | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U054-R011 | Collection Centers | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U054-R012 | Gallery | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U054-R013 | Testimonials | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U054-R014 | FAQs | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U054-R015 | Blog | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U054-R016 | News | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U054-R017 | Promotional Content | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U055-R001 | Dashboards | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U055-R002 | Charts | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U055-R003 | KPIs | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U055-R004 | Analytics | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U055-R005 | Notifications | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U055-R006 | Audit Logs | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U055-R007 | Revenue Statistics | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U056-R001 | Patients | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U056-R002 | Doctors | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U056-R003 | Staff | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U056-R004 | Branches | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U056-R005 | Inventory | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U056-R006 | Reports | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U056-R007 | Billing | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U056-R008 | Dashboards | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U056-R009 | Analytics | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U056-R010 | Profiles | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U056-R011 | Medical History | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U056-R012 | Appointments | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U056-R013 | Payments | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U056-R014 | Notifications | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U056-R015 | Follow-ups | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U056-R016 | Notes | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U056-R017 | AI Insights | F-04/F-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U057-R001 | Dashboard Data | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U057-R002 | Charts | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U057-R003 | Notifications | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U057-R004 | Reports | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U057-R005 | Appointments | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U057-R006 | Billing | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U057-R007 | Analytics | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U059-R001 | Laboratories | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U059-R002 | Branches | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U059-R003 | Departments | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U059-R004 | Patients | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U059-R005 | Doctors | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U059-R006 | Referral Doctors | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U059-R007 | Staff | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U059-R008 | Corporate Clients | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U059-R009 | Insurance Providers | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U059-R010 | Appointments | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U059-R011 | Sample Collections | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U059-R012 | Reports | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U059-R013 | Invoices | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U059-R014 | Payments | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U059-R015 | Medical History | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U060-R001 | Machines | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U060-R002 | Vendors | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U060-R003 | Manufacturers | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U060-R004 | Reagents | F-04/F-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U060-R005 | Chemicals | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U060-R006 | Kits | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U060-R007 | Consumables | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U060-R008 | Purchase Orders | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U060-R009 | Stock | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U060-R010 | Inventory | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U060-R011 | QC Records | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U061-R001 | Test Categories | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U061-R002 | Test Subcategories | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U061-R003 | Laboratory Tests | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U061-R004 | Test Profiles | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U061-R005 | Full Body Checkup Packages | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U061-R006 | Health Packages | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U061-R007 | Corporate Packages | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U061-R008 | Parameters | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U061-R009 | Biomarkers | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U061-R010 | Reference Ranges | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U061-R011 | Sample Reports | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U061-R012 | QR Codes | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U061-R013 | Barcodes | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U061-R014 | AI Summaries | F-04/F-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U063-R001 | Countries | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U063-R002 | States | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U063-R003 | Districts | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U063-R004 | Cities | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U063-R005 | Languages | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U063-R006 | Time Zones | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U063-R007 | Currencies | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U063-R008 | Nationalities | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U063-R009 | Session(2026-2100) | F-04/F-07 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U064-R001 | Titles (Mr., Mrs., Miss., Dr., Prof., etc.) | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U064-R002 | Gender | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U064-R003 | Marital Status | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U064-R004 | Blood Groups | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U064-R005 | Religion | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U064-R006 | Category (General, OBC, SC, ST, EWS, etc.) | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U064-R007 | Occupations | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U064-R008 | Education Levels | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U065-R001 | Departments | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U065-R002 | Designations | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U065-R003 | Roles | F-04/F-07 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U065-R004 | Permissions | F-04/F-07 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U065-R005 | Branch Types | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U065-R006 | Working Shifts | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U065-R007 | Holiday Calendar | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U066-R001 | Test Categories | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U066-R002 | Test Subcategories | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U066-R003 | Individual Tests | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U066-R004 | Test Profiles | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U066-R005 | Full Body Checkup Packages | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U066-R006 | Health Packages | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U066-R007 | Corporate Packages | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U066-R008 | Sample Types | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U066-R009 | Specimen Types | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U066-R010 | Sample Containers | F-04/F-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U066-R011 | Collection Methods | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U066-R012 | Test Methods | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U066-R013 | Instrument Methods | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U066-R014 | Units | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U066-R015 | Reference Units | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U066-R016 | Age Groups | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U066-R017 | Gender-wise Reference Ranges | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U066-R018 | Panic Values | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U066-R019 | Critical Values | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U066-R020 | Analyzer Manufacturers | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U066-R021 | Analyzer Models | F-04/F-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U066-R022 | Machine Types | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U067-R001 | Vendors | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U067-R002 | Manufacturers | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U067-R003 | Reagents | F-04/F-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U067-R004 | Chemicals | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U067-R005 | Kits | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U067-R006 | Consumables | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U067-R007 | Equipment Categories | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U068-R001 | Payment Methods | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U068-R002 | Invoice Status | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U068-R003 | Payment Status | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U068-R004 | Discount Types | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U068-R005 | Tax Types | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U068-R006 | GST Rates | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U069-R001 | Appointment Status | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U069-R002 | Sample Status | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U069-R003 | Worklist Status | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U069-R004 | Report Status | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U069-R005 | Patient Status | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U069-R006 | Staff Status | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U070-R001 | ICD Ready Mapping | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U070-R002 | LOINC Ready Mapping | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U070-R003 | SNOMED CT Ready | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U070-R004 | HL7 Mapping | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U070-R005 | FHIR Mapping | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U070-R006 | ASTM Device Mapping | F-04/F-07 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U071-R001 | The platform shall include: | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U071-R002 | Copyright-free Images | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U071-R003 | Copyright-free Icons | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U071-R004 | Copyright-free Illustrations | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U071-R005 | Copyright-free Background Graphics | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U071-R006 | Copyright-free Gallery Images | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U071-R007 | Copyright-free Marketing Banners | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U073-R001 | When AI image generation is available, the platform shall generate: | F-04/F-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U073-R002 | Hero Banners | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U073-R003 | Website Banners | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U073-R004 | Landing Page Graphics | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U073-R005 | Dashboard Graphics | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U073-R006 | Marketing Graphics | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U073-R007 | Feature Illustrations | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U073-R008 | Medical Illustrations | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U073-R009 | Infographics | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U073-R010 | Background Graphics | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U073-R011 | Gallery Images | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U073-R012 | Promotional Images | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U073-R013 | Blog Cover Images | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U073-R014 | Social Media Graphics | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U073-R015 | AI Generated Videos (where supported) | F-04/F-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U073-R016 | All generated assets shall: | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U073-R017 | Be original and unique | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U073-R018 | Be commercially usable | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U073-R019 | Be production quality | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U073-R020 | Match the SBGlobal Plus brand identity | F-04/F-07 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U073-R021 | Support responsive web and mobile layouts | F-04/F-07 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.2-U073-R022 | Be optimized for performance (WebP, SVG, PNG where appropriate) | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U074-R001 | If AI generation is unavailable or disabled, assets shall only be sourced from commercially licensed copyright-free libraries: | F-04/F-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U074-R002 | Unsplash | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U074-R003 | Pexels | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U074-R004 | Pixabay | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U074-R005 | Openverse | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U074-R006 | Wikimedia Commons (commercially compatible content only) | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U074-R007 | Coverr (Videos) | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U074-R008 | Mixkit (Videos) | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U074-R009 | No other image or media source shall be used without an explicit commercial license. | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U075-R001 | Only use: | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U075-R002 | Lucide Icons | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U075-R003 | Heroicons | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U075-R004 | Tabler Icons | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U075-R005 | Material Symbols | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U076-R001 | Never use: | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U076-R002 | Google Images | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U076-R003 | Shutterstock previews | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U076-R004 | Getty Images | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U076-R005 | Adobe Stock watermarked assets | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U076-R006 | Copyrighted YouTube videos | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U076-R007 | Copyrighted movie or TV content | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U076-R008 | Trademarked logos without permission | F-04/F-07 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U076-R009 | Copyrighted characters | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U076-R010 | Celebrity likenesses | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U076-R011 | Artwork that imitates living artists | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U076-R012 | Any unlicensed visual content | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U077-R001 | Every visual asset shall: | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U077-R002 | Be high resolution | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U077-R003 | Be production ready | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U077-R004 | Be visually consistent | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U077-R005 | Be editable where applicable | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U077-R006 | Support commercial deployment | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U077-R007 | Require no manual replacement before production | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U077-R008 | The final application shall contain no placeholder images, watermarked assets, dummy graphics, or copyright-infringing media. | F-04/F-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U078-R001 | All generated content shall: | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U078-R002 | Be realistic | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U078-R003 | Be production quality | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U078-R004 | Be AI-generated where appropriate | F-04/F-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U078-R005 | Be commercially usable | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U078-R006 | Be copyright free | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U078-R007 | Be editable through the appropriate Admin Panel | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U078-R008 | Support multilingual expansion | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U078-R009 | Never contain Lorem Ipsum | F-04/F-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U078-R010 | Never contain placeholder text | F-04/F-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U078-R011 | Never contain placeholder images | F-04/F-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U078-R012 | Never require manual replacement before production use | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U079-R001 | Every demonstration record shall be clearly identified using a configurable DEMO flag. | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U079-R002 | Demo records shall never interfere with production records. | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U079-R003 | Super Admin shall be able to enable, disable, regenerate, import or remove demo content. | F-04/F-07 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U079-R004 | Demo content generation shall support AI regeneration without affecting production data. | F-04/F-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U080-R001 | The Super Admin Platform shall control the complete SaaS ecosystem. | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U080-R002 | Dashboard | F-01/F-06 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U080-R003 | Tenant Management | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U080-R004 | Laboratory Management | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U080-R005 | Branch Monitoring | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U080-R006 | Subscription Management | F-01/F-06 | A-04 | ADR-007 | DD-04 | DD-17 COM family | MATERIAL_SHARED |
| S2.2-U080-R007 | Trial Management | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U080-R008 | Billing Management | F-01/F-06 | A-04 | ADR-007 | DD-04 | DD-17 COM family | MATERIAL_SHARED |
| S2.2-U080-R009 | Payment Management | F-01/F-06 | A-04 | ADR-007 | DD-04 | DD-17 COM family | MATERIAL_SHARED |
| S2.2-U080-R010 | Revenue Dashboard | F-01/F-06 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U080-R011 | 🆕 Affiliate & Partner Management | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U080-R012 | Website CMS | F-01/F-06 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U080-R013 | Branding | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U080-R014 | Theme Management | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U080-R015 | User Management | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U080-R016 | Role Management | F-01/F-06 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U080-R017 | Permission Management | F-01/F-06 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U080-R018 | Security Center | F-01/F-06 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U080-R019 | Audit Center | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U080-R020 | Activity Logs | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U080-R021 | AI Management | F-01/F-06 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U080-R022 | API Management | F-01/F-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U080-R023 | Integration Center | F-01/F-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U080-R024 | Communication Center | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U080-R025 | Monitoring Center | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U080-R026 | License Management | F-01/F-06 | A-04 | ADR-007 | DD-04 | DD-17 COM family | MATERIAL_SHARED |
| S2.2-U080-R027 | Environment Management | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U080-R028 | Backup Management | F-01/F-06 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U080-R029 | Disaster Recovery | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U080-R030 | Compliance Center | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U080-R031 | Feature Flags | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U080-R032 | Maintenance Center | F-01/F-06 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U080-R033 | Notification Center | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U080-R034 | Export Center | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U080-R035 | Import Center | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U080-R036 | Version Center | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U080-R037 | Global Settings | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U080-R038 | Dynamic Configuration | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U081-R001 | 🆕 This portal serves every tenant-side role (Lab Admin, Doctor, Pathologist, Technician, Receptionist, Billing Executive, Accountant, Collection Staff, Patient, and others) through a single unified web experience. Feature visibility, workflows, and permissions are scoped per role via Role-Based Access Control (RBAC); no separate role-specific portal shall be created. | F-01/F-06 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U081-R002 | Tenant users shall manage only tenant-owned resources. | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U081-R003 | Dashboard | F-01/F-06 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U081-R004 | Patients | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U081-R005 | Doctors | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U081-R006 | Staff | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U081-R007 | Branches | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U081-R008 | Departments | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U081-R009 | Collection Centers | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U081-R010 | Referral Doctors | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U081-R011 | Corporate Clients | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U081-R012 | Insurance Accounts | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U081-R013 | Appointments | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U081-R014 | Test Categories | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U081-R015 | Tests | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U081-R016 | Health Packages | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U081-R017 | Sample Collection | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U081-R018 | Worklists | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U081-R019 | Reports | F-01/F-06 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U081-R020 | Billing | F-01/F-06 | A-04 | ADR-007 | DD-04 | DD-17 COM family | MATERIAL_SHARED |
| S2.2-U081-R021 | Payments | F-01/F-06 | A-04 | ADR-007 | DD-04 | DD-17 COM family | MATERIAL_SHARED |
| S2.2-U081-R022 | Inventory | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U081-R023 | Vendors | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U081-R024 | Purchase | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U081-R025 | Stock | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U081-R026 | Website | F-01/F-06 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U081-R027 | Communication | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U081-R028 | Settings | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U081-R029 | Profile | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U081-R030 | AI Features | F-01/F-06 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U081-R031 | Mobile Configuration (Tenant Scope) | F-01/F-06 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.2-U081-R032 | Tenant Analytics | F-01/F-06 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U081-R033 | 🆕 Affiliate/Referral Participation (Tenant Scope) | F-01/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U081-R034 | Tenant users shall never access resources belonging to another tenant. | F-01/F-06 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U082-R001 | Single Branch | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U082-R002 | Multiple Branches | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U082-R003 | Franchise Branches | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U082-R004 | Each branch shall support: | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U082-R005 | Address | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U082-R006 | Contact | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U082-R007 | Manager | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U082-R008 | Staff | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U082-R009 | Working Hours | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U082-R010 | Services | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U082-R011 | Collection Counters | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U082-R012 | Equipment | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U082-R013 | Inventory | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U082-R014 | Reports | F-07/F-12/F-13 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U082-R015 | Billing | F-07/F-12/F-13 | A-04 | ADR-007 | DD-04 | DD-17 COM family | MATERIAL_SHARED |
| S2.2-U082-R016 | Dashboard | F-07/F-12/F-13 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U082-R017 | Branch level reporting shall be supported. | F-07/F-12/F-13 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U083-R001 | Support unlimited departments. | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U083-R002 | Hematology | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U083-R003 | Clinical Pathology | F-07/F-12/F-13 | A-09 + A-02/A-03/A-05/A-06/A-07/A-08 | ADR-002/004/005/006/008/010/012 | DD-13 + HLT-LIS canonical industry DD + DD-21/DD-22/DD-23/DD-24/DD-25 | HLT-LIS-T001…T014 + applicable KPI T01/T02 | MATERIAL_MS |
| S2.2-U083-R004 | Biochemistry | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U083-R005 | Microbiology | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U083-R006 | Histopathology | F-07/F-12/F-13 | A-09 + A-02/A-03/A-05/A-06/A-07/A-08 | ADR-002/004/005/006/008/010/012 | DD-13 + HLT-LIS canonical industry DD + DD-21/DD-22/DD-23/DD-24/DD-25 | HLT-LIS-T001…T014 + applicable KPI T01/T02 | MATERIAL_MS |
| S2.2-U083-R007 | Cytology | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U083-R008 | Molecular Biology | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U083-R009 | Serology | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U083-R010 | Immunology | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U083-R011 | Each department shall support: | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U083-R012 | Staff | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U083-R013 | Equipment | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U083-R014 | Worklists | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U083-R015 | Reports | F-07/F-12/F-13 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U083-R016 | KPIs | F-07/F-12/F-13 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U084-R001 | Support unlimited staff. | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U084-R002 | Pathologist | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U084-R003 | Doctor | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U084-R004 | Technician | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U084-R005 | Receptionist | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U084-R006 | Accountant | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U084-R007 | Store Manager | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U084-R008 | Collection Executive | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U084-R009 | Branch Manager | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U084-R010 | Marketing Executive | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U084-R011 | Driver | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U084-R012 | Phlebotomist | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U084-R013 | Data Entry Operator | F-07/F-12/F-13 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U084-R014 | Support Staff | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U084-R015 | Each staff profile shall support: | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U084-R016 | Personal Information | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U084-R017 | Employment Information | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U084-R018 | Department | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U084-R019 | Branch | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U084-R020 | Role | F-07/F-12/F-13 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U084-R021 | Permissions | F-07/F-12/F-13 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U084-R022 | Attendance | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U084-R023 | Leave | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U084-R024 | Performance | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U084-R025 | Documents | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U084-R026 | Login History | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U085-R001 | Patient module shall support: | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U085-R002 | Registration | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U085-R003 | Patient ID | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U085-R004 | External Patient ID | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U085-R005 | UHID | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U085-R006 | Demographics | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U085-R007 | Contact Details | F-07/F-12/F-13 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U085-R008 | Medical History | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U085-R009 | Allergies | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U085-R010 | Chronic Diseases | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U085-R011 | Family History | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U085-R012 | Emergency Contacts | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U085-R013 | Insurance Details | F-07/F-12/F-13 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U085-R014 | Corporate Mapping | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U085-R015 | Previous Reports | F-07/F-12/F-13 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U085-R016 | Previous Visits | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U085-R017 | QR Identification | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U085-R018 | Consent Records | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U085-R019 | Attachments | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U085-R020 | Notes | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U085-R021 | Status | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U085-R022 | Audit Trail | F-07/F-12/F-13 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U085-R023 | Patient records shall remain permanently associated with the owning tenant. | F-07/F-12/F-13 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U086-R001 | Doctor module shall support: | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U086-R002 | Internal Doctors | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U086-R003 | External Doctors | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U086-R004 | Referral Doctors | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U086-R005 | Visiting Doctors | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U086-R006 | Consultant Doctors | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U086-R007 | Each doctor shall support: | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U086-R008 | Registration | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U086-R009 | Specialization | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U086-R010 | Qualification | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U086-R011 | Registration Number | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U086-R012 | External Doctor ID | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U086-R013 | Hospital Mapping | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U086-R014 | Clinic Mapping | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U086-R015 | Branch Mapping | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U086-R016 | Referral Statistics | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U086-R017 | Commission Rules | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U086-R018 | Digital Signature | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U086-R019 | Profile | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U086-R020 | Contact Details | F-07/F-12/F-13 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U086-R021 | Doctor-wise analytics shall be available. | F-07/F-12/F-13 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U087-R001 | Support: | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U087-R002 | Walk-in Appointments | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U087-R003 | Online Booking | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U087-R004 | Mobile Booking | F-07/F-12/F-13 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.2-U087-R005 | Doctor Appointment | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U087-R006 | Home Collection | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U087-R007 | Follow-up Appointment | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U087-R008 | Rescheduling | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U087-R009 | Cancellation | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U087-R010 | Queue Tokens | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U087-R011 | Slot Management | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U087-R012 | Calendar View | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U087-R013 | Reminder Notifications | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U087-R014 | Attendance Status | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U087-R015 | Appointment History | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U087-R016 | Appointments shall support tenant isolation and branch mapping. | F-07/F-12/F-13 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U088-R001 | The platform shall include a complete enterprise Laboratory Information System. | F-07/F-12/F-13 | A-09 + A-02/A-03/A-05/A-06/A-07/A-08 | ADR-002/004/005/006/008/010/012 | DD-13 + HLT-LIS canonical industry DD + DD-21/DD-22/DD-23/DD-24/DD-25 | HLT-LIS-T001…T014 + applicable KPI T01/T02 | MATERIAL_MS |
| S2.2-U088-R002 | Patient Registration | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U088-R003 | Appointment Management | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U088-R004 | Token Management | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U088-R005 | Sample Collection | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U088-R006 | Sample Accessioning | F-07/F-12/F-13 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U088-R007 | Barcode Generation | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U088-R008 | QR Code Generation | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U088-R009 | Sample Tracking | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U088-R010 | Sample Routing | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U088-R011 | Sample Transfer | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U088-R012 | Sample Receiving | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U088-R013 | Sample Rejection | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U088-R014 | Sample Recall | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U088-R015 | Worklists | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U088-R016 | Analyzer Integration Ready | F-07/F-12/F-13 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U088-R017 | Manual Result Entry | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U088-R018 | Auto Result Import | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U088-R019 | Critical Value Alerts | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U088-R020 | Delta Check | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U088-R021 | Verification | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U088-R022 | Pathologist Review | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U088-R023 | Digital Approval | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U088-R024 | Report Generation | F-07/F-12/F-13 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U088-R025 | Report Distribution | F-07/F-12/F-13 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U088-R026 | Report Archive | F-07/F-12/F-13 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U088-R027 | Audit Trail | F-07/F-12/F-13 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U088-R028 | Complete sample lifecycle shall be traceable. | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U089-R001 | Support unlimited: | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U089-R002 | Test Categories | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U089-R003 | Individual Tests | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U089-R004 | Profiles | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U089-R005 | Health Packages | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U089-R006 | Corporate Packages | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U089-R007 | Each test shall support: | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U089-R008 | Test Code | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U089-R009 | LOINC Ready Mapping | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U089-R010 | Department | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U089-R011 | Method | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U089-R012 | Specimen Type | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U089-R013 | Container Type | F-07/F-12/F-13 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U089-R014 | Preparation Instructions | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U089-R015 | Turnaround Time | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U089-R016 | Age Wise Range | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U089-R017 | Gender Wise Range | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U089-R018 | Panic Values | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U089-R019 | Critical Values | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U089-R020 | Machine Mapping | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U089-R021 | Pricing | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U089-R022 | External Codes | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U089-R023 | Status | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U091-R001 | Reports shall support: | F-07/F-12/F-13 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U091-R002 | Interactive Reports | F-07/F-12/F-13 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U091-R003 | Premium PDF Reports | F-07/F-12/F-13 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U091-R004 | Mobile Friendly Reports | F-07/F-12/F-13 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.2-U091-R005 | Digital Reports | F-07/F-12/F-13 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U091-R006 | QR Verification | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U091-R007 | Barcode Verification | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U091-R008 | Digital Signature | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U091-R009 | Electronic Signature | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U091-R010 | Watermark | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U091-R011 | AI Summary | F-07/F-12/F-13 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U091-R012 | AI Risk Score | F-07/F-12/F-13 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U091-R013 | AI Health Score | F-07/F-12/F-13 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U091-R014 | Trend Charts | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U091-R015 | Historical Comparison | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U091-R016 | Previous Reports | F-07/F-12/F-13 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U091-R017 | Doctor Notes | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U091-R018 | Pathologist Notes | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U091-R019 | Follow-up Advice | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U091-R020 | Diet Suggestions | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U091-R021 | Lifestyle Suggestions | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U091-R022 | Tamper Detection | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U091-R023 | Audit History | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U091-R024 | Secure Sharing | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U091-R025 | Password Protected Sharing | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U091-R026 | Printing | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U091-R027 | Download | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U091-R028 | Email | F-07/F-12/F-13 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U091-R029 | WhatsApp Sharing | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U091-R030 | Multiple configurable templates shall be supported. | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U092-R001 | Estimates | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U092-R002 | Billing | F-07/F-12/F-13 | A-04 | ADR-007 | DD-04 | DD-17 COM family | MATERIAL_SHARED |
| S2.2-U092-R003 | Invoices | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U092-R004 | Receipts | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U092-R005 | Refunds | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U092-R006 | Credit Notes | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U092-R007 | Debit Notes | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U092-R008 | Payments | F-07/F-12/F-13 | A-04 | ADR-007 | DD-04 | DD-17 COM family | MATERIAL_SHARED |
| S2.2-U092-R009 | Partial Payments | F-07/F-12/F-13 | A-04 | ADR-007 | DD-04 | DD-17 COM family | MATERIAL_SHARED |
| S2.2-U092-R010 | Outstanding | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U092-R011 | Packages | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U092-R012 | Discounts | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U092-R013 | Coupons | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U092-R014 | Taxes | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U092-R015 | GST | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U092-R016 | TDS Ready | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U092-R017 | Corporate Billing | F-07/F-12/F-13 | A-04 | ADR-007 | DD-04 | DD-17 COM family | MATERIAL_SHARED |
| S2.2-U092-R018 | Insurance Billing | F-07/F-12/F-13 | A-04 | ADR-007 | DD-04 | DD-17 COM family | MATERIAL_SHARED |
| S2.2-U092-R019 | Referral Commission | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U092-R020 | Revenue Reports | F-07/F-12/F-13 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U092-R021 | Financial Reports | F-07/F-12/F-13 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U092-R022 | Support multiple payment methods. | F-07/F-12/F-13 | A-04 | ADR-007 | DD-04 | DD-17 COM family | MATERIAL_SHARED |
| S2.2-U093-R001 | Categories | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U093-R002 | Products | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U093-R003 | Reagents | F-07/F-12/F-13 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U093-R004 | Chemicals | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U093-R005 | Kits | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U093-R006 | Consumables | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U093-R007 | Machines | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U093-R008 | Equipment | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U093-R009 | Vendors | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U093-R010 | Manufacturers | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U093-R011 | Purchase Orders | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U093-R012 | Goods Receipt | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U093-R013 | Batch Tracking | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U093-R014 | Expiry Tracking | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U093-R015 | Consumption | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U093-R016 | Stock Transfer | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U093-R017 | Stock Adjustment | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U093-R018 | Low Stock Alerts | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U093-R019 | Expiry Alerts | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U093-R020 | Purchase Analytics | F-07/F-12/F-13 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U093-R021 | Inventory shall be tenant isolated. | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U094-R001 | Email | F-07/F-12/F-13 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U094-R002 | SMS | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U094-R003 | WhatsApp | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U094-R004 | Push Notification | F-07/F-12/F-13 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.2-U094-R005 | In-App Notification | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U094-R006 | Supported providers shall be fully configurable. | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U094-R007 | SMTP | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U094-R008 | Gmail SMTP | F-07/F-12/F-13 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U094-R009 | Microsoft 365 SMTP | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U094-R010 | Amazon SES | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U094-R011 | Mailgun | F-07/F-12/F-13 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U094-R012 | SendGrid | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U094-R013 | Postmark | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U094-R014 | Brevo | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U094-R015 | Custom SMTP | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U094-R016 | Twilio | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U094-R017 | MSG91 | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U094-R018 | Textlocal | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U094-R019 | Fast2SMS | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U094-R020 | AWS SNS | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U094-R021 | Custom Gateway | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U094-R022 | Meta WhatsApp Cloud API | F-07/F-12/F-13 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U094-R023 | Twilio WhatsApp | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U094-R024 | 360dialog | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U094-R025 | Gupshup | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U094-R026 | Interakt | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U094-R027 | WATI | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U094-R028 | Custom Provider | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U094-R029 | Firebase Cloud Messaging (FCM) | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U094-R030 | Support: | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U094-R031 | Templates | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U094-R032 | Variables | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U094-R033 | Scheduling | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U094-R034 | Retry | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U094-R035 | Queue | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U094-R036 | Delivery Status | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U094-R037 | Failure Logs | F-07/F-12/F-13 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U094-R038 | Usage Logs | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U094-R039 | Provider Priority | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U094-R040 | Failover Rules | F-07/F-12/F-13 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U094-R041 | All providers shall be configurable by Super Admin without source code modification. | F-07/F-12/F-13 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U095-R001 | 🆕 Free | F-14/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U095-R002 | 🆕 Starter | F-14/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U095-R003 | 🆕 Pro | F-14/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U095-R004 | 🆕 Premium | F-14/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U095-R005 | 🆕 Enterprise | F-14/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U095-R006 | 🆕 Free and Starter: Self-Service Registration & Onboarding | F-14/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U095-R007 | 🆕 Pro, Premium, and Enterprise: Sales-Assisted Onboarding, Enterprise Provisioning, and Custom Deployment where applicable | F-14/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U095-R008 | Support: | F-14/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U095-R009 | Subscription Plans | F-14/F-01 | A-04 | ADR-007 | DD-04 | DD-17 COM family | MATERIAL_SHARED |
| S2.2-U095-R010 | Trial Plans | F-14/F-01 | A-04 | ADR-007 | DD-04 | DD-17 COM family | MATERIAL_SHARED |
| S2.2-U095-R011 | Plan Limits | F-14/F-01 | A-04 | ADR-007 | DD-04 | DD-17 COM family | MATERIAL_SHARED |
| S2.2-U095-R012 | Feature Permissions | F-14/F-01 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U095-R013 | Tenant Limits | F-14/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U095-R014 | Branch Limits | F-14/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U095-R015 | User Limits | F-14/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U095-R016 | API Limits | F-14/F-01 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U095-R017 | AI Limits | F-14/F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U095-R018 | Storage Limits | F-14/F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U095-R019 | SMS Limits | F-14/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U095-R020 | WhatsApp Limits | F-14/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U095-R021 | Email Limits | F-14/F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U095-R022 | Mobile App Access | F-14/F-01 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U095-R023 | 🆕 Tenant Portal Access | F-14/F-01 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U095-R024 | Reports | F-14/F-01 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U095-R025 | Inventory | F-14/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U095-R026 | Billing | F-14/F-01 | A-04 | ADR-007 | DD-04 | DD-17 COM family | MATERIAL_SHARED |
| S2.2-U095-R027 | Website | F-14/F-01 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U095-R028 | Integrations | F-14/F-01 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U095-R029 | Trial | F-14/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U095-R030 | Active | F-14/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U095-R031 | Grace Period | F-14/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U095-R032 | Suspended | F-14/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U095-R033 | Expired | F-14/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U095-R034 | Renewed | F-14/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U095-R035 | No tenant data shall be deleted after expiry. | F-14/F-01 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U096-R001 | 🆕 The platform shall provide a reusable, Core Platform-level Affiliate/Referral/Commission capability, configurable per tenant or Industry Vertical Suite (enabled or disabled through configuration). | F-14/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U096-R002 | 🆕 SaaS Affiliate Partners | F-14/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U096-R003 | 🆕 Tenant Referral Program | F-14/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U096-R004 | 🆕 Doctor Referral | F-14/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U096-R005 | 🆕 User Referral | F-14/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U096-R006 | 🆕 Business Partner Referral | F-14/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U096-R007 | 🆕 Channel Partner | F-14/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U096-R008 | 🆕 Reseller | F-14/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U096-R009 | 🆕 Franchise | F-14/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U096-R010 | 🆕 Agent Network | F-14/F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U096-R011 | 🆕 Commission & Incentive Management | F-14/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U097-R001 | The platform shall support enterprise healthcare interoperability. | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U097-R002 | Hospitals | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U097-R003 | Multi-Speciality Hospitals | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U097-R004 | Super Speciality Hospitals | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U097-R005 | Clinics | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U097-R006 | Diagnostic Centers | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U097-R007 | Imaging Centers | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U097-R008 | Radiology Centers | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U097-R009 | Blood Banks | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U097-R010 | Collection Centers | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U097-R011 | Nursing Homes | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U097-R012 | Polyclinics | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U097-R013 | Medical Colleges | F-01/A-06 | A-09 + A-02/A-03/A-05/A-06/A-07/A-08 | ADR-002/004/005/006/008/010/012 | DD-13 + EDU-CUM canonical industry DD + DD-21/DD-22/DD-23/DD-24/DD-25 | EDU-CUM-T001…T014 + applicable KPI T01/T02 | MATERIAL_MS |
| S2.2-U097-R014 | Corporate Clients | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U097-R015 | Insurance / TPA | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U097-R016 | Government Health Programs | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U097-R017 | External Healthcare Platforms | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U097-R018 | Each laboratory shall support unlimited enterprise connections. | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U098-R001 | Enterprise API shall support: | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U098-R002 | REST API | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U098-R003 | API Versioning | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U098-R004 | JWT Authentication | F-01/A-06 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U098-R005 | API Key Authentication | F-01/A-06 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U098-R006 | OAuth2 Ready | F-01/A-06 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U098-R007 | Webhooks | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U098-R008 | Event Notifications | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U098-R009 | External Patient ID | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U098-R010 | External Doctor ID | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U098-R011 | External Organization ID | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U098-R012 | HL7 Ready | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U098-R013 | FHIR Ready | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U098-R014 | HIS Ready | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U098-R015 | EMR Ready | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U098-R016 | EHR Ready | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U098-R017 | LIS Ready | F-01/A-06 | A-09 + A-02/A-03/A-05/A-06/A-07/A-08 | ADR-002/004/005/006/008/010/012 | DD-13 + HLT-LIS canonical industry DD + DD-21/DD-22/DD-23/DD-24/DD-25 | HLT-LIS-T001…T014 + applicable KPI T01/T02 | MATERIAL_MS |
| S2.2-U098-R018 | RIS Ready | F-01/A-06 | A-09 + A-02/A-03/A-05/A-06/A-07/A-08 | ADR-002/004/005/006/008/010/012 | DD-13 + HLT-RIS canonical industry DD + DD-21/DD-22/DD-23/DD-24/DD-25 | HLT-RIS-T001…T014 + applicable KPI T01/T02 | MATERIAL_MS |
| S2.2-U098-R019 | PACS Future Ready | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U098-R020 | Support: | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U098-R021 | OpenAPI | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U098-R022 | Swagger Documentation | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U098-R023 | Sandbox Mode | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U098-R024 | Production Mode | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U098-R025 | API Analytics | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U098-R026 | API Logs | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U098-R027 | Health Dashboard | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U099-R001 | Integration Management shall be fully dynamic. | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U099-R002 | Super Admin shall manage: | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U099-R003 | Integration Profiles | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U099-R004 | API Credentials | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U099-R005 | API Keys | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U099-R006 | JWT Configuration | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U099-R007 | OAuth Configuration | F-01/A-06 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U099-R008 | Webhooks | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U099-R009 | Mapping Rules | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U099-R010 | Synchronization Rules | F-01/A-06 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.2-U099-R011 | Import Rules | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U099-R012 | Export Rules | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U099-R013 | Retry Rules | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U099-R014 | Queue Settings | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U099-R015 | IP Whitelisting | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U099-R016 | Rate Limits | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U099-R017 | Integration Logs | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U099-R018 | Synchronization History | F-01/A-06 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.2-U099-R019 | Connectivity Testing | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U099-R020 | Sandbox Configuration | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U099-R021 | Production Configuration | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U099-R022 | No source code modification shall be required. | F-01/A-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U100-R001 | Separate mobile applications shall be provided. | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.2-U100-R002 | > Full mobile technical architecture, frameworks, state management, local storage, offline strategy, and per-app module breakdown: see SBGlobal_Plus_Mobile_Architecture_Standards.md (authoritative). This section defines only the business-required application set and headline capabilities. | F-06/A-08 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U100-R003 | 🆕 Tenant Staff App (serves Doctor, Pathologist, Technician, Receptionist, Collection Staff, Billing Executive, Lab Admin, and other internal tenant roles via RBAC) | F-06/A-08 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U100-R004 | 🆕 Tenant User/Customer App (serves the Patient/Customer role) | F-06/A-08 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U100-R005 | Super Admin App (platform-level, not tenant-scoped) | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.2-U100-R006 | Headline business capabilities required across these apps (technical detail owned by Mobile Architecture Standards): REST API access, offline-capable operation, push notifications, QR/Barcode scanning, appointment management, billing & payments, dashboards, and AI features. | F-06/A-08 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U101-R001 | All mobile applications shall support dynamic configuration. | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.2-U101-R002 | Super Admin shall manage: | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.2-U101-R003 | App Logo | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.2-U101-R004 | Splash Screen | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.2-U101-R005 | App Icon | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.2-U101-R006 | Welcome Screens | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.2-U101-R007 | Theme | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.2-U101-R008 | Colors | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.2-U101-R009 | Typography | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.2-U101-R010 | Dashboard Layout | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.2-U101-R011 | Home Widgets | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.2-U101-R012 | Navigation | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.2-U101-R013 | Menus | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.2-U101-R014 | Feature Visibility | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.2-U101-R015 | App Banners | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.2-U101-R016 | Promotional Cards | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.2-U101-R017 | API Endpoint | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.2-U101-R018 | Version Control | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.2-U101-R019 | Force Update | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.2-U101-R020 | Maintenance Mode | F-06/A-08 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U101-R021 | Privacy Policy | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.2-U101-R022 | Terms | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.2-U101-R023 | Contact Information | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.2-U101-R024 | Social Links | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.2-U101-R025 | Push Templates | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.2-U101-R026 | No mobile rebuild shall be required except for native package changes. | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.2-U102-R001 | AI shall operate as an independent service layer. | F-05 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U102-R002 | AI Summary | F-05 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U102-R003 | Report Explanation | F-05 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U102-R004 | Health Score | F-05 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U102-R005 | Risk Analysis | F-05 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U102-R006 | Dashboard Insights | F-05 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U102-R007 | Inventory Suggestions | F-05 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U102-R008 | Revenue Insights | F-05 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U102-R009 | SEO Generation | F-05 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U102-R010 | Blog Generation | F-05 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U102-R011 | FAQ Assistant | F-05 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U102-R012 | Documentation Assistant | F-05 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U102-R013 | Marketing Assistant | F-05 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U102-R014 | Provider replacement shall not require business logic changes. | F-05 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U103-R001 | AI Development Center shall support: | F-05 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U103-R002 | Code Review | F-05 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U103-R003 | Security Review | F-05 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U103-R004 | Performance Review | F-05 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U103-R005 | Database Review | F-05 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U103-R006 | Dependency Review | F-05 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U103-R007 | Architecture Review | F-05 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U103-R008 | Route Review | F-05 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U103-R009 | API Review | F-05 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U103-R010 | Configuration Review | F-05 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U103-R011 | Duplicate Code Detection | F-05 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U103-R012 | Dead Code Detection | F-05 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U103-R013 | Log Analysis | F-05 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U103-R014 | Error Analysis | F-05 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U103-R015 | Production Readiness Audit | F-05 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U103-R016 | Release Readiness Report | F-05 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U103-R017 | Documentation Review | F-05 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U103-R018 | AI shall never modify production code automatically. | F-05 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U103-R019 | Every recommendation shall require Super Admin approval. | F-05 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U103-R020 | Every AI operation shall be logged. | F-05 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U104-R001 | Dashboards shall support: | F-01 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U104-R002 | Revenue Analytics | F-01 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U104-R003 | Patient Analytics | F-01 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U104-R004 | Test Analytics | F-01 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U104-R005 | Doctor Analytics | F-01 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U104-R006 | Branch Analytics | F-01 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U104-R007 | Inventory Analytics | F-01 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U104-R008 | AI Usage Analytics | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U104-R009 | API Analytics | F-01 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U104-R010 | Communication Analytics | F-01 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U104-R011 | Financial Analytics | F-01 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U104-R012 | Subscription Analytics | F-01 | A-04 | ADR-007 | DD-04 | DD-17 COM family | MATERIAL_SHARED |
| S2.2-U104-R013 | Growth Analytics | F-01 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U104-R014 | Performance KPIs | F-01 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U104-R015 | Custom Widgets | F-01 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U104-R016 | Exportable Charts | F-01 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U104-R017 | Analytics shall support tenant isolation. | F-01 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U105-R001 | Web Authentication | F-03 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U105-R002 | OTP Authentication | F-03 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U105-R003 | JWT Authentication | F-03 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U105-R004 | API Key Authentication | F-03 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U105-R005 | 🆕 Multi-Factor Authentication (MFA) | F-03 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U105-R006 | 🆕 Enterprise Single Sign-On (SSO) | F-03 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U105-R007 | 🆕 OAuth 2.0 / OpenID Connect (OIDC) | F-03 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U105-R008 | 🆕 SAML 2.0 | F-03 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U105-R009 | 🆕 LDAP / Active Directory | F-03 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U105-R010 | 🆕 Passkeys (FIDO2/WebAuthn) | F-03 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U105-R011 | 🆕 Biometric Authentication | F-03 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U105-R012 | 🆕 PKI / Digital Certificates | F-03 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U105-R013 | 🆕 Aadhaar eSign | F-03 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U105-R014 | 🆕 DigiLocker Integration | F-03 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U105-R015 | 🆕 Enterprise Identity Federation | F-03 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U105-R016 | 🆕 > Canonical technology baseline for these methods: see Master Development Instruction — Section 18 (Technology Stack, Authentication). This section defines business-facing capability only. | F-03 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U105-R017 | RBAC | F-03 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U105-R018 | Permission Groups | F-03 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U105-R019 | Policy Based Authorization | F-03 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U105-R020 | Tenant Isolation | F-03 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U105-R021 | Privacy Controls | F-03 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U105-R022 | Consent Management | F-03 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U105-R023 | Data Retention | F-03 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U105-R024 | Access Logs | F-03 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U105-R025 | Audit Reports | F-03 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U105-R026 | Security Reports | F-03 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U105-R027 | Compliance Reports | F-03 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U105-R028 | 🆕 GDPR Alignment | F-03 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U105-R029 | 🆕 India DPDP Act 2023 Alignment | F-03 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U105-R030 | 🆕 HIPAA Readiness (Healthcare & Diagnostics Vertical) | F-03 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U105-R031 | 🆕 SOC 2 Type II Alignment | F-03 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U105-R032 | 🆕 ISO 27001 Alignment | F-03 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U105-R033 | 🆕 Data Processing Agreements (DPA) | F-03 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U105-R034 | 🆕 Right to Access / Right to Erasure Handling | F-03 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U105-R035 | 🆕 Security Incident Response Commitment (Breach Notification, Formal Response Plan) | F-03 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U105-R036 | 🆕 > Operational security-program detail (penetration-testing cadence, vulnerability disclosure/bug bounty policy, incident response runbook mechanics): see SBGlobal_Plus_Engineering_Standards.md — Section 4 Security Standards. This section defines only the business-level compliance commitment. | F-03 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U106-R001 | Enterprise monitoring shall support: | F-01/F-04/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U106-R002 | System Health | F-01/F-04/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U106-R003 | Queue Monitoring | F-01/F-04/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U106-R004 | Scheduler Monitoring | F-01/F-04/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U106-R005 | Failed Jobs | F-01/F-04/A-10/A-11 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U106-R006 | Exception Logs | F-01/F-04/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U106-R007 | Error Logs | F-01/F-04/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U106-R008 | Performance Metrics | F-01/F-04/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U106-R009 | CPU Usage | F-01/F-04/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U106-R010 | Memory Usage | F-01/F-04/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U106-R011 | Storage Usage | F-01/F-04/A-10/A-11 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U106-R012 | Database Statistics | F-01/F-04/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U106-R013 | API Usage | F-01/F-04/A-10/A-11 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U106-R014 | AI Usage | F-01/F-04/A-10/A-11 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U106-R015 | Communication Usage | F-01/F-04/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U106-R016 | Cache Statistics | F-01/F-04/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U106-R017 | Support: | F-01/F-04/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U106-R018 | Alerts | F-01/F-04/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U106-R019 | Notifications | F-01/F-04/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U106-R020 | Export | F-01/F-04/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U106-R021 | Historical Trends | F-01/F-04/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U107-R001 | Support: | F-01/F-04/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U107-R002 | Automatic Backup | F-01/F-04/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U107-R003 | Manual Backup | F-01/F-04/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U107-R004 | Database Backup | F-01/F-04/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U107-R005 | File Backup | F-01/F-04/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U107-R006 | Media Backup | F-01/F-04/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U107-R007 | Configuration Backup | F-01/F-04/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U107-R008 | Scheduled Backup | F-01/F-04/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U107-R009 | Cloud Backup Ready | F-01/F-04/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U107-R010 | Restore | F-01/F-04/A-10/A-11 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U107-R011 | Backup Verification | F-01/F-04/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U107-R012 | Recovery Logs | F-01/F-04/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U107-R013 | Recovery Testing | F-01/F-04/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U107-R014 | Backups shall support tenant isolation where applicable. | F-01/F-04/A-10/A-11 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U108-R001 | Super Admin shall manage: | F-01/F-04/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U108-R002 | License | F-01/F-04/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U108-R003 | License Status | F-01/F-04/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U108-R004 | License Renewal | F-01/F-04/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U108-R005 | Environment | F-01/F-04/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U108-R006 | Domain Management | F-01/F-04/A-10/A-11 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U108-R007 | Custom Domains | F-01/F-04/A-10/A-11 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U108-R008 | SSL Status | F-01/F-04/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U108-R009 | Storage Providers | F-01/F-04/A-10/A-11 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U108-R010 | SMTP Providers | F-01/F-04/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U108-R011 | SMS Providers | F-01/F-04/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U108-R012 | WhatsApp Providers | F-01/F-04/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U108-R013 | Payment Providers | F-01/F-04/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U108-R014 | AI Providers | F-01/F-04/A-10/A-11 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U108-R015 | Integration Providers | F-01/F-04/A-10/A-11 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U108-R016 | All provider credentials shall be encrypted. | F-01/F-04/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U109-R001 | The platform shall be configuration-driven. | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U109-R002 | Super Admin shall dynamically manage: | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U109-R003 | Branding | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U109-R004 | CMS | F-01 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U109-R005 | SaaS Website | F-01 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U109-R006 | Lab Websites | F-01 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U109-R007 | Mobile Apps | F-01 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.2-U109-R008 | Themes | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U109-R009 | Menus | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U109-R010 | Navigation | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U109-R011 | Widgets | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U109-R012 | Dashboards | F-01 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U109-R013 | Forms | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U109-R014 | Validation Rules | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U109-R015 | Workflows | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U109-R016 | Report Templates | F-01 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U109-R017 | Invoice Templates | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U109-R018 | Print Templates | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U109-R019 | PDF Templates | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U109-R020 | QR Templates | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U109-R021 | Email Templates | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U109-R022 | SMS Templates | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U109-R023 | WhatsApp Templates | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U109-R024 | Notification Templates | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U109-R025 | AI Providers | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U109-R026 | API Settings | F-01 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U109-R027 | Integration Settings | F-01 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U109-R028 | Feature Flags | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U109-R029 | Subscription Plans | F-01 | A-04 | ADR-007 | DD-04 | DD-17 COM family | MATERIAL_SHARED |
| S2.2-U109-R030 | Trial Plans | F-01 | A-04 | ADR-007 | DD-04 | DD-17 COM family | MATERIAL_SHARED |
| S2.2-U109-R031 | Roles | F-01 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U109-R032 | Permissions | F-01 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U109-R033 | Security Policies | F-01 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U109-R034 | Maintenance | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U109-R035 | Master Data | F-01 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U109-R036 | Lookup Values | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U109-R037 | Custom Fields | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U109-R038 | Dynamic Fields | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U109-R039 | Communication Providers | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U109-R040 | Payment Providers | F-01 | A-04 | ADR-007 | DD-04 | DD-17 COM family | MATERIAL_SHARED |
| S2.2-U109-R041 | Storage Providers | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U109-R042 | Enterprise Integrations | F-01 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U109-R043 | Lab Admin shall manage only tenant-owned resources permitted by Super Admin and Subscription Plan. | F-01 | A-04 | ADR-007 | DD-04 | DD-17 COM family | MATERIAL_SHARED |
| S2.2-U110-R001 | > Default token values (brand colors, font families, font size scale, spacing scale, border radius): see Enterprise Default Standards and Enterprise UI Design System — the authoritative source of default values. This section defines only the governance requirement that Super Admin can change these dynamically without code modification. | F-01 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U110-R002 | Super Admin shall dynamically manage: | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U110-R003 | Primary Font Family | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U110-R004 | Secondary Font Family | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U110-R005 | Heading Font | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U110-R006 | Body Font | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U110-R007 | Font Size Scale | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U110-R008 | Font Weight | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U110-R009 | Line Height | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U110-R010 | Letter Spacing | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U110-R011 | Border Radius | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U110-R012 | Spacing Scale | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U110-R013 | Theme settings shall be stored in the database and applied dynamically across: | F-01 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U110-R014 | SaaS Website | F-01 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U110-R015 | Laboratory Websites | F-01 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U110-R016 | Super Admin Portal | F-01 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U110-R017 | 🆕 Tenant Web Portal | F-01 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.2-U110-R018 | Mobile Applications (where supported) | F-01 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.2-U110-R019 | No source code modification shall be required for typography customization. | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U111-R001 | The platform shall be: | F-01/A-10 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U111-R002 | Production Ready | F-01/A-10 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U111-R003 | Enterprise Ready | F-01/A-10 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U111-R004 | Commercial SaaS Ready | F-01/A-10 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U111-R005 | Multi-Tenant Ready | F-01/A-10 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U111-R006 | API Ready | F-01/A-10 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U111-R007 | Mobile Ready | F-01/A-10 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.2-U111-R008 | AI Ready | F-01/A-10 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U111-R009 | Integration Ready | F-01/A-10 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U111-R010 | High Availability Ready | F-01/A-10 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U111-R011 | Scalable | F-01/A-10 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U111-R012 | Secure | F-01/A-10 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U111-R013 | Modular | F-01/A-10 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U111-R014 | Recoverable | F-01/A-10 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U111-R015 | cPanel Compatible | F-01/A-10 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U111-R016 | Linux Compatible | F-01/A-10 | A-08 | ADR-015 | DD-12 | DD-17 DESK family | MATERIAL_SHARED |
| S2.2-U111-R017 | Cloud Ready | F-01/A-10 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U111-R018 | Docker Optional | F-01/A-10 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U111-R019 | Future Proof | F-01/A-10 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U113-R001 | The platform shall support enterprise-grade laboratory analyzer integration. | F-07/F-02/F-01 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U113-R002 | ASTM Interface | F-07/F-02/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U113-R003 | HL7 Interface Engine | F-07/F-02/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U113-R004 | Uni-directional Analyzer Support | F-07/F-02/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U113-R005 | Bi-directional Analyzer Support | F-07/F-02/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U113-R006 | Machine Driver Management | F-07/F-02/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U113-R007 | Analyzer Mapping | F-07/F-02/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U113-R008 | Instrument Configuration | F-07/F-02/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U113-R009 | Auto Result Import | F-07/F-02/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U113-R010 | Auto Result Validation Rules | F-07/F-02/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U113-R011 | Instrument QC Integration | F-07/F-02/F-01 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U113-R012 | Connectivity Monitoring | F-07/F-02/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U113-R013 | Analyzer Error Logs | F-07/F-02/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U114-R001 | The platform shall provide enterprise reporting and business intelligence. | F-07/F-02/F-01 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U114-R002 | Custom Report Builder | F-07/F-02/F-01 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U114-R003 | Dashboard Builder | F-07/F-02/F-01 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U114-R004 | Saved Reports | F-07/F-02/F-01 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U114-R005 | Scheduled Reports | F-07/F-02/F-01 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U114-R006 | Dynamic Report Designer | F-07/F-02/F-01 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U114-R007 | Pivot Reports | F-07/F-02/F-01 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U114-R008 | KPI Builder | F-07/F-02/F-01 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U114-R009 | Export Templates | F-07/F-02/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U114-R010 | Executive Dashboards | F-07/F-02/F-01 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U114-R011 | Business Intelligence Ready | F-07/F-02/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U114-R012 | Excel Export | F-07/F-02/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U114-R013 | PDF Export | F-07/F-02/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U114-R014 | CSV Export | F-07/F-02/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U115-R001 | The platform shall implement enterprise disaster recovery standards. | F-07/F-02/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U115-R002 | Recovery Point Objective (RPO) | F-07/F-02/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U115-R003 | Recovery Time Objective (RTO) | F-07/F-02/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U115-R004 | Backup Retention Policy | F-07/F-02/F-01 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U115-R005 | Backup Verification | F-07/F-02/F-01 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U115-R006 | Restore Verification | F-07/F-02/F-01 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U115-R007 | Disaster Recovery SOP | F-07/F-02/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U115-R008 | Periodic Recovery Testing | F-07/F-02/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U115-R009 | Recovery Audit Logs | F-07/F-02/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U116-R001 | The product shall satisfy enterprise quality standards before production deployment. | F-07/F-02/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U116-R002 | Unit Testing | F-07/F-02/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U116-R003 | Feature Testing | F-07/F-02/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U116-R004 | API Testing | F-07/F-02/F-01 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U116-R005 | Browser / End-to-End Testing | F-07/F-02/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U116-R006 | Load Testing | F-07/F-02/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U116-R007 | Stress Testing | F-07/F-02/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U116-R008 | Security Testing | F-07/F-02/F-01 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U116-R009 | Vulnerability Scanning | F-07/F-02/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U116-R010 | Penetration Testing | F-07/F-02/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U116-R011 | User Acceptance Testing (UAT) | F-07/F-02/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U116-R012 | Production release shall not be approved until all critical tests pass. | F-07/F-02/F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U117-R001 | The platform architecture shall support future expansion without affecting existing modules. | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U117-R002 | Plugin Architecture | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U117-R003 | Module Installer | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U117-R004 | Marketplace Ready | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U117-R005 | Third-party Extensions | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U117-R006 | Theme Marketplace | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U117-R007 | API Marketplace | F-01 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U117-R008 | Extension SDK Ready | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U118-R001 | The platform shall maintain complete historical records. | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U118-R002 | Entity Change History | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U118-R003 | Configuration Version History | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U118-R004 | Record Versioning | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U118-R005 | Soft Delete | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U118-R006 | Restore Deleted Records | F-01 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U118-R007 | Change Logs | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U118-R008 | User Activity History | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U119-R001 | The platform shall include enterprise productivity tools. | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U119-R002 | Global Search | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U119-R003 | Universal Search | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U119-R004 | Advanced Filters | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U119-R005 | Saved Filters | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U119-R006 | Smart Search | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U119-R007 | Bulk Operations | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U119-R008 | Import Wizard | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U119-R009 | Export Wizard | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U119-R010 | Bulk Update | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U119-R011 | Bulk Delete | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U119-R012 | Bulk Assignment | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U120-R001 | The platform shall include enterprise document management. | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U120-R002 | Patient Documents | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U120-R003 | Staff Documents | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U120-R004 | Vendor Documents | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U120-R005 | Corporate Documents | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U120-R006 | Insurance Documents | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U120-R007 | Digital Archive | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U120-R008 | Document Categories | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U120-R009 | File Versioning | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U120-R010 | OCR Ready | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U120-R011 | Secure File Storage | F-01 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U121-R001 | The platform shall support international deployment. | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U121-R002 | Multi-language | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U121-R003 | Multi-currency | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U121-R004 | Multi-timezone | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U121-R005 | RTL Language Support | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U121-R006 | Regional Date Formats | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U121-R007 | Regional Number Formats | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U121-R008 | Localization Ready | F-01 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U122-R001 | Minimum 99.9% Service Availability | F-01/F-04/F-02 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U122-R002 | API Response Time Targets | F-01/F-04/F-02 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U122-R003 | Dashboard Response Time Targets | F-01/F-04/F-02 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.2-U122-R004 | Concurrent User Support | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U122-R005 | Large Database Support | F-01/F-04/F-02 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U122-R006 | Large File Storage Support | F-01/F-04/F-02 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U122-R007 | CDN Ready | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U122-R008 | Auto Scaling Ready | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U122-R009 | Performance Benchmarking | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U122-R010 | Capacity Planning | F-01/F-04/F-02 | A-04 | ADR-007 | DD-04 | DD-17 COM family | MATERIAL_SHARED |
| S2.2-U122-R011 | Resource Monitoring | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U122-R012 | Performance SLA Documentation | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U123-R001 | The platform shall implement complete enterprise data lifecycle management. | F-01/F-04/F-02 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U123-R002 | Soft Delete | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U123-R003 | Hard Delete | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U123-R004 | Archive Policy | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U123-R005 | Data Retention Policy | F-01/F-04/F-02 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U123-R006 | Legal Hold Support | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U123-R007 | Record Restoration | F-01/F-04/F-02 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U123-R008 | Historical Data Archive | F-01/F-04/F-02 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U123-R009 | Automatic Data Purge Rules | F-01/F-04/F-02 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U123-R010 | Tenant-wise Retention Policy | F-01/F-04/F-02 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U123-R011 | Backup-aware Deletion | F-01/F-04/F-02 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U123-R012 | GDPR-style Deletion Ready | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U123-R013 | Complete Audit Preservation | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U125-R001 | Security Logs | F-01/F-04/F-02 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U125-R002 | Communication Logs | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U125-R003 | Exception Logs | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U125-R004 | Performance Logs | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U125-R005 | Log Retention Policy | F-01/F-04/F-02 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U125-R006 | Log Rotation | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U125-R007 | Searchable Logs | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U125-R008 | Export Logs | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U125-R009 | Alert Rules | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U125-R010 | Centralized Monitoring Ready | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U126-R001 | The communication engine shall support enterprise-grade message delivery. | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U126-R002 | Retry Strategy | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U126-R003 | Queue Priority | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U126-R004 | Delayed Delivery | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U126-R005 | Scheduled Delivery | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U126-R006 | Failover Providers | F-01/F-04/F-02 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U126-R007 | Dead Letter Queue | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U126-R008 | Delivery Tracking | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U126-R009 | Read Status | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U126-R010 | Failure Handling | F-01/F-04/F-02 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U126-R011 | Notification SLA | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U126-R012 | Bulk Notification Optimization | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U127-R001 | The platform shall support enterprise software delivery practices. | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U127-R002 | Git-based Version Control | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U127-R003 | Branching Strategy | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U127-R004 | Release Versioning | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U127-R005 | Semantic Versioning | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U127-R006 | Automated Build Pipeline | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U127-R007 | Automated Deployment | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U127-R008 | Zero-downtime Deployment Ready | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U127-R009 | Blue-Green Deployment Ready | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U127-R010 | Rollback Strategy | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U127-R011 | Release Checklist | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U127-R012 | Production Release Approval Workflow | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U128-R001 | The platform shall support enterprise lifecycle management. | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U128-R002 | Bug Severity Classification | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U128-R003 | SLA Definition | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U128-R004 | Hotfix Policy | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U128-R005 | Patch Management | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U128-R006 | Upgrade Policy | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U128-R007 | Long-Term Support (LTS) | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U128-R008 | Version Compatibility | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U128-R009 | Maintenance Windows | F-01/F-04/F-02 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U128-R010 | End-of-Life Policy | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U128-R011 | Customer Support Workflow | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U128-R012 | Knowledge Base Updates | F-01/F-04/F-02 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U130-R001 | The product shall be considered complete only when: | F-00 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U130-R002 | All functional modules are implemented. | F-00 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U130-R003 | Multi-tenancy is verified. | F-00 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U130-R004 | Security validation is complete. | F-00 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U130-R005 | API validation is complete. | F-00 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U130-R006 | Mobile APIs are complete. | F-00 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.2-U130-R007 | AI providers are operational. | F-00 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U130-R008 | Enterprise integrations are ready. | F-00 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U130-R009 | Dynamic configuration is fully operational. | F-00 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U130-R010 | Documentation is complete. | F-00 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U130-R011 | User manuals are complete. | F-00 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U130-R012 | Deployment guides are complete. | F-00 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U130-R013 | Backup and recovery are verified. | F-00 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.2-U130-R014 | Performance testing is complete. | F-00 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U130-R015 | Automated testing passes. | F-00 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U130-R016 | Production readiness audit passes. | F-00 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U130-R017 | All configurable business settings are manageable without source code modification wherever reasonably possible. | F-00 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U131-R001 | SBGlobal Plus shall be a premium AI-powered 🆕 enterprise Multi-Tenant, Multi-Industry SaaS platform where: | F-00 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U131-R002 | Super Admin controls the complete SaaS ecosystem. | F-00 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U131-R003 | 🆕 Every tenant — across Healthcare & Diagnostics and every supported Industry Vertical Suite — operates independently with strict tenant isolation. | F-00 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.2-U131-R004 | Patients, Doctors, Staff, Branches and Enterprise Partners collaborate securely. | F-00 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U131-R005 | Mobile applications consume secure REST APIs. | F-00 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.2-U131-R006 | AI assists business and medical workflows. | F-00 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.2-U131-R007 | Enterprise integrations support hospitals, clinics and healthcare systems 🆕 and other supported Industry Vertical Suites. | F-00 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.2-U131-R008 | Business configuration requires no developer intervention wherever reasonably possible. | F-00 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.2-U131-R009 | The platform is fully production-ready, commercially deployable and future-ready. | F-00 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.3-U134-R001 | Fast page loading | F-01/A-10/A-11 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.3-U134-R002 | Optimized database queries | F-01/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.3-U134-R003 | Efficient API responses | F-01/A-10/A-11 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.3-U134-R004 | Background queue processing | F-01/A-10/A-11 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.3-U134-R005 | Lazy loading where appropriate | F-01/A-10/A-11 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.3-U134-R006 | Caching for frequently accessed data | F-01/A-10/A-11 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.3-U135-R001 | Horizontal scaling ready | F-01/A-10/A-11 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.3-U135-R002 | Modular architecture | F-01/A-10/A-11 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.3-U135-R003 | Multi-tenant scalability | F-01/A-10/A-11 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.3-U135-R004 | API scalability | F-01/A-10/A-11 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.3-U135-R005 | AI scalability | F-01/A-10/A-11 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U135-R006 | Mobile scalability | F-01/A-10/A-11 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.3-U136-R001 | High availability architecture | F-01/A-10/A-11 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U136-R002 | Graceful error handling | F-01/A-10/A-11 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.3-U136-R003 | Automatic recovery where possible | F-01/A-10/A-11 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.3-U136-R004 | Zero data loss during normal operations | F-01/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.3-U137-R001 | Scheduled backups | F-01/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.3-U137-R002 | Database backups | F-01/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.3-U137-R003 | File storage backups | F-01/A-10/A-11 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U137-R004 | Backup verification | F-01/A-10/A-11 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.3-U137-R005 | Restore capability | F-01/A-10/A-11 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.3-U137-R006 | Disaster recovery procedures | F-01/A-10/A-11 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.3-U138-R001 | Application logs | F-01/A-10/A-11 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.3-U138-R002 | API logs | F-01/A-10/A-11 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.3-U138-R003 | Authentication logs | F-01/A-10/A-11 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.3-U138-R004 | Audit logs | F-01/A-10/A-11 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.3-U138-R005 | Error logs | F-01/A-10/A-11 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.3-U138-R006 | AI usage logs | F-01/A-10/A-11 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U138-R007 | Integration logs | F-01/A-10/A-11 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.3-U138-R008 | Queue monitoring | F-01/A-10/A-11 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.3-U138-R009 | Scheduler monitoring | F-01/A-10/A-11 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.3-U139-R001 | Distributed Tracing Ready | F-01/A-10/A-11 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.3-U139-R002 | Metrics Collection | F-01/A-10/A-11 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.3-U140-R001 | Configuration cache | Governing MI/Detailed Design | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U140-R002 | Route cache | Governing MI/Detailed Design | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U140-R003 | View cache | Governing MI/Detailed Design | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U140-R004 | Query cache where applicable | Governing MI/Detailed Design | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U140-R005 | Redis-ready architecture | Governing MI/Detailed Design | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U141-R001 | > **Full ownership: `SBGlobal_Plus_Database_Architecture_Standards.md`** (Core Source of Truth for database architecture, naming conventions, identifiers, performance, security, backup, and data governance). The list below is the minimum engineering baseline checklist only; do not extend it here — extend the Database Architecture Standards document instead. | Governing MI/Detailed Design | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.3-U141-R002 | UUID support where appropriate | Governing MI/Detailed Design | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U141-R003 | Foreign key constraints | Governing MI/Detailed Design | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U141-R004 | Proper indexing strategy | Governing MI/Detailed Design | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U141-R005 | Normalized schema | Governing MI/Detailed Design | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U141-R006 | Soft Deletes where applicable | Governing MI/Detailed Design | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U141-R007 | Created By / Updated By tracking | Governing MI/Detailed Design | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U141-R008 | Created At / Updated At timestamps | Governing MI/Detailed Design | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U141-R009 | Audit history support | Governing MI/Detailed Design | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U141-R010 | Tenant isolation at database level | Governing MI/Detailed Design | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.3-U141-R011 | No orphan records | Governing MI/Detailed Design | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U141-R012 | Optimized relationships | Governing MI/Detailed Design | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U141-R013 | Migration-based schema management | Governing MI/Detailed Design | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U142-R001 | All development shall follow modern Laravel engineering practices. | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U142-R002 | Laravel Best Practices | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U142-R003 | PSR-12 Coding Standard | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U142-R004 | SOLID Principles | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U142-R005 | Clean Architecture | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U142-R006 | Service Layer Architecture | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U142-R007 | Repository Pattern where appropriate | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U142-R008 | Action Classes where appropriate | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U142-R009 | Dependency Injection | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U142-R010 | Interface-based programming where appropriate | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U142-R011 | Reusable components | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U142-R012 | Modular code organization | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U142-R013 | DRY (Don't Repeat Yourself) | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U142-R014 | KISS (Keep It Simple) | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U142-R015 | Clear naming conventions | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U142-R016 | Proper exception handling | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U142-R017 | Comprehensive documentation | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U143-R001 | Static Code Analysis | Governing MI/Detailed Design | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U143-R002 | PHPStan Compliance | Governing MI/Detailed Design | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U143-R003 | Laravel Pint Formatting | Governing MI/Detailed Design | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U143-R004 | Dead Code Detection | Governing MI/Detailed Design | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U143-R005 | Duplicate Code Detection | Governing MI/Detailed Design | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U143-R006 | Technical Debt Monitoring | Governing MI/Detailed Design | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U144-R001 | Approved Package Policy | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U144-R002 | License Compatibility Verification | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U144-R003 | Security Vulnerability Scanning | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U144-R004 | Regular Dependency Updates | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U144-R005 | Composer Lock File Validation | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U146-R001 | OWASP Top 10 protection | F-03/A-03 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.3-U146-R002 | CSRF protection | F-03/A-03 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.3-U146-R003 | XSS protection | F-03/A-03 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.3-U146-R004 | SQL Injection protection | F-03/A-03 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.3-U146-R005 | Secure Authentication | F-03/A-03 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.3-U146-R006 | Role-Based Access Control (RBAC) | F-03/A-03 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.3-U146-R007 | Tenant isolation enforcement | F-03/A-03 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.3-U146-R008 | Password hashing | F-03/A-03 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.3-U146-R009 | AES-256 encryption for sensitive data | F-03/A-03 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.3-U146-R010 | HTTPS-only communication | F-03/A-03 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.3-U146-R011 | Secure HTTP headers | F-03/A-03 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.3-U146-R012 | Rate limiting | F-03/A-03 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.3-U146-R013 | Brute-force protection | F-03/A-03 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.3-U146-R014 | Session security | F-03/A-03 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.3-U146-R015 | Input validation | F-03/A-03 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.3-U146-R016 | Output escaping | F-03/A-03 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.3-U146-R017 | Secure file uploads | F-03/A-03 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.3-U146-R018 | Audit logging | F-03/A-03 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.3-U146-R019 | API security | F-03/A-03 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.3-U146-R020 | JWT security | F-03/A-03 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.3-U146-R021 | API Key security | F-03/A-03 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.3-U146-R022 | IP Whitelisting support | F-03/A-03 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.3-U147-R001 | 🆕 Centralized Secrets Vault | Governing MI/Detailed Design | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U147-R002 | 🆕 Automated Key Rotation | Governing MI/Detailed Design | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U147-R003 | 🆕 Hardware Security Module (HSM) Support (where applicable) | Governing MI/Detailed Design | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.3-U148-R001 | 🆕 API Gateway | Governing MI/Detailed Design | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U148-R002 | 🆕 Per-Tenant Rate Limiting | Governing MI/Detailed Design | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U148-R003 | 🆕 Per-Endpoint Rate Limiting | Governing MI/Detailed Design | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U148-R004 | 🆕 Web Application Firewall (WAF) | Governing MI/Detailed Design | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U148-R005 | 🆕 DDoS Protection | Governing MI/Detailed Design | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U148-R006 | 🆕 Bot Detection | Governing MI/Detailed Design | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U149-R001 | 🆕 Scheduled Penetration Testing | Governing MI/Detailed Design | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U149-R002 | 🆕 Vulnerability Disclosure / Bug Bounty Policy | Governing MI/Detailed Design | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U149-R003 | 🆕 Security Incident Response Runbook | Governing MI/Detailed Design | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.3-U149-R004 | 🆕 Breach Notification Procedure | Governing MI/Detailed Design | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U151-R001 | Models | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U151-R002 | Services | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U151-R003 | Helpers | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U151-R004 | Business logic | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U152-R001 | Authentication | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U152-R002 | Authorization | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U152-R003 | CRUD operations | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U152-R004 | Portals | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U152-R005 | Billing | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U152-R006 | Reports | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U152-R007 | AI | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U152-R008 | APIs | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U153-R001 | Third-party integrations | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U153-R002 | Payment gateways | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U153-R003 | AI providers | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U153-R004 | Communication providers | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U153-R005 | External APIs | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U154-R001 | Cross-tenant access prevention | F-03/A-03 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U154-R002 | Resource ownership validation | F-03/A-03 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U154-R003 | Permission enforcement | F-03/A-03 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U154-R004 | Subscription restrictions | F-03/A-03 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U155-R001 | Authentication | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U155-R002 | Authorization | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U155-R003 | Validation | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U155-R004 | Rate limiting | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U155-R005 | Versioning | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U155-R006 | Error responses | Governing MI/Detailed Design | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U156-R001 | Load testing | F-01/A-10/A-11 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U156-R002 | Stress testing | F-01/A-10/A-11 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U156-R003 | Database performance | F-01/A-10/A-11 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U156-R004 | Queue performance | F-01/A-10/A-11 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U156-R005 | API response time | F-01/A-10/A-11 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.3-U157-R001 | All automated tests pass | Governing MI/Detailed Design | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U157-R002 | No critical security issues | Governing MI/Detailed Design | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.3-U157-R003 | No database migration conflicts | Governing MI/Detailed Design | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U157-R004 | No tenant isolation issues | Governing MI/Detailed Design | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.3-U157-R005 | No permission escalation issues | Governing MI/Detailed Design | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.3-U157-R006 | No unresolved critical bugs | Governing MI/Detailed Design | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U157-R007 | Documentation is up to date | Governing MI/Detailed Design | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U157-R008 | Production checklist completed | Governing MI/Detailed Design | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U157-R009 | Static Analysis Passed | Governing MI/Detailed Design | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U157-R010 | Dependency Security Scan Passed | Governing MI/Detailed Design | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.3-U157-R011 | Code Style Validation Passed | Governing MI/Detailed Design | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.3-U157-R012 | Release Tag Verified | Governing MI/Detailed Design | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.4-U160-R001 | Website | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U160-R002 | Super Admin | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U160-R003 | 🆕 Tenant Web Portal | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U160-R004 | LIS | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U160-R005 | Billing | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U160-R006 | Inventory | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U160-R007 | APIs | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U160-R008 | Mobile Apps | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U160-R009 | Analytics | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U161-R001 | MySQL (Default) | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U161-R002 | MariaDB | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U161-R003 | PostgreSQL (Future Support) | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U162-R001 | Multi-Tenant | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U162-R002 | Configuration Driven | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U162-R003 | Database Driven | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U162-R004 | Modular | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U162-R005 | Scalable | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U162-R006 | Normalized | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U162-R007 | API First | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U163-R001 | Master Tables | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U163-R002 | Transaction Tables | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U163-R003 | Mapping Tables | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U163-R004 | Configuration Tables | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U163-R005 | Audit Tables | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U163-R006 | Log Tables | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U163-R007 | Notification Tables | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U163-R008 | Queue Tables | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U163-R009 | AI Tables | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U163-R010 | Template Tables | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U163-R011 | CMS Tables | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U163-R012 | API Tables | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U163-R013 | Analytics Tables | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U163-R014 | Session Tables | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U163-R015 | Security Tables | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U164-R001 | UUID Primary Key | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U164-R002 | Tenant ID | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U164-R003 | Branch ID | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U164-R004 | Department ID | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U164-R005 | 🆕 Industry Vertical Suite Reference (per Tenant) | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U165-R001 | snake_case | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U165-R002 | Plural Table Names | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U165-R003 | Singular Model Names | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U165-R004 | Foreign Key Standards | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U165-R005 | Index Naming Standards | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U166-R001 | Soft Delete | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U166-R002 | Audit Trail | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U166-R003 | Created By | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U166-R004 | Updated By | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U166-R005 | Deleted By | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U166-R006 | Created At | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U166-R007 | Updated At | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U166-R008 | Deleted At | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U167-R001 | Fast page loading | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U167-R002 | Optimized database queries | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U167-R003 | Efficient API responses | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U167-R004 | Background queue processing | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U167-R005 | Lazy loading where appropriate | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U167-R006 | Caching for frequently accessed data | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U167-R007 | Source item 7 under "Performance" requires exact material extraction/verification. | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U167-R008 | Source item 8 under "Performance" requires exact material extraction/verification. | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U167-R009 | Source item 9 under "Performance" requires exact material extraction/verification. | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U168-R001 | Tenant Isolation | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U168-R002 | Encrypted Fields | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U168-R003 | Password Hashing | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U168-R004 | API Token Security | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U168-R005 | Database Backup | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U168-R006 | Access Logging | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U169-R001 | 🆕 Configurable Region / Data-Center Selection (per Tenant) | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U169-R002 | 🆕 Regional Database Instance Support | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U169-R003 | 🆕 Data Sovereignty Compliance Mapping | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U170-R001 | Daily Backup | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U170-R002 | Weekly Backup | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U170-R003 | Monthly Backup | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U170-R004 | Restore Validation | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U170-R005 | Disaster Recovery | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U171-R001 | Validation Rules | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U171-R002 | Reference Integrity | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U171-R003 | Migration Standards | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U171-R004 | Seeder Standards | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U171-R005 | Schema Versioning | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U171-R006 | Migration Version Control | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U171-R007 | Rollback Strategy | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U171-R008 | Data Archival Strategy | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U171-R009 | Data Retention Policy | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U172-R001 | REST API | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U172-R002 | FHIR | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U172-R003 | HL7 | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U172-R004 | Webhook | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U172-R005 | Import | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U172-R006 | Export | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U172-R007 | Queue | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.4-U172-R008 | Scheduler | F-04/F-11/A-05 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.5-U176-R001 | Website | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U176-R002 | Super Admin | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U176-R003 | 🆕 Tenant Web Portal | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U176-R004 | LIS | F-06/A-08 | A-09 + A-02/A-03/A-05/A-06/A-07/A-08 | ADR-002/004/005/006/008/010/012 | DD-13 + HLT-LIS canonical industry DD + DD-21/DD-22/DD-23/DD-24/DD-25 | HLT-LIS-T001…T014 + applicable KPI T01/T02 | MATERIAL_MS |
| S2.5-U176-R005 | Billing | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U176-R006 | Inventory | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U176-R007 | APIs | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U176-R008 | Mobile Apps | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U176-R009 | Analytics | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U177-R001 | Android | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U177-R002 | iOS | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U177-R003 | Future: Web App (PWA) | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U180-R001 | Multi-Tenant | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U180-R002 | Configuration Driven | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U180-R003 | Database Driven | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U180-R004 | Modular | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U180-R005 | Scalable | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U180-R006 | Normalized | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U180-R007 | API First | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U180-R008 | Source item 8 under "Architecture" requires exact material extraction/verification. | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U180-R009 | Source item 9 under "Architecture" requires exact material extraction/verification. | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U181-R001 | Riverpod (Default) | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U181-R002 | Future Support: Bloc, Cubit | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U182-R001 | SQLite | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U182-R002 | Hive | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U182-R003 | Secure Storage | F-06/A-08 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.5-U182-R004 | Shared Preferences | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U183-R001 | API Cache | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U183-R002 | Image Cache | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U183-R003 | Configuration Cache | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U183-R004 | Offline Cache | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U184-R001 | REST API | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U184-R002 | JSON | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U184-R003 | HTTPS | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U184-R004 | JWT | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U184-R005 | Multipart Upload | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U184-R006 | Retry Mechanism | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U185-R001 | Background Sync | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U185-R002 | Auto Retry | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U185-R003 | Queue Processing | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U185-R004 | Offline Upload | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U186-R001 | Offline First Architecture | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U186-R002 | Local Queue Management | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U186-R003 | Automatic Conflict Resolution | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U186-R004 | Incremental Synchronization | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U186-R005 | Sync Retry Policy | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U187-R001 | Firebase Cloud Messaging (FCM) | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U187-R002 | Push Notification | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U187-R003 | Local Notification | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U187-R004 | SMS Trigger | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U187-R005 | WhatsApp Trigger | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U187-R006 | Email Trigger | F-06/A-08 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.5-U188-R001 | • JWT Authentication (API Only) | F-03/F-06/A-03/A-08 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.5-U188-R002 | Source item 2 under "Authentication" requires exact material extraction/verification. | F-03/F-06/A-03/A-08 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.5-U188-R003 | Source item 3 under "Authentication" requires exact material extraction/verification. | F-03/F-06/A-03/A-08 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.5-U188-R004 | Source item 4 under "Authentication" requires exact material extraction/verification. | F-03/F-06/A-03/A-08 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.5-U188-R005 | Source item 5 under "Authentication" requires exact material extraction/verification. | F-03/F-06/A-03/A-08 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.5-U188-R006 | Source item 6 under "Authentication" requires exact material extraction/verification. | F-03/F-06/A-03/A-08 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.5-U188-R007 | Source item 7 under "Authentication" requires exact material extraction/verification. | F-03/F-06/A-03/A-08 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.5-U188-R008 | Source item 8 under "Authentication" requires exact material extraction/verification. | F-03/F-06/A-03/A-08 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.5-U188-R009 | Source item 9 under "Authentication" requires exact material extraction/verification. | F-03/F-06/A-03/A-08 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.5-U188-R010 | Source item 10 under "Authentication" requires exact material extraction/verification. | F-03/F-06/A-03/A-08 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.5-U189-R001 | Tenant Isolation | F-03/F-06/A-03/A-08 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.5-U189-R002 | Encrypted Fields | F-03/F-06/A-03/A-08 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.5-U189-R003 | Password Hashing | F-03/F-06/A-03/A-08 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.5-U189-R004 | API Token Security | F-03/F-06/A-03/A-08 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.5-U189-R005 | Database Backup | F-03/F-06/A-03/A-08 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.5-U189-R006 | Access Logging | F-03/F-06/A-03/A-08 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.5-U189-R007 | Source item 7 under "Security" requires exact material extraction/verification. | F-03/F-06/A-03/A-08 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.5-U189-R008 | Source item 8 under "Security" requires exact material extraction/verification. | F-03/F-06/A-03/A-08 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.5-U190-R001 | QR Scanner | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U190-R002 | Barcode Scanner | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U190-R003 | Patient QR | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U190-R004 | Report QR | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U190-R005 | Invoice QR | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U190-R006 | Sample Barcode | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U191-R001 | Camera | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U191-R002 | Gallery | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U191-R003 | GPS | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U191-R004 | Bluetooth | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U191-R005 | Microphone | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U191-R006 | File Picker | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U191-R007 | PDF Viewer | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U191-R008 | Printer Support | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U191-R009 | Share | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U191-R010 | Deep Linking | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U193-R001 | Dashboard | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U193-R002 | Appointments | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U193-R003 | Lab Booking | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U193-R004 | Reports | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U193-R005 | Invoices | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U193-R006 | Payments | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U193-R007 | Medical History | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U193-R008 | Prescription | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U193-R009 | Notifications | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U193-R010 | AI Assistant | F-06/A-08 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.5-U193-R011 | Profile | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U194-R001 | Dashboard | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U194-R002 | Patients | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U194-R003 | Appointments | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U194-R004 | Reports | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U194-R005 | Prescription | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U194-R006 | AI Summary | F-06/A-08 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.5-U194-R007 | Digital Signature | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U194-R008 | Notifications | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U194-R009 | Calendar | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U194-R010 | Sample Collection | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U194-R011 | Barcode Scan | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U194-R012 | QR Scan | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U194-R013 | Worklist | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U194-R014 | Result Entry | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U194-R015 | Pending Tests | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U194-R016 | Machine Status | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U194-R017 | Offline Sync | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U195-R001 | Dashboard | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U195-R002 | Revenue | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U195-R003 | Analytics | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U195-R004 | Users | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U195-R005 | Branches | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U195-R006 | Doctors | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U195-R007 | Patients | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U195-R008 | Approvals | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U195-R009 | Reports | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U195-R010 | Notifications | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U197-R001 | AI Chat | F-06/A-08 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.5-U197-R002 | AI Copilot | F-06/A-08 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.5-U197-R003 | AI Search | F-06/A-08 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.5-U197-R004 | AI OCR | F-06/A-08 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.5-U197-R005 | AI Report Summary | F-06/A-08 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.5-U197-R006 | AI Recommendations | F-06/A-08 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.5-U197-R007 | Voice Assistant | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U197-R008 | AI Notification Generator | F-06/A-08 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.5-U198-R001 | Fast page loading | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U198-R002 | Optimized database queries | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U198-R003 | Efficient API responses | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U198-R004 | Background queue processing | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U198-R005 | Lazy loading where appropriate | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U198-R006 | Caching for frequently accessed data | F-06/A-08 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.5-U199-R001 | Distributed Tracing Ready | A-11 | see current owner | UD-TECH-01 | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.5-U199-R002 | Metrics Collection | A-11 | see current owner | UD-TECH-01 | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.5-U199-R003 | Source item 3 under "Observability" requires exact material extraction/verification. | A-11 | see current owner | UD-TECH-01 | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.5-U200-R001 | Dark Mode | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U200-R002 | Light Mode | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U200-R003 | Large Fonts | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U200-R004 | Screen Reader | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U200-R005 | High Contrast | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U200-R006 | Offline Support | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U201-R001 | Tenant Isolation | F-06/A-08 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.5-U201-R002 | Branch Isolation | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U201-R003 | Role Based Access | F-06/A-08 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.5-U201-R004 | Feature Flags | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U201-R005 | White Label Support | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U202-R001 | Unit Test | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U202-R002 | Widget Test | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U202-R003 | Integration Test | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U202-R004 | API Test | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U202-R005 | Performance Test | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U202-R006 | Security Test | F-06/A-08 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.5-U203-R001 | Google Play Store | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U203-R002 | Apple App Store | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U203-R003 | Enterprise APK | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U203-R004 | MDM Support | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U204-R001 | In-App Update Support | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U204-R002 | Minimum Supported Version Policy | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U204-R003 | Force Update Support | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U205-R001 | GitHub Actions | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U205-R002 | Codemagic | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U205-R003 | Fastlane | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U206-R001 | Semantic Versioning | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.5-U206-R002 | Backward Compatibility Policy | F-06/A-08 | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.6-U209-R001 | Website | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U209-R002 | Super Admin | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U209-R003 | 🆕 Tenant Web Portal | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U209-R004 | LIS | F-05/A-07 | A-09 + A-02/A-03/A-05/A-06/A-07/A-08 | ADR-002/004/005/006/008/010/012 | DD-13 + HLT-LIS canonical industry DD + DD-21/DD-22/DD-23/DD-24/DD-25 | HLT-LIS-T001…T014 + applicable KPI T01/T02 | MATERIAL_MS |
| S2.6-U209-R005 | Billing | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U209-R006 | Inventory | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U209-R007 | APIs | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U209-R008 | Mobile Apps | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U209-R009 | Analytics | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U209-R010 | Source item 10 under "Scope" requires exact material extraction/verification. | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U210-R001 | Source item 1 under "Supported AI Providers" requires exact material extraction/verification. | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U210-R002 | Source item 2 under "Supported AI Providers" requires exact material extraction/verification. | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U210-R003 | Source item 3 under "Supported AI Providers" requires exact material extraction/verification. | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U210-R004 | Source item 4 under "Supported AI Providers" requires exact material extraction/verification. | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U210-R005 | Source item 5 under "Supported AI Providers" requires exact material extraction/verification. | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U210-R006 | Source item 6 under "Supported AI Providers" requires exact material extraction/verification. | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U210-R007 | Source item 7 under "Supported AI Providers" requires exact material extraction/verification. | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U210-R008 | Source item 8 under "Supported AI Providers" requires exact material extraction/verification. | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U210-R009 | Source item 9 under "Supported AI Providers" requires exact material extraction/verification. | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U210-R010 | Source item 10 under "Supported AI Providers" requires exact material extraction/verification. | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U210-R011 | Source item 11 under "Supported AI Providers" requires exact material extraction/verification. | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U210-R012 | Source item 12 under "Supported AI Providers" requires exact material extraction/verification. | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U210-R013 | Source item 13 under "Supported AI Providers" requires exact material extraction/verification. | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U212-R001 | General Reasoning | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U212-R002 | Enterprise Documentation | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U212-R003 | Code Generation | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U212-R004 | Code Review | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U212-R005 | Agent Orchestration | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U212-R006 | Vision AI | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U212-R007 | OCR | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U212-R008 | Speech Recognition | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U212-R009 | Text-to-Speech | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U212-R010 | Translation | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U212-R011 | Embeddings | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U212-R012 | RAG | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U212-R013 | Image Generation | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U212-R014 | Illustration Generation | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U212-R015 | SVG Generation | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U212-R016 | Video Generation | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U212-R017 | Audio Generation | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U212-R018 | Moderation | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U212-R019 | Safety & Guardrails | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U212-R020 | The Model Registry shall dynamically map providers to supported capabilities without requiring application-level changes. | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U213-R001 | AI Chat | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U213-R002 | AI Copilot | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U213-R003 | AI Assistant | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U213-R004 | AI Search | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U213-R005 | AI OCR | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U213-R006 | AI Document Parser | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U213-R007 | AI Report Summary | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U213-R008 | AI Medical Insights 🆕 (Healthcare & Diagnostics Vertical) | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U213-R009 | AI Analytics | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U213-R010 | AI Recommendation Engine | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U213-R011 | AI Notification Generator | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U213-R012 | AI Email Generator | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U213-R013 | AI WhatsApp Generator | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U213-R014 | AI Voice | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U213-R015 | AI Translation | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U213-R016 | AI Classification | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U213-R017 | AI Workflow Automation | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U213-R018 | AI Vision | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U213-R019 | AI Image Understanding | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U213-R020 | AI Video Understanding | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U213-R021 | AI Speech-to-Text | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U213-R022 | AI Text-to-Speech | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U213-R023 | AI Embeddings | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U213-R024 | AI Semantic Search | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U214-R001 | Reception Agent | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U214-R002 | Patient Agent | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U214-R003 | Doctor Agent | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U214-R004 | Lab Technician Agent | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U214-R005 | Billing Agent | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U214-R006 | Inventory Agent | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U214-R007 | Admin Agent | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U214-R008 | Support Agent | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U214-R009 | Knowledge Agent | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U214-R010 | Analytics Agent | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U215-R001 | RAG | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U215-R002 | Knowledge Base | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U215-R003 | Vector Database | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U215-R004 | Embedding Store | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U215-R005 | Document Index | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U215-R006 | Project Knowledge | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U215-R007 | Reference Documents | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U216-R001 | Conversation Memory | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U216-R002 | Tenant Memory | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U216-R003 | User Memory | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U216-R004 | Session Memory | F-05/A-07 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.6-U216-R005 | Knowledge Memory | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U217-R001 | Tenant Isolation | F-05/A-07 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.6-U217-R002 | Role Based Access | F-05/A-07 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.6-U217-R003 | Prompt Validation | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U217-R004 | Data Encryption | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U217-R005 | PII Protection | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U217-R006 | Audit Logging | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U217-R007 | Rate Limiting | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U217-R008 | Content Moderation | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U217-R009 | Prompt Injection Protection | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U217-R010 | Jailbreak Detection | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U217-R011 | AI Guardrails | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U217-R012 | Sensitive Data Detection | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U217-R013 | Model Safety Validation | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U218-R001 | REST API | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U218-R002 | SDK | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U218-R003 | Webhook | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U218-R004 | MCP | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U218-R005 | Function Calling | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U218-R006 | Streaming Response | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U218-R007 | JSON Mode | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U219-R001 | The platform shall implement intelligent model routing. | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U219-R002 | Task Type | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U219-R003 | Industry Vertical | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U219-R004 | User Role | F-05/A-07 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.6-U219-R005 | Subscription Plan | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U219-R006 | Feature Availability | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U219-R007 | Cost Policy | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U219-R008 | Performance Policy | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U219-R009 | Latency | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U219-R010 | Availability | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U219-R011 | Fallback Strategy | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U219-R012 | Documentation | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U219-R013 | Software Development | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U219-R014 | Architecture Design | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U219-R015 | Report Generation | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U219-R016 | AI Chat | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U219-R017 | AI Agents | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U219-R018 | Image Generation | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U219-R019 | Video Generation | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U219-R020 | OCR | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U219-R021 | Translation | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U219-R022 | The routing engine shall remain provider independent through the AI Provider Abstraction Layer. | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U220-R001 | The AI Platform shall support reusable workflow automation. | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U220-R002 | Multi-Step AI Processing | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U220-R003 | Human Approval | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U220-R004 | AI Approval | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U220-R005 | Conditional Routing | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U220-R006 | Scheduled AI Tasks | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U220-R007 | Event Driven Automation | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U220-R008 | Workflow Retry | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U220-R009 | Queue Processing | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U220-R010 | Long Running Jobs | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U220-R011 | Parallel Processing | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U220-R012 | The Workflow Engine shall integrate with Business Workflows and Enterprise Automation Framework. | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U221-R001 | Provider Abstraction | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U221-R002 | Prompt Templates | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U221-R003 | Model Registry | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U221-R004 | Version Control | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U221-R005 | Cost Tracking | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U221-R006 | Fallback Strategy | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U221-R007 | Retry Policy | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U221-R008 | Monitoring | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U221-R009 | Evaluation | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U221-R010 | Human Approval | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U221-R011 | AI Policy Management | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U221-R012 | AI Usage Quotas | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U221-R013 | AI Budget Management | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U221-R014 | Model Lifecycle Management | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U221-R015 | Provider Health Monitoring | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U221-R016 | The AI Platform shall integrate with the following architecture documents as they are introduced into the Enterprise Architecture documentation set. | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U222-R001 | The Enterprise Pack Architecture shall define: | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U222-R002 | AI Pack Licensing | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U222-R003 | AI Feature Packs | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U222-R004 | AI Module Packs | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U222-R005 | Industry-specific AI Packs | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U222-R006 | AI Marketplace Licensing | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U222-R007 | AI Add-on Licensing | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U222-R008 | AI Feature Enablement Policies | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U223-R001 | The Subscription & Billing Architecture shall define: | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U223-R002 | AI Billing | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U223-R003 | AI Credits | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U223-R004 | AI Usage Metering | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U223-R005 | AI Token Consumption | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U223-R006 | AI Image Generation Credits | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U223-R007 | AI Video Generation Credits | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U223-R008 | AI Audio Generation Credits | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U223-R009 | AI Monthly Usage Limits | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U223-R010 | Pay-As-You-Go Billing | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U223-R011 | Overage Billing | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U223-R012 | AI Cost Allocation | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U223-R013 | This document defines the AI platform architecture only. Licensing, commercial packaging, billing, and usage metering remain the responsibility of the Enterprise Pack Architecture and Subscription & Billing Architecture documents. | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U226-R001 | Enterprise AI Assistant | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U226-R002 | Organization AI Assistant | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U226-R003 | Tenant AI Assistant | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U226-R004 | Personal AI Assistant | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U227-R001 | Healthcare AI Assistant | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U227-R002 | Education AI Assistant | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U227-R003 | Retail & Commerce AI Assistant | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U227-R004 | Manufacturing AI Assistant | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U227-R005 | Hospitality AI Assistant | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U227-R006 | Professional Services AI Assistant | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U227-R007 | Security & Facility AI Assistant | F-05/A-07 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.6-U227-R008 | Government & NGO AI Assistant | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U229-R001 | Knowledge Agent | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U229-R002 | Workflow Agent | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U229-R003 | Automation Agent | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U229-R004 | Analytics Agent | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U229-R005 | Notification Agent | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U229-R006 | Integration Agent | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U229-R007 | Support Agent | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U229-R008 | Security Agent | F-05/A-07 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.6-U230-R001 | Each Industry Vertical Suite may define its own specialized AI Agents. | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U230-R002 | Patient Agent | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U230-R003 | Doctor Agent | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U230-R004 | Nurse Agent | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U230-R005 | Laboratory Agent | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U230-R006 | Pharmacy Agent | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U230-R007 | Appointment Agent | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U230-R008 | Billing Agent | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U230-R009 | Student Agent | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U230-R010 | Teacher Agent | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U230-R011 | Admission Agent | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U230-R012 | Examination Agent | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U230-R013 | Sales Agent | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U230-R014 | Inventory Agent | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U230-R015 | Customer Support Agent | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U230-R016 | Production Agent | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U230-R017 | Quality Control Agent | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U230-R018 | Warehouse Agent | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U230-R019 | The architecture shall support future Industry-specific AI Agents without requiring platform redesign. | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U231-R001 | The platform shall support enterprise document intelligence. | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U231-R002 | Capabilities include: | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U231-R003 | Secure Document Upload | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U231-R004 | OCR | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U231-R005 | AI Document Parsing | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U231-R006 | Classification | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U231-R007 | Metadata Extraction | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U231-R008 | Validation | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U231-R009 | Summarization | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U231-R010 | Translation | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U231-R011 | Document Comparison | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U231-R012 | AI Insights | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U231-R013 | Workflow Routing | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U231-R014 | Digital Signature Integration | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U231-R015 | Audit Logging | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U231-R016 | Supported document types include: | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U231-R017 | PDF | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U231-R018 | Office Documents | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U231-R019 | Images | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U231-R020 | Medical Reports | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U231-R021 | Identity Documents | F-05/A-07 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.6-U231-R022 | Contracts | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U231-R023 | Invoices | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U231-R024 | Certificates | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U232-R001 | The AI Platform shall expose secure APIs. | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U232-R002 | Internal AI APIs | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U232-R003 | Tenant AI APIs | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U232-R004 | Public AI APIs | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U232-R005 | Partner AI APIs | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U232-R006 | Developer APIs | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U232-R007 | REST API | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U232-R008 | GraphQL | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U232-R009 | Webhooks | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U232-R010 | MCP | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U232-R011 | SDK | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U232-R012 | Streaming APIs | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U233-R001 | The platform shall support an enterprise AI Marketplace. | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U233-R002 | AI Assistants | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U233-R003 | AI Agents | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U233-R004 | Prompt Packs | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U233-R005 | AI Skills | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U233-R006 | AI Templates | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U233-R007 | AI Workflows | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U233-R008 | AI Automations | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U233-R009 | AI Connectors | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U233-R010 | AI Plugins | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U233-R011 | AI Extensions | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U233-R012 | Marketplace resources shall be provisioned according to Subscription Plan, Tenant Configuration, RBAC, and Licensing policies. | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U234-R001 | AI resources shall be provisioned dynamically using: | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U234-R002 | Subscription Plan | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U234-R003 | Industry Vertical Suite | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U234-R004 | Feature Packs | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U234-R005 | Management System Packs | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U234-R006 | Country Packs | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U234-R007 | Localization Packs | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U234-R008 | Tenant Configuration | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U234-R009 | User Role (RBAC) | F-05/A-07 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.6-U234-R010 | The platform shall automatically enable only authorized AI capabilities for each Tenant. | F-05/A-07 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.6-U235-R001 | Prompt Management shall be centralized. | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U235-R002 | Prompt Library | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U235-R003 | Prompt Categories | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U235-R004 | Prompt Versioning | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U235-R005 | Prompt Templates | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U235-R006 | Prompt Variables | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U235-R007 | Tenant-specific Prompts | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U235-R008 | Industry-specific Prompts | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U235-R009 | Approval Workflow | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U235-R010 | Prompt Testing | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U235-R011 | Prompt Rollback | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U235-R012 | Prompt Audit History | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U235-R013 | Prompt definitions shall remain reusable across all supported AI Providers. | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U236-R001 | The platform shall support enterprise media generation. | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U236-R002 | Images | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U236-R003 | Illustrations | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U236-R004 | SVG Assets | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U236-R005 | Icons | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U236-R006 | Logos | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U236-R007 | Infographics | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U236-R008 | Marketing Graphics | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U236-R009 | Presentations | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U236-R010 | Videos | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U236-R011 | Animations | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U236-R012 | Voice | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U236-R013 | Audio | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U236-R014 | Media generation shall support tenant branding, localization, and Industry-specific customization. | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U237-R001 | The AI Platform shall provide enterprise observability. | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U237-R002 | Request Metrics | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U237-R003 | Response Metrics | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U237-R004 | Token Usage | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U237-R005 | Cost Analytics | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U237-R006 | Latency | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U237-R007 | Error Tracking | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U237-R008 | Provider Health | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U237-R009 | Success Rate | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U237-R010 | Failure Rate | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U237-R011 | Usage Analytics | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U237-R012 | AI Performance Dashboard | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.6-U237-R013 | Observability shall integrate with Enterprise Monitoring and Audit Logging. | F-05/A-07 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.7-U242-R001 | 🆕 Organization: SBGlobal Plus Pvt Ltd. | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U242-R002 | 🆕 Founder / CEO: Mr. J.S. Yadav | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U242-R003 | 🆕 Address: 2835/1, Swatantra Nagar, Madhya Pradesh, India – 477001 | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U242-R004 | 🆕 Email: info@sbglobalplus.com | F-04/F-06 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.7-U243-R001 | Primary: `#06B6D4` | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U243-R002 | Primary Hover: `#2563EB` | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U243-R003 | Secondary: `#0F766E` | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U243-R004 | Accent: `#7C3AED` | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U243-R005 | Success: `#16A34A` | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U243-R006 | Warning: `#F59E0B` | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U243-R007 | Danger: `#DC2626` | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U243-R008 | Info: `#0284C7` | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U244-R001 | White: `#FFFFFF` | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U244-R002 | Gray: `#F8FAFC` | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U244-R003 | Sidebar: `#0F172A` | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U244-R004 | Card: `#FFFFFF` | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U245-R001 | Heading: `#0F172A` | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U245-R002 | Body: `#475569` | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U245-R003 | Muted: `#64748B` | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U245-R004 | Border: `#E2E8F0` | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U246-R001 | Primary Font: Inter | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U246-R002 | Secondary Font: Poppins | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U246-R003 | Report Font: Roboto | F-04/F-06 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.7-U246-R004 | Invoice Font: Inter | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U246-R005 | PDF Font: Roboto | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U247-R001 | Regular: 400 | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U247-R002 | Medium: 500 | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U247-R003 | SemiBold: 600 | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U247-R004 | Bold: 700 | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U248-R001 | H1: 36px | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U248-R002 | H2: 30px | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U248-R003 | H3: 24px | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U248-R004 | H4: 20px | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U248-R005 | H5: 18px | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U248-R006 | Body: 16px | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U248-R007 | Small: 14px | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U248-R008 | Extra Small: 12px | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U248-R009 | Table: 14px | F-04/F-06 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.7-U248-R010 | Sidebar: 15px | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U248-R011 | Button: 14px | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U248-R012 | Input: 14px | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U249-R001 | Card: 12px | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U249-R002 | Button: 10px | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U249-R003 | Input: 8px | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U251-R001 | Card: `0 2 8 rgba(0,0,0,.08)` | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U251-R002 | Popup: `0 8 30 rgba(0,0,0,.15)` | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U252-R001 | Top Navbar | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U252-R002 | Left Fixed Sidebar | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U252-R003 | Sticky Header | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U252-R004 | Scrollable Content | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U252-R005 | Rounded Cards | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U252-R006 | Light Theme Default | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U252-R007 | Dark Theme Optional | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U254-R001 | Container: 1320px | F-04/F-06 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.7-U254-R002 | Hero Height: 700px | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U254-R003 | Section Padding: 100px | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U254-R004 | Button Radius: 10px | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U254-R005 | Icon Size: 22px | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U254-R006 | Hero CTA: Start Free Trial, Login, Get Demo | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U256-R001 | Patients | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U256-R002 | Doctors | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U256-R003 | Staff | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U256-R004 | Branches | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U256-R005 | Inventory | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U256-R006 | Reports | F-04/F-06 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.7-U256-R007 | Billing | F-04/F-06 | A-04 | ADR-007 | DD-04 | DD-17 COM family | MATERIAL_SHARED |
| S2.7-U256-R008 | Dashboards | F-04/F-06 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.7-U256-R009 | Analytics | F-04/F-06 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.7-U256-R010 | Profiles | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U256-R011 | Medical History | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U256-R012 | Appointments | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U256-R013 | Payments | F-04/F-06 | A-04 | ADR-007 | DD-04 | DD-17 COM family | MATERIAL_SHARED |
| S2.7-U256-R014 | Notifications | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U256-R015 | Follow-ups | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U256-R016 | Notes | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U256-R017 | AI Insights | F-04/F-06 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.7-U257-R001 | KPI Cards: Revenue, Patients, Doctors, Reports, Pending Samples, Collections | F-04/F-06 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.7-U257-R002 | Revenue Graph | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U257-R003 | Quick Actions | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U257-R004 | Recent Activity | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U257-R005 | Calendar | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U257-R006 | Todo | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U257-R007 | Top Tests | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U257-R008 | Top Branches | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U258-R001 | Appointments | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U258-R002 | Invoices | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U258-R003 | Payments | F-04/F-06 | A-04 | ADR-007 | DD-04 | DD-17 COM family | MATERIAL_SHARED |
| S2.7-U258-R004 | Medical History | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U258-R005 | Download PDF | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U258-R006 | QR Verification | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U258-R007 | AI Summary | F-04/F-06 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.7-U258-R008 | Profile | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U259-R001 | Patients | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U259-R002 | Pending Review | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U259-R003 | AI Insights | F-04/F-06 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.7-U259-R004 | Digital Signature | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U259-R005 | Follow Up | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U259-R006 | Prescription | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U260-R001 | Patient Registration | F-07 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U260-R002 | Appointment | F-07 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U260-R003 | Billing | F-07 | A-04 | ADR-007 | DD-04 | DD-17 COM family | MATERIAL_SHARED |
| S2.7-U260-R004 | Sample Collection | F-07 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U260-R005 | Barcode | F-07 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U260-R006 | QR | F-07 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U260-R007 | Sample Tracking | F-07 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U260-R008 | Worklist | F-07 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U260-R009 | Machine Integration | F-07 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.7-U260-R010 | Result Entry | F-07 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U260-R011 | Verification | F-07 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U260-R012 | Approval | F-07 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U260-R013 | Report | F-07 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.7-U260-R014 | Dispatch | F-07 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U260-R015 | Archive | F-07 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U261-R001 | A4 Portrait | F-04/F-06 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.7-U261-R002 | Logo Top Left | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U261-R003 | QR Top Right | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U261-R004 | Invoice Number | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U261-R005 | Patient Details | F-04/F-06 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.7-U261-R006 | Doctor | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U261-R007 | Test Table | F-04/F-06 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.7-U261-R008 | GST | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U261-R009 | Discount | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U261-R010 | Grand Total | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U261-R011 | Terms | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U261-R012 | Digital Signature | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U262-R001 | A4 Portrait | F-04/F-06 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.7-U262-R002 | Logo | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U262-R003 | Patient Information | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U262-R004 | Doctor | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U262-R005 | Collection Date | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U262-R006 | Report Date | F-04/F-06 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.7-U262-R007 | Parameter Table | F-04/F-06 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.7-U262-R008 | Reference Range | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U262-R009 | Flag | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U262-R010 | Trend Graph | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U262-R011 | AI Summary | F-04/F-06 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.7-U262-R012 | Pathologist Signature | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U262-R013 | QR Verification | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U262-R014 | Footer | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U263-R001 | Row Height: 48px | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U263-R002 | Header Height: 52px | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U263-R003 | Pagination: 10 / 25 / 50 / 100 | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U263-R004 | Sticky Header | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U263-R005 | Resizable Columns | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U263-R006 | Column Picker | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U263-R007 | Search | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U263-R008 | Export: CSV, Excel, PDF | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U263-R009 | Print | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U263-R010 | Bulk Actions | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U264-R001 | Required (`*`) | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U264-R002 | Auto Save | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U264-R003 | Autocomplete | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U264-R004 | Input Mask | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U264-R005 | Date Picker | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U264-R006 | Validation | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U264-R007 | Draft Save | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U264-R008 | Audit Log | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U265-R001 | Session | F-04/F-06 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.7-U265-R002 | Country | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U265-R003 | State | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U265-R004 | District | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U265-R005 | City | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U265-R006 | Language | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U265-R007 | Currency | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U265-R008 | Gender | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U265-R009 | Blood Group | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U265-R010 | Religion | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U265-R011 | Category | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U265-R012 | Department | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U265-R013 | Designation | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U265-R014 | Role | F-04/F-06 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.7-U265-R015 | Branch | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U265-R016 | Doctor | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U265-R017 | Patient Status | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U265-R018 | Appointment Status | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U265-R019 | Sample Status | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U265-R020 | Report Status | F-04/F-06 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.7-U265-R021 | Invoice Status | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U265-R022 | Payment Status | F-04/F-06 | A-04 | ADR-007 | DD-04 | DD-17 COM family | MATERIAL_SHARED |
| S2.7-U265-R023 | Test Category | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U265-R024 | Test | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U265-R025 | Package | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U265-R026 | Specimen | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U265-R027 | Container | F-04/F-06 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.7-U265-R028 | Method | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U265-R029 | Machine | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U265-R030 | Vendor | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U265-R031 | Manufacturer | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U265-R032 | Tax | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U265-R033 | Discount | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U265-R034 | Shift | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U265-R035 | Holiday | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U265-R036 | Priority | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U265-R037 | Severity | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U266-R001 | 2026-2027 | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U266-R002 | 2027-2028 | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U266-R003 | 2028-2029 | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U266-R004 | Automatically Generate | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U266-R005 | Current Session Default | F-04/F-06 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.7-U267-R001 | UUID | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U267-R002 | Code | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U267-R003 | Name | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U267-R004 | Description | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U267-R005 | Status | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U267-R006 | Sort Order | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U267-R007 | Tenant ID | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U267-R008 | Created By | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U267-R009 | Created At | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U267-R010 | Updated By | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U267-R011 | Updated At | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U267-R012 | Deleted By | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U267-R013 | Deleted At | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U268-R001 | General | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U268-R002 | Branding | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U268-R003 | Theme | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U268-R004 | Typography | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U268-R005 | Localization | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U268-R006 | Session | F-04/F-06 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.7-U268-R007 | Company | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U268-R008 | Branches | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U268-R009 | Departments | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U268-R010 | Users | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U268-R011 | Roles | F-04/F-06 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.7-U268-R012 | Permissions | F-04/F-06 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.7-U268-R013 | Master Data | F-04/F-06 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.7-U268-R014 | LIS | F-04/F-06 | A-09 + A-02/A-03/A-05/A-06/A-07/A-08 | ADR-002/004/005/006/008/010/012 | DD-13 + HLT-LIS canonical industry DD + DD-21/DD-22/DD-23/DD-24/DD-25 | HLT-LIS-T001…T014 + applicable KPI T01/T02 | MATERIAL_MS |
| S2.7-U268-R015 | Billing | F-04/F-06 | A-04 | ADR-007 | DD-04 | DD-17 COM family | MATERIAL_SHARED |
| S2.7-U268-R016 | Inventory | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U268-R017 | Communication | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U268-R018 | Email | F-04/F-06 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.7-U268-R019 | SMS | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U268-R020 | WhatsApp | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U268-R021 | Storage | F-04/F-06 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.7-U268-R022 | Payment Gateway | F-04/F-06 | A-04 | ADR-007 | DD-04 | DD-17 COM family | MATERIAL_SHARED |
| S2.7-U268-R023 | API | F-04/F-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.7-U268-R024 | AI | F-04/F-06 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.7-U268-R025 | Security | F-04/F-06 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.7-U268-R026 | Backup | F-04/F-06 | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.7-U268-R027 | Logs | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U268-R028 | Audit | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U268-R029 | CMS | F-04/F-06 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.7-U268-R030 | Website | F-04/F-06 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.7-U268-R031 | 🆕 Tenant Portal Settings | F-04/F-06 | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.7-U268-R032 | Reports | F-04/F-06 | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.7-U268-R033 | Invoice | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U268-R034 | Notifications | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U268-R035 | Integrations | F-04/F-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.7-U268-R036 | Subscription | F-04/F-06 | A-04 | ADR-007 | DD-04 | DD-17 COM family | MATERIAL_SHARED |
| S2.7-U268-R037 | Feature Flags | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U269-R001 | Active | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U269-R002 | Inactive | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U269-R003 | Draft | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U269-R004 | Pending | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U269-R005 | Approved | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U269-R006 | Rejected | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U269-R007 | Completed | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U269-R008 | Cancelled | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U269-R009 | Deleted | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U270-R001 | > **Authoritative complete list: see Product Specification Requirement — Section 5 (User Types).** The roles below are only the default subset pre-seeded at installation: | F-04/F-06 | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.7-U270-R002 | Super Admin | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U270-R003 | Tenant Owner | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U270-R004 | Lab Admin | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U270-R005 | Branch Manager | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U270-R006 | Doctor | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U270-R007 | Pathologist | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U270-R008 | Receptionist | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U270-R009 | Technician | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U270-R010 | Collection Staff | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U270-R011 | Billing Executive | F-04/F-06 | A-04 | ADR-007 | DD-04 | DD-17 COM family | MATERIAL_SHARED |
| S2.7-U270-R012 | Accountant | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U270-R013 | Patient | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U270-R014 | API User | F-04/F-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.7-U271-R001 | Timezone: Asia/Kolkata | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U271-R002 | Date Format: dd-MM-yyyy | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U271-R003 | Time Format: Configurable (12/24 Hour) | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U271-R004 | Default Currency: INR (Configurable per Tenant) | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U271-R005 | Default Language: English | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U271-R006 | Secondary Language: Hindi | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U271-R007 | Additional Languages: Configurable (Per Tenant) | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U271-R008 | OTP Login: Enabled | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U271-R009 | 2FA: Optional | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U271-R010 | Audit Log: Enabled | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U271-R011 | Soft Delete: Enabled | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U271-R012 | UUID: Enabled | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U271-R013 | Multi Tenant: Enabled | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U271-R014 | API First: Enabled | F-04/F-06 | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.7-U271-R015 | White Label: Enabled | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U271-R016 | Dark Mode: Supported | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.7-U271-R017 | AI Features: Enabled | F-04/F-06 | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.7-U271-R018 | Feature Flags: Enabled | F-04/F-06 | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.8-U273-R001 | Desktop: 12 Columns | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U273-R002 | Tablet: 8 Columns | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U273-R003 | Mobile: 4 Columns | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U274-R001 | XS: 100% | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U274-R002 | SM: 540px | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U274-R003 | MD: 720px | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U274-R004 | LG: 960px | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U274-R005 | XL: 1140px | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U274-R006 | 2XL: 1320px | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U276-R001 | Card: 12px | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U276-R002 | Button: 10px | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U276-R003 | Input: 8px | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U276-R004 | Source item 4 under "Border Radius" requires exact material extraction/verification. | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U276-R005 | Source item 5 under "Border Radius" requires exact material extraction/verification. | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U278-R001 | Primary | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U278-R002 | Secondary | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U278-R003 | Success | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U278-R004 | Danger | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U278-R005 | Warning | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U278-R006 | Info | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U278-R007 | Light | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U278-R008 | Dark | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U278-R009 | Outline | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U278-R010 | Ghost | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U278-R011 | Link | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U279-R001 | SM: 36px | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U279-R002 | MD: 44px | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U279-R003 | LG: 52px | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U280-R001 | Auto | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U280-R002 | Full Width | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U281-R001 | Left Icon | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U281-R002 | Right Icon | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U281-R003 | Loading | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U281-R004 | Disabled | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U283-R001 | Text | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U283-R002 | Number | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U283-R003 | Email | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U283-R004 | Password | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U283-R005 | Phone | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U283-R006 | Search | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U283-R007 | Textarea | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U283-R008 | Date | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U283-R009 | Time | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U283-R010 | DateTime | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U283-R011 | Month | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U283-R012 | Week | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U283-R013 | Color | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U283-R014 | URL | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U283-R015 | Hidden | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U283-R016 | Readonly | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U284-R001 | OTP | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U284-R002 | PIN | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U284-R003 | Currency | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U284-R004 | Percentage | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U284-R005 | Tags | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U284-R006 | Rich Editor | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U284-R007 | Markdown | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U284-R008 | JSON Editor | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U284-R009 | Code Editor | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U285-R001 | Single Select | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U285-R002 | Multi Select | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U285-R003 | Async Select | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U285-R004 | Searchable Select | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U285-R005 | Grouped Select | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U286-R001 | Single | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U286-R002 | Multiple | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U287-R001 | Horizontal | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U287-R002 | Vertical | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U289-R001 | Image Upload | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U289-R002 | Document Upload | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U289-R003 | Drag Drop | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U289-R004 | Camera Upload | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U289-R005 | Multiple Upload | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U289-R006 | Preview | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U290-R001 | Simple Card | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U290-R002 | KPI Card | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U290-R003 | Analytics Card | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U290-R004 | Report Card | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U290-R005 | Chart Card | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U290-R006 | Profile Card | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U290-R007 | Invoice Card | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U290-R008 | Metric Card | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U292-R001 | Responsive | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U292-R002 | Sticky Header | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U292-R003 | Sticky Column | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U292-R004 | Sorting | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U292-R005 | Filtering | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U292-R006 | Column Hide | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U292-R007 | Column Resize | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U292-R008 | Bulk Action | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U292-R009 | Export | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U292-R010 | Print | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U292-R011 | Pagination | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U293-R001 | View | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U293-R002 | Edit | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U293-R003 | Delete | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U293-R004 | Print | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U293-R005 | Download | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U293-R006 | History | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U293-R007 | Duplicate | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U293-R008 | Archive | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U293-R009 | Restore | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U294-R001 | Primary | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U294-R002 | Success | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U294-R003 | Warning | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U294-R004 | Danger | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U294-R005 | Info | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U294-R006 | Gray | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U295-R001 | > Color mapping only. Canonical status value list: see Enterprise Default Standards — Default Status. | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U295-R002 | Draft → Gray | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U295-R003 | Pending → Yellow | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U295-R004 | Active → Green | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U295-R005 | Inactive → Gray | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U295-R006 | Approved → Green | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U295-R007 | Rejected → Red | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U295-R008 | Completed → Green | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U295-R009 | Cancelled → Red | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U295-R010 | Deleted → Gray | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U295-R011 | > Additional workflow-specific states (for example: Processing, Archived) may be introduced by individual modules or Vertical Suites when required. | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U296-R001 | Small | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U296-R002 | Medium | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U296-R003 | Large | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U296-R004 | Extra Large | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U296-R005 | Fullscreen | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U297-R001 | Left | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U297-R002 | Right | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U297-R003 | Bottom | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U298-R001 | Sidebar | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U298-R002 | Topbar | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U298-R003 | Breadcrumb | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U298-R004 | Tabs | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U298-R005 | Vertical Tabs | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U298-R006 | Mega Menu | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U299-R001 | Global Search | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U299-R002 | Quick Search | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U299-R003 | Advanced Search | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U300-R001 | Date | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U300-R002 | Branch | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U300-R003 | Doctor | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U300-R004 | Department | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U300-R005 | Status | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U300-R006 | Payment | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U300-R007 | Report | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U300-R008 | Custom | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U301-R001 | Success | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U301-R002 | Error | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U301-R003 | Warning | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U301-R004 | Information | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U302-R001 | Success | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U302-R002 | Warning | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U302-R003 | Error | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U302-R004 | Info | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U303-R001 | Spinner | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U303-R002 | Skeleton | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U303-R003 | Progress Bar | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U303-R004 | Shimmer | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U304-R001 | Line | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U304-R002 | Bar | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U304-R003 | Area | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U304-R004 | Pie | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U304-R005 | Donut | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U304-R006 | Radar | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U304-R007 | Gauge | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U304-R008 | Heatmap | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U304-R009 | Scatter | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U304-R010 | Treemap | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U305-R001 | Styles: Outline, Filled | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U305-R002 | Default Sizes: 16, 18, 20, 24, 28, 32 | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U306-R001 | One Column | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U306-R002 | Two Column | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U306-R003 | Three Column | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U306-R004 | Wizard | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U306-R005 | Stepper | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U306-R006 | Accordion | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U307-R001 | Required | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U307-R002 | Unique | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U307-R003 | Email | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U307-R004 | Phone | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U307-R005 | GST | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U307-R006 | PAN | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U307-R007 | Aadhaar | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U307-R008 | UUID | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U307-R009 | Slug | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U307-R010 | Age | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U307-R011 | Password Strength | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U308-R001 | Avatar | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U308-R002 | Initial Avatar | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U308-R003 | Online Status | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U308-R004 | Role Badge | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U309-R001 | Audit Timeline | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U309-R002 | Patient Timeline | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U309-R003 | Sample Timeline | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U309-R004 | Activity Timeline | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U309-R005 | Workflow Timeline | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U310-R001 | Firebase Cloud Messaging (FCM) | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U310-R002 | Push Notification | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U310-R003 | Local Notification | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U310-R004 | SMS Trigger | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U310-R005 | WhatsApp Trigger | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U310-R006 | Email Trigger | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U310-R007 | Source item 7 under "Notifications" requires exact material extraction/verification. | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U312-R001 | Normal → Green | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U312-R002 | High → Red | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U312-R003 | Low → Orange | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U312-R004 | Critical → Dark Red | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U313-R001 | H | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U313-R002 | L | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U313-R003 | HH | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U313-R004 | LL | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U313-R005 | Critical | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U314-R001 | A4 | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U314-R002 | A5 | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U314-R003 | Thermal 80mm | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U314-R004 | Thermal 58mm | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U314-R005 | Letter | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U315-R001 | Revenue | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U315-R002 | Patients | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U315-R003 | Doctors | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U315-R004 | Reports | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U315-R005 | Today's Collection | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U315-R006 | Pending Reports | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U315-R007 | Appointments | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U315-R008 | Sample Status | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U315-R009 | Top Tests | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U315-R010 | Revenue Graph | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U315-R011 | Monthly Trend | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U315-R012 | Notifications | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U315-R013 | Calendar | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U315-R014 | Tasks | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U315-R015 | Quick Links | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U315-R016 | 🆕 > Patients, Doctors, Today's Collection, Pending Reports, Sample Status, and Top Tests reflect Healthcare & Diagnostics Vertical widget defaults. Other supported Industry Vertical Suites will use their own widget subset from this same library. | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U316-R001 | Types: Fade, Slide, Zoom | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U316-R002 | Duration: 200ms | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U317-R001 | Light | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U317-R002 | Dark | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U317-R003 | Auto | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U318-R001 | Dark Mode | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U318-R002 | Light Mode | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U318-R003 | Large Fonts | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U318-R004 | Screen Reader | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U318-R005 | High Contrast | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U318-R006 | Offline Support | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U319-R001 | Mobile: 0–575px | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U319-R002 | Tablet: 576–991px | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U319-R003 | Laptop: 992–1199px | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U319-R004 | Desktop: 1200–1599px | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.8-U319-R005 | Wide Screen: 1600px+ | F-06/A-08 | see current owner | — | Registers/F5_DEFERRED_REQUIREMENT_DISPOSITION.md | future Development/Test or current DD owner per disposition | DEFERRED_RECLASSIFIED |
| S2.9-U321-R001 | Enterprise Coding Standards | F-00/Governing MI | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.9-U321-R002 | Folder Structure | F-00/Governing MI | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.9-U321-R003 | Naming Standards | F-00/Governing MI | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.9-U321-R004 | Environment Standards | F-00/Governing MI | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.9-U321-R005 | Configuration Standards | F-00/Governing MI | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.9-U321-R006 | Multi Tenant Architecture | F-00/Governing MI | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.9-U321-R007 | Database Standards | F-00/Governing MI | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.9-U321-R008 | UUID Standards | F-00/Governing MI | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.9-U321-R009 | Soft Delete Standards | F-00/Governing MI | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.9-U321-R010 | Audit Standards | F-00/Governing MI | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.9-U322-R001 | Database Naming Convention | F-00/Governing MI | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.9-U322-R002 | Master Tables | F-00/Governing MI | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.9-U322-R003 | Transaction Tables | F-00/Governing MI | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.9-U322-R004 | Mapping Tables | F-00/Governing MI | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.9-U322-R005 | Log Tables | F-00/Governing MI | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.9-U322-R006 | Configuration Tables | F-00/Governing MI | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.9-U322-R007 | Lookup Tables | F-00/Governing MI | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.9-U322-R008 | Dynamic Field Tables | F-00/Governing MI | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.9-U322-R009 | Localization Tables | F-00/Governing MI | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.9-U322-R010 | Audit Tables | F-00/Governing MI | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.9-U322-R011 | Queue Tables | F-00/Governing MI | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.9-U322-R012 | Notification Tables | F-00/Governing MI | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.9-U322-R013 | Report Tables | F-00/Governing MI | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.9-U322-R014 | Template Tables | F-00/Governing MI | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.9-U322-R015 | CMS Tables | F-00/Governing MI | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.9-U322-R016 | AI Tables | F-00/Governing MI | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.9-U322-R017 | API Tables | F-00/Governing MI | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.9-U322-R018 | Session Tables | F-00/Governing MI | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.9-U322-R019 | Security Tables | F-00/Governing MI | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.9-U322-R020 | Backup Tables | F-00/Governing MI | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.9-U335-R001 | ✔ Enterprise SaaS Website | F-00/Governing MI | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.9-U335-R002 | ✔ Super Admin Portal | F-00/Governing MI | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.9-U335-R003 | ✔ Tenant Web Portal | F-00/Governing MI | A-08 | ADR-011 | DD-10/DD-26 | DD-17 APP family | MATERIAL_SHARED |
| S2.9-U335-R004 | ✔ Mobile Apps | F-00/Governing MI | A-08 | ADR-014/016 | DD-11 | DD-17 MOB family | MATERIAL_SHARED |
| S2.9-U335-R005 | ✔ Windows Desktop Application | F-00/Governing MI | A-08 | ADR-015 | DD-12 | DD-17 DESK family | MATERIAL_SHARED |
| S2.9-U335-R006 | ✔ Complete LIS | F-00/Governing MI | A-09 + A-02/A-03/A-05/A-06/A-07/A-08 | ADR-002/004/005/006/008/010/012 | DD-13 + HLT-LIS canonical industry DD + DD-21/DD-22/DD-23/DD-24/DD-25 | HLT-LIS-T001…T014 + applicable KPI T01/T02 | MATERIAL_MS |
| S2.9-U335-R007 | ✔ Billing ERP | F-00/Governing MI | A-04 | ADR-007 | DD-04 | DD-17 COM family | MATERIAL_SHARED |
| S2.9-U335-R008 | ✔ Inventory ERP | F-00/Governing MI | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.9-U335-R009 | ✔ Affiliate & Referral Platform | F-00/Governing MI | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.9-U335-R010 | ✔ AI Platform | F-00/Governing MI | A-07 | ADR-008/010 | DD-09 | DD-17 AI family | MATERIAL_SHARED |
| S2.9-U335-R011 | ✔ API Platform | F-00/Governing MI | A-06 | ADR-005/006/009 | DD-06/DD-07 | DD-17 API/EVT/INT families | MATERIAL_SHARED |
| S2.9-U335-R012 | ✔ Notification Platform | F-00/Governing MI | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.9-U335-R013 | ✔ Analytics Platform | F-00/Governing MI | A-11 + A-09 | ADR-012/017 | DD-15/DD-25 | DD-25 KPI T01/T02 | MATERIAL_SHARED |
| S2.9-U335-R014 | ✔ Enterprise Security | F-00/Governing MI | A-02/A-03 | ADR-002/003/004 | DD-02/DD-03/DD-16/DD-23 | DD-17 TCTX/ID/AUTH/SEC families | MATERIAL_SHARED |
| S2.9-U335-R015 | ✔ Production Ready | F-00/Governing MI | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.9-U335-R016 | ✔ Multi-Tenant | F-00/Governing MI | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.9-U335-R017 | ✔ Multi-Industry Platform | F-00/Governing MI | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.9-U335-R018 | ✔ Cloud Ready | F-00/Governing MI | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.9-U335-R019 | ✔ White Label Platform | F-00/Governing MI | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.9-U335-R020 | ✔ Configuration Driven | F-00/Governing MI | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |
| S2.9-U335-R021 | ✔ Database Driven | F-00/Governing MI | A-02/A-05/A-10 | ADR-002/008/017/018 | DD-05/DD-08/DD-14/DD-16/DD-23 | DD-17 DB/DOC/INF families | MATERIAL_SHARED |
| S2.9-U335-R022 | ✔ Future Ready | F-00/Governing MI | A-00/A-01 | ADR-001 | DD-00/DD-01 + applicable module owner | DD-17 applicable shared acceptance | MATERIAL_SHARED |

## Counts
- SOURCE_HISTORY: **41**
- MATERIAL_SHARED: **2489**
- MATERIAL_MS: **25**
- SUPERSEDED: **11**
- DEFERRED_RECLASSIFIED: **396**
- Total rows: **2962**.
- Current explicit-user 41-MS requirements remain separately traceable in `F5_USER_DIRECTED_REQUIREMENTS.md` / `DD_REQUIREMENT_TRACEABILITY_F5.md`; they are not falsely labeled RawSourceCorpus requirements.
