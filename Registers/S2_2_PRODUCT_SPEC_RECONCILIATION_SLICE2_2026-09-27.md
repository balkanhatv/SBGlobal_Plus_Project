# S2.2 PRODUCT SPECIFICATION RECONCILIATION — SLICE 2 — 2026-09-27

**Scope:** S2.2-U082…U111, excluding already reconciled parent units.

## Healthcare operations over reusable Core primitives

Laboratory Branch/Department/Staff sections are mixed: organization/HR primitives remain Core, while laboratory equipment, worklists, KPI and Healthcare role semantics remain Healthcare-owned. Patient, Doctor, Appointment, LIS and Test Catalogue are Healthcare domain capabilities.

Healthcare Billing/Finance and Inventory consume reusable Core Finance/Commercial/Inventory primitives but keep their Healthcare workflow semantics. GST/TDS resolve through jurisdiction/Country-Pack policy.

Communication channels/provider orchestration are Core. Named providers in source are configurable integrations, not proof that a provider is enabled, contracted or globally applicable.

## Clinical AI boundary

Healthcare Report AI Summary, Risk Score, Health Score, Diet Suggestions and Lifestyle Suggestions remain source-preserved capabilities, but only as assistive evidence. They cannot modify verified laboratory values/reference ranges/flags, satisfy pathologist/clinician approval, or autonomously publish diagnosis, prescription or treatment decisions.

DD-17 HLT-AI-001/002 records deterministic acceptance.

## Commercial normalization

The source tier set remains Free/Starter/Pro/Premium/Enterprise. Current F-14 owns operational details: Renewed is an event, not a resting state; Free/Starter self-serve; Enterprise sales-assisted; Pro/Premium governed dual-route; no expiry/suspension lifecycle deletes tenant data.

## Integration, API and mobile

Healthcare organizations and HL7/FHIR/HIS/EMR/EHR/LIS/RIS/PACS remain suite-level interoperability. Core Integration owns mappings, retries, queues, credentials, webhooks and policy.

Current API architecture is tRPC for first-party typed application APIs and REST/OpenAPI for external interoperability. Source JWT wording does not create a competing human-session/token system.

Tenant mobile remains exactly two logical apps (Staff/User). Platform Mobile is separate. Dynamic mobile endpoint configuration is a governed environment/profile reference, not arbitrary tenant URL authority.

## Operations/status

AI/analytics source lists are mixed between reusable platform capabilities and Healthcare-specific health/patient/test/doctor semantics. Security/compliance language is alignment/readiness, not certification. Monitoring, backup, provider/environment configuration and typography remain shared platform capabilities.

Deployment Production Ready, cPanel and Docker-optional wording is source target/history only under current UD-TECH-01 and evidence-gated status lifecycle.

## Boundary

RawSource unchanged. No runtime implementation, executable test, SQL/RLS, role/grant or stable requirement-count change. Final 17 S2.2 parent units remain open after this slice. DD-208 remains current.
