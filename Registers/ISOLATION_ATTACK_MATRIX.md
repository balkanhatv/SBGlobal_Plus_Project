# ISOLATION ATTACK MATRIX — FABLE 5 FRESH REMEDIATION
**Evaluated substantive HEAD:** `5a46d5f7f39a480685ccfb35b7eb13a69efd3b77`
**Date:** 2026-09-11 · **Status:** FRESH ISOLATION EVIDENCE

This audit supersedes the stale isolation evidence that referenced `df1f7241...`. It evaluates the current remediation contracts. These are design-level attack expectations; executable penetration/runtime tests remain future Test/Security Validation work.

## 1. Shared enforcement attacks
| Attack | Exact enforcement | Test ID / evidence | Expected result | Result |
|---|---|---|---|---|
| Tenant A → Tenant B resource ID | DD-02 RequestContext + DD-05 forced RLS + DD-21 T007 | every `<MS>-T007` | `RESOURCE_NOT_FOUND`; zero mutation/event; no existence leak | PASS |
| Same tenant Industry A → B resource | DD-02 active Industry Context + DD-05 industry RLS | every `<MS>-T008` | `INDUSTRY_CONTEXT_MISMATCH`; no auto-switch | PASS |
| Wrong-industry document | DD-08 DocumentMeta ownership/ACL/context | every `<MS>-T010` | `PERMISSION_DENIED`; no signed URL | PASS |
| Wrong-context event consumer/webhook | DD-07 scopeClass/envelope/filter | every `<MS>-T011` | `INDUSTRY_CONTEXT_MISMATCH`; consumer effect=0; delivery=0 | PASS |
| Wrong-context report/projection | DD-05 projection ownership + DD-25 KPI T02 | per-MS first KPI T02 below | sibling rows contribute 0; unauthorized query denied/empty per contract | PASS |
| Offline origin context revoked | DD-11 immutable queued origin | every `<MS>-T012` | `INDUSTRY_CONTEXT_MISMATCH`; queue not rebound; mutation/event=0 | PASS |
| AI/RAG/tool privilege escalation | DD-09 acting principal + context + OperationContract | every `<MS>-T013` | `PERMISSION_DENIED`; retrieval/tool effect=0 | PASS |
| Core worker missing persisted context | DD-02 WorkerContext + DD-07 event envelope | TCTX-007 / EVT-003 | reject/dead-letter; no default tenant/context | PASS |
| Resource ID attempts context auto-switch | DD-02 selector/resource rule | TCTX-005 | deny; active context unchanged | PASS |
| Cross-context operation without explicit contract | DD-02 EXPLICIT_CROSS_CONTEXT | TCTX-008 | deny; no implicit tenant-wide sibling access | PASS |

## 2. Per-MS isolation instantiation
| MS | Tenant test | Industry test | Document | Event/Webhook | Offline | AI/RAG/Tool | Report/KPI projection | Verdict |
|---|---|---|---|---|---|---|---|---|
| HLT-HMS | HLT-HMS-T007 | HLT-HMS-T008 | HLT-HMS-T010 | HLT-HMS-T011 | HLT-HMS-T012 | HLT-HMS-T013 | HLT-HMS-KPI-01-T02 | PASS |
| HLT-LIS | HLT-LIS-T007 | HLT-LIS-T008 | HLT-LIS-T010 | HLT-LIS-T011 | HLT-LIS-T012 | HLT-LIS-T013 | HLT-LIS-KPI-01-T02 | PASS |
| HLT-RIS | HLT-RIS-T007 | HLT-RIS-T008 | HLT-RIS-T010 | HLT-RIS-T011 | HLT-RIS-T012 | HLT-RIS-T013 | HLT-RIS-KPI-01-T02 | PASS |
| HLT-PMS | HLT-PMS-T007 | HLT-PMS-T008 | HLT-PMS-T010 | HLT-PMS-T011 | HLT-PMS-T012 | HLT-PMS-T013 | HLT-PMS-KPI-01-T02 | PASS |
| HLT-CMS | HLT-CMS-T007 | HLT-CMS-T008 | HLT-CMS-T010 | HLT-CMS-T011 | HLT-CMS-T012 | HLT-CMS-T013 | HLT-CMS-KPI-01-T02 | PASS |
| EDU-SMS | EDU-SMS-T007 | EDU-SMS-T008 | EDU-SMS-T010 | EDU-SMS-T011 | EDU-SMS-T012 | EDU-SMS-T013 | EDU-SMS-KPI-01-T02 | PASS |
| EDU-CUM | EDU-CUM-T007 | EDU-CUM-T008 | EDU-CUM-T010 | EDU-CUM-T011 | EDU-CUM-T012 | EDU-CUM-T013 | EDU-CUM-KPI-01-T02 | PASS |
| EDU-CTM | EDU-CTM-T007 | EDU-CTM-T008 | EDU-CTM-T010 | EDU-CTM-T011 | EDU-CTM-T012 | EDU-CTM-T013 | EDU-CTM-KPI-01-T02 | PASS |
| EDU-LMS | EDU-LMS-T007 | EDU-LMS-T008 | EDU-LMS-T010 | EDU-LMS-T011 | EDU-LMS-T012 | EDU-LMS-T013 | EDU-LMS-KPI-01-T02 | PASS |
| EDU-EMS | EDU-EMS-T007 | EDU-EMS-T008 | EDU-EMS-T010 | EDU-EMS-T011 | EDU-EMS-T012 | EDU-EMS-T013 | EDU-EMS-KPI-01-T02 | PASS |
| RTL-RSM | RTL-RSM-T007 | RTL-RSM-T008 | RTL-RSM-T010 | RTL-RSM-T011 | RTL-RSM-T012 | RTL-RSM-T013 | RTL-RSM-KPI-01-T02 | PASS |
| RTL-POS | RTL-POS-T007 | RTL-POS-T008 | RTL-POS-T010 | RTL-POS-T011 | RTL-POS-T012 | RTL-POS-T013 | RTL-POS-KPI-01-T02 | PASS |
| RTL-IWM | RTL-IWM-T007 | RTL-IWM-T008 | RTL-IWM-T010 | RTL-IWM-T011 | RTL-IWM-T012 | RTL-IWM-T013 | RTL-IWM-KPI-01-T02 | PASS |
| RTL-OMS | RTL-OMS-T007 | RTL-OMS-T008 | RTL-OMS-T010 | RTL-OMS-T011 | RTL-OMS-T012 | RTL-OMS-T013 | RTL-OMS-KPI-01-T02 | PASS |
| RTL-MKT | RTL-MKT-T007 | RTL-MKT-T008 | RTL-MKT-T010 | RTL-MKT-T011 | RTL-MKT-T012 | RTL-MKT-T013 | RTL-MKT-KPI-01-T02 | PASS |
| HSP-HMS | HSP-HMS-T007 | HSP-HMS-T008 | HSP-HMS-T010 | HSP-HMS-T011 | HSP-HMS-T012 | HSP-HMS-T013 | HSP-HMS-KPI-01-T02 | PASS |
| HSP-RMS | HSP-RMS-T007 | HSP-RMS-T008 | HSP-RMS-T010 | HSP-RMS-T011 | HSP-RMS-T012 | HSP-RMS-T013 | HSP-RMS-KPI-01-T02 | PASS |
| HSP-BEM | HSP-BEM-T007 | HSP-BEM-T008 | HSP-BEM-T010 | HSP-BEM-T011 | HSP-BEM-T012 | HSP-BEM-T013 | HSP-BEM-KPI-01-T02 | PASS |
| HSP-RBM | HSP-RBM-T007 | HSP-RBM-T008 | HSP-RBM-T010 | HSP-RBM-T011 | HSP-RBM-T012 | HSP-RBM-T013 | HSP-RBM-KPI-01-T02 | PASS |
| MFG-PMS | MFG-PMS-T007 | MFG-PMS-T008 | MFG-PMS-T010 | MFG-PMS-T011 | MFG-PMS-T012 | MFG-PMS-T013 | MFG-PMS-KPI-01-T02 | PASS |
| MFG-IWM | MFG-IWM-T007 | MFG-IWM-T008 | MFG-IWM-T010 | MFG-IWM-T011 | MFG-IWM-T012 | MFG-IWM-T013 | MFG-IWM-KPI-01-T02 | PASS |
| MFG-QMS | MFG-QMS-T007 | MFG-QMS-T008 | MFG-QMS-T010 | MFG-QMS-T011 | MFG-QMS-T012 | MFG-QMS-T013 | MFG-QMS-KPI-01-T02 | PASS |
| MFG-PRO | MFG-PRO-T007 | MFG-PRO-T008 | MFG-PRO-T010 | MFG-PRO-T011 | MFG-PRO-T012 | MFG-PRO-T013 | MFG-PRO-KPI-01-T02 | PASS |
| MFG-MMS | MFG-MMS-T007 | MFG-MMS-T008 | MFG-MMS-T010 | MFG-MMS-T011 | MFG-MMS-T012 | MFG-MMS-T013 | MFG-MMS-KPI-01-T02 | PASS |
| PSV-CRM | PSV-CRM-T007 | PSV-CRM-T008 | PSV-CRM-T010 | PSV-CRM-T011 | PSV-CRM-T012 | PSV-CRM-T013 | PSV-CRM-KPI-01-T02 | PASS |
| PSV-PJM | PSV-PJM-T007 | PSV-PJM-T008 | PSV-PJM-T010 | PSV-PJM-T011 | PSV-PJM-T012 | PSV-PJM-T013 | PSV-PJM-KPI-01-T02 | PASS |
| PSV-SDM | PSV-SDM-T007 | PSV-SDM-T008 | PSV-SDM-T010 | PSV-SDM-T011 | PSV-SDM-T012 | PSV-SDM-T013 | PSV-SDM-KPI-01-T02 | PASS |
| PSV-RTM | PSV-RTM-T007 | PSV-RTM-T008 | PSV-RTM-T010 | PSV-RTM-T011 | PSV-RTM-T012 | PSV-RTM-T013 | PSV-RTM-KPI-01-T02 | PASS |
| PSV-SGM | PSV-SGM-T007 | PSV-SGM-T008 | PSV-SGM-T010 | PSV-SGM-T011 | PSV-SGM-T012 | PSV-SGM-T013 | PSV-SGM-KPI-01-T02 | PASS |
| GOV-CSM | GOV-CSM-T007 | GOV-CSM-T008 | GOV-CSM-T010 | GOV-CSM-T011 | GOV-CSM-T012 | GOV-CSM-T013 | GOV-CSM-KPI-01-T02 | PASS |
| GOV-CFM | GOV-CFM-T007 | GOV-CFM-T008 | GOV-CFM-T010 | GOV-CFM-T011 | GOV-CFM-T012 | GOV-CFM-T013 | GOV-CFM-KPI-01-T02 | PASS |
| GOV-PLM | GOV-PLM-T007 | GOV-PLM-T008 | GOV-PLM-T010 | GOV-PLM-T011 | GOV-PLM-T012 | GOV-PLM-T013 | GOV-PLM-KPI-01-T02 | PASS |
| GOV-RTM | GOV-RTM-T007 | GOV-RTM-T008 | GOV-RTM-T010 | GOV-RTM-T011 | GOV-RTM-T012 | GOV-RTM-T013 | GOV-RTM-KPI-01-T02 | PASS |
| NGO-DMS | NGO-DMS-T007 | NGO-DMS-T008 | NGO-DMS-T010 | NGO-DMS-T011 | NGO-DMS-T012 | NGO-DMS-T013 | NGO-DMS-KPI-01-T02 | PASS |
| NGO-DFM | NGO-DFM-T007 | NGO-DFM-T008 | NGO-DFM-T010 | NGO-DFM-T011 | NGO-DFM-T012 | NGO-DFM-T013 | NGO-DFM-KPI-01-T02 | PASS |
| NGO-TAM | NGO-TAM-T007 | NGO-TAM-T008 | NGO-TAM-T010 | NGO-TAM-T011 | NGO-TAM-T012 | NGO-TAM-T013 | NGO-TAM-KPI-01-T02 | PASS |
| NGO-MVM | NGO-MVM-T007 | NGO-MVM-T008 | NGO-MVM-T010 | NGO-MVM-T011 | NGO-MVM-T012 | NGO-MVM-T013 | NGO-MVM-KPI-01-T02 | PASS |
| SFM-SGM | SFM-SGM-T007 | SFM-SGM-T008 | SFM-SGM-T010 | SFM-SGM-T011 | SFM-SGM-T012 | SFM-SGM-T013 | SFM-SGM-KPI-01-T02 | PASS |
| SFM-PMS | SFM-PMS-T007 | SFM-PMS-T008 | SFM-PMS-T010 | SFM-PMS-T011 | SFM-PMS-T012 | SFM-PMS-T013 | SFM-PMS-KPI-01-T02 | PASS |
| SFM-VMS | SFM-VMS-T007 | SFM-VMS-T008 | SFM-VMS-T010 | SFM-VMS-T011 | SFM-VMS-T012 | SFM-VMS-T013 | SFM-VMS-KPI-01-T02 | PASS |
| SFM-FMM | SFM-FMM-T007 | SFM-FMM-T008 | SFM-FMM-T010 | SFM-FMM-T011 | SFM-FMM-T012 | SFM-FMM-T013 | SFM-FMM-KPI-01-T02 | PASS |

## 3. Cross-family attack examples
- Healthcare HLT-LIS report/result queried from Retail context → `INDUSTRY_CONTEXT_MISMATCH`.
- Education EDU-EMS result projection queried from Government context → zero sibling rows / denial.
- RTL-POS refund operation attempted from Hospitality context → `INDUSTRY_CONTEXT_MISMATCH`.
- HSP-HMS folio document from Manufacturing context → `PERMISSION_DENIED`.
- MFG-QMS event delivered to PSV consumer → rejected before consumer effect.
- PSV-RTM offline timesheet replay after Industry Context revocation → rejected; no rebinding.
- GOV-PLM permit RAG source requested by NGO assistant → filtered before retrieval.
- NGO-DFM fund tool called by SFM acting principal → permission/context denial.
- SFM-PMS patrol event/report requested by Healthcare context → denied/filter=0.

## 4. Conclusion
41/41 MS families instantiate the same fail-closed Core isolation contracts with explicit per-MS acceptance IDs. Same-Tenant sibling-Industry leakage is denied across data/resource lookup, documents, events/webhooks, reports/projections, offline replay and AI/RAG/tools.

**Fresh isolation result: PASS at Detailed Design contract level.**
