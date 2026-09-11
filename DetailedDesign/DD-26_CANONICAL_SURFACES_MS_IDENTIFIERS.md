# DD-26 — CANONICAL SURFACES & MANAGEMENT-SYSTEM IDENTIFIER REGISTRY
**Status:** ACTIVE REMEDIATION EVIDENCE · **Date:** 2026-09-11

## Canonical surfaces
`PUBLIC_SAAS_WEBSITE` → Public SaaS Website  
`PLATFORM_APPLICATION` → Platform Application  
`TENANT_MANAGEMENT_APPLICATION` → Tenant Management Application  
`INDUSTRY_EXPERIENCE` → Reusable Industry Experience Shell

No other surface name is canonical. In particular, bare `Tenant App` must not be used as an authority-bearing identifier.

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
