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
