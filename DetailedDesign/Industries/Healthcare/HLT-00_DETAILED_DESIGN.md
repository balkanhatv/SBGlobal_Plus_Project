# HEALTHCARE & DIAGNOSTICS — MANAGEMENT SYSTEM DETAILED DESIGN
**Wave:** 3 · **Status:** DETAILED DESIGN COMPLETE
**Authority:** F-07 §1 + F-13 §1 · A-09 · ADR-012 · DD-01…DD-18
**Rule:** Healthcare is one equal first-class suite, not a template for sibling industries. Every private resource below is `TENANT_INDUSTRY` and requires immutable `tenant_id + industry_context_id`.

## Shared healthcare DD conventions
All mutable entities include `id uuid PK`, `tenant_id uuid NOT NULL`, `industry_context_id uuid NOT NULL`, `row_version bigint NOT NULL`, `created_at/created_by`, `updated_at/updated_by`, `is_demo boolean default false`. Index prefixes are `(tenant_id, industry_context_id, ...)`. Patient/clinical/diagnostic data is `SENSITIVE_PERSONAL` or `REGULATED`; retention is policy/jurisdiction/contract driven through DD-16, never hard-coded as a legal claim. Cross-MS collaboration uses OperationContracts/events/projections, never direct sibling-table reads. Documents use DD-08; AI uses DD-09; offline uses DD-11.

---

# HLT-HMS — Hospital Management System
**Foundation owner:** F-13 §1.1 · **Status:** COMPLETE
**Ownership baseline:** every entity in this MS is `TENANT_INDUSTRY` and carries immutable `tenant_id uuid NOT NULL` + `industry_context_id uuid NOT NULL`; indexes begin with both context keys and cross-context access is denied unless an explicit DD-02 cross-context contract exists.
### Purpose / actors / modules
Hospital-wide OPD/IPD/emergency/wards/beds/nursing/clinical-order/OT/discharge/MRD operations. Actors: Hospital Admin, Doctor, Nurse, Receptionist, Ward Manager, OT Coordinator, Billing Executive, MRD Officer, Patient. Modules: OPD, IPD, Emergency, Ward/Bed, Nursing, Clinical Orders, OT, Discharge, MRD.

### Entity design
| Entity / table | Domain fields | Constraints / indexes | Sensitivity / retention |
|---|---|---|---|
| Encounter / `hlt_hms_encounter` | patient_ref uuid, encounter_no text, encounter_type enum(OPD,IPD,EMERGENCY), doctor_principal_id uuid?, org_unit_id uuid, state enum(REGISTERED,CHECKED_IN,IN_CARE,DISCHARGE_INITIATED,DISCHARGED,CLOSED,CANCELLED), started_at timestamptz, ended_at? | UNIQUE (tenant_id, industry_context_id,encounter_no); INDEX (tenant_id, industry_context_id, patient_ref, state); version required | REGULATED; healthcare-record policy |
| Admission / `hlt_hms_admission` | encounter_id uuid, admission_no text, bed_id uuid?, admitting_doctor_id uuid, consent_document_id uuid?, state enum(REQUESTED,BED_ALLOCATED,IN_CARE,TRANSFER_PENDING,DISCHARGE_INITIATED,DISCHARGED,LAMA,REFERRED_OUT) | UNIQUE (tenant_id, industry_context_id,admission_no); one active bed allocation/patient; INDEX (tenant_id, industry_context_id, bed_id, state) | REGULATED |
| Bed / `hlt_hms_bed` | ward_code text, bed_code text, bed_type text, state enum(AVAILABLE,RESERVED,OCCUPIED,CLEANING,MAINTENANCE) | UNIQUE (tenant_id, industry_context_id,ward_code,bed_code); check active occupancy max one | INTERNAL |
| BedTransfer / `hlt_hms_bed_transfer` | admission_id uuid, from_bed_id uuid, to_bed_id uuid, reason_code text, authorized_by uuid, transferred_at timestamptz | append-only; INDEX (tenant_id, industry_context_id, admission_id, transferred_at) | REGULATED evidence |
| ClinicalOrder / `hlt_hms_order` | encounter_id uuid, order_type enum(LAB,RADIOLOGY,PHARMACY,PROCEDURE), target_ms text, requested_by uuid, priority_code text, state enum(ORDERED,ACCEPTED,IN_PROGRESS,COMPLETED,CANCELLED), target_resource_ref text? | INDEX (tenant_id, industry_context_id, encounter_id, state) | REGULATED |
| NursingObservation / `hlt_hms_nursing_observation` | admission_id uuid, observation_type text, observed_at timestamptz, value_json jsonb, recorded_by uuid, verification_ref uuid? | append-only; INDEX (tenant_id, industry_context_id, admission_id, observed_at) | REGULATED |
| OTCase / `hlt_hms_ot_case` | admission_id uuid?, patient_ref uuid, procedure_code text, surgeon_id uuid, scheduled_at timestamptz, state enum(REQUESTED,SCHEDULED,PREOP_READY,IN_SURGERY,RECOVERY,NOTES_APPROVED,CLOSED,CANCELLED) | INDEX (tenant_id, industry_context_id, scheduled_at, state); expectedVersion on transition | REGULATED |
| DischargeSummary / `hlt_hms_discharge_summary` | admission_id uuid, version_no int, doctor_id uuid, summary_document_id uuid, state enum(DRAFT,APPROVED,ADDENDUM), approved_at timestamptz? | UNIQUE (tenant_id, industry_context_id,admission_id,version_no); approved versions immutable | REGULATED/evidentiary |

### Workflow
**OPD:** REGISTERED → CHECKED_IN → IN_CARE → CLOSED.
**IPD:** REQUESTED → BED_ALLOCATED → IN_CARE → DISCHARGE_INITIATED → DISCHARGED; branches TRANSFER_PENDING→IN_CARE, LAMA/REFERRED_OUT terminal with reason.
**OT:** REQUESTED → SCHEDULED → PREOP_READY → IN_SURGERY → RECOVERY → NOTES_APPROVED → CLOSED. Invalid transitions return `HLT-HMS_STATE_INVALID`.

### Business rules
- `HLT-HMS-R01` Admission requires available/authorized bed + recorded consent.
- `HLT-HMS-R02` Discharge requires treating-doctor-approved summary plus Billing clearance/approved credit/corporate transfer.
- `HLT-HMS-R03` High-risk medication administration requires configured second-staff verification.
- `HLT-HMS-R04` Every bed/ward transfer is append-only with reason/authorizer/timestamps.
- `HLT-HMS-R05` Clinical orders target LIS/RIS/PMS by service contract/event; HMS never edits their private tables.

### Permissions / ABAC / approvals
`hlt.hms.encounter.open`, `hlt.hms.admission.admit`, `hlt.hms.bed.transfer`, `hlt.hms.nursing.record`, `hlt.hms.order.place`, `hlt.hms.ot.schedule`, `hlt.hms.discharge.initiate`, `hlt.hms.summary.approve`, `hlt.hms.mrd.view`. ABAC: facility/ward/org unit, treating-team relation, sensitivity, encounter state, device/risk. Discharge-summary approval and exceptional medication/transfer override require authorized clinical role and audit.

### Documents / notifications / reports
Documents: consent, admission form, nursing chart exports, OT checklist/note, discharge summary, referral/LAMA record. Notifications: appointment/bed/order/discharge/follow-up; sensitive pushes generic. KPIs: bed occupancy, LOS, OPD throughput, OT utilization, discharge TAT, readmission, order TAT. Exports are permission/residency governed.

### API / events / integration
tRPC: `ind.hlt.hms.encounter_open`, `admission_admit`, `bed_transfer`, `order_place`, `ot_transition`, `discharge_initiate`, `summary_approve`. Inputs carry resource ID, expectedVersion and domain facts; outputs DD-06 envelope. Events v1: `hlt.hms.patient.admitted`, `patient.transferred`, `patient.discharged`, `order.placed`, `ot.scheduled`, `ot.completed`, `summary.approved`. Consumers: LIS/RIS/PMS/Billing/Communication projections. REST only for governed external HIS/EHR interoperability.

### AI / experience / offline
AI may summarize authorized encounter history, draft discharge text, prioritize worklists; cannot diagnose, prescribe, discharge or change orders autonomously. RAG sources require patient/resource ACL. High-risk tool actions require approval. Web `/app/hlt/hms`; Tenant Staff App: rounds/observations/tasks; Tenant User App: own appointments/discharge docs; Desktop optional ward/OT station. Offline: `CONTROLLED_OFFLINE_MUTATION` only for configured nursing observations/tasks; orders/discharge/medication verification online or server-reconciled, never naive LWW.

### Configuration / entitlement / dependencies / audit
Config: wards/beds, triage, procedures, consent/discharge templates, medication-risk classes. Entitlement: HLT suite + HLT-HMS MS + module features. Dependencies: Core Billing/Documents/Communication/Workflow + LIS/RIS/PMS. Audit every admission, transfer, clinical order, approval, exceptional override, export and cross-MS handoff.

### Tests / acceptance
Positive: OPD and IPD full lifecycle. Negative: no-bed/consent admission denied; discharge without clearance denied; unauthorized summary approval denied. Isolation: wrong tenant and same-tenant wrong Industry Context return no data/effect. Entitlement-disabled HMS denied. Wrong-context event/document/AI retrieval denied. **Acceptance:** audited OPD/IPD/OT/discharge lifecycle implements F-13 BR-HLT-05…08 semantics.

---

# HLT-LIS — Laboratory Information System
**Foundation owner:** F-07 §1.4–1.6 · **Status:** COMPLETE
**Ownership baseline:** every entity in this MS is `TENANT_INDUSTRY` and carries immutable `tenant_id uuid NOT NULL` + `industry_context_id uuid NOT NULL`; indexes begin with both context keys and cross-context access is denied unless an explicit DD-02 cross-context contract exists.
### Purpose / actors / modules
Patient-to-approved-report laboratory lifecycle. Actors: Lab Admin, Pathologist, Technician, Phlebotomist, Receptionist, Collection Executive, Billing Executive, Doctor, Patient. Modules: registration/appointment, billing reference, accession/barcode, collection/receipt/routing, worklists, analyzer/manual results, QC/delta/critical checks, verification, pathologist approval, report publication/distribution/archive, lab inventory references.

### Entity design
| Entity / table | Domain fields | Constraints / indexes | Sensitivity / retention |
|---|---|---|---|
| LabOrder / `hlt_lis_order` | order_no text, patient_ref uuid, encounter_ref uuid?, ordering_doctor_ref uuid?, priority_code text, state enum(REGISTERED,BILLED,COLLECTION_PENDING,IN_PROCESS,COMPLETED,CANCELLED) | UNIQUE (tenant_id, industry_context_id,order_no); INDEX (tenant_id, industry_context_id, patient_ref, state) | REGULATED |
| OrderedTest / `hlt_lis_order_test` | order_id uuid, test_catalog_ref uuid, specimen_type text, department_code text, tat_due_at timestamptz?, state enum(ORDERED,COLLECTED,RECEIVED,TESTING,RESULTED,VERIFIED,APPROVED,PUBLISHED,REJECTED) | UNIQUE (tenant_id, industry_context_id,order_id,test_catalog_ref); index dept+state+tat | REGULATED |
| Specimen / `hlt_lis_specimen` | accession_no text, order_id uuid, specimen_type text, container_type text, barcode_value text, collected_at timestamptz?, received_at timestamptz?, state enum(EXPECTED,COLLECTED,IN_TRANSIT,RECEIVED,REJECTED,RECOLLECTION_REQUIRED,ALLOCATED,TESTING,ARCHIVED) | UNIQUE (tenant_id, industry_context_id,accession_no); barcode unique/context | REGULATED |
| SpecimenRejection / `hlt_lis_rejection` | specimen_id uuid, reason_code text, notes text?, rejected_by uuid, rejected_at timestamptz, recollection_required boolean | append-only | REGULATED evidence |
| ResultValue / `hlt_lis_result` | ordered_test_id uuid, parameter_code text, value_text text?, value_numeric numeric?, unit_code text?, reference_range_snapshot jsonb, flag_code text?, source enum(MANUAL,ANALYZER), entered_by uuid, state enum(DRAFT,HELD,VERIFIED,INVALIDATED) | versioned; INDEX (tenant_id, industry_context_id, ordered_test_id) | REGULATED |
| CriticalAlert / `hlt_lis_critical_alert` | result_id uuid, threshold_snapshot jsonb, recipients jsonb, state enum(PENDING,SENT,ACKNOWLEDGED,ESCALATED), sent_at timestamptz?, acknowledged_at timestamptz? | append-only delivery evidence | REGULATED |
| DeltaCheck / `hlt_lis_delta_check` | result_id uuid, prior_result_ref uuid, delta_rule_ref uuid, outcome enum(PASS,HOLD,OVERRIDDEN), reviewed_by uuid?, reason text? | index result; override audited | REGULATED |
| LabReport / `hlt_lis_report` | order_id uuid, version_no int, document_id uuid, pathologist_id uuid, state enum(DRAFT,APPROVED,PUBLISHED,ADDENDUM), approved_at timestamptz?, published_at timestamptz? | UNIQUE (tenant_id, industry_context_id,order_id,version_no); published immutable | REGULATED/evidentiary |
| TestCatalogProjection / `hlt_lis_test_catalog` | code text, name text, loinc_mapping text?, department text, method text, specimen_container jsonb, tat_class text, reference_rule_set_id uuid, critical_rule_set_id uuid, status text | UNIQUE (tenant_id, industry_context_id,code); searchable index | CONFIDENTIAL config |

### Workflow
Order REGISTERED→BILLED→COLLECTION_PENDING→IN_PROCESS→COMPLETED. Specimen EXPECTED→COLLECTED→IN_TRANSIT?→RECEIVED→ALLOCATED→TESTING→ARCHIVED; rejection→RECOLLECTION_REQUIRED. Test ORDERED→COLLECTED→RECEIVED→TESTING→RESULTED→VERIFIED→APPROVED→PUBLISHED. Invalid transition `HLT-LIS_STATE_INVALID`.

### Business rules
- `HLT-LIS-R01` Critical value at verification triggers immediate pathologist + ordering-doctor alert and report flag.
- `HLT-LIS-R02` Report publication requires all required results verified and pathologist digital approval.
- `HLT-LIS-R03` Receipt QC failure records rejection reason and recollection workflow; rejected evidence retained.
- `HLT-LIS-R04` Delta deviation beyond configured rule holds result for review before verification.
- `HLT-LIS-R05` Published report immutable; correction is versioned addendum.

### Permissions / ABAC
`hlt.lis.order.register`, `hlt.lis.sample.collect`, `hlt.lis.sample.receive`, `hlt.lis.result.enter`, `hlt.lis.result.verify`, `hlt.lis.result.override_hold`, `hlt.lis.report.approve`, `hlt.lis.report.publish`, `hlt.lis.critical.acknowledge`. ABAC: department/worklist, assigned lab/branch, patient/resource relationship, result state, sensitivity. Pathologist-only approval where policy requires.

### Documents / notifications / reports
Documents: requisition, barcode/label, collection acknowledgment, final lab report/addendum, external referral result. Notifications: collection/reminder, rejection/recollect, report ready, critical alert. KPIs: sample TAT, rejection rate, verification backlog, critical acknowledgment TAT, department/test volume. QR verification references public-safe token, not patient details.

### API / events / integrations
tRPC: `ind.hlt.lis.order_register`, `sample_collect`, `sample_receive`, `result_enter`, `result_verify`, `report_approve`, `report_publish`, `critical_acknowledge`. Events: `hlt.lis.sample.collected`, `sample.rejected`, `result.verified`, `critical.triggered`, `report.approved`, `report.published`. External REST/adapters for HL7/FHIR/HIS/EHR/analyzer/ASTM only where configured; external codes map to internal canonical IDs.

### AI / experience / offline
AI may summarize authorized report values, explain terminology, trend authorized history and assist draft narrative; cannot verify/approve results or suppress critical flags. RAG uses approved reports/templates, not unverified raw results unless explicitly permitted to staff. Web `/app/hlt/lis`; Tenant Staff App: collection/barcode/status; Tenant User App: booking/report download; Desktop: lab workstation/analyzer candidate. Offline `CONTROLLED_OFFLINE_MUTATION` for home-collection capture; result verification/approval online.

### Configuration / entitlement / dependencies / audit
Config: departments, specimen/container, methods, ranges, critical/delta rules, analyzer mappings, report templates, TAT policies. Entitlement HLT-LIS + analyzer/integration/report features. Dependencies: HMS/CMS orders; Core Billing/Document/Communication/AI. Audit accession, rejection, result revisions, holds/overrides, verification, approval, publication/download.

### Tests / acceptance
Positive: registration→collection→testing→verified→approved QR report. Negative: rejected sample/delta hold/approval without verification denied. Wrong tenant/industry denied. Analyzer duplicate result idempotent. Unauthorized AI/report/document access denied. **Acceptance:** F-07 BR-HLT-01…04 implemented.

---

# HLT-RIS — Radiology Information System
**Foundation owner:** F-13 §1.2 · **Status:** COMPLETE
**Ownership baseline:** every entity in this MS is `TENANT_INDUSTRY` and carries immutable `tenant_id uuid NOT NULL` + `industry_context_id uuid NOT NULL`; indexes begin with both context keys and cross-context access is denied unless an explicit DD-02 cross-context contract exists.
### Purpose / actors / modules
Imaging order-to-report lifecycle with modality scheduling, consent/contrast screening, worklist, reading/second-read, critical findings and report publication. Actors: Radiologist, Radiographer, Receptionist, Referring Doctor, Patient.

### Entity design
| Entity / table | Domain fields | Constraints / indexes | Sensitivity / retention |
|---|---|---|---|
| ImagingOrder / `hlt_ris_order` | order_no text, patient_ref uuid, encounter_ref uuid?, exam_code text, modality_code text, priority_code text, state enum(ORDERED,SCHEDULED,PREPARED,PERFORMED,IMAGES_AVAILABLE,READING,REPORTED,CANCELLED) | UNIQUE (tenant_id, industry_context_id,order_no); INDEX (tenant_id, industry_context_id, modality_code, state, scheduled_at) | REGULATED |
| ImagingAppointment / `hlt_ris_appointment` | order_id uuid, modality_resource_ref uuid, slot_start timestamptz, slot_end timestamptz, prep_status text, state enum(BOOKED,CHECKED_IN,READY,COMPLETED,NO_SHOW,CANCELLED) | slot conflict constraint by modality; schedule index | SENSITIVE_PERSONAL |
| ContrastScreen / `hlt_ris_contrast_screen` | order_id uuid, allergy_flags jsonb, contraindication_flags jsonb, consent_document_id uuid?, outcome enum(CLEARED,BLOCKED,OVERRIDDEN), override_by uuid?, override_reason_code text?, override_note text? | one current version/order | REGULATED |
| ImagingExam / `hlt_ris_exam` | order_id uuid, performed_by uuid, performed_at timestamptz, pacs_study_ref text?, repeat_of_exam_id uuid?, repeat_reason_code text?, dose_metadata jsonb?, state enum(PERFORMED,REPEAT_REQUIRED,AVAILABLE) | index order; repeats linked | REGULATED |
| RadiologyReport / `hlt_ris_report` | order_id uuid, version_no int, radiologist_id uuid, template_code text, document_id uuid?, state enum(DRAFT,SECOND_READ,APPROVED,PUBLISHED,ADDENDUM) | UNIQUE (tenant_id, industry_context_id,order_id,version_no); published immutable | REGULATED |
| CriticalFinding / `hlt_ris_critical_finding` | report_id uuid, finding_code text, severity_code text, recipient_ref uuid, state enum(PENDING,SENT,ACKNOWLEDGED,ESCALATED), sent_at timestamptz?, acknowledged_at timestamptz? | append-only evidence | REGULATED |

### Workflow
ORDERED→SCHEDULED→PREPARED→PERFORMED→IMAGES_AVAILABLE→READING→DRAFT REPORT→SECOND_READ(optional)→APPROVED→PUBLISHED. Repeat/cancel branches require reason/permission. Invalid transition `HLT-RIS_STATE_INVALID`.

### Rules / permissions
`HLT-RIS-R01` Contrast contraindication blocks study unless radiologist override+justification. `R02` Critical finding sends immediate delivery-tracked alert. `R03` Repeat exam requires reason + supervisor approval. `R04` Published report immutable; addendum only. Permissions: `hlt.ris.order.schedule`, `exam.prepare`, `exam.perform`, `report.draft`, `report.second_read`, `report.approve`, `finding.acknowledge`, `exam.repeat.approve`. ABAC modality/site/assigned radiologist/sensitivity/state.

### Documents / notifications / reports / APIs
Documents: preparation/consent, imaging report/addendum, referral note. KPIs: TAT by modality, repeat rate, backlog, utilization, critical acknowledgment. tRPC `ind.hlt.ris.order_schedule`, `contrast_screen`, `exam_perform`, `report_submit`, `report_approve`; events `hlt.ris.exam.performed`, `report.approved`, `report.published`, `finding.critical`. PACS/DICOM/HL7/FHIR are adapter seams when configured; no mandatory vendor fabricated.

### AI / experience / offline / entitlement
AI can draft structured narrative/compare authorized history; cannot approve report or clear contraindication. Web `/app/hlt/ris`; Staff Mobile worklist/alerts; Tenant User App patient report read; Desktop imaging workstation link optional. Offline `READ_OFFLINE`; exam/report finalization online. Entitlement HLT-RIS + modality/PACS/integration features. Audit all overrides/repeats/report versions/critical delivery.

### Tests / acceptance
Positive order→published report. Negative contraindication/unauthorized repeat/approval denied. Wrong tenant/context/RAG/document denied. Critical alert delivery tracked. **Acceptance:** F-13 BR-HLT-09…12 implemented.

---

# HLT-PMS — Pharmacy Management System
**Foundation owner:** F-13 §1.3 · **Status:** COMPLETE
**Ownership baseline:** every entity in this MS is `TENANT_INDUSTRY` and carries immutable `tenant_id uuid NOT NULL` + `industry_context_id uuid NOT NULL`; indexes begin with both context keys and cross-context access is denied unless an explicit DD-02 cross-context contract exists.
### Purpose / actors / modules
Prescription intake, dispensing, pharmacy stock/batch/expiry, ward indents, controlled register, returns/recalls, purchasing/GRN/transfers/adjustments. Actors: Pharmacist, Pharmacy Manager, Store Keeper, Doctor, Patient.

### Entity design
| Entity / table | Domain fields | Constraints / indexes | Sensitivity / retention |
|---|---|---|---|
| Prescription / `hlt_pms_prescription` | prescription_no text, patient_ref uuid, prescriber_ref uuid, encounter_ref uuid?, issued_at timestamptz, validity_until timestamptz?, state enum(RECEIVED,VALIDATED,PARTIAL,DISPENSED,CANCELLED,EXPIRED) | UNIQUE (tenant_id, industry_context_id,prescription_no); patient/state index | REGULATED |
| PrescriptionLine / `hlt_pms_prescription_line` | prescription_id uuid, drug_catalog_ref uuid, dose_text text, frequency text, quantity_prescribed numeric, quantity_dispensed numeric, substitution_policy text | quantity checks; index drug | REGULATED |
| DrugBatch / `hlt_pms_batch` | drug_catalog_ref uuid, batch_no text, expiry_date date, quantity_on_hand numeric, quantity_reserved numeric, state enum(AVAILABLE,QUARANTINED,RECALLED,EXPIRED,DEPLETED) | UNIQUE (tenant_id, industry_context_id,drug_catalog_ref,batch_no); CHECK nonnegative; expiry index | CONFIDENTIAL/regulated stock |
| Dispense / `hlt_pms_dispense` | prescription_id uuid?, patient_ref uuid?, dispense_no text, pharmacist_id uuid, dispensed_at timestamptz, state enum(PREPARED,BILLED,DISPENSED,REVERSED) | UNIQUE (tenant_id, industry_context_id,dispense_no); posted lines immutable | REGULATED/financial-adjacent |
| DispenseLine / `hlt_pms_dispense_line` | dispense_id uuid, prescription_line_id uuid?, drug_ref uuid, batch_id uuid, qty numeric, override_reason_code text?, override_note text? | qty>0; same-context FK; batch identity mandatory | REGULATED |
| ControlledDrugRegister / `hlt_pms_controlled_register` | drug_ref uuid,batch_id uuid,prescription_ref uuid,patient_ref uuid,qty numeric,direction text,pharmacist_id uuid,occurred_at timestamptz | append-only | REGULATED evidence |
| RecallCase / `hlt_pms_recall` | drug_ref uuid,batch_id uuid,notice_ref text,state enum(NOTICE,QUARANTINE,TRACE,RETURN_DISPOSE,CLOSED),opened_at timestamptz,closed_at timestamptz? | one active per batch/notice; trace index | REGULATED |
| WardIndent / `hlt_pms_indent` | ward_ref uuid, requested_by uuid, approved_by uuid?, state enum(DRAFT,SUBMITTED,APPROVED,ISSUED,CLOSED,CANCELLED), line_refs jsonb | versioned; ward/state index | CONFIDENTIAL |

### Workflow / rules
Prescription RECEIVED→VALIDATED→PREPARED/BILLED→DISPENSED; PARTIAL preserves balance. Indent DRAFT→SUBMITTED→APPROVED→ISSUED→CLOSED. Recall NOTICE→QUARANTINE→TRACE→RETURN_DISPOSE→CLOSED. `HLT-PMS-R01` expired/recalled/quarantined batch cannot dispense. `R02` controlled drug requires valid prescription reference and pharmacist identity. `R03` FEFO default; override reason/permission required. `R04` recall traces every dispensed unit to patient/sale within context. Negative stock forbidden.

### Permissions / documents / API/events
Permissions: `hlt.pms.prescription.validate`, `dispense.prepare`, `dispense.commit`, `batch.override_fefo`, `controlled.dispense`, `indent.approve`, `recall.open`, `recall.dispose`, `stock.adjust.approve`. **ABAC:** pharmacy/branch/org-unit assignment, patient/resource relationship, controlled-drug class, batch state, prescription validity/state, sensitivity, device/risk and recall-case assignment. Documents: prescription, dispense receipt reference, controlled register export, recall/disposal evidence. **Notifications:** prescription-ready to the authorized patient/user after DISPENSED; low-stock/near-expiry to pharmacy stock roles; recall NOTICE/QUARANTINE/TRACE escalation to Pharmacy Manager and affected authorized care/dispense recipients; controlled-dispense exceptions to configured pharmacy compliance owner. Sensitive pushes contain only generic preview; recipient resolution is authorization/context checked. tRPC `ind.hlt.pms.prescription_validate`, `dispense_commit`, `indent_approve`, `recall_open`, `recall_trace`; events `hlt.pms.prescription.dispensed`, `batch.recalled`, `stock.low`, `indent.issued`.

### Reports / KPIs
Operational reports: stock by batch/expiry, controlled-drug register, dispensing volume/TAT, ward-indent status, recall trace, stock adjustment and expiry/write-off. KPIs: stock turnover, expiry write-off %, fill TAT, stock-out rate, recall closure TAT and controlled-register exception count. Filters include branch/pharmacy, date, drug/category, batch, prescriber and state. Projections remain Tenant+Industry scoped; export requires `hlt.pms.report.export` and DD-16 export policy.

### AI / experience / offline / entitlement / dependencies
AI may explain authorized medication instructions/stock risks and suggest FEFO pick; cannot prescribe, substitute against policy, dispense controlled drug or approve recall disposal. Web `/app/hlt/pms`; Staff Mobile stock/indent/recall; Patient Mobile prescription/dispense history own-scope; Desktop pharmacy counter useful. Offline stock lookup `READ_OFFLINE`; dispensing/stock/controlled operations use financial/stock integrity behavior and no naive LWW. Entitlement: HLT suite + `HLT-PMS` Management-System license + pharmacy/controlled-register/integration/report feature entitlements and usage limits where configured; services never hard-code plan names. Dependencies HMS/CMS orders, Core Billing/Document/Communication, supplier adapters where configured. Audit critical stock/controlled/dispense actions.

### Tests / acceptance
Expired/recalled batch dispense denied; controlled register mandatory; FEFO override audited; recall trace complete; wrong tenant/context denied; unauthorized AI tool denied. **Acceptance:** F-13 BR-HLT-13…16 implemented.

---

# HLT-CMS — Clinic Management System
**Foundation owner:** F-13 §1.4 · **Status:** COMPLETE
**Ownership baseline:** every entity in this MS is `TENANT_INDUSTRY` and carries immutable `tenant_id uuid NOT NULL` + `industry_context_id uuid NOT NULL`; indexes begin with both context keys and cross-context access is denied unless an explicit DD-02 cross-context contract exists.
### Purpose / actors / modules
Outpatient clinic/polyclinic appointment→encounter→orders/procedure/prescription→billing→follow-up. Actors: Clinic Admin, Doctor, Clinical Assistant, Receptionist, Patient.

### Entity design
| Entity / table | Domain fields | Constraints / indexes | Sensitivity / retention |
|---|---|---|---|
| ClinicAppointment / `hlt_cms_appointment` | appointment_no text, patient_ref uuid, doctor_id uuid, visit_type text, scheduled_at timestamptz, state enum(BOOKED,CHECKED_IN,NO_SHOW,CANCELLED,COMPLETED) | UNIQUE (tenant_id, industry_context_id,appointment_no); doctor+time index | SENSITIVE_PERSONAL |
| ClinicEncounter / `hlt_cms_encounter` | appointment_id uuid?, patient_ref uuid, doctor_id uuid, token_no text?, vitals_json jsonb, diagnosis_codes text[], clinical_note_ref uuid?, state enum(OPEN,IN_CONSULTATION,SIGNED,CLOSED,ADDENDUM) | only doctor sign; signed content immutable | REGULATED |
| ClinicProcedure / `hlt_cms_procedure` | encounter_id uuid, procedure_code text, performer_id uuid, state enum(ORDERED,CONSENTED,PERFORMED,CANCELLED), document_refs jsonb? | index encounter+state | REGULATED |
| Referral / `hlt_cms_referral` | encounter_id uuid, target_type text, target_ref text?, consent_document_id uuid, summary_document_id uuid, state enum(DRAFT,CONSENTED,SENT,ACKNOWLEDGED,CLOSED) | consent required before SENT | REGULATED |
| FollowUp / `hlt_cms_followup` | encounter_id uuid, due_at timestamptz, protocol_code text?, state enum(PLANNED,BOOKED,COMPLETED,MISSED,CANCELLED) | index due_at/state | SENSITIVE_PERSONAL |
| TeleConsultSession / `hlt_cms_teleconsult` | encounter_id uuid, provider_session_ref text?, state enum(SCHEDULED,READY,ACTIVE,COMPLETED,FAILED,CANCELLED), started_at timestamptz?,ended_at timestamptz? | entitlement required | REGULATED |

### Workflow / rules
Appointment BOOKED→CHECKED_IN→encounter OPEN→IN_CONSULTATION→SIGNED→CLOSED; no-show/cancel branches. Referral DRAFT→CONSENTED→SENT→ACKNOWLEDGED→CLOSED. `HLT-CMS-R01` signed encounter immutable; correction addendum. `R02` referral sends only consented summary. `R03` no-show fee/rebooking configurable and audited. `R04` tele-consult only when entitlement grants it. Clinical order handoffs to LIS/RIS/PMS use contracts/events.

### Permissions / documents / API/events
`hlt.cms.appointment.manage`, `hlt.cms.vitals.record`, `hlt.cms.encounter.sign`, `hlt.cms.procedure.perform`, `hlt.cms.referral.send`, `hlt.cms.followup.manage`, `hlt.cms.teleconsult.start`. ABAC assigned doctor/clinic/org, patient relation, state, sensitivity. Documents: consent, encounter summary, referral summary, procedure note. tRPC `ind.hlt.cms.appointment_manage`, `encounter_sign`, `referral_send`, `followup_book`, `teleconsult_start`; events `hlt.cms.encounter.signed`, `referral.sent`, `followup.booked`.

### AI / experience / offline / reports
AI may summarize authorized history, draft note/referral/follow-up guidance; cannot sign encounter, prescribe autonomously or bypass referral consent. Web `/app/hlt/cms`; Staff Mobile appointments/vitals/follow-ups; Patient Mobile booking/own docs/teleconsult; optional Desktop reception. Offline `READ_OFFLINE` for schedule plus controlled draft vitals where policy permits; signed encounters/referrals online. KPIs: consultations/day, wait time, follow-up adherence, no-show rate, revenue/doctor via Core billing projection.

### Configuration / entitlement / tests
Config visit types, procedures, diagnosis favorites, fee/follow-up/no-show rules, teleconsult policy. Entitlement HLT-CMS + teleconsult/integration features. Tests: signed-record mutation denied; referral without consent denied; teleconsult entitlement missing denied; wrong tenant/context/RAG/document denied; events scoped. **Acceptance:** F-13 BR-HLT-17…20 implemented.

---

# Healthcare cross-MS contracts
- HMS places lab/radiology/pharmacy orders; LIS/RIS/PMS publish status/result/report/dispense projections/events back. No direct cross-MS table reads.
- CMS uses the same governed order/referral integration pattern.
- Patient identity is a Core/suite reference, not five duplicate identity stores.
- Core Billing owns financial transaction truth; MSs own clinical/operational facts and billing references.
- Cross-industry access remains private by default; any legitimate healthcare↔other-industry process uses `EXPLICIT_CROSS_CONTEXT` with minimized fields, permission, policy and audit.
- Healthcare AI cannot widen patient/clinical access beyond acting principal permissions and current Tenant+Industry Context.

# Healthcare Wave-3 acceptance
All five MSs define purpose, actors/modules, implementation fields/types/storage, relationships/constraints/indexes, Tenant+Industry ownership, sensitivity/retention, workflows/rules/permissions/ABAC, documents/notifications/reports, APIs/events/integrations, AI, experiences/offline, configuration/entitlements/dependencies/audit and positive/negative/isolation tests. **Healthcare suite Wave-3 DD: PASS.**


## Fable 5 deterministic contract binding
The Healthcare MS sections above remain the canonical domain entity/module/permission/document/integration owners. The following remediation artifacts are **normative extensions of each listed MS**, not optional commentary:
- MS set: `HLT-HMS`, `HLT-LIS`, `HLT-RIS`, `HLT-PMS`, `HLT-CMS`.
- Deterministic per-MS tests: `DD-21_MS_ACCEPTANCE_TEST_CONTRACTS.md` → `<MS>-T001…T014`.
- Exact major workflow transitions/forbidden edges/reversal-cancellation: `DD-22_MS_WORKFLOW_TRANSITION_MATRICES.md`.
- Behavior-bearing field/catalog and exact context-index rules: `DD-23_BEHAVIORAL_CATALOGS_INDEX_CONTRACTS.md` + `DD-23A_BEHAVIOR_FIELD_REGISTRY.md`.
- Domain-critical product defaults: `DD-24_INDUSTRY_DOMAIN_RULE_DECISIONS.md` → HLT-AC-001…003.
- Mathematical KPIs + KPI acceptance IDs: `DD-25_KPI_CALCULATION_CATALOG.md`.
- Requirement-ID chains: `Registers/DD_REQUIREMENT_TRACEABILITY_F5.md`.
- 41-MS determinism evidence: `DD-27_41_MS_DETERMINISM_AUDIT.md`.

Where an earlier sentence in this file is less specific than a referenced remediation contract, the more specific remediation contract governs. None of these references permits cross-industry inheritance of business semantics.


## Canonical mobile-app mapping — Phase 3
All mobile capabilities in this Industry DD are routes/features inside the canonical `TENANT_STAFF_APP` and/or `TENANT_USER_APP` defined by DD-10/DD-11. Role/persona labels never create separate mobile app classes or binaries. Platform Mobile is outside the Tenant app pair.
