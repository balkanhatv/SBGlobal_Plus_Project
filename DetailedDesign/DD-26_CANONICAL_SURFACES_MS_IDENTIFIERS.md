# DD-26 — CANONICAL SURFACES & MANAGEMENT-SYSTEM IDENTIFIER REGISTRY
**Status:** ACTIVE PHASE 3 CANONICAL IDENTIFIER EVIDENCE · **Date:** 2026-09-13

## Canonical surfaces
`PUBLIC_SAAS_WEBSITE` → Public SaaS Website  
`PLATFORM_APPLICATION` → Platform Application  
`TENANT_MANAGEMENT_APPLICATION` → Tenant Management Application  
`INDUSTRY_EXPERIENCE` → Reusable Industry Experience Shell

No other surface name is canonical. In particular, bare `Tenant App` must not be used as an authority-bearing identifier.

## Canonical Tenant mobile app classes
`TENANT_STAFF_APP` → Tenant Staff App  
`TENANT_USER_APP` → Tenant User App

No role/persona-specific Tenant app identifier is canonical. `DOCTOR_APP`, `PATIENT_APP`, `TEACHER_APP`, `STUDENT_APP`, `CASHIER_APP`, `GUARD_APP`, etc. MUST NOT be persisted as app classes, binaries, entitlement subjects, route authorities or traceability keys. They are personas/roles mapped inside one of the two canonical Tenant app classes.

`PLATFORM_MOBILE` may exist only as a channel of `PLATFORM_APPLICATION` under DD-10 channel eligibility and is not one of the two Tenant app classes.

## Future Industry status identifiers
Canonical lifecycle: `DRAFT_FUTURE`, `FOUNDATION_READY`, `ARCHITECTURE_READY`, `DD_READY`, `APPROVAL_REQUIRED`, `APPROVED_FOR_PROMOTION`, `PROMOTED`, `RETIRED`.
Only `PROMOTED` is eligible for Current Supported Industry catalog/live Tenant activation.
## Canonical MS IDs
All machine identifiers include industry prefix. Canonical IDs are:
- Healthcare: HLT-HMS, HLT-LIS, HLT-RIS, HLT-PMS, HLT-CMS
- Education: EDU-SMS, EDU-CUM, EDU-CTM, EDU-LMS, EDU-EMS
- Retail: RTL-RSM, RTL-POS, RTL-IWM, RTL-OMS, RTL-MKT
- Hospitality: HSP-HMS, HSP-RMS, HSP-BEM, HSP-RBM
- Manufacturing: MFG-PMS, MFG-IWM, MFG-QMS, MFG-PRO, MFG-MMS
- Professional Services: PSV-CRM, PSV-PJM, PSV-SDM, PSV-RTM, PSV-SGM
- Government: GOV-CSM, GOV-CFM, GOV-PLM, GOV-RTM
- NGO/Temple/Trust: NGO-DMS, NGO-DFM, NGO-TAM, NGO-MVM
- Security/Facility: SFM-SGM, SFM-PMS, SFM-VMS, SFM-FMM

Bare `PMS`, `HMS`, `IWM`, `RTM` or similar abbreviations may appear only as local human prose where the fully-qualified owner is already unambiguous. They MUST NOT be persisted as global MS IDs, event owners, KPI owners, permission namespaces, entitlement subject keys, traceability keys or test namespaces.

## Stable identifier test
- ID-T001 persisted `PMS` as MS ID → `VALIDATION_FAILED`.
- ID-T002 persisted `MFG-PMS` → accepted if catalog active.
- ID-T003 event owner `HMS` → schema validation failure.
- ID-T004 KPI owner `HSP-HMS` → accepted.

## Phase-3 identifier tests
- ID-T005 persisted `GUARD_APP` as Tenant appClass → `VALIDATION_FAILED`.
- ID-T006 persisted `TENANT_STAFF_APP` → accepted for internal-role mobile capability.
- ID-T007 `PLATFORM_MOBILE` counted as Tenant app → validation failure.
- ID-T008 Future Industry status `DD_READY` requested for live Tenant activation → denied.
- ID-T009 Future Industry status `PROMOTED` + valid catalog/entitlement → activation eligibility may proceed.
