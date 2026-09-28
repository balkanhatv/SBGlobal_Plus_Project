# DD-28 — FINAL NAMED-KPI COVERAGE MATRIX
**Date:** 2026-09-12 · **Status:** FINAL FABLE KPI REVALIDATION
**Method:** independently extracted KPI/report metric names from all nine canonical industry/MS DD files and mapped each to stable DD-25 contract IDs. Composite labels map to each required underlying KPI rather than being accepted by fuzzy name alone.

| MS | Named KPI / metric in canonical industry DD | KPI contract ID(s) | Formula contract completeness | Fixture test | Isolation test | Result |
|---|---|---|---|---|---|---|
| HLT-HMS | bed occupancy | HLT-HMS-KPI-01 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HLT-HMS-KPI-01-T01 | HLT-HMS-KPI-01-T02 | VERIFIED |
| HLT-HMS | LOS | HLT-HMS-KPI-02 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HLT-HMS-KPI-02-T01 | HLT-HMS-KPI-02-T02 | VERIFIED |
| HLT-HMS | OPD throughput | HLT-HMS-KPI-03 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HLT-HMS-KPI-03-T01 | HLT-HMS-KPI-03-T02 | VERIFIED |
| HLT-HMS | OT utilization | HLT-HMS-KPI-04 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HLT-HMS-KPI-04-T01 | HLT-HMS-KPI-04-T02 | VERIFIED |
| HLT-HMS | discharge TAT | HLT-HMS-KPI-05 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HLT-HMS-KPI-05-T01 | HLT-HMS-KPI-05-T02 | VERIFIED |
| HLT-HMS | readmission | HLT-HMS-KPI-06 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HLT-HMS-KPI-06-T01 | HLT-HMS-KPI-06-T02 | VERIFIED |
| HLT-HMS | order TAT. Exports are permission/residency governed | HLT-HMS-KPI-07 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HLT-HMS-KPI-07-T01 | HLT-HMS-KPI-07-T02 | VERIFIED |
| HLT-LIS | sample TAT | HLT-LIS-KPI-01 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HLT-LIS-KPI-01-T01 | HLT-LIS-KPI-01-T02 | VERIFIED |
| HLT-LIS | rejection rate | HLT-LIS-KPI-02 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HLT-LIS-KPI-02-T01 | HLT-LIS-KPI-02-T02 | VERIFIED |
| HLT-LIS | verification backlog | HLT-LIS-KPI-03 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HLT-LIS-KPI-03-T01 | HLT-LIS-KPI-03-T02 | VERIFIED |
| HLT-LIS | critical acknowledgment TAT | HLT-LIS-KPI-04 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HLT-LIS-KPI-04-T01 | HLT-LIS-KPI-04-T02 | VERIFIED |
| HLT-LIS | department/test volume | HLT-LIS-KPI-05 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HLT-LIS-KPI-05-T01 | HLT-LIS-KPI-05-T02 | VERIFIED |
| HLT-RIS | TAT by modality | HLT-RIS-KPI-01 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HLT-RIS-KPI-01-T01 | HLT-RIS-KPI-01-T02 | VERIFIED |
| HLT-RIS | repeat rate | HLT-RIS-KPI-02 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HLT-RIS-KPI-02-T01 | HLT-RIS-KPI-02-T02 | VERIFIED |
| HLT-RIS | backlog | HLT-RIS-KPI-03 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HLT-RIS-KPI-03-T01 | HLT-RIS-KPI-03-T02 | VERIFIED |
| HLT-RIS | utilization | HLT-RIS-KPI-04 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HLT-RIS-KPI-04-T01 | HLT-RIS-KPI-04-T02 | VERIFIED |
| HLT-RIS | critical acknowledgment | HLT-RIS-KPI-90 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HLT-RIS-KPI-90-T01 | HLT-RIS-KPI-90-T02 | VERIFIED |
| HLT-PMS | stock turnover | HLT-PMS-KPI-01 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HLT-PMS-KPI-01-T01 | HLT-PMS-KPI-01-T02 | VERIFIED |
| HLT-PMS | expiry write-off % | HLT-PMS-KPI-02 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HLT-PMS-KPI-02-T01 | HLT-PMS-KPI-02-T02 | VERIFIED |
| HLT-PMS | fill TAT | HLT-PMS-KPI-03 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HLT-PMS-KPI-03-T01 | HLT-PMS-KPI-03-T02 | VERIFIED |
| HLT-PMS | stock-out rate | HLT-PMS-KPI-04 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HLT-PMS-KPI-04-T01 | HLT-PMS-KPI-04-T02 | VERIFIED |
| HLT-PMS | recall closure TAT | HLT-PMS-KPI-05 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HLT-PMS-KPI-05-T01 | HLT-PMS-KPI-05-T02 | VERIFIED |
| HLT-PMS | controlled-register exception count | HLT-PMS-KPI-06 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HLT-PMS-KPI-06-T01 | HLT-PMS-KPI-06-T02 | VERIFIED |
| HLT-CMS | consultations/day | HLT-CMS-KPI-01 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HLT-CMS-KPI-01-T01 | HLT-CMS-KPI-01-T02 | VERIFIED |
| HLT-CMS | wait time | HLT-CMS-KPI-02 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HLT-CMS-KPI-02-T01 | HLT-CMS-KPI-02-T02 | VERIFIED |
| HLT-CMS | follow-up adherence | HLT-CMS-KPI-03 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HLT-CMS-KPI-03-T01 | HLT-CMS-KPI-03-T02 | VERIFIED |
| HLT-CMS | no-show rate | HLT-CMS-KPI-04 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HLT-CMS-KPI-04-T01 | HLT-CMS-KPI-04-T02 | VERIFIED |
| HLT-CMS | revenue/doctor via Core billing projection | HLT-CMS-KPI-90 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HLT-CMS-KPI-90-T01 | HLT-CMS-KPI-90-T02 | VERIFIED |
| EDU-SMS | enrollment | EDU-SMS-KPI-90 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | EDU-SMS-KPI-90-T01 | EDU-SMS-KPI-90-T02 | VERIFIED |
| EDU-SMS | attendance % | EDU-SMS-KPI-01 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | EDU-SMS-KPI-01-T01 | EDU-SMS-KPI-01-T02 | VERIFIED |
| EDU-SMS | fee realization | EDU-SMS-KPI-03 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | EDU-SMS-KPI-03-T01 | EDU-SMS-KPI-03-T02 | VERIFIED |
| EDU-SMS | promotion rate | EDU-SMS-KPI-02 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | EDU-SMS-KPI-02-T01 | EDU-SMS-KPI-02-T02 | VERIFIED |
| EDU-CUM | enrollment | EDU-CUM-KPI-90 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | EDU-CUM-KPI-90-T01 | EDU-CUM-KPI-90-T02 | VERIFIED |
| EDU-CUM | retention | EDU-CUM-KPI-01 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | EDU-CUM-KPI-01-T01 | EDU-CUM-KPI-01-T02 | VERIFIED |
| EDU-CUM | attendance | EDU-CUM-KPI-91 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | EDU-CUM-KPI-91-T01 | EDU-CUM-KPI-91-T02 | VERIFIED |
| EDU-CUM | progression | EDU-CUM-KPI-92 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | EDU-CUM-KPI-92-T01 | EDU-CUM-KPI-92-T02 | VERIFIED |
| EDU-CUM | completion | EDU-CUM-KPI-02 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | EDU-CUM-KPI-02-T01 | EDU-CUM-KPI-02-T02 | VERIFIED |
| EDU-CTM | conversion % | EDU-CTM-KPI-01 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | EDU-CTM-KPI-01-T01 | EDU-CTM-KPI-01-T02 | VERIFIED |
| EDU-CTM | batch fill % | EDU-CTM-KPI-02 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | EDU-CTM-KPI-02-T01 | EDU-CTM-KPI-02-T02 | VERIFIED |
| EDU-CTM | fee realization | EDU-CTM-KPI-90 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | EDU-CTM-KPI-90-T01 | EDU-CTM-KPI-90-T02 | VERIFIED |
| EDU-CTM | completion rate | EDU-CTM-KPI-91 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | EDU-CTM-KPI-91-T01 | EDU-CTM-KPI-91-T02 | VERIFIED |
| EDU-CTM | trainer utilization | EDU-CTM-KPI-03 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | EDU-CTM-KPI-03-T01 | EDU-CTM-KPI-03-T02 | VERIFIED |
| EDU-LMS | completion | EDU-LMS-KPI-01 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | EDU-LMS-KPI-01-T01 | EDU-LMS-KPI-01-T02 | VERIFIED |
| EDU-LMS | engagement | EDU-LMS-KPI-90 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | EDU-LMS-KPI-90-T01 | EDU-LMS-KPI-90-T02 | VERIFIED |
| EDU-LMS | submission % | EDU-LMS-KPI-02 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | EDU-LMS-KPI-02-T01 | EDU-LMS-KPI-02-T02 | VERIFIED |
| EDU-LMS | pass rate | EDU-LMS-KPI-03 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | EDU-LMS-KPI-03-T01 | EDU-LMS-KPI-03-T02 | VERIFIED |
| EDU-EMS | pass % | EDU-EMS-KPI-01 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | EDU-EMS-KPI-01-T01 | EDU-EMS-KPI-01-T02 | VERIFIED |
| EDU-EMS | evaluation TAT | EDU-EMS-KPI-02 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | EDU-EMS-KPI-02-T01 | EDU-EMS-KPI-02-T02 | VERIFIED |
| EDU-EMS | moderation backlog | EDU-EMS-KPI-03 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | EDU-EMS-KPI-03-T01 | EDU-EMS-KPI-03-T02 | VERIFIED |
| EDU-EMS | re-evaluation rate | EDU-EMS-KPI-04 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | EDU-EMS-KPI-04-T01 | EDU-EMS-KPI-04-T02 | VERIFIED |
| RTL-RSM | sales/store | RTL-RSM-KPI-90 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | RTL-RSM-KPI-90-T01 | RTL-RSM-KPI-90-T02 | VERIFIED |
| RTL-RSM | cash variance | RTL-RSM-KPI-01 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | RTL-RSM-KPI-01-T01 | RTL-RSM-KPI-01-T02 | VERIFIED |
| RTL-RSM | shrinkage | RTL-RSM-KPI-02 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | RTL-RSM-KPI-02-T01 | RTL-RSM-KPI-02-T02 | VERIFIED |
| RTL-RSM | checklist compliance | RTL-RSM-KPI-03 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | RTL-RSM-KPI-03-T01 | RTL-RSM-KPI-03-T02 | VERIFIED |
| RTL-POS | sales | RTL-POS-KPI-90 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | RTL-POS-KPI-90-T01 | RTL-POS-KPI-90-T02 | VERIFIED |
| RTL-POS | basket value | RTL-POS-KPI-01 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | RTL-POS-KPI-01-T01 | RTL-POS-KPI-01-T02 | VERIFIED |
| RTL-POS | tender mix | RTL-POS-KPI-91 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | RTL-POS-KPI-91-T01 | RTL-POS-KPI-91-T02 | VERIFIED |
| RTL-POS | refund/void rate | RTL-POS-KPI-02 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | RTL-POS-KPI-02-T01 | RTL-POS-KPI-02-T02 | VERIFIED |
| RTL-IWM | turnover | RTL-IWM-KPI-90 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | RTL-IWM-KPI-90-T01 | RTL-IWM-KPI-90-T02 | VERIFIED |
| RTL-IWM | fill rate | RTL-IWM-KPI-01 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | RTL-IWM-KPI-01-T01 | RTL-IWM-KPI-01-T02 | VERIFIED |
| RTL-IWM | inventory accuracy | RTL-IWM-KPI-02 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | RTL-IWM-KPI-02-T01 | RTL-IWM-KPI-02-T02 | VERIFIED |
| RTL-IWM | stockout | RTL-IWM-KPI-03 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | RTL-IWM-KPI-03-T01 | RTL-IWM-KPI-03-T02 | VERIFIED |
| RTL-OMS | AOV | RTL-OMS-KPI-01 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | RTL-OMS-KPI-01-T01 | RTL-OMS-KPI-01-T02 | VERIFIED |
| RTL-OMS | fulfillment time | RTL-OMS-KPI-02 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | RTL-OMS-KPI-02-T01 | RTL-OMS-KPI-02-T02 | VERIFIED |
| RTL-OMS | delivery % | RTL-OMS-KPI-90 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | RTL-OMS-KPI-90-T01 | RTL-OMS-KPI-90-T02 | VERIFIED |
| RTL-OMS | return rate | RTL-OMS-KPI-91 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | RTL-OMS-KPI-91-T01 | RTL-OMS-KPI-91-T02 | VERIFIED |
| RTL-MKT | active sellers | RTL-MKT-KPI-90 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | RTL-MKT-KPI-90-T01 | RTL-MKT-KPI-90-T02 | VERIFIED |
| RTL-MKT | GMV | RTL-MKT-KPI-01 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | RTL-MKT-KPI-01-T01 | RTL-MKT-KPI-01-T02 | VERIFIED |
| RTL-MKT | commission | RTL-MKT-KPI-91 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | RTL-MKT-KPI-91-T01 | RTL-MKT-KPI-91-T02 | VERIFIED |
| RTL-MKT | settlement TAT | RTL-MKT-KPI-02 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | RTL-MKT-KPI-02-T01 | RTL-MKT-KPI-02-T02 | VERIFIED |
| HSP-HMS | occupancy | HSP-HMS-KPI-01 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HSP-HMS-KPI-01-T01 | HSP-HMS-KPI-01-T02 | VERIFIED |
| HSP-HMS | ADR | HSP-HMS-KPI-02 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HSP-HMS-KPI-02-T01 | HSP-HMS-KPI-02-T02 | VERIFIED |
| HSP-HMS | RevPAR | HSP-HMS-KPI-03 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HSP-HMS-KPI-03-T01 | HSP-HMS-KPI-03-T02 | VERIFIED |
| HSP-HMS | housekeeping turnaround | HSP-HMS-KPI-04 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HSP-HMS-KPI-04-T01 | HSP-HMS-KPI-04-T02 | VERIFIED |
| HSP-RMS | covers | HSP-RMS-KPI-90 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HSP-RMS-KPI-90-T01 | HSP-RMS-KPI-90-T02 | VERIFIED |
| HSP-RMS | table turnover | HSP-RMS-KPI-01 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HSP-RMS-KPI-01-T01 | HSP-RMS-KPI-01-T02 | VERIFIED |
| HSP-RMS | ticket time | HSP-RMS-KPI-02 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HSP-RMS-KPI-02-T01 | HSP-RMS-KPI-02-T02 | VERIFIED |
| HSP-RMS | void rate | HSP-RMS-KPI-91 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HSP-RMS-KPI-91-T01 | HSP-RMS-KPI-91-T02 | VERIFIED |
| HSP-BEM | conversion | HSP-BEM-KPI-01 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HSP-BEM-KPI-01-T01 | HSP-BEM-KPI-01-T02 | VERIFIED |
| HSP-BEM | event revenue | HSP-BEM-KPI-90 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HSP-BEM-KPI-90-T01 | HSP-BEM-KPI-90-T02 | VERIFIED |
| HSP-BEM | venue utilization | HSP-BEM-KPI-02 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HSP-BEM-KPI-02-T01 | HSP-BEM-KPI-02-T02 | VERIFIED |
| HSP-BEM | variance | HSP-BEM-KPI-91 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HSP-BEM-KPI-91-T01 | HSP-BEM-KPI-91-T02 | VERIFIED |
| HSP-RBM | forecast occupancy | HSP-RBM-KPI-01 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HSP-RBM-KPI-01-T01 | HSP-RBM-KPI-01-T02 | VERIFIED |
| HSP-RBM | booking pace | HSP-RBM-KPI-90 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HSP-RBM-KPI-90-T01 | HSP-RBM-KPI-90-T02 | VERIFIED |
| HSP-RBM | cancellation/no-show | HSP-RBM-KPI-91, HSP-RBM-KPI-02 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | HSP-RBM-KPI-91-T01, HSP-RBM-KPI-02-T01 | HSP-RBM-KPI-91-T02, HSP-RBM-KPI-02-T02 | VERIFIED |
| MFG-PMS | OEE | MFG-PMS-KPI-01 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | MFG-PMS-KPI-01-T01 | MFG-PMS-KPI-01-T02 | VERIFIED |
| MFG-PMS | yield | MFG-PMS-KPI-02 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | MFG-PMS-KPI-02-T01 | MFG-PMS-KPI-02-T02 | VERIFIED |
| MFG-PMS | scrap | MFG-PMS-KPI-03 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | MFG-PMS-KPI-03-T01 | MFG-PMS-KPI-03-T02 | VERIFIED |
| MFG-PMS | schedule adherence | MFG-PMS-KPI-04 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | MFG-PMS-KPI-04-T01 | MFG-PMS-KPI-04-T02 | VERIFIED |
| MFG-IWM | accuracy | MFG-IWM-KPI-01 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | MFG-IWM-KPI-01-T01 | MFG-IWM-KPI-01-T02 | VERIFIED |
| MFG-IWM | turns | MFG-IWM-KPI-02 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | MFG-IWM-KPI-02-T01 | MFG-IWM-KPI-02-T02 | VERIFIED |
| MFG-IWM | released-order stockouts | MFG-IWM-KPI-90 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | MFG-IWM-KPI-90-T01 | MFG-IWM-KPI-90-T02 | VERIFIED |
| MFG-IWM | dead stock | MFG-IWM-KPI-91 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | MFG-IWM-KPI-91-T01 | MFG-IWM-KPI-91-T02 | VERIFIED |
| MFG-QMS | defect rate | MFG-QMS-KPI-02 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | MFG-QMS-KPI-02-T01 | MFG-QMS-KPI-02-T02 | VERIFIED |
| MFG-QMS | first-pass yield | MFG-QMS-KPI-01 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | MFG-QMS-KPI-01-T01 | MFG-QMS-KPI-01-T02 | VERIFIED |
| MFG-QMS | CAPA aging | MFG-QMS-KPI-90 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | MFG-QMS-KPI-90-T01 | MFG-QMS-KPI-90-T02 | VERIFIED |
| MFG-PRO | PO cycle | MFG-PRO-KPI-01 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | MFG-PRO-KPI-01-T01 | MFG-PRO-KPI-01-T02 | VERIFIED |
| MFG-PRO | supplier performance | MFG-PRO-KPI-90 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | MFG-PRO-KPI-90-T01 | MFG-PRO-KPI-90-T02 | VERIFIED |
| MFG-PRO | price variance | MFG-PRO-KPI-02 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | MFG-PRO-KPI-02-T01 | MFG-PRO-KPI-02-T02 | VERIFIED |
| MFG-MMS | MTBF | MFG-MMS-KPI-01 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | MFG-MMS-KPI-01-T01 | MFG-MMS-KPI-01-T02 | VERIFIED |
| MFG-MMS | MTTR | MFG-MMS-KPI-02 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | MFG-MMS-KPI-02-T01 | MFG-MMS-KPI-02-T02 | VERIFIED |
| MFG-MMS | downtime | MFG-MMS-KPI-90 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | MFG-MMS-KPI-90-T01 | MFG-MMS-KPI-90-T02 | VERIFIED |
| MFG-MMS | preventive compliance | MFG-MMS-KPI-03 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | MFG-MMS-KPI-03-T01 | MFG-MMS-KPI-03-T02 | VERIFIED |
| PSV-CRM | pipeline | PSV-CRM-KPI-90 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | PSV-CRM-KPI-90-T01 | PSV-CRM-KPI-90-T02 | VERIFIED |
| PSV-CRM | win rate | PSV-CRM-KPI-01 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | PSV-CRM-KPI-01-T01 | PSV-CRM-KPI-01-T02 | VERIFIED |
| PSV-CRM | sales cycle | PSV-CRM-KPI-02 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | PSV-CRM-KPI-02-T01 | PSV-CRM-KPI-02-T02 | VERIFIED |
| PSV-CRM | source conversion | PSV-CRM-KPI-91 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | PSV-CRM-KPI-91-T01 | PSV-CRM-KPI-91-T02 | VERIFIED |
| PSV-PJM | on-time % | PSV-PJM-KPI-01 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | PSV-PJM-KPI-01-T01 | PSV-PJM-KPI-01-T02 | VERIFIED |
| PSV-PJM | margin | PSV-PJM-KPI-02 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | PSV-PJM-KPI-02-T01 | PSV-PJM-KPI-02-T02 | VERIFIED |
| PSV-PJM | change volume | PSV-PJM-KPI-90 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | PSV-PJM-KPI-90-T01 | PSV-PJM-KPI-90-T02 | VERIFIED |
| PSV-PJM | milestone acceptance | PSV-PJM-KPI-91 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | PSV-PJM-KPI-91-T01 | PSV-PJM-KPI-91-T02 | VERIFIED |
| PSV-SDM | SLA % | PSV-SDM-KPI-01 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | PSV-SDM-KPI-01-T01 | PSV-SDM-KPI-01-T02 | VERIFIED |
| PSV-SDM | response/resolution | PSV-SDM-KPI-02, PSV-SDM-KPI-90 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | PSV-SDM-KPI-02-T01, PSV-SDM-KPI-90-T01 | PSV-SDM-KPI-02-T02, PSV-SDM-KPI-90-T02 | VERIFIED |
| PSV-SDM | backlog age | PSV-SDM-KPI-91 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | PSV-SDM-KPI-91-T01 | PSV-SDM-KPI-91-T02 | VERIFIED |
| PSV-SDM | CSAT | PSV-SDM-KPI-92 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | PSV-SDM-KPI-92-T01 | PSV-SDM-KPI-92-T02 | VERIFIED |
| PSV-SDM | profitability | PSV-SDM-KPI-93 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | PSV-SDM-KPI-93-T01 | PSV-SDM-KPI-93-T02 | VERIFIED |
| PSV-RTM | utilization | PSV-RTM-KPI-01 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | PSV-RTM-KPI-01-T01 | PSV-RTM-KPI-01-T02 | VERIFIED |
| PSV-RTM | billable % | PSV-RTM-KPI-02 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | PSV-RTM-KPI-02-T01 | PSV-RTM-KPI-02-T02 | VERIFIED |
| PSV-RTM | approval TAT | PSV-RTM-KPI-03 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | PSV-RTM-KPI-03-T01 | PSV-RTM-KPI-03-T02 | VERIFIED |
| PSV-RTM | allocation conflict | PSV-RTM-KPI-90 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | PSV-RTM-KPI-90-T01 | PSV-RTM-KPI-90-T02 | VERIFIED |
| PSV-SGM | conversion | PSV-SGM-KPI-90 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | PSV-SGM-KPI-90-T01 | PSV-SGM-KPI-90-T02 | VERIFIED |
| PSV-SGM | turnaround | PSV-SGM-KPI-01 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | PSV-SGM-KPI-01-T01 | PSV-SGM-KPI-01-T02 | VERIFIED |
| PSV-SGM | revisions | PSV-SGM-KPI-91 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | PSV-SGM-KPI-91-T01 | PSV-SGM-KPI-91-T02 | VERIFIED |
| PSV-SGM | utilization | PSV-SGM-KPI-92 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | PSV-SGM-KPI-92-T01 | PSV-SGM-KPI-92-T02 | VERIFIED |
| GOV-CSM | SLA % | GOV-CSM-KPI-01 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | GOV-CSM-KPI-01-T01 | GOV-CSM-KPI-01-T02 | VERIFIED |
| GOV-CSM | pendency | GOV-CSM-KPI-03 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | GOV-CSM-KPI-03-T01 | GOV-CSM-KPI-03-T02 | VERIFIED |
| GOV-CSM | resolution time | GOV-CSM-KPI-02 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | GOV-CSM-KPI-02-T01 | GOV-CSM-KPI-02-T02 | VERIFIED |
| GOV-CSM | reopen rate | GOV-CSM-KPI-90 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | GOV-CSM-KPI-90-T01 | GOV-CSM-KPI-90-T02 | VERIFIED |
| GOV-CFM | pendency | GOV-CFM-KPI-90 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | GOV-CFM-KPI-90-T01 | GOV-CFM-KPI-90-T02 | VERIFIED |
| GOV-CFM | movement time | GOV-CFM-KPI-91 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | GOV-CFM-KPI-91-T01 | GOV-CFM-KPI-91-T02 | VERIFIED |
| GOV-CFM | disposal rate | GOV-CFM-KPI-92 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | GOV-CFM-KPI-92-T01 | GOV-CFM-KPI-92-T02 | VERIFIED |
| GOV-PLM | issuance TAT | GOV-PLM-KPI-01 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | GOV-PLM-KPI-01-T01 | GOV-PLM-KPI-01-T02 | VERIFIED |
| GOV-PLM | deficiency % | GOV-PLM-KPI-02 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | GOV-PLM-KPI-02-T01 | GOV-PLM-KPI-02-T02 | VERIFIED |
| GOV-PLM | inspection backlog | GOV-PLM-KPI-90 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | GOV-PLM-KPI-90-T01 | GOV-PLM-KPI-90-T02 | VERIFIED |
| GOV-PLM | renewal backlog | GOV-PLM-KPI-91 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | GOV-PLM-KPI-91-T01 | GOV-PLM-KPI-91-T02 | VERIFIED |
| GOV-RTM | collection vs demand | GOV-RTM-KPI-01 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | GOV-RTM-KPI-01-T01 | GOV-RTM-KPI-01-T02 | VERIFIED |
| GOV-RTM | arrears | GOV-RTM-KPI-90 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | GOV-RTM-KPI-90-T01 | GOV-RTM-KPI-90-T02 | VERIFIED |
| GOV-RTM | reconciliation | GOV-RTM-KPI-91 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | GOV-RTM-KPI-91-T01 | GOV-RTM-KPI-91-T02 | VERIFIED |
| NGO-DMS | retention | NGO-DMS-KPI-01 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | NGO-DMS-KPI-01-T01 | NGO-DMS-KPI-01-T02 | VERIFIED |
| NGO-DMS | reactivation | NGO-DMS-KPI-90 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | NGO-DMS-KPI-90-T01 | NGO-DMS-KPI-90-T02 | VERIFIED |
| NGO-DMS | pledge fulfillment | NGO-DMS-KPI-02 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | NGO-DMS-KPI-02-T01 | NGO-DMS-KPI-02-T02 | VERIFIED |
| NGO-DMS | average gift | NGO-DMS-KPI-91 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | NGO-DMS-KPI-91-T01 | NGO-DMS-KPI-91-T02 | VERIFIED |
| NGO-DFM | donations | NGO-DFM-KPI-90 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | NGO-DFM-KPI-90-T01 | NGO-DFM-KPI-90-T02 | VERIFIED |
| NGO-DFM | fund utilization | NGO-DFM-KPI-01 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | NGO-DFM-KPI-01-T01 | NGO-DFM-KPI-01-T02 | VERIFIED |
| NGO-DFM | grant balance | NGO-DFM-KPI-02 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | NGO-DFM-KPI-02-T01 | NGO-DFM-KPI-02-T02 | VERIFIED |
| NGO-TAM | bookings | NGO-TAM-KPI-90 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | NGO-TAM-KPI-90-T01 | NGO-TAM-KPI-90-T02 | VERIFIED |
| NGO-TAM | participation | NGO-TAM-KPI-91 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | NGO-TAM-KPI-91-T01 | NGO-TAM-KPI-91-T02 | VERIFIED |
| NGO-TAM | revenue | NGO-TAM-KPI-92 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | NGO-TAM-KPI-92-T01 | NGO-TAM-KPI-92-T02 | VERIFIED |
| NGO-TAM | budget variance | NGO-TAM-KPI-01 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | NGO-TAM-KPI-01-T01 | NGO-TAM-KPI-01-T02 | VERIFIED |
| NGO-MVM | renewal % | NGO-MVM-KPI-01 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | NGO-MVM-KPI-01-T01 | NGO-MVM-KPI-01-T02 | VERIFIED |
| NGO-MVM | active members | NGO-MVM-KPI-90 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | NGO-MVM-KPI-90-T01 | NGO-MVM-KPI-90-T02 | VERIFIED |
| NGO-MVM | volunteer hours | NGO-MVM-KPI-91 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | NGO-MVM-KPI-91-T01 | NGO-MVM-KPI-91-T02 | VERIFIED |
| NGO-MVM | participation | NGO-MVM-KPI-92 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | NGO-MVM-KPI-92-T01 | NGO-MVM-KPI-92-T02 | VERIFIED |
| SFM-SGM | post coverage | SFM-SGM-KPI-01 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | SFM-SGM-KPI-01-T01 | SFM-SGM-KPI-01-T02 | VERIFIED |
| SFM-SGM | attendance compliance | SFM-SGM-KPI-02 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | SFM-SGM-KPI-02-T01 | SFM-SGM-KPI-02-T02 | VERIFIED |
| SFM-SGM | replacement TAT | SFM-SGM-KPI-03 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | SFM-SGM-KPI-03-T01 | SFM-SGM-KPI-03-T02 | VERIFIED |
| SFM-PMS | checkpoint completion | SFM-PMS-KPI-01 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | SFM-PMS-KPI-01-T01 | SFM-PMS-KPI-01-T02 | VERIFIED |
| SFM-PMS | incident rate/response | SFM-PMS-KPI-90, SFM-PMS-KPI-02 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | SFM-PMS-KPI-90-T01, SFM-PMS-KPI-02-T01 | SFM-PMS-KPI-90-T02, SFM-PMS-KPI-02-T02 | VERIFIED |
| SFM-VMS | throughput | SFM-VMS-KPI-90 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | SFM-VMS-KPI-90-T01 | SFM-VMS-KPI-90-T02 | VERIFIED |
| SFM-VMS | approval TAT | SFM-VMS-KPI-01 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | SFM-VMS-KPI-01-T01 | SFM-VMS-KPI-01-T02 | VERIFIED |
| SFM-VMS | overstay rate | SFM-VMS-KPI-02 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | SFM-VMS-KPI-02-T01 | SFM-VMS-KPI-02-T02 | VERIFIED |
| SFM-FMM | SLA % | SFM-FMM-KPI-01 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | SFM-FMM-KPI-01-T01 | SFM-FMM-KPI-01-T02 | VERIFIED |
| SFM-FMM | backlog | SFM-FMM-KPI-90 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | SFM-FMM-KPI-90-T01 | SFM-FMM-KPI-90-T02 | VERIFIED |
| SFM-FMM | MTTR | SFM-FMM-KPI-02 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | SFM-FMM-KPI-02-T01 | SFM-FMM-KPI-02-T02 | VERIFIED |
| SFM-FMM | PM compliance | SFM-FMM-KPI-03 | numerator + denominator + time + inclusion/exclusion + source + permission + refresh | SFM-FMM-KPI-03-T01 | SFM-FMM-KPI-03-T02 | VERIFIED |

## Result
- Named KPI/report metrics discovered: **165**.
- DD-25 KPI contracts present: **169**.
- Named metrics mapped to stable KPI contract(s): **165**.
- Unmapped named KPI: **0**.
- Every mapped contract carries formula inputs, time basis, inclusion/exclusion, source, permission, refresh owner and inherits `<KPI-ID>-T01` formula-fixture + `<KPI-ID>-T02` Tenant/Industry isolation acceptance tests.
- Extra DD-25 KPI contracts not named in the compact industry report sentence remain valid detailed metrics; they do not inflate named-KPI coverage.
