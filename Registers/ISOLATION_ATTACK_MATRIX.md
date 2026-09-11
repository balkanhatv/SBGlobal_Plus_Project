# ISOLATION ATTACK MATRIX — FINAL FABLE RECERTIFICATION
**Evaluated substantive HEAD:** `6e03b5dc0da98f1ef3296337aac2f7b9e7bf3029`  
**Date:** 2026-09-12 · **Status:** FINAL DD CONTRACT-LEVEL ISOLATION AUDIT

This is design-contract evidence, not executable penetration testing. Runtime/security validation remains a later status in the governed lifecycle.

## Final attacks
| Attack | Enforcement owner | Test ID | Expected result | Final result |
|---|---|---|---|---|
| Tenant A → Tenant B resource | DD-02/DD-05/DD-21 | TCTX-004 + <MS>-T007 | `RESOURCE_NOT_FOUND`; no existence leak/mutation/event | PASS |
| Same Tenant Industry A → Industry B | DD-02/DD-05/DD-21 | TCTX-003 + <MS>-T008 | `INDUSTRY_CONTEXT_MISMATCH`; no auto-switch | PASS |
| Resource-ID injection | DD-02 resource selector rule | TCTX-005 | active context unchanged; deny | PASS |
| Document cross-context access | DD-08 | <MS>-T010 | `PERMISSION_DENIED`; no signed URL/token | PASS |
| Event cross-context delivery | DD-07 | <MS>-T011 | envelope rejected; consumer effect=0 | PASS |
| Webhook cross-context delivery | DD-07 | <MS>-T011 | filter/context deny; outbound delivery=0 | PASS |
| Projection/report leakage | DD-05/DD-25/DD-28 | <KPI-ID>-T02 | sibling tenant/industry rows contribute 0 | PASS |
| Offline wrong-context replay | DD-11 | <MS>-T012 | `INDUSTRY_CONTEXT_MISMATCH`; queue not rebound | PASS |
| AI/RAG sibling-industry retrieval | DD-09 | <MS>-T013 | context/ACL filter produces 0 unauthorized retrieval | PASS |
| AI Agent unauthorized tool | DD-09/DD-21 | <MS>-T013 | `PERMISSION_DENIED`; tool effect=0 | PASS |
| Worker missing persisted context | DD-02/DD-07 | TCTX-007 / DB-007 | reject/dead-letter; no ambient/default context | PASS |
| Ungoverned EXPLICIT_CROSS_CONTEXT | DD-02/DD-03 | TCTX-008 | deny without dedicated permission/policy | PASS |
| Dedicated/shared DB context confusion | DD-05 routing + DD-17 | INF-014 | `DB_ROUTE_CONTEXT_MISMATCH`; connection not acquired/query=0 | PASS |
| Pooled connection context leakage | DD-05 transaction-local RLS + DD-17 | INF-003 + INF-015 | transaction-local context reset/set; leakage=0; failure blocks release | PASS |
| Missing RLS policy | DD-05 RLS registry | DB-003 / INF-004 | release blocked | PASS |
| Tenant ownership mutation | DD-05 | DB-008 | immutable ownership update rejected | PASS |

## 41-MS instantiation
| MS | Tenant | Industry | Document | Event/Webhook | Offline | AI/RAG/Tool | Report/KPI | Result |
|---|---|---|---|---|---|---|---|---|
| HLT-HMS | HLT-HMS-T007 | HLT-HMS-T008 | HLT-HMS-T010 | HLT-HMS-T011 | HLT-HMS-T012 | HLT-HMS-T013 | DD-25 `HLT-HMS-KPI-*-T02` | PASS |
| HLT-LIS | HLT-LIS-T007 | HLT-LIS-T008 | HLT-LIS-T010 | HLT-LIS-T011 | HLT-LIS-T012 | HLT-LIS-T013 | DD-25 `HLT-LIS-KPI-*-T02` | PASS |
| HLT-RIS | HLT-RIS-T007 | HLT-RIS-T008 | HLT-RIS-T010 | HLT-RIS-T011 | HLT-RIS-T012 | HLT-RIS-T013 | DD-25 `HLT-RIS-KPI-*-T02` | PASS |
| HLT-PMS | HLT-PMS-T007 | HLT-PMS-T008 | HLT-PMS-T010 | HLT-PMS-T011 | HLT-PMS-T012 | HLT-PMS-T013 | DD-25 `HLT-PMS-KPI-*-T02` | PASS |
| HLT-CMS | HLT-CMS-T007 | HLT-CMS-T008 | HLT-CMS-T010 | HLT-CMS-T011 | HLT-CMS-T012 | HLT-CMS-T013 | DD-25 `HLT-CMS-KPI-*-T02` | PASS |
| EDU-SMS | EDU-SMS-T007 | EDU-SMS-T008 | EDU-SMS-T010 | EDU-SMS-T011 | EDU-SMS-T012 | EDU-SMS-T013 | DD-25 `EDU-SMS-KPI-*-T02` | PASS |
| EDU-CUM | EDU-CUM-T007 | EDU-CUM-T008 | EDU-CUM-T010 | EDU-CUM-T011 | EDU-CUM-T012 | EDU-CUM-T013 | DD-25 `EDU-CUM-KPI-*-T02` | PASS |
| EDU-CTM | EDU-CTM-T007 | EDU-CTM-T008 | EDU-CTM-T010 | EDU-CTM-T011 | EDU-CTM-T012 | EDU-CTM-T013 | DD-25 `EDU-CTM-KPI-*-T02` | PASS |
| EDU-LMS | EDU-LMS-T007 | EDU-LMS-T008 | EDU-LMS-T010 | EDU-LMS-T011 | EDU-LMS-T012 | EDU-LMS-T013 | DD-25 `EDU-LMS-KPI-*-T02` | PASS |
| EDU-EMS | EDU-EMS-T007 | EDU-EMS-T008 | EDU-EMS-T010 | EDU-EMS-T011 | EDU-EMS-T012 | EDU-EMS-T013 | DD-25 `EDU-EMS-KPI-*-T02` | PASS |
| RTL-RSM | RTL-RSM-T007 | RTL-RSM-T008 | RTL-RSM-T010 | RTL-RSM-T011 | RTL-RSM-T012 | RTL-RSM-T013 | DD-25 `RTL-RSM-KPI-*-T02` | PASS |
| RTL-POS | RTL-POS-T007 | RTL-POS-T008 | RTL-POS-T010 | RTL-POS-T011 | RTL-POS-T012 | RTL-POS-T013 | DD-25 `RTL-POS-KPI-*-T02` | PASS |
| RTL-IWM | RTL-IWM-T007 | RTL-IWM-T008 | RTL-IWM-T010 | RTL-IWM-T011 | RTL-IWM-T012 | RTL-IWM-T013 | DD-25 `RTL-IWM-KPI-*-T02` | PASS |
| RTL-OMS | RTL-OMS-T007 | RTL-OMS-T008 | RTL-OMS-T010 | RTL-OMS-T011 | RTL-OMS-T012 | RTL-OMS-T013 | DD-25 `RTL-OMS-KPI-*-T02` | PASS |
| RTL-MKT | RTL-MKT-T007 | RTL-MKT-T008 | RTL-MKT-T010 | RTL-MKT-T011 | RTL-MKT-T012 | RTL-MKT-T013 | DD-25 `RTL-MKT-KPI-*-T02` | PASS |
| HSP-HMS | HSP-HMS-T007 | HSP-HMS-T008 | HSP-HMS-T010 | HSP-HMS-T011 | HSP-HMS-T012 | HSP-HMS-T013 | DD-25 `HSP-HMS-KPI-*-T02` | PASS |
| HSP-RMS | HSP-RMS-T007 | HSP-RMS-T008 | HSP-RMS-T010 | HSP-RMS-T011 | HSP-RMS-T012 | HSP-RMS-T013 | DD-25 `HSP-RMS-KPI-*-T02` | PASS |
| HSP-BEM | HSP-BEM-T007 | HSP-BEM-T008 | HSP-BEM-T010 | HSP-BEM-T011 | HSP-BEM-T012 | HSP-BEM-T013 | DD-25 `HSP-BEM-KPI-*-T02` | PASS |
| HSP-RBM | HSP-RBM-T007 | HSP-RBM-T008 | HSP-RBM-T010 | HSP-RBM-T011 | HSP-RBM-T012 | HSP-RBM-T013 | DD-25 `HSP-RBM-KPI-*-T02` | PASS |
| MFG-PMS | MFG-PMS-T007 | MFG-PMS-T008 | MFG-PMS-T010 | MFG-PMS-T011 | MFG-PMS-T012 | MFG-PMS-T013 | DD-25 `MFG-PMS-KPI-*-T02` | PASS |
| MFG-IWM | MFG-IWM-T007 | MFG-IWM-T008 | MFG-IWM-T010 | MFG-IWM-T011 | MFG-IWM-T012 | MFG-IWM-T013 | DD-25 `MFG-IWM-KPI-*-T02` | PASS |
| MFG-QMS | MFG-QMS-T007 | MFG-QMS-T008 | MFG-QMS-T010 | MFG-QMS-T011 | MFG-QMS-T012 | MFG-QMS-T013 | DD-25 `MFG-QMS-KPI-*-T02` | PASS |
| MFG-PRO | MFG-PRO-T007 | MFG-PRO-T008 | MFG-PRO-T010 | MFG-PRO-T011 | MFG-PRO-T012 | MFG-PRO-T013 | DD-25 `MFG-PRO-KPI-*-T02` | PASS |
| MFG-MMS | MFG-MMS-T007 | MFG-MMS-T008 | MFG-MMS-T010 | MFG-MMS-T011 | MFG-MMS-T012 | MFG-MMS-T013 | DD-25 `MFG-MMS-KPI-*-T02` | PASS |
| PSV-CRM | PSV-CRM-T007 | PSV-CRM-T008 | PSV-CRM-T010 | PSV-CRM-T011 | PSV-CRM-T012 | PSV-CRM-T013 | DD-25 `PSV-CRM-KPI-*-T02` | PASS |
| PSV-PJM | PSV-PJM-T007 | PSV-PJM-T008 | PSV-PJM-T010 | PSV-PJM-T011 | PSV-PJM-T012 | PSV-PJM-T013 | DD-25 `PSV-PJM-KPI-*-T02` | PASS |
| PSV-SDM | PSV-SDM-T007 | PSV-SDM-T008 | PSV-SDM-T010 | PSV-SDM-T011 | PSV-SDM-T012 | PSV-SDM-T013 | DD-25 `PSV-SDM-KPI-*-T02` | PASS |
| PSV-RTM | PSV-RTM-T007 | PSV-RTM-T008 | PSV-RTM-T010 | PSV-RTM-T011 | PSV-RTM-T012 | PSV-RTM-T013 | DD-25 `PSV-RTM-KPI-*-T02` | PASS |
| PSV-SGM | PSV-SGM-T007 | PSV-SGM-T008 | PSV-SGM-T010 | PSV-SGM-T011 | PSV-SGM-T012 | PSV-SGM-T013 | DD-25 `PSV-SGM-KPI-*-T02` | PASS |
| GOV-CSM | GOV-CSM-T007 | GOV-CSM-T008 | GOV-CSM-T010 | GOV-CSM-T011 | GOV-CSM-T012 | GOV-CSM-T013 | DD-25 `GOV-CSM-KPI-*-T02` | PASS |
| GOV-CFM | GOV-CFM-T007 | GOV-CFM-T008 | GOV-CFM-T010 | GOV-CFM-T011 | GOV-CFM-T012 | GOV-CFM-T013 | DD-25 `GOV-CFM-KPI-*-T02` | PASS |
| GOV-PLM | GOV-PLM-T007 | GOV-PLM-T008 | GOV-PLM-T010 | GOV-PLM-T011 | GOV-PLM-T012 | GOV-PLM-T013 | DD-25 `GOV-PLM-KPI-*-T02` | PASS |
| GOV-RTM | GOV-RTM-T007 | GOV-RTM-T008 | GOV-RTM-T010 | GOV-RTM-T011 | GOV-RTM-T012 | GOV-RTM-T013 | DD-25 `GOV-RTM-KPI-*-T02` | PASS |
| NGO-DMS | NGO-DMS-T007 | NGO-DMS-T008 | NGO-DMS-T010 | NGO-DMS-T011 | NGO-DMS-T012 | NGO-DMS-T013 | DD-25 `NGO-DMS-KPI-*-T02` | PASS |
| NGO-DFM | NGO-DFM-T007 | NGO-DFM-T008 | NGO-DFM-T010 | NGO-DFM-T011 | NGO-DFM-T012 | NGO-DFM-T013 | DD-25 `NGO-DFM-KPI-*-T02` | PASS |
| NGO-TAM | NGO-TAM-T007 | NGO-TAM-T008 | NGO-TAM-T010 | NGO-TAM-T011 | NGO-TAM-T012 | NGO-TAM-T013 | DD-25 `NGO-TAM-KPI-*-T02` | PASS |
| NGO-MVM | NGO-MVM-T007 | NGO-MVM-T008 | NGO-MVM-T010 | NGO-MVM-T011 | NGO-MVM-T012 | NGO-MVM-T013 | DD-25 `NGO-MVM-KPI-*-T02` | PASS |
| SFM-SGM | SFM-SGM-T007 | SFM-SGM-T008 | SFM-SGM-T010 | SFM-SGM-T011 | SFM-SGM-T012 | SFM-SGM-T013 | DD-25 `SFM-SGM-KPI-*-T02` | PASS |
| SFM-PMS | SFM-PMS-T007 | SFM-PMS-T008 | SFM-PMS-T010 | SFM-PMS-T011 | SFM-PMS-T012 | SFM-PMS-T013 | DD-25 `SFM-PMS-KPI-*-T02` | PASS |
| SFM-VMS | SFM-VMS-T007 | SFM-VMS-T008 | SFM-VMS-T010 | SFM-VMS-T011 | SFM-VMS-T012 | SFM-VMS-T013 | DD-25 `SFM-VMS-KPI-*-T02` | PASS |
| SFM-FMM | SFM-FMM-T007 | SFM-FMM-T008 | SFM-FMM-T010 | SFM-FMM-T011 | SFM-FMM-T012 | SFM-FMM-T013 | DD-25 `SFM-FMM-KPI-*-T02` | PASS |

## Adversarial conclusion
- Null Industry Context is never interpreted as all industries.
- Shared-database tenants rely on forced RLS plus immutable RequestContext; dedicated-database routing is checked before acquiring the connection.
- Pool reuse cannot inherit an earlier tenant/industry session context because application RLS variables are transaction-local and INF-003/INF-015 are release gates.
- Cross-context behavior exists only as an explicit minimized operation with named source/target, permission and policy.
- All 41 MS have concrete per-MS isolation IDs rather than one generic claim.

**Final isolation verdict at substantive HEAD `6e03b5dc0da98f1ef3296337aac2f7b9e7bf3029`: PASS.**
