# DD-25 — KPI CALCULATION CATALOG
**Status:** ACTIVE REMEDIATION EVIDENCE · **Date:** 2026-09-11
**Authority:** Fable 5 remediation mandate · industry DD reports/KPIs · DD-15

## Global KPI rules
Every KPI is computed inside the caller's verified `tenant_id + industry_context_id`; cross-industry aggregation requires DD-02 `EXPLICIT_CROSS_CONTEXT`. All projections retain source event/resource lineage and policy/version. Currency KPIs are never summed across currencies without an approved FX conversion policy. Permissions below are minimum report permissions; row/field ABAC and sensitivity policy still apply. Refresh owner is the MS projection worker unless stated Core billing/analytics.

| KPI ID | MS | KPI | Numerator | Denominator | Time basis | Inclusion / exclusion | Source entities/events | Permission | Refresh |
|---|---|---|---|---|---|---|---|---|---|
| HLT-HMS-KPI-01 | HLT-HMS | Bed occupancy % | occupied bed-minutes | available bed-minutes | property-local day/month | exclude OUT_OF_ORDER beds | hlt_hms_bed + admission occupancy projection | `hlt.hms.report.view` | 15m |
| HLT-HMS-KPI-02 | HLT-HMS | LOS | sum(discharge_at-admission_at) hours | count discharged admissions | rolling month | exclude cancelled/non-admitted | hlt_hms_admission | `hlt.hms.report.view` | hourly |
| HLT-HMS-KPI-03 | HLT-HMS | OPD throughput | count encounters CLOSED | 1 | local day | encounter_type=OPD | hlt_hms_encounter | `hlt.hms.report.view` | 15m |
| HLT-HMS-KPI-04 | HLT-HMS | OT utilization % | procedure occupied minutes | scheduled available OT minutes | local day/month | exclude cancelled cases | hlt_hms_ot_case + OT calendar | `hlt.hms.report.view` | 15m |
| HLT-HMS-KPI-05 | HLT-HMS | Discharge TAT | sum(DISCHARGE_INITIATED→DISCHARGED duration) | count discharged admissions | month | exclude LAMA/referred-out unless separately filtered | hlt_hms_admission transition projection | `hlt.hms.report.view` | 15m |
| HLT-HMS-KPI-06 | HLT-HMS | Readmission % | discharges with new admission within configured 30d window | eligible discharges | rolling 30/90d | exclude planned/readmission-exempt policy codes | admission projection | `hlt.hms.report.view` | daily |
| HLT-HMS-KPI-07 | HLT-HMS | Order TAT | sum(COMPLETED-ORDERED) | count completed clinical orders | day/month | exclude cancelled | hlt_hms_order | `hlt.hms.report.view` | 15m |
| HLT-LIS-KPI-01 | HLT-LIS | Sample TAT | sum(RECEIVED→VERIFIED duration) | count verified tests | day/month | exclude rejected/recollected | hlt_lis_order_test/specimen | `hlt.lis.report.view` | 15m |
| HLT-LIS-KPI-02 | HLT-LIS | Rejection rate % | rejected specimens | received+rejected specimens | day/month | exclude cancelled orders | hlt_lis_specimen | `hlt.lis.report.view` | 15m |
| HLT-LIS-KPI-03 | HLT-LIS | Verification backlog | count results in RESULTED/HELD not VERIFIED | 1 | point-in-time | active orders only | hlt_lis_result/order_test | `hlt.lis.report.view` | 5m |
| HLT-LIS-KPI-04 | HLT-LIS | Critical acknowledgment TAT | sum(acknowledged_at-sent_at) | count acknowledged critical alerts | day/month | exclude test alerts | hlt_lis_critical_alert | `hlt.lis.report.view` | 5m |
| HLT-LIS-KPI-05 | HLT-LIS | Test volume | count ordered tests reaching VERIFIED/APPROVED/PUBLISHED | 1 | day/month | group by department/test | hlt_lis_order_test | `hlt.lis.report.view` | 15m |
| HLT-RIS-KPI-01 | HLT-RIS | Imaging TAT | sum(PERFORMED→APPROVED duration) | count approved reports | day/month | group by modality; exclude cancelled | hlt_ris_order/report | `hlt.ris.report.view` | 15m |
| HLT-RIS-KPI-02 | HLT-RIS | Repeat rate % | repeat exams | performed exams | month | exclude planned multi-series | hlt_ris_exam | `hlt.ris.report.view` | hourly |
| HLT-RIS-KPI-03 | HLT-RIS | Reading backlog | count IMAGES_AVAILABLE/READING without approved report | 1 | point-in-time | active exams | hlt_ris_order/report | `hlt.ris.report.view` | 5m |
| HLT-RIS-KPI-04 | HLT-RIS | Modality utilization % | performed scan minutes | available modality minutes | day/month | exclude maintenance | appointment/exam + modality calendar | `hlt.ris.report.view` | 15m |
| HLT-PMS-KPI-01 | HLT-PMS | Stock turnover | dispensed inventory cost/value during period | average inventory value | month/quarter | exclude recalled/expired write-offs from numerator | dispense + inventory projection | `hlt.pms.report.view` | daily |
| HLT-PMS-KPI-02 | HLT-PMS | Expiry write-off % | expiry write-off value | average inventory value | month | expiry reason only | stock movement projection | `hlt.pms.report.view` | daily |
| HLT-PMS-KPI-03 | HLT-PMS | Fill TAT | sum(DISPENSED-VALIDATED duration) | count dispensed prescriptions | day/month | exclude cancelled | prescription/dispense | `hlt.pms.report.view` | 15m |
| HLT-PMS-KPI-04 | HLT-PMS | Stock-out rate % | requested dispense lines unavailable in full | dispense request lines | month | exclude unavailable due to policy hold | dispense request projection | `hlt.pms.report.view` | hourly |
| HLT-PMS-KPI-05 | HLT-PMS | Recall closure TAT | sum(CLOSED-NOTICE duration) | count closed recall cases | quarter | none | hlt_pms_recall | `hlt.pms.report.view` | daily |
| HLT-PMS-KPI-06 | HLT-PMS | Controlled exception count | count controlled-register override/exception events | 1 | day/month | none | controlled register audit projection | `hlt.pms.controlled.report` | 15m |
| HLT-CMS-KPI-01 | HLT-CMS | Consultations/day | count encounters SIGNED/CLOSED | 1 | clinic-local day | exclude cancelled | hlt_cms_encounter | `hlt.cms.report.view` | 15m |
| HLT-CMS-KPI-02 | HLT-CMS | Wait time | sum(IN_CONSULTATION start-CHECKED_IN) | count consultations | day/month | exclude no-show | appointment/encounter transitions | `hlt.cms.report.view` | 15m |
| HLT-CMS-KPI-03 | HLT-CMS | Follow-up adherence % | completed followups by due window | due followups | month | exclude cancelled | hlt_cms_followup | `hlt.cms.report.view` | daily |
| HLT-CMS-KPI-04 | HLT-CMS | No-show rate % | NO_SHOW appointments | BOOKED appointments whose time elapsed | month | exclude cancelled | hlt_cms_appointment | `hlt.cms.report.view` | hourly |
| EDU-SMS-KPI-01 | EDU-SMS | Attendance % | PRESENT + policy-weighted LATE/EXCUSED attended units | eligible scheduled attendance units | term/month | exclude cancelled sessions; weights from AttendancePolicy | attendance/session projection | `edu.sms.report.view` | daily |
| EDU-SMS-KPI-02 | EDU-SMS | Promotion rate % | students promoted | students evaluated for promotion | academic year | exclude withdrawn | promotion decision projection | `edu.sms.report.view` | daily |
| EDU-SMS-KPI-03 | EDU-SMS | Fee realization % | collected eligible fees | invoiced/due eligible fees | month/term | exclude reversed/waived per policy | Core billing projection | `edu.sms.finance.report` | daily |
| EDU-CUM-KPI-01 | EDU-CUM | Retention % | continuing eligible students | prior-period active eligible students | term/year | exclude graduates/completed | enrollment projection | `edu.cum.report.view` | daily |
| EDU-CUM-KPI-02 | EDU-CUM | Completion % | COMPLETED enrollments | eligible cohort enrollments | cohort | exclude withdrawals before census date | edu_cum_enrollment | `edu.cum.report.view` | daily |
| EDU-CTM-KPI-01 | EDU-CTM | Conversion % | CONVERTED enquiries | qualified/contacted eligible enquiries | month | exclude duplicates/test leads | edu_ctm_enquiry | `edu.ctm.report.view` | daily |
| EDU-CTM-KPI-02 | EDU-CTM | Batch fill % | active enrolled seats | configured batch capacity | point-in-time | exclude dropped | batch enrollment + batch capacity | `edu.ctm.report.view` | 15m |
| EDU-CTM-KPI-03 | EDU-CTM | Trainer utilization % | delivered trainer hours | available trainer hours | week/month | exclude approved leave | schedule/calendar projection | `edu.ctm.report.view` | daily |
| EDU-LMS-KPI-01 | EDU-LMS | Course completion % | COMPLETED enrollments | started/enrolled eligible learners | course/cohort | exclude DROPPED when policy excludes | edu_lms_enrollment | `edu.lms.report.view` | hourly |
| EDU-LMS-KPI-02 | EDU-LMS | Submission % | submitted required assessments | required assessment opportunities | course/period | exclude excused/waived | assignment submissions | `edu.lms.report.view` | hourly |
| EDU-LMS-KPI-03 | EDU-LMS | Pass rate % | passing final assessment outcomes | graded eligible outcomes | course/cohort | policy grading scale | graded submissions | `edu.lms.report.view` | hourly |
| EDU-EMS-KPI-01 | EDU-EMS | Pass % | students meeting GradingPolicy pass rule | published eligible candidates | exam/term | exclude held/withdrawn | final result projection | `edu.ems.report.view` | on publication + daily |
| EDU-EMS-KPI-02 | EDU-EMS | Evaluation TAT | sum(FINAL/SUBMITTED completion - assessment CONDUCTED) | count finalized candidates/papers | exam | exclude cancelled | exam/result transitions | `edu.ems.report.view` | hourly |
| EDU-EMS-KPI-03 | EDU-EMS | Moderation backlog | count SUBMITTED results awaiting moderation | 1 | point-in-time | moderation-enabled exams | result projection | `edu.ems.report.view` | 5m |
| EDU-EMS-KPI-04 | EDU-EMS | Re-evaluation rate % | re-evaluation requests | published results | term | exclude system corrections | re-evaluation/result versions | `edu.ems.report.view` | daily |
| RTL-RSM-KPI-01 | RTL-RSM | Cash variance | counted cash - expected cash | 1 | store day | exclude approved non-cash movements | cash movements/session reconciliation | `rtl.rsm.report.view` | on close |
| RTL-RSM-KPI-02 | RTL-RSM | Shrinkage % | book inventory value - counted inventory value | book inventory value | count period | exclude approved write-offs | inventory/count projection | `rtl.rsm.report.view` | on count |
| RTL-RSM-KPI-03 | RTL-RSM | Checklist compliance % | DONE required checklist items | required checklist items | store day | exclude not-applicable catalog items | store checklist | `rtl.rsm.report.view` | 15m |
| RTL-POS-KPI-01 | RTL-POS | Average basket value | net paid sales amount | count paid sales | day/month | exclude voided; refunds netted by policy | rtl_pos_sale/tender | `rtl.pos.report.view` | 15m |
| RTL-POS-KPI-02 | RTL-POS | Refund/Void rate % | refunded or voided sales | paid+voided sales | day/month | exclude training mode | sale state projection | `rtl.pos.report.view` | 15m |
| RTL-IWM-KPI-01 | RTL-IWM | Fill rate % | order/reservation lines fulfilled in full | eligible demand lines | day/month | exclude customer cancellations | reservation/movement projection | `rtl.iwm.report.view` | hourly |
| RTL-IWM-KPI-02 | RTL-IWM | Inventory accuracy % | counted SKU-location records within tolerance | counted SKU-location records | count event/month | exclude uncounted | cycle count | `rtl.iwm.report.view` | on post |
| RTL-IWM-KPI-03 | RTL-IWM | Stockout % | SKU-location demand observations with available<=0 | eligible demand observations | day/month | exclude disabled SKUs | balance/demand projection | `rtl.iwm.report.view` | hourly |
| RTL-OMS-KPI-01 | RTL-OMS | AOV | net order amount | count non-cancelled paid orders | day/month | refunds netted | order projection | `rtl.oms.report.view` | 15m |
| RTL-OMS-KPI-02 | RTL-OMS | Fulfillment time | sum(SHIPPED/DELIVERED - PAID) | count shipped/delivered orders | day/month | exclude cancelled | order transitions | `rtl.oms.report.view` | 15m |
| RTL-MKT-KPI-01 | RTL-MKT | GMV | sum seller order gross merchandise value | 1 | day/month | exclude cancelled; before returns by default with net-GMV separate | marketplace order projection | `rtl.mkt.report.view` | 15m |
| RTL-MKT-KPI-02 | RTL-MKT | Settlement TAT | sum(PAID-APPROVED) | count paid settlements | month | exclude reversed | settlement transitions | `rtl.mkt.report.view` | hourly |
| HSP-HMS-KPI-01 | HSP-HMS | Occupancy % | sold/occupied room-nights | available sellable room-nights | business day/month | exclude OUT_OF_ORDER; include complimentary if occupied | stay + room availability | `hsp.hms.report.view` | 15m |
| HSP-HMS-KPI-02 | HSP-HMS | ADR | eligible room revenue | sold room-nights | business day/month | exclude taxes/non-room revenue; include comps only if revenue>0 | folio room-charge projection | `hsp.hms.report.view` | night audit + 15m |
| HSP-HMS-KPI-03 | HSP-HMS | RevPAR | eligible room revenue | available sellable room-nights | business day/month | same exclusions as ADR; OUT_OF_ORDER excluded | folio + room availability | `hsp.hms.report.view` | night audit + 15m |
| HSP-HMS-KPI-04 | HSP-HMS | Housekeeping turnaround | sum(READY time-DIRTY time) | count rooms reaching READY | day/month | exclude OUT_OF_ORDER | housekeeping transitions | `hsp.hms.report.view` | 15m |
| HSP-RMS-KPI-01 | HSP-RMS | Table turnover | count settled dine-in checks | available table-hours or table count per service period | service/day | exclude takeaway/delivery | restaurant order/table schedule | `hsp.rms.report.view` | 15m |
| HSP-RMS-KPI-02 | HSP-RMS | Ticket time | sum(SERVED-KOT_SENT) | count served order lines/checks | service/day | exclude voided | order transitions | `hsp.rms.report.view` | 5m |
| HSP-BEM-KPI-01 | HSP-BEM | Event conversion % | CONFIRMED bookings | qualified enquiries | month | exclude duplicate/lost-before-qualified | enquiry/booking | `hsp.bem.report.view` | daily |
| HSP-BEM-KPI-02 | HSP-BEM | Venue utilization % | confirmed/executed booked minutes | available venue minutes | month | exclude blocked/maintenance | booking + venue calendar | `hsp.bem.report.view` | hourly |
| HSP-RBM-KPI-01 | HSP-RBM | Forecast occupancy % | confirmed forecast room-nights | forecast sellable room-nights | future date range | exclude cancelled | reservation + availability | `hsp.rbm.report.view` | 15m |
| HSP-RBM-KPI-02 | HSP-RBM | No-show % | NO_SHOW reservations | confirmed arrivals due | business day/month | exclude cancelled | reservation state | `hsp.rbm.report.view` | night audit |
| MFG-PMS-KPI-01 | MFG-PMS | OEE % | availability × performance × quality | 1 | shift/day/month | availability=run/planned; performance=ideal output/actual run; quality=good/total | operation execution + downtime + output | `mfg.pms.report.view` | 15m |
| MFG-PMS-KPI-02 | MFG-PMS | Yield % | good output qty | total output qty | order/day | exclude rework input duplication | production/output movements | `mfg.pms.report.view` | on operation |
| MFG-PMS-KPI-03 | MFG-PMS | Scrap % | scrap qty | good+scrap qty | order/day | none | operation execution | `mfg.pms.report.view` | on operation |
| MFG-PMS-KPI-04 | MFG-PMS | Schedule adherence % | orders completed on/before planned_end | completed eligible orders | week/month | exclude cancelled | production order | `mfg.pms.report.view` | hourly |
| MFG-IWM-KPI-01 | MFG-IWM | Inventory accuracy % | counted item-location-lots within tolerance | counted item-location-lots | count/month | exclude uncounted | cycle count | `mfg.iwm.report.view` | on adjust |
| MFG-IWM-KPI-02 | MFG-IWM | Inventory turns | annualized material consumption value | average inventory value | month/quarter | exclude quarantined valuation only if policy says | movement/balance valuation projection | `mfg.iwm.report.view` | daily |
| MFG-QMS-KPI-01 | MFG-QMS | First-pass yield % | units/lots passing first inspection without rework | units/lots inspected first time | day/month | exclude reinspections from numerator/denominator | inspection genealogy | `mfg.qms.report.view` | 15m |
| MFG-QMS-KPI-02 | MFG-QMS | Defect rate % | defective units/defects by chosen unit | units inspected | day/month | catalog version fixed per report | inspection/NCR | `mfg.qms.report.view` | 15m |
| MFG-PRO-KPI-01 | MFG-PRO | PO cycle time | sum(ISSUED - requisition SUBMITTED) | count issued POs | month | exclude cancelled/rejected | PR/PO transitions | `mfg.pro.report.view` | hourly |
| MFG-PRO-KPI-02 | MFG-PRO | Price variance % | actual PO price - approved baseline price | approved baseline price | PO/month | weighted by quantity; zero baseline excluded | PO/quote baseline | `mfg.pro.report.view` | daily |
| MFG-MMS-KPI-01 | MFG-MMS | MTBF | total operating time between failures | count breakdown failures | rolling 30/90d | planned maintenance downtime excluded | asset/downtime/work orders | `mfg.mms.report.view` | daily |
| MFG-MMS-KPI-02 | MFG-MMS | MTTR | total breakdown repair duration | count closed breakdown work orders | rolling 30/90d | waiting external parts included/excluded by report flag | work order/downtime | `mfg.mms.report.view` | hourly |
| MFG-MMS-KPI-03 | MFG-MMS | Preventive compliance % | PM work orders completed by due date | PM work orders due | month | exclude retired assets | schedule/work order | `mfg.mms.report.view` | daily |
| PSV-CRM-KPI-01 | PSV-CRM | Win rate % | accepted proposals/converted opportunities | closed won+lost qualified opportunities | month/quarter | exclude disqualified before opportunity | lead/opportunity/proposal | `psv.crm.report.view` | daily |
| PSV-CRM-KPI-02 | PSV-CRM | Sales cycle | sum(converted_at-qualified_at) | count converted opportunities | month | exclude reactivated history unless configured | CRM transitions | `psv.crm.report.view` | daily |
| PSV-PJM-KPI-01 | PSV-PJM | On-time milestone % | accepted milestones on/before due_at | accepted milestones | month/project | exclude scope-changed due dates using current approved baseline | milestone/change request | `psv.pjm.report.view` | hourly |
| PSV-PJM-KPI-02 | PSV-PJM | Project margin % | recognized/eligible project revenue - project cost | recognized/eligible project revenue | month/project | if accounting integration absent label operational margin estimate | billing/time/cost projection | `psv.pjm.financial.report` | daily |
| PSV-SDM-KPI-01 | PSV-SDM | SLA compliance % | SLA instances MET | MET+BREACHED SLA instances | month | exclude cancelled/test tickets | sla clock | `psv.sdm.report.view` | 15m |
| PSV-SDM-KPI-02 | PSV-SDM | Response TAT | sum(first_response-received) | count responded tickets | month | calendar from SLA policy | ticket/action projection | `psv.sdm.report.view` | 15m |
| PSV-RTM-KPI-01 | PSV-RTM | Utilization % | approved productive project hours (billable+approved nonbillable project) | available capacity hours after leave/non-working calendar | week/month | exclude leave/holiday; internal admin excluded by default | time entries + resource calendar | `psv.rtm.report.view` | daily |
| PSV-RTM-KPI-02 | PSV-RTM | Billable % | approved billable hours | approved worked hours | week/month | exclude leave/non-work | time entries | `psv.rtm.report.view` | daily |
| PSV-RTM-KPI-03 | PSV-RTM | Approval TAT | sum(APPROVED/REJECTED-SUBMITTED) | count decided timesheets | period/month | exclude withdrawn | timesheet transitions | `psv.rtm.report.view` | hourly |
| PSV-SGM-KPI-01 | PSV-SGM | Studio turnaround | sum(DELIVERED-SHOT) | count delivered bookings | month | exclude cancelled | studio booking | `psv.sgm.report.view` | hourly |
| GOV-CSM-KPI-01 | GOV-CSM | SLA compliance % | service requests closed/resolved within SLA | eligible completed requests | month | clock uses ServiceCalendarPolicy; exclude withdrawn/cancelled | request + SLA projection | `gov.csm.report.view` | 15m |
| GOV-CSM-KPI-02 | GOV-CSM | Resolution TAT | sum(RESOLVED-SLA start excluding approved pauses) | count resolved requests | month | ServiceCalendarPolicy working time | request/SLA | `gov.csm.report.view` | 15m |
| GOV-CSM-KPI-03 | GOV-CSM | Pendency | count active requests not terminal | 1 | point-in-time | group aging buckets by SLA working time | citizen request | `gov.csm.report.view` | 5m |
| GOV-CFM-KPI-01 | GOV-CFM | Approval TAT | sum(decision_at-entry_to_APPROVAL) | count files decided from approval | month | exclude returned/resubmitted intervals separately | file movement/decision | `gov.cfm.report.view` | hourly |
| GOV-PLM-KPI-01 | GOV-PLM | Issuance TAT | sum(ISSUED-SUBMITTED working time) | count issued applications | month | exclude applicant deficiency pauses per policy | application/SLA | `gov.plm.report.view` | hourly |
| GOV-PLM-KPI-02 | GOV-PLM | Deficiency % | applications entering DEFICIENCY | applications reaching SCRUTINY | month | exclude withdrawn pre-scrutiny | permit application | `gov.plm.report.view` | daily |
| GOV-RTM-KPI-01 | GOV-RTM | Collection vs demand % | paid/reconciled amount | net issued demand amount | period/month | exclude reversed demands/receipts | demand/receipt | `gov.rtm.report.view` | hourly |
| NGO-DMS-KPI-01 | NGO-DMS | Donor retention % | prior-period donors donating again in current period | prior-period active donors | year/rolling12m | exclude anonymized-unlinkable donors | donation/donor projection | `ngo.dms.report.view` | daily |
| NGO-DMS-KPI-02 | NGO-DMS | Pledge fulfillment % | fulfilled pledge amount | pledged amount due in period | month/year | exclude cancelled pledges | pledge | `ngo.dms.report.view` | daily |
| NGO-DFM-KPI-01 | NGO-DFM | Fund utilization % | posted eligible utilization amount | available allocated fund amount | period/fund | restricted purpose only; reversals netted | fund/utilization | `ngo.dfm.report.view` | hourly |
| NGO-DFM-KPI-02 | NGO-DFM | Grant balance | opening eligible fund balance + allocations - posted utilization - reversals | 1 | point-in-time | per fund/currency | fund ledger projection | `ngo.dfm.report.view` | hourly |
| NGO-TAM-KPI-01 | NGO-TAM | Budget variance % | actual event spend - approved budget | approved budget | event | zero-budget shown absolute not % | event/billing projection | `ngo.tam.report.view` | daily |
| NGO-MVM-KPI-01 | NGO-MVM | Renewal % | renewed memberships | memberships due for renewal | period | exclude cancelled before due | membership | `ngo.mvm.report.view` | daily |
| SFM-SGM-KPI-01 | SFM-SGM | Post coverage % | covered post-minutes | scheduled required post-minutes | shift/day/month | exclude officially deactivated posts | roster/attendance | `sfm.sgm.report.view` | 5m |
| SFM-SGM-KPI-02 | SFM-SGM | Attendance compliance % | valid check-ins within allowed window | scheduled shifts requiring check-in | day/month | approved overrides separately reported | roster/attendance | `sfm.sgm.report.view` | 5m |
| SFM-SGM-KPI-03 | SFM-SGM | Replacement TAT | sum(replacement ASSIGNED-requested) | count assigned relief requests | month | exclude cancelled | handover/relief events | `sfm.sgm.report.view` | 5m |
| SFM-PMS-KPI-01 | SFM-PMS | Checkpoint completion % | VALID/LATE required checkpoint scans | required checkpoint opportunities | round/day/month | INVALID scans excluded numerator | round/scan | `sfm.pms.report.view` | 5m |
| SFM-PMS-KPI-02 | SFM-PMS | Incident response time | sum(ACKNOWLEDGED-REPORTED) | count acknowledged incidents | month | group by severity | incident | `sfm.pms.report.view` | 5m |
| SFM-VMS-KPI-01 | SFM-VMS | Approval TAT | sum(decision_at-arrived_or_preregistered approval request) | count decided visits | day/month | exclude auto-approved policy cases if report flag | visit/approval | `sfm.vms.report.view` | 5m |
| SFM-VMS-KPI-02 | SFM-VMS | Overstay rate % | visits entering OVERSTAY | checked-in visits with expected_to | day/month | exclude approved extensions | visit | `sfm.vms.report.view` | 5m |
| SFM-FMM-KPI-01 | SFM-FMM | Facility SLA compliance % | tickets resolved within configured SLA | eligible resolved tickets | month | ServiceCalendarPolicy working time | ticket/SLA projection | `sfm.fmm.report.view` | 15m |
| SFM-FMM-KPI-02 | SFM-FMM | MTTR | sum(RESOLVED/VERIFIED time-IN_PROGRESS start) | count resolved work orders | rolling30/90d | waiting time reported separately flag | work order | `sfm.fmm.report.view` | hourly |
| SFM-FMM-KPI-03 | SFM-FMM | PM compliance % | preventive work completed by due_at | preventive work due | month | exclude retired assets | PM schedule/work order | `sfm.fmm.report.view` | daily |

## Formula semantics
- Percentage KPIs = numerator ÷ denominator × 100; denominator=0 returns NULL/NO_DATA, never 0% unless explicitly defined.
- Duration KPIs use event timestamps and the declared calendar/time basis; invalid negative durations are excluded and raise projection-quality alert.
- Count KPIs with denominator `1` are absolute counts/sums, not ratios.
- Revised/reversed source transactions are included according to current effective version and explicit reversal semantics; history remains auditable.
- Report filters may narrow tenant-authorized dimensions (branch, site, department, product, doctor, service, etc.) but cannot change the KPI formula without a new KPI version.


## KPI acceptance-test namespace
Every KPI row above automatically owns two canonical design acceptance IDs:
- `<KPI-ID>-T01` — formula fixture test: given a fixed tenant/context fixture with known source values, compute the exact numerator/denominator/time-basis formula and expect the mathematically specified value; denominator=0 expects `NO_DATA`, never fabricated 0%.
- `<KPI-ID>-T02` — scope/permission test: sibling tenant or sibling Industry Context data is present in storage but excluded by RequestContext/RLS/projection ownership; unauthorized caller receives `PERMISSION_DENIED` or non-disclosing empty result according to query contract; cross-context rows contribute exactly 0.

These IDs are part of DD-17 authoritative acceptance ownership through DD-25 and are required in QA implementation.


## Named KPI completion addendum — Fable 5
The following rows close KPI names present in canonical industry DD that were not explicit in the initial catalog.

| KPI ID | MS | KPI | Numerator | Denominator | Time basis | Inclusion / exclusion | Source entities/events | Permission | Refresh |
|---|---|---|---|---|---|---|---|---|---|
| HLT-RIS-KPI-90 | HLT-RIS | Critical acknowledgment TAT | sum(acknowledged_at-sent_at) | count acknowledged critical findings | day/month | exclude test/withdrawn alerts | hlt_ris_critical_finding | `hlt.ris.report.view` | 5m |
| HLT-CMS-KPI-90 | HLT-CMS | Revenue per doctor | net eligible clinic revenue | count distinct active consulting doctors or doctor-level denominator=1 per doctor row | month | exclude reversed/refunded billing; report by doctor | Core billing + hlt_cms_encounter projection | `hlt.cms.financial.report` | daily |
| EDU-SMS-KPI-90 | EDU-SMS | Enrollment count | count active ENROLLED students | 1 | term/year | exclude withdrawn | student enrollment projection | `edu.sms.report.view` | daily |
| EDU-CUM-KPI-90 | EDU-CUM | Enrollment count | count REGISTERED/ACTIVE enrollments | 1 | term/year | exclude withdrawn/completed when current-active view | edu_cum enrollment | `edu.cum.report.view` | daily |
| EDU-CUM-KPI-91 | EDU-CUM | Attendance % | attended eligible scheduled units | eligible scheduled units | term | AttendancePolicy weights/exclusions | attendance projection | `edu.cum.report.view` | daily |
| EDU-CUM-KPI-92 | EDU-CUM | Progression % | students advancing to next configured academic level | eligible progression decisions | academic year | exclude graduates/withdrawn | progression decision projection | `edu.cum.report.view` | daily |
| EDU-CTM-KPI-90 | EDU-CTM | Fee realization % | collected eligible fee amount | due/invoiced eligible fee amount | batch/month | exclude reversals/waivers per policy | Core billing projection | `edu.ctm.finance.report` | daily |
| EDU-CTM-KPI-91 | EDU-CTM | Completion rate % | COMPLETED enrollments | enrollments reaching attendance/start threshold | batch/cohort | exclude approved withdrawals before census | edu_ctm enrollment | `edu.ctm.report.view` | daily |
| EDU-LMS-KPI-90 | EDU-LMS | Engagement % | active learner-days with at least one governed learning interaction | eligible enrolled learner-days | course/week | exclude system/bot events; cap one active day/learner/day | LMS activity event projection | `edu.lms.report.view` | daily |
| RTL-RSM-KPI-90 | RTL-RSM | Sales per store | net paid sales amount | 1 | store day/month | exclude voided; refunds netted | POS sales projection by store | `rtl.rsm.report.view` | 15m |
| RTL-POS-KPI-90 | RTL-POS | Net sales | paid sale amount - finalized refunds | 1 | day/month | exclude voids/training mode | rtl_pos_sale/refund projection | `rtl.pos.report.view` | 15m |
| RTL-POS-KPI-91 | RTL-POS | Tender mix % | amount captured by tender type | total captured tender amount | day/month | exclude reversed tender entries | rtl_pos_tender | `rtl.pos.report.view` | 15m |
| RTL-IWM-KPI-90 | RTL-IWM | Inventory turnover | COGS/eligible issued inventory value | average inventory value | month/quarter | currency-consistent; exclude non-sale quarantine as configured | inventory movement/valuation projection | `rtl.iwm.report.view` | daily |
| RTL-OMS-KPI-90 | RTL-OMS | Delivery % | DELIVERED orders | SHIPPED eligible orders | day/month | exclude cancelled/lost before shipment | order transitions | `rtl.oms.report.view` | hourly |
| RTL-OMS-KPI-91 | RTL-OMS | Return rate % | accepted return quantity or orders | delivered eligible quantity or orders | month | consistent unit basis per report; exclude rejected returns | return/order projection | `rtl.oms.report.view` | hourly |
| RTL-MKT-KPI-90 | RTL-MKT | Active sellers | count sellers with ACTIVE status and at least one active listing/order in reporting window | 1 | day/month | exclude suspended/revoked | seller/listing/order projection | `rtl.mkt.report.view` | hourly |
| RTL-MKT-KPI-91 | RTL-MKT | Commission | sum finalized marketplace commission minor units | 1 | day/month | exclude reversed settlements/commission adjustments | commission/settlement projection | `rtl.mkt.report.view` | hourly |
| HSP-RMS-KPI-90 | HSP-RMS | Covers | sum guest cover count on SETTLED dine-in checks | 1 | service/day | exclude voided/employee/test checks | restaurant checks/orders | `hsp.rms.report.view` | 15m |
| HSP-RMS-KPI-91 | HSP-RMS | Void rate % | VOIDED orders/lines | opened orders/lines | service/day | consistent order or line basis | restaurant order/reversal | `hsp.rms.report.view` | 15m |
| HSP-BEM-KPI-90 | HSP-BEM | Event revenue | sum finalized event charges net of reversals | 1 | event/month | exclude taxes if revenue policy excludes | event charge/billing projection | `hsp.bem.report.view` | daily |
| HSP-BEM-KPI-91 | HSP-BEM | Budget variance % | actual finalized event cost - approved budget | approved budget | event | zero budget reported absolute only | event cost/budget projection | `hsp.bem.report.view` | daily |
| HSP-RBM-KPI-90 | HSP-RBM | Booking pace | confirmed room-nights as of snapshot - confirmed room-nights at prior comparable snapshot | days between snapshots | arrival-date cohort | same lead-time comparison only | reservation snapshots | `hsp.rbm.report.view` | daily |
| HSP-RBM-KPI-91 | HSP-RBM | Cancellation rate % | CANCELLED reservations | confirmed reservations exposed to cancellation | arrival period | exclude duplicate/rebook linkage where policy nets rebook | reservation state projection | `hsp.rbm.report.view` | hourly |
| MFG-IWM-KPI-90 | MFG-IWM | Released-order stockout incidents | count released production material demands unable to allocate required qty at request time | 1 | day/month | exclude QC-held shortage shown separately if report flag | reservation/allocation projection | `mfg.iwm.report.view` | hourly |
| MFG-IWM-KPI-91 | MFG-IWM | Dead stock value | sum on-hand value for stock with no qualifying movement for configured inactivity window | 1 | point-in-time | exclude strategic/safety stock catalog flags | inventory balance/movement | `mfg.iwm.report.view` | daily |
| MFG-QMS-KPI-90 | MFG-QMS | CAPA aging | sum(current_or_closed_at-opened_at) | count CAPA in selected cohort | point/month | report open/closed separately; working/calendar basis declared | mfg_qms_capa | `mfg.qms.report.view` | daily |
| MFG-PRO-KPI-90 | MFG-PRO | Supplier performance % | weighted score of on-time delivery, accepted-quality qty and quantity conformance | sum configured weights | month/quarter | weights versioned; suppliers with no eligible receipts NO_DATA | PO/GRN/QC projection | `mfg.pro.report.view` | daily |
| MFG-MMS-KPI-90 | MFG-MMS | Downtime | sum asset unavailable duration | 1 | shift/day/month | separate planned/unplanned by source | downtime/work order projection | `mfg.mms.report.view` | 15m |
| PSV-CRM-KPI-90 | PSV-CRM | Pipeline value | sum expected deal amount × probability policy weight | 1 | point-in-time/month | active qualified opportunities only | opportunity projection | `psv.crm.report.view` | hourly |
| PSV-CRM-KPI-91 | PSV-CRM | Source conversion % | converted opportunities | eligible leads/opportunities from source | month | exclude duplicate/disqualified-before-qualified | lead source/opportunity | `psv.crm.report.view` | daily |
| PSV-PJM-KPI-90 | PSV-PJM | Change volume | count approved change requests | 1 | project/month | exclude withdrawn/rejected | change request projection | `psv.pjm.report.view` | hourly |
| PSV-PJM-KPI-91 | PSV-PJM | Milestone acceptance % | ACCEPTED milestones | submitted milestones | project/month | exclude withdrawn | milestone transitions | `psv.pjm.report.view` | hourly |
| PSV-SDM-KPI-90 | PSV-SDM | Resolution TAT | sum(RESOLVED-received excluding approved pause intervals) | count resolved tickets | month | SLA calendar policy applied | ticket/SLA clock | `psv.sdm.report.view` | 15m |
| PSV-SDM-KPI-91 | PSV-SDM | Backlog age | sum(now-received excluding terminal tickets) | count active tickets | point-in-time | bucket by priority/SLA | ticket projection | `psv.sdm.report.view` | 5m |
| PSV-SDM-KPI-92 | PSV-SDM | CSAT | sum valid survey score | count valid completed surveys | month | exclude duplicate/test/incomplete | service survey projection | `psv.sdm.report.view` | daily |
| PSV-SDM-KPI-93 | PSV-SDM | Contract profitability % | eligible service revenue - attributable service cost | eligible service revenue | month/contract | if accounting feed absent mark ESTIMATE | billing/time/cost projection | `psv.sdm.financial.report` | daily |
| PSV-RTM-KPI-90 | PSV-RTM | Allocation conflict rate % | allocations exceeding policy capacity/overlap threshold | active allocations evaluated | week/month | exclude approved leave-only conflicts | allocation projection | `psv.rtm.report.view` | hourly |
| PSV-SGM-KPI-90 | PSV-SGM | Booking conversion % | confirmed bookings | qualified enquiries | month | exclude duplicate/test | studio enquiry/booking | `psv.sgm.report.view` | daily |
| PSV-SGM-KPI-91 | PSV-SGM | Revision count | sum revision cycles after first client review | 1 | booking/month | exclude internal pre-review edits | deliverable review events | `psv.sgm.report.view` | hourly |
| PSV-SGM-KPI-92 | PSV-SGM | Resource utilization % | scheduled productive studio/resource hours | available resource hours | week/month | exclude maintenance/approved unavailable | booking/resource calendar | `psv.sgm.report.view` | daily |
| GOV-CSM-KPI-90 | GOV-CSM | Reopen rate % | REOPENED requests | requests previously CLOSED in cohort | month | exclude system corrections not citizen/authority reopen | request transitions | `gov.csm.report.view` | hourly |
| GOV-CFM-KPI-90 | GOV-CFM | Pendency | count files not DISPOSED/ARCHIVED | 1 | point-in-time | group by age/authority | official file projection | `gov.cfm.report.view` | 5m |
| GOV-CFM-KPI-91 | GOV-CFM | Movement time | sum(next_movement_at-moved_at) | count completed movement legs | month | exclude invalidated movement corrections | file movement | `gov.cfm.report.view` | hourly |
| GOV-CFM-KPI-92 | GOV-CFM | Disposal rate % | DISPOSED files | eligible files reaching decision/disposal stage | month | exclude cancelled/test | file state projection | `gov.cfm.report.view` | daily |
| GOV-PLM-KPI-90 | GOV-PLM | Inspection backlog | count inspections SCHEDULED/ASSIGNED/IN_PROGRESS past due or awaiting action | 1 | point-in-time | exclude cancelled | inspection projection | `gov.plm.report.view` | 5m |
| GOV-PLM-KPI-91 | GOV-PLM | Renewal backlog | count renewable permits/licenses with renewal request active and not terminal | 1 | point-in-time | exclude expired-without-request if policy excludes | permit/renewal projection | `gov.plm.report.view` | daily |
| GOV-RTM-KPI-90 | GOV-RTM | Arrears amount | sum outstanding issued demand amount after payments/reversals | 1 | point-in-time/month | exclude stayed/suspended demands if report flag | demand/payment projection | `gov.rtm.report.view` | hourly |
| GOV-RTM-KPI-91 | GOV-RTM | Reconciliation rate % | receipts/payments matched and reconciled | eligible received payment records | day/month | exclude reversed/voided | receipt/reconciliation | `gov.rtm.report.view` | hourly |
| NGO-DMS-KPI-90 | NGO-DMS | Donor reactivation % | lapsed donors becoming ACTIVE through new donation | eligible lapsed donors contacted/observed | year/rolling12m | exclude anonymized-unlinkable donor | donor lifecycle/donation | `ngo.dms.report.view` | daily |
| NGO-DMS-KPI-91 | NGO-DMS | Average gift | finalized donation amount | count finalized donations | period | exclude reversed; consistent currency | donation projection | `ngo.dms.report.view` | daily |
| NGO-DFM-KPI-90 | NGO-DFM | Donation amount | sum finalized donation amount net reversals | 1 | period/fund | consistent currency; exclude reversed | donation/receipt | `ngo.dfm.report.view` | hourly |
| NGO-TAM-KPI-90 | NGO-TAM | Seva/event bookings | count CONFIRMED/PERFORMED bookings | 1 | period | exclude cancelled/no-show where report specifies performed | seva/event booking | `ngo.tam.report.view` | hourly |
| NGO-TAM-KPI-91 | NGO-TAM | Participation | count distinct eligible participant/devotee/registrant refs | 1 | event/period | privacy-safe distinct identity; anonymous counted by booking | event participation projection | `ngo.tam.report.view` | daily |
| NGO-TAM-KPI-92 | NGO-TAM | Event/seva revenue | sum finalized eligible charges/donations linked to event/seva | 1 | event/period | net reversals; separate donations if policy | billing/donation linkage | `ngo.tam.financial.report` | daily |
| NGO-MVM-KPI-90 | NGO-MVM | Active members | count memberships ACTIVE | 1 | point-in-time | exclude suspended/expired | membership | `ngo.mvm.report.view` | daily |
| NGO-MVM-KPI-91 | NGO-MVM | Volunteer hours | sum verified volunteer hours | 1 | period | exclude rejected/unverified | volunteer time verification | `ngo.mvm.report.view` | daily |
| NGO-MVM-KPI-92 | NGO-MVM | Participation % | members/volunteers with at least one eligible participation event | active eligible members/volunteers | period | exclude system/test activity | participation/assignment | `ngo.mvm.report.view` | daily |
| SFM-PMS-KPI-90 | SFM-PMS | Incident rate | count valid incidents | 1,000 patrol-hours | month | exclude test/duplicate incidents | incident + patrol duration projection | `sfm.pms.report.view` | hourly |
| SFM-VMS-KPI-90 | SFM-VMS | Visitor throughput | count CHECKED_IN visits | 1 | site day/hour | exclude denied/test | visit projection | `sfm.vms.report.view` | 5m |
| SFM-FMM-KPI-90 | SFM-FMM | Backlog | count work orders OPEN/ACCEPTED/IN_PROGRESS/WAITING/RESOLVED awaiting verification | 1 | point-in-time | exclude cancelled/closed | facility work order | `sfm.fmm.report.view` | 5m |

All addendum KPI IDs inherit `<KPI-ID>-T01` formula-fixture and `<KPI-ID>-T02` tenant/industry/permission isolation acceptance IDs.
