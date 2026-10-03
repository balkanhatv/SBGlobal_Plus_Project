-- SBGlobal Plus — Migration 0024: Healthcare & Diagnostics Industry database wave
-- Canonical MS: HLT-HMS, HLT-LIS, HLT-RIS, HLT-PMS, HLT-CMS
-- Healthcare is one equal first-class suite; this migration is not a template for sibling industries.
BEGIN;

-- HLT-HMS enums
CREATE TYPE ind_hlt.hms_encounter_type AS ENUM ('OPD','IPD','EMERGENCY');
CREATE TYPE ind_hlt.hms_encounter_state AS ENUM ('REGISTERED','CHECKED_IN','IN_CARE','DISCHARGE_INITIATED','DISCHARGED','CLOSED','CANCELLED');
CREATE TYPE ind_hlt.hms_admission_state AS ENUM ('REQUESTED','BED_ALLOCATED','IN_CARE','TRANSFER_PENDING','DISCHARGE_INITIATED','DISCHARGED','LAMA','REFERRED_OUT');
CREATE TYPE ind_hlt.hms_bed_state AS ENUM ('AVAILABLE','RESERVED','OCCUPIED','CLEANING','MAINTENANCE');
CREATE TYPE ind_hlt.hms_order_type AS ENUM ('LAB','RADIOLOGY','PHARMACY','PROCEDURE');
CREATE TYPE ind_hlt.hms_order_state AS ENUM ('ORDERED','ACCEPTED','IN_PROGRESS','COMPLETED','CANCELLED');
CREATE TYPE ind_hlt.hms_ot_state AS ENUM ('REQUESTED','SCHEDULED','PREOP_READY','IN_SURGERY','RECOVERY','NOTES_APPROVED','CLOSED','CANCELLED');
CREATE TYPE ind_hlt.hms_summary_state AS ENUM ('DRAFT','APPROVED','ADDENDUM');

-- HLT-LIS enums
CREATE TYPE ind_hlt.lis_order_state AS ENUM ('REGISTERED','BILLED','COLLECTION_PENDING','IN_PROCESS','COMPLETED','CANCELLED');
CREATE TYPE ind_hlt.lis_test_state AS ENUM ('ORDERED','COLLECTED','RECEIVED','TESTING','RESULTED','VERIFIED','APPROVED','PUBLISHED','REJECTED');
CREATE TYPE ind_hlt.lis_specimen_state AS ENUM ('EXPECTED','COLLECTED','IN_TRANSIT','RECEIVED','REJECTED','RECOLLECTION_REQUIRED','ALLOCATED','TESTING','ARCHIVED');
CREATE TYPE ind_hlt.lis_result_source AS ENUM ('MANUAL','ANALYZER');
CREATE TYPE ind_hlt.lis_result_state AS ENUM ('DRAFT','HELD','VERIFIED','INVALIDATED');
CREATE TYPE ind_hlt.lis_alert_state AS ENUM ('PENDING','SENT','ACKNOWLEDGED','ESCALATED');
CREATE TYPE ind_hlt.lis_delta_outcome AS ENUM ('PASS','HOLD','OVERRIDDEN');
CREATE TYPE ind_hlt.lis_report_state AS ENUM ('DRAFT','APPROVED','PUBLISHED','ADDENDUM');

-- HLT-RIS enums
CREATE TYPE ind_hlt.ris_order_state AS ENUM ('ORDERED','SCHEDULED','PREPARED','PERFORMED','IMAGES_AVAILABLE','READING','REPORTED','CANCELLED');
CREATE TYPE ind_hlt.ris_appointment_state AS ENUM ('BOOKED','CHECKED_IN','READY','COMPLETED','NO_SHOW','CANCELLED');
CREATE TYPE ind_hlt.ris_contrast_outcome AS ENUM ('CLEARED','BLOCKED','OVERRIDDEN');
CREATE TYPE ind_hlt.ris_exam_state AS ENUM ('PERFORMED','REPEAT_REQUIRED','AVAILABLE');
CREATE TYPE ind_hlt.ris_report_state AS ENUM ('DRAFT','SECOND_READ','APPROVED','PUBLISHED','ADDENDUM');
CREATE TYPE ind_hlt.ris_finding_state AS ENUM ('PENDING','SENT','ACKNOWLEDGED','ESCALATED');

-- HLT-PMS enums
CREATE TYPE ind_hlt.pms_prescription_state AS ENUM ('RECEIVED','VALIDATED','PARTIAL','DISPENSED','CANCELLED','EXPIRED');
CREATE TYPE ind_hlt.pms_batch_state AS ENUM ('AVAILABLE','QUARANTINED','RECALLED','EXPIRED','DEPLETED');
CREATE TYPE ind_hlt.pms_dispense_state AS ENUM ('PREPARED','BILLED','DISPENSED','REVERSED');
CREATE TYPE ind_hlt.pms_recall_state AS ENUM ('NOTICE','QUARANTINE','TRACE','RETURN_DISPOSE','CLOSED');
CREATE TYPE ind_hlt.pms_indent_state AS ENUM ('DRAFT','SUBMITTED','APPROVED','ISSUED','CLOSED','CANCELLED');

-- HLT-CMS enums
CREATE TYPE ind_hlt.cms_appointment_state AS ENUM ('BOOKED','CHECKED_IN','NO_SHOW','CANCELLED','COMPLETED');
CREATE TYPE ind_hlt.cms_encounter_state AS ENUM ('OPEN','IN_CONSULTATION','SIGNED','CLOSED','ADDENDUM');
CREATE TYPE ind_hlt.cms_procedure_state AS ENUM ('ORDERED','CONSENTED','PERFORMED','CANCELLED');
CREATE TYPE ind_hlt.cms_referral_state AS ENUM ('DRAFT','CONSENTED','SENT','ACKNOWLEDGED','CLOSED');
CREATE TYPE ind_hlt.cms_followup_state AS ENUM ('PLANNED','BOOKED','COMPLETED','MISSED','CANCELLED');
CREATE TYPE ind_hlt.cms_teleconsult_state AS ENUM ('SCHEDULED','READY','ACTIVE','COMPLETED','FAILED','CANCELLED');

-- HLT-HMS
CREATE TABLE ind_hlt.hlt_hms_encounter (
 id uuid PRIMARY KEY, patient_ref uuid NOT NULL, encounter_no text NOT NULL,
 encounter_type ind_hlt.hms_encounter_type NOT NULL, doctor_principal_id uuid, org_unit_id uuid NOT NULL,
 state ind_hlt.hms_encounter_state NOT NULL, started_at timestamptz NOT NULL, ended_at timestamptz,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id) REFERENCES core_tenancy.industry_context(tenant_id,id), UNIQUE(tenant_id,industry_context_id,id), UNIQUE(tenant_id,industry_context_id,encounter_no),
 CHECK(ended_at IS NULL OR ended_at>=started_at)
);
CREATE INDEX hlt_hms_encounter_patient_state_idx ON ind_hlt.hlt_hms_encounter(tenant_id,industry_context_id,patient_ref,state);

CREATE TABLE ind_hlt.hlt_hms_bed (
 id uuid PRIMARY KEY, ward_code text NOT NULL, bed_code text NOT NULL, bed_type text NOT NULL,
 state ind_hlt.hms_bed_state NOT NULL,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id) REFERENCES core_tenancy.industry_context(tenant_id,id), UNIQUE(tenant_id,industry_context_id,id), UNIQUE(tenant_id,industry_context_id,ward_code,bed_code)
);
CREATE INDEX hlt_hms_bed_state_idx ON ind_hlt.hlt_hms_bed(tenant_id,industry_context_id,state);

CREATE TABLE ind_hlt.hlt_hms_admission (
 id uuid PRIMARY KEY, encounter_id uuid NOT NULL, admission_no text NOT NULL, bed_id uuid,
 admitting_doctor_id uuid NOT NULL, consent_document_id uuid, state ind_hlt.hms_admission_state NOT NULL,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id) REFERENCES core_tenancy.industry_context(tenant_id,id), UNIQUE(tenant_id,industry_context_id,id), UNIQUE(tenant_id,industry_context_id,admission_no),
 FOREIGN KEY(tenant_id,industry_context_id,encounter_id) REFERENCES ind_hlt.hlt_hms_encounter(tenant_id,industry_context_id,id),
 FOREIGN KEY(tenant_id,industry_context_id,bed_id) REFERENCES ind_hlt.hlt_hms_bed(tenant_id,industry_context_id,id)
);
CREATE INDEX hlt_hms_admission_bed_state_idx ON ind_hlt.hlt_hms_admission(tenant_id,industry_context_id,bed_id,state);
CREATE UNIQUE INDEX hlt_hms_one_active_bed_idx ON ind_hlt.hlt_hms_admission(tenant_id,industry_context_id,bed_id)
 WHERE bed_id IS NOT NULL AND state IN ('BED_ALLOCATED','IN_CARE','TRANSFER_PENDING','DISCHARGE_INITIATED') AND deleted_at IS NULL;

CREATE TABLE ind_hlt.hlt_hms_bed_transfer (
 id uuid PRIMARY KEY, admission_id uuid NOT NULL, from_bed_id uuid NOT NULL, to_bed_id uuid NOT NULL,
 reason_code text NOT NULL, authorized_by uuid NOT NULL, transferred_at timestamptz NOT NULL,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id) REFERENCES core_tenancy.industry_context(tenant_id,id), UNIQUE(tenant_id,industry_context_id,id),
 FOREIGN KEY(tenant_id,industry_context_id,admission_id) REFERENCES ind_hlt.hlt_hms_admission(tenant_id,industry_context_id,id),
 FOREIGN KEY(tenant_id,industry_context_id,from_bed_id) REFERENCES ind_hlt.hlt_hms_bed(tenant_id,industry_context_id,id),
 FOREIGN KEY(tenant_id,industry_context_id,to_bed_id) REFERENCES ind_hlt.hlt_hms_bed(tenant_id,industry_context_id,id),
 CHECK(from_bed_id<>to_bed_id)
);
CREATE INDEX hlt_hms_bed_transfer_admission_idx ON ind_hlt.hlt_hms_bed_transfer(tenant_id,industry_context_id,admission_id,transferred_at);

CREATE TABLE ind_hlt.hlt_hms_order (
 id uuid PRIMARY KEY, encounter_id uuid NOT NULL, order_type ind_hlt.hms_order_type NOT NULL,
 target_ms text NOT NULL, requested_by uuid NOT NULL, priority_code text NOT NULL,
 state ind_hlt.hms_order_state NOT NULL, target_resource_ref text,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id) REFERENCES core_tenancy.industry_context(tenant_id,id), UNIQUE(tenant_id,industry_context_id,id),
 FOREIGN KEY(tenant_id,industry_context_id,encounter_id) REFERENCES ind_hlt.hlt_hms_encounter(tenant_id,industry_context_id,id)
);
CREATE INDEX hlt_hms_order_encounter_state_idx ON ind_hlt.hlt_hms_order(tenant_id,industry_context_id,encounter_id,state);

CREATE TABLE ind_hlt.hlt_hms_nursing_observation (
 id uuid PRIMARY KEY, admission_id uuid NOT NULL, observation_type text NOT NULL,
 observed_at timestamptz NOT NULL, value_json jsonb NOT NULL, recorded_by uuid NOT NULL, verification_ref uuid,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id) REFERENCES core_tenancy.industry_context(tenant_id,id), UNIQUE(tenant_id,industry_context_id,id),
 FOREIGN KEY(tenant_id,industry_context_id,admission_id) REFERENCES ind_hlt.hlt_hms_admission(tenant_id,industry_context_id,id)
);
CREATE INDEX hlt_hms_nursing_obs_idx ON ind_hlt.hlt_hms_nursing_observation(tenant_id,industry_context_id,admission_id,observed_at);

CREATE TABLE ind_hlt.hlt_hms_ot_case (
 id uuid PRIMARY KEY, admission_id uuid, patient_ref uuid NOT NULL, procedure_code text NOT NULL,
 surgeon_id uuid NOT NULL, scheduled_at timestamptz NOT NULL, state ind_hlt.hms_ot_state NOT NULL,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id) REFERENCES core_tenancy.industry_context(tenant_id,id), UNIQUE(tenant_id,industry_context_id,id),
 FOREIGN KEY(tenant_id,industry_context_id,admission_id) REFERENCES ind_hlt.hlt_hms_admission(tenant_id,industry_context_id,id)
);
CREATE INDEX hlt_hms_ot_schedule_idx ON ind_hlt.hlt_hms_ot_case(tenant_id,industry_context_id,scheduled_at,state);

CREATE TABLE ind_hlt.hlt_hms_discharge_summary (
 id uuid PRIMARY KEY, admission_id uuid NOT NULL, version_no integer NOT NULL CHECK(version_no>0),
 doctor_id uuid NOT NULL, summary_document_id uuid NOT NULL, state ind_hlt.hms_summary_state NOT NULL, approved_at timestamptz,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id) REFERENCES core_tenancy.industry_context(tenant_id,id), UNIQUE(tenant_id,industry_context_id,id), UNIQUE(tenant_id,industry_context_id,admission_id,version_no),
 FOREIGN KEY(tenant_id,industry_context_id,admission_id) REFERENCES ind_hlt.hlt_hms_admission(tenant_id,industry_context_id,id),
 CHECK(state<>'APPROVED' OR approved_at IS NOT NULL)
);

-- HLT-LIS
CREATE TABLE ind_hlt.hlt_lis_order (
 id uuid PRIMARY KEY, order_no text NOT NULL, patient_ref uuid NOT NULL, encounter_ref uuid,
 ordering_doctor_ref uuid, priority_code text NOT NULL, state ind_hlt.lis_order_state NOT NULL,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id) REFERENCES core_tenancy.industry_context(tenant_id,id), UNIQUE(tenant_id,industry_context_id,id), UNIQUE(tenant_id,industry_context_id,order_no)
);
CREATE INDEX hlt_lis_order_patient_state_idx ON ind_hlt.hlt_lis_order(tenant_id,industry_context_id,patient_ref,state);

CREATE TABLE ind_hlt.hlt_lis_order_test (
 id uuid PRIMARY KEY, order_id uuid NOT NULL, test_catalog_ref uuid NOT NULL, specimen_type text NOT NULL,
 department_code text NOT NULL, tat_due_at timestamptz, state ind_hlt.lis_test_state NOT NULL,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id) REFERENCES core_tenancy.industry_context(tenant_id,id), UNIQUE(tenant_id,industry_context_id,id), UNIQUE(tenant_id,industry_context_id,order_id,test_catalog_ref),
 FOREIGN KEY(tenant_id,industry_context_id,order_id) REFERENCES ind_hlt.hlt_lis_order(tenant_id,industry_context_id,id)
);
CREATE INDEX hlt_lis_test_dept_state_tat_idx ON ind_hlt.hlt_lis_order_test(tenant_id,industry_context_id,department_code,state,tat_due_at);

CREATE TABLE ind_hlt.hlt_lis_specimen (
 id uuid PRIMARY KEY, accession_no text NOT NULL, order_id uuid NOT NULL, specimen_type text NOT NULL,
 container_type text NOT NULL, barcode_value text NOT NULL, collected_at timestamptz, received_at timestamptz,
 state ind_hlt.lis_specimen_state NOT NULL,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id) REFERENCES core_tenancy.industry_context(tenant_id,id), UNIQUE(tenant_id,industry_context_id,id), UNIQUE(tenant_id,industry_context_id,accession_no),
 UNIQUE(tenant_id,industry_context_id,barcode_value),
 FOREIGN KEY(tenant_id,industry_context_id,order_id) REFERENCES ind_hlt.hlt_lis_order(tenant_id,industry_context_id,id),
 CHECK(received_at IS NULL OR collected_at IS NULL OR received_at>=collected_at)
);

CREATE TABLE ind_hlt.hlt_lis_rejection (
 id uuid PRIMARY KEY, specimen_id uuid NOT NULL, reason_code text NOT NULL, notes text,
 rejected_by uuid NOT NULL, rejected_at timestamptz NOT NULL, recollection_required boolean NOT NULL,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id) REFERENCES core_tenancy.industry_context(tenant_id,id), UNIQUE(tenant_id,industry_context_id,id),
 FOREIGN KEY(tenant_id,industry_context_id,specimen_id) REFERENCES ind_hlt.hlt_lis_specimen(tenant_id,industry_context_id,id)
);

CREATE TABLE ind_hlt.hlt_lis_result (
 id uuid PRIMARY KEY, ordered_test_id uuid NOT NULL, parameter_code text NOT NULL,
 value_text text, value_numeric numeric, unit_code text, reference_range_snapshot jsonb NOT NULL,
 flag_code text, source ind_hlt.lis_result_source NOT NULL, entered_by uuid NOT NULL,
 state ind_hlt.lis_result_state NOT NULL, result_version integer NOT NULL DEFAULT 1 CHECK(result_version>0),

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id) REFERENCES core_tenancy.industry_context(tenant_id,id), UNIQUE(tenant_id,industry_context_id,id),
 UNIQUE(tenant_id,industry_context_id,ordered_test_id,parameter_code,result_version),
 FOREIGN KEY(tenant_id,industry_context_id,ordered_test_id) REFERENCES ind_hlt.hlt_lis_order_test(tenant_id,industry_context_id,id),
 CHECK(value_text IS NOT NULL OR value_numeric IS NOT NULL)
);
CREATE INDEX hlt_lis_result_test_idx ON ind_hlt.hlt_lis_result(tenant_id,industry_context_id,ordered_test_id);

CREATE TABLE ind_hlt.hlt_lis_critical_alert (
 id uuid PRIMARY KEY, result_id uuid NOT NULL, threshold_snapshot jsonb NOT NULL, recipients jsonb NOT NULL,
 state ind_hlt.lis_alert_state NOT NULL, sent_at timestamptz, acknowledged_at timestamptz,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id) REFERENCES core_tenancy.industry_context(tenant_id,id), UNIQUE(tenant_id,industry_context_id,id),
 FOREIGN KEY(tenant_id,industry_context_id,result_id) REFERENCES ind_hlt.hlt_lis_result(tenant_id,industry_context_id,id),
 CHECK(acknowledged_at IS NULL OR sent_at IS NULL OR acknowledged_at>=sent_at)
);

CREATE TABLE ind_hlt.hlt_lis_delta_check (
 id uuid PRIMARY KEY, result_id uuid NOT NULL, prior_result_ref uuid NOT NULL, delta_rule_ref uuid NOT NULL,
 outcome ind_hlt.lis_delta_outcome NOT NULL, reviewed_by uuid, reason text,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id) REFERENCES core_tenancy.industry_context(tenant_id,id), UNIQUE(tenant_id,industry_context_id,id),
 FOREIGN KEY(tenant_id,industry_context_id,result_id) REFERENCES ind_hlt.hlt_lis_result(tenant_id,industry_context_id,id),
 CHECK(outcome<>'OVERRIDDEN' OR (reviewed_by IS NOT NULL AND reason IS NOT NULL))
);

CREATE TABLE ind_hlt.hlt_lis_report (
 id uuid PRIMARY KEY, order_id uuid NOT NULL, version_no integer NOT NULL CHECK(version_no>0),
 document_id uuid NOT NULL, pathologist_id uuid NOT NULL, state ind_hlt.lis_report_state NOT NULL,
 approved_at timestamptz, published_at timestamptz,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id) REFERENCES core_tenancy.industry_context(tenant_id,id), UNIQUE(tenant_id,industry_context_id,id), UNIQUE(tenant_id,industry_context_id,order_id,version_no),
 FOREIGN KEY(tenant_id,industry_context_id,order_id) REFERENCES ind_hlt.hlt_lis_order(tenant_id,industry_context_id,id),
 CHECK(state NOT IN ('APPROVED','PUBLISHED','ADDENDUM') OR approved_at IS NOT NULL),
 CHECK(published_at IS NULL OR approved_at IS NOT NULL)
);

CREATE TABLE ind_hlt.hlt_lis_test_catalog (
 id uuid PRIMARY KEY, code text NOT NULL, name text NOT NULL, loinc_mapping text, department text NOT NULL,
 method text NOT NULL, specimen_container jsonb NOT NULL, tat_class text NOT NULL,
 reference_rule_set_id uuid NOT NULL, critical_rule_set_id uuid NOT NULL, status text NOT NULL,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id) REFERENCES core_tenancy.industry_context(tenant_id,id), UNIQUE(tenant_id,industry_context_id,id), UNIQUE(tenant_id,industry_context_id,code)
);

-- HLT-RIS
CREATE TABLE ind_hlt.hlt_ris_order (
 id uuid PRIMARY KEY, order_no text NOT NULL, patient_ref uuid NOT NULL, encounter_ref uuid,
 exam_code text NOT NULL, modality_code text NOT NULL, priority_code text NOT NULL,
 scheduled_at timestamptz, state ind_hlt.ris_order_state NOT NULL,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id) REFERENCES core_tenancy.industry_context(tenant_id,id), UNIQUE(tenant_id,industry_context_id,id), UNIQUE(tenant_id,industry_context_id,order_no)
);
CREATE INDEX hlt_ris_order_modality_state_idx ON ind_hlt.hlt_ris_order(tenant_id,industry_context_id,modality_code,state,scheduled_at);

CREATE TABLE ind_hlt.hlt_ris_appointment (
 id uuid PRIMARY KEY, order_id uuid NOT NULL, modality_resource_ref uuid NOT NULL,
 slot_start timestamptz NOT NULL, slot_end timestamptz NOT NULL, prep_status text NOT NULL,
 state ind_hlt.ris_appointment_state NOT NULL,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id) REFERENCES core_tenancy.industry_context(tenant_id,id), UNIQUE(tenant_id,industry_context_id,id),
 FOREIGN KEY(tenant_id,industry_context_id,order_id) REFERENCES ind_hlt.hlt_ris_order(tenant_id,industry_context_id,id),
 CHECK(slot_end>slot_start)
);
CREATE INDEX hlt_ris_appointment_modality_time_idx ON ind_hlt.hlt_ris_appointment(tenant_id,industry_context_id,modality_resource_ref,slot_start,slot_end,state);

CREATE TABLE ind_hlt.hlt_ris_contrast_screen (
 id uuid PRIMARY KEY, order_id uuid NOT NULL, screen_version integer NOT NULL DEFAULT 1 CHECK(screen_version>0),
 allergy_flags jsonb NOT NULL, contraindication_flags jsonb NOT NULL, consent_document_id uuid,
 outcome ind_hlt.ris_contrast_outcome NOT NULL, override_by uuid, override_reason_code text, override_note text,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id) REFERENCES core_tenancy.industry_context(tenant_id,id), UNIQUE(tenant_id,industry_context_id,id), UNIQUE(tenant_id,industry_context_id,order_id,screen_version),
 FOREIGN KEY(tenant_id,industry_context_id,order_id) REFERENCES ind_hlt.hlt_ris_order(tenant_id,industry_context_id,id),
 CHECK(outcome<>'OVERRIDDEN' OR (override_by IS NOT NULL AND override_reason_code IS NOT NULL))
);

CREATE TABLE ind_hlt.hlt_ris_exam (
 id uuid PRIMARY KEY, order_id uuid NOT NULL, performed_by uuid NOT NULL, performed_at timestamptz NOT NULL,
 pacs_study_ref text, repeat_of_exam_id uuid, repeat_reason_code text, dose_metadata jsonb,
 state ind_hlt.ris_exam_state NOT NULL,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id) REFERENCES core_tenancy.industry_context(tenant_id,id), UNIQUE(tenant_id,industry_context_id,id),
 FOREIGN KEY(tenant_id,industry_context_id,order_id) REFERENCES ind_hlt.hlt_ris_order(tenant_id,industry_context_id,id),
 FOREIGN KEY(tenant_id,industry_context_id,repeat_of_exam_id) REFERENCES ind_hlt.hlt_ris_exam(tenant_id,industry_context_id,id),
 CHECK(repeat_of_exam_id IS NULL OR repeat_reason_code IS NOT NULL)
);

CREATE TABLE ind_hlt.hlt_ris_report (
 id uuid PRIMARY KEY, order_id uuid NOT NULL, version_no integer NOT NULL CHECK(version_no>0),
 radiologist_id uuid NOT NULL, template_code text NOT NULL, document_id uuid,
 state ind_hlt.ris_report_state NOT NULL,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id) REFERENCES core_tenancy.industry_context(tenant_id,id), UNIQUE(tenant_id,industry_context_id,id), UNIQUE(tenant_id,industry_context_id,order_id,version_no),
 FOREIGN KEY(tenant_id,industry_context_id,order_id) REFERENCES ind_hlt.hlt_ris_order(tenant_id,industry_context_id,id)
);

CREATE TABLE ind_hlt.hlt_ris_critical_finding (
 id uuid PRIMARY KEY, report_id uuid NOT NULL, finding_code text NOT NULL, severity_code text NOT NULL,
 recipient_ref uuid NOT NULL, state ind_hlt.ris_finding_state NOT NULL, sent_at timestamptz, acknowledged_at timestamptz,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id) REFERENCES core_tenancy.industry_context(tenant_id,id), UNIQUE(tenant_id,industry_context_id,id),
 FOREIGN KEY(tenant_id,industry_context_id,report_id) REFERENCES ind_hlt.hlt_ris_report(tenant_id,industry_context_id,id),
 CHECK(acknowledged_at IS NULL OR sent_at IS NULL OR acknowledged_at>=sent_at)
);

-- HLT-PMS
CREATE TABLE ind_hlt.hlt_pms_prescription (
 id uuid PRIMARY KEY, prescription_no text NOT NULL, patient_ref uuid NOT NULL, prescriber_ref uuid NOT NULL,
 encounter_ref uuid, issued_at timestamptz NOT NULL, validity_until timestamptz,
 state ind_hlt.pms_prescription_state NOT NULL,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id) REFERENCES core_tenancy.industry_context(tenant_id,id), UNIQUE(tenant_id,industry_context_id,id), UNIQUE(tenant_id,industry_context_id,prescription_no),
 CHECK(validity_until IS NULL OR validity_until>=issued_at)
);
CREATE INDEX hlt_pms_prescription_patient_state_idx ON ind_hlt.hlt_pms_prescription(tenant_id,industry_context_id,patient_ref,state);

CREATE TABLE ind_hlt.hlt_pms_prescription_line (
 id uuid PRIMARY KEY, prescription_id uuid NOT NULL, drug_catalog_ref uuid NOT NULL,
 dose_text text NOT NULL, frequency text NOT NULL, quantity_prescribed numeric NOT NULL CHECK(quantity_prescribed>0),
 quantity_dispensed numeric NOT NULL DEFAULT 0 CHECK(quantity_dispensed>=0), substitution_policy text NOT NULL,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id) REFERENCES core_tenancy.industry_context(tenant_id,id), UNIQUE(tenant_id,industry_context_id,id),
 FOREIGN KEY(tenant_id,industry_context_id,prescription_id) REFERENCES ind_hlt.hlt_pms_prescription(tenant_id,industry_context_id,id),
 CHECK(quantity_dispensed<=quantity_prescribed)
);

CREATE TABLE ind_hlt.hlt_pms_batch (
 id uuid PRIMARY KEY, drug_catalog_ref uuid NOT NULL, batch_no text NOT NULL, expiry_date date NOT NULL,
 quantity_on_hand numeric NOT NULL CHECK(quantity_on_hand>=0), quantity_reserved numeric NOT NULL DEFAULT 0 CHECK(quantity_reserved>=0),
 state ind_hlt.pms_batch_state NOT NULL,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id) REFERENCES core_tenancy.industry_context(tenant_id,id), UNIQUE(tenant_id,industry_context_id,id), UNIQUE(tenant_id,industry_context_id,drug_catalog_ref,batch_no),
 CHECK(quantity_reserved<=quantity_on_hand)
);
CREATE INDEX hlt_pms_batch_expiry_idx ON ind_hlt.hlt_pms_batch(tenant_id,industry_context_id,expiry_date,state);

CREATE TABLE ind_hlt.hlt_pms_dispense (
 id uuid PRIMARY KEY, prescription_id uuid, patient_ref uuid, dispense_no text NOT NULL,
 pharmacist_id uuid NOT NULL, dispensed_at timestamptz NOT NULL, state ind_hlt.pms_dispense_state NOT NULL,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id) REFERENCES core_tenancy.industry_context(tenant_id,id), UNIQUE(tenant_id,industry_context_id,id), UNIQUE(tenant_id,industry_context_id,dispense_no),
 FOREIGN KEY(tenant_id,industry_context_id,prescription_id) REFERENCES ind_hlt.hlt_pms_prescription(tenant_id,industry_context_id,id),
 CHECK(prescription_id IS NOT NULL OR patient_ref IS NOT NULL)
);

CREATE TABLE ind_hlt.hlt_pms_dispense_line (
 id uuid PRIMARY KEY, dispense_id uuid NOT NULL, prescription_line_id uuid, drug_ref uuid NOT NULL,
 batch_id uuid NOT NULL, qty numeric NOT NULL CHECK(qty>0), override_reason_code text, override_note text,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id) REFERENCES core_tenancy.industry_context(tenant_id,id), UNIQUE(tenant_id,industry_context_id,id),
 FOREIGN KEY(tenant_id,industry_context_id,dispense_id) REFERENCES ind_hlt.hlt_pms_dispense(tenant_id,industry_context_id,id),
 FOREIGN KEY(tenant_id,industry_context_id,prescription_line_id) REFERENCES ind_hlt.hlt_pms_prescription_line(tenant_id,industry_context_id,id),
 FOREIGN KEY(tenant_id,industry_context_id,batch_id) REFERENCES ind_hlt.hlt_pms_batch(tenant_id,industry_context_id,id)
);

CREATE TABLE ind_hlt.hlt_pms_controlled_register (
 id uuid PRIMARY KEY, drug_ref uuid NOT NULL, batch_id uuid NOT NULL, prescription_ref uuid NOT NULL,
 patient_ref uuid NOT NULL, qty numeric NOT NULL CHECK(qty>0), direction text NOT NULL,
 pharmacist_id uuid NOT NULL, occurred_at timestamptz NOT NULL,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id) REFERENCES core_tenancy.industry_context(tenant_id,id), UNIQUE(tenant_id,industry_context_id,id),
 FOREIGN KEY(tenant_id,industry_context_id,batch_id) REFERENCES ind_hlt.hlt_pms_batch(tenant_id,industry_context_id,id)
);
CREATE INDEX hlt_pms_controlled_register_time_idx ON ind_hlt.hlt_pms_controlled_register(tenant_id,industry_context_id,occurred_at);

CREATE TABLE ind_hlt.hlt_pms_recall (
 id uuid PRIMARY KEY, drug_ref uuid NOT NULL, batch_id uuid NOT NULL, notice_ref text NOT NULL,
 state ind_hlt.pms_recall_state NOT NULL, opened_at timestamptz NOT NULL, closed_at timestamptz,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id) REFERENCES core_tenancy.industry_context(tenant_id,id), UNIQUE(tenant_id,industry_context_id,id),
 FOREIGN KEY(tenant_id,industry_context_id,batch_id) REFERENCES ind_hlt.hlt_pms_batch(tenant_id,industry_context_id,id),
 CHECK(closed_at IS NULL OR closed_at>=opened_at)
);
CREATE UNIQUE INDEX hlt_pms_recall_active_uq ON ind_hlt.hlt_pms_recall(tenant_id,industry_context_id,batch_id,notice_ref)
 WHERE state<>'CLOSED' AND deleted_at IS NULL;

CREATE TABLE ind_hlt.hlt_pms_indent (
 id uuid PRIMARY KEY, ward_ref uuid NOT NULL, requested_by uuid NOT NULL, approved_by uuid,
 state ind_hlt.pms_indent_state NOT NULL, line_refs jsonb NOT NULL,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id) REFERENCES core_tenancy.industry_context(tenant_id,id), UNIQUE(tenant_id,industry_context_id,id)
);
CREATE INDEX hlt_pms_indent_state_idx ON ind_hlt.hlt_pms_indent(tenant_id,industry_context_id,ward_ref,state);

-- HLT-CMS
CREATE TABLE ind_hlt.hlt_cms_appointment (
 id uuid PRIMARY KEY, appointment_no text NOT NULL, patient_ref uuid NOT NULL, doctor_id uuid NOT NULL,
 visit_type text NOT NULL, scheduled_at timestamptz NOT NULL, state ind_hlt.cms_appointment_state NOT NULL,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id) REFERENCES core_tenancy.industry_context(tenant_id,id), UNIQUE(tenant_id,industry_context_id,id), UNIQUE(tenant_id,industry_context_id,appointment_no)
);
CREATE INDEX hlt_cms_appointment_doctor_time_idx ON ind_hlt.hlt_cms_appointment(tenant_id,industry_context_id,doctor_id,scheduled_at,state);

CREATE TABLE ind_hlt.hlt_cms_encounter (
 id uuid PRIMARY KEY, appointment_id uuid, patient_ref uuid NOT NULL, doctor_id uuid NOT NULL, token_no text,
 vitals_json jsonb NOT NULL DEFAULT '{}'::jsonb, diagnosis_codes text[] NOT NULL DEFAULT '{}',
 clinical_note_ref uuid, state ind_hlt.cms_encounter_state NOT NULL, signed_at timestamptz,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id) REFERENCES core_tenancy.industry_context(tenant_id,id), UNIQUE(tenant_id,industry_context_id,id),
 FOREIGN KEY(tenant_id,industry_context_id,appointment_id) REFERENCES ind_hlt.hlt_cms_appointment(tenant_id,industry_context_id,id),
 CHECK(state NOT IN ('SIGNED','CLOSED','ADDENDUM') OR signed_at IS NOT NULL)
);
CREATE INDEX hlt_cms_encounter_patient_state_idx ON ind_hlt.hlt_cms_encounter(tenant_id,industry_context_id,patient_ref,state);

CREATE TABLE ind_hlt.hlt_cms_procedure (
 id uuid PRIMARY KEY, encounter_id uuid NOT NULL, procedure_code text NOT NULL, performer_id uuid NOT NULL,
 state ind_hlt.cms_procedure_state NOT NULL, document_refs jsonb,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id) REFERENCES core_tenancy.industry_context(tenant_id,id), UNIQUE(tenant_id,industry_context_id,id),
 FOREIGN KEY(tenant_id,industry_context_id,encounter_id) REFERENCES ind_hlt.hlt_cms_encounter(tenant_id,industry_context_id,id)
);
CREATE INDEX hlt_cms_procedure_encounter_state_idx ON ind_hlt.hlt_cms_procedure(tenant_id,industry_context_id,encounter_id,state);

CREATE TABLE ind_hlt.hlt_cms_referral (
 id uuid PRIMARY KEY, encounter_id uuid NOT NULL, target_type text NOT NULL, target_ref text,
 consent_document_id uuid NOT NULL, summary_document_id uuid NOT NULL, state ind_hlt.cms_referral_state NOT NULL,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id) REFERENCES core_tenancy.industry_context(tenant_id,id), UNIQUE(tenant_id,industry_context_id,id),
 FOREIGN KEY(tenant_id,industry_context_id,encounter_id) REFERENCES ind_hlt.hlt_cms_encounter(tenant_id,industry_context_id,id)
);
CREATE INDEX hlt_cms_referral_state_idx ON ind_hlt.hlt_cms_referral(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_hlt.hlt_cms_followup (
 id uuid PRIMARY KEY, encounter_id uuid NOT NULL, due_at timestamptz NOT NULL, protocol_code text,
 state ind_hlt.cms_followup_state NOT NULL,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id) REFERENCES core_tenancy.industry_context(tenant_id,id), UNIQUE(tenant_id,industry_context_id,id),
 FOREIGN KEY(tenant_id,industry_context_id,encounter_id) REFERENCES ind_hlt.hlt_cms_encounter(tenant_id,industry_context_id,id)
);
CREATE INDEX hlt_cms_followup_due_state_idx ON ind_hlt.hlt_cms_followup(tenant_id,industry_context_id,due_at,state);

CREATE TABLE ind_hlt.hlt_cms_teleconsult (
 id uuid PRIMARY KEY, encounter_id uuid NOT NULL, provider_session_ref text,
 state ind_hlt.cms_teleconsult_state NOT NULL, started_at timestamptz, ended_at timestamptz,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id) REFERENCES core_tenancy.industry_context(tenant_id,id), UNIQUE(tenant_id,industry_context_id,id),
 FOREIGN KEY(tenant_id,industry_context_id,encounter_id) REFERENCES ind_hlt.hlt_cms_encounter(tenant_id,industry_context_id,id),
 CHECK(ended_at IS NULL OR started_at IS NULL OR ended_at>=started_at)
);
CREATE INDEX hlt_cms_teleconsult_state_idx ON ind_hlt.hlt_cms_teleconsult(tenant_id,industry_context_id,state,updated_at);


ALTER TABLE ind_hlt.hlt_hms_encounter ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hlt.hlt_hms_encounter FORCE ROW LEVEL SECURITY;
CREATE POLICY hlt_hms_encounter_industry_policy ON ind_hlt.hlt_hms_encounter
 USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
 WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hlt.hlt_hms_admission ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hlt.hlt_hms_admission FORCE ROW LEVEL SECURITY;
CREATE POLICY hlt_hms_admission_industry_policy ON ind_hlt.hlt_hms_admission
 USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
 WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hlt.hlt_hms_bed ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hlt.hlt_hms_bed FORCE ROW LEVEL SECURITY;
CREATE POLICY hlt_hms_bed_industry_policy ON ind_hlt.hlt_hms_bed
 USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
 WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hlt.hlt_hms_bed_transfer ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hlt.hlt_hms_bed_transfer FORCE ROW LEVEL SECURITY;
CREATE POLICY hlt_hms_bed_transfer_industry_policy ON ind_hlt.hlt_hms_bed_transfer
 USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
 WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hlt.hlt_hms_order ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hlt.hlt_hms_order FORCE ROW LEVEL SECURITY;
CREATE POLICY hlt_hms_order_industry_policy ON ind_hlt.hlt_hms_order
 USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
 WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hlt.hlt_hms_nursing_observation ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hlt.hlt_hms_nursing_observation FORCE ROW LEVEL SECURITY;
CREATE POLICY hlt_hms_nursing_observation_industry_policy ON ind_hlt.hlt_hms_nursing_observation
 USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
 WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hlt.hlt_hms_ot_case ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hlt.hlt_hms_ot_case FORCE ROW LEVEL SECURITY;
CREATE POLICY hlt_hms_ot_case_industry_policy ON ind_hlt.hlt_hms_ot_case
 USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
 WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hlt.hlt_hms_discharge_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hlt.hlt_hms_discharge_summary FORCE ROW LEVEL SECURITY;
CREATE POLICY hlt_hms_discharge_summary_industry_policy ON ind_hlt.hlt_hms_discharge_summary
 USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
 WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hlt.hlt_lis_order ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hlt.hlt_lis_order FORCE ROW LEVEL SECURITY;
CREATE POLICY hlt_lis_order_industry_policy ON ind_hlt.hlt_lis_order
 USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
 WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hlt.hlt_lis_order_test ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hlt.hlt_lis_order_test FORCE ROW LEVEL SECURITY;
CREATE POLICY hlt_lis_order_test_industry_policy ON ind_hlt.hlt_lis_order_test
 USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
 WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hlt.hlt_lis_specimen ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hlt.hlt_lis_specimen FORCE ROW LEVEL SECURITY;
CREATE POLICY hlt_lis_specimen_industry_policy ON ind_hlt.hlt_lis_specimen
 USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
 WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hlt.hlt_lis_rejection ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hlt.hlt_lis_rejection FORCE ROW LEVEL SECURITY;
CREATE POLICY hlt_lis_rejection_industry_policy ON ind_hlt.hlt_lis_rejection
 USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
 WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hlt.hlt_lis_result ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hlt.hlt_lis_result FORCE ROW LEVEL SECURITY;
CREATE POLICY hlt_lis_result_industry_policy ON ind_hlt.hlt_lis_result
 USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
 WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hlt.hlt_lis_critical_alert ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hlt.hlt_lis_critical_alert FORCE ROW LEVEL SECURITY;
CREATE POLICY hlt_lis_critical_alert_industry_policy ON ind_hlt.hlt_lis_critical_alert
 USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
 WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hlt.hlt_lis_delta_check ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hlt.hlt_lis_delta_check FORCE ROW LEVEL SECURITY;
CREATE POLICY hlt_lis_delta_check_industry_policy ON ind_hlt.hlt_lis_delta_check
 USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
 WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hlt.hlt_lis_report ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hlt.hlt_lis_report FORCE ROW LEVEL SECURITY;
CREATE POLICY hlt_lis_report_industry_policy ON ind_hlt.hlt_lis_report
 USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
 WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hlt.hlt_lis_test_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hlt.hlt_lis_test_catalog FORCE ROW LEVEL SECURITY;
CREATE POLICY hlt_lis_test_catalog_industry_policy ON ind_hlt.hlt_lis_test_catalog
 USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
 WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hlt.hlt_ris_order ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hlt.hlt_ris_order FORCE ROW LEVEL SECURITY;
CREATE POLICY hlt_ris_order_industry_policy ON ind_hlt.hlt_ris_order
 USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
 WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hlt.hlt_ris_appointment ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hlt.hlt_ris_appointment FORCE ROW LEVEL SECURITY;
CREATE POLICY hlt_ris_appointment_industry_policy ON ind_hlt.hlt_ris_appointment
 USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
 WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hlt.hlt_ris_contrast_screen ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hlt.hlt_ris_contrast_screen FORCE ROW LEVEL SECURITY;
CREATE POLICY hlt_ris_contrast_screen_industry_policy ON ind_hlt.hlt_ris_contrast_screen
 USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
 WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hlt.hlt_ris_exam ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hlt.hlt_ris_exam FORCE ROW LEVEL SECURITY;
CREATE POLICY hlt_ris_exam_industry_policy ON ind_hlt.hlt_ris_exam
 USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
 WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hlt.hlt_ris_report ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hlt.hlt_ris_report FORCE ROW LEVEL SECURITY;
CREATE POLICY hlt_ris_report_industry_policy ON ind_hlt.hlt_ris_report
 USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
 WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hlt.hlt_ris_critical_finding ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hlt.hlt_ris_critical_finding FORCE ROW LEVEL SECURITY;
CREATE POLICY hlt_ris_critical_finding_industry_policy ON ind_hlt.hlt_ris_critical_finding
 USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
 WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hlt.hlt_pms_prescription ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hlt.hlt_pms_prescription FORCE ROW LEVEL SECURITY;
CREATE POLICY hlt_pms_prescription_industry_policy ON ind_hlt.hlt_pms_prescription
 USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
 WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hlt.hlt_pms_prescription_line ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hlt.hlt_pms_prescription_line FORCE ROW LEVEL SECURITY;
CREATE POLICY hlt_pms_prescription_line_industry_policy ON ind_hlt.hlt_pms_prescription_line
 USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
 WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hlt.hlt_pms_batch ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hlt.hlt_pms_batch FORCE ROW LEVEL SECURITY;
CREATE POLICY hlt_pms_batch_industry_policy ON ind_hlt.hlt_pms_batch
 USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
 WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hlt.hlt_pms_dispense ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hlt.hlt_pms_dispense FORCE ROW LEVEL SECURITY;
CREATE POLICY hlt_pms_dispense_industry_policy ON ind_hlt.hlt_pms_dispense
 USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
 WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hlt.hlt_pms_dispense_line ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hlt.hlt_pms_dispense_line FORCE ROW LEVEL SECURITY;
CREATE POLICY hlt_pms_dispense_line_industry_policy ON ind_hlt.hlt_pms_dispense_line
 USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
 WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hlt.hlt_pms_controlled_register ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hlt.hlt_pms_controlled_register FORCE ROW LEVEL SECURITY;
CREATE POLICY hlt_pms_controlled_register_industry_policy ON ind_hlt.hlt_pms_controlled_register
 USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
 WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hlt.hlt_pms_recall ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hlt.hlt_pms_recall FORCE ROW LEVEL SECURITY;
CREATE POLICY hlt_pms_recall_industry_policy ON ind_hlt.hlt_pms_recall
 USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
 WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hlt.hlt_pms_indent ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hlt.hlt_pms_indent FORCE ROW LEVEL SECURITY;
CREATE POLICY hlt_pms_indent_industry_policy ON ind_hlt.hlt_pms_indent
 USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
 WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hlt.hlt_cms_appointment ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hlt.hlt_cms_appointment FORCE ROW LEVEL SECURITY;
CREATE POLICY hlt_cms_appointment_industry_policy ON ind_hlt.hlt_cms_appointment
 USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
 WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hlt.hlt_cms_encounter ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hlt.hlt_cms_encounter FORCE ROW LEVEL SECURITY;
CREATE POLICY hlt_cms_encounter_industry_policy ON ind_hlt.hlt_cms_encounter
 USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
 WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hlt.hlt_cms_procedure ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hlt.hlt_cms_procedure FORCE ROW LEVEL SECURITY;
CREATE POLICY hlt_cms_procedure_industry_policy ON ind_hlt.hlt_cms_procedure
 USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
 WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hlt.hlt_cms_referral ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hlt.hlt_cms_referral FORCE ROW LEVEL SECURITY;
CREATE POLICY hlt_cms_referral_industry_policy ON ind_hlt.hlt_cms_referral
 USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
 WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hlt.hlt_cms_followup ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hlt.hlt_cms_followup FORCE ROW LEVEL SECURITY;
CREATE POLICY hlt_cms_followup_industry_policy ON ind_hlt.hlt_cms_followup
 USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
 WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hlt.hlt_cms_teleconsult ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hlt.hlt_cms_teleconsult FORCE ROW LEVEL SECURITY;
CREATE POLICY hlt_cms_teleconsult_industry_policy ON ind_hlt.hlt_cms_teleconsult
 USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
 WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

INSERT INTO core_authz.rls_table_registry
(schema_name,table_name,scope_class,policy_class,owner_module,force_rls_required,registered_at)
VALUES
('ind_hlt','hlt_hms_encounter','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HLT-HMS',true,now()),
('ind_hlt','hlt_hms_admission','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HLT-HMS',true,now()),
('ind_hlt','hlt_hms_bed','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HLT-HMS',true,now()),
('ind_hlt','hlt_hms_bed_transfer','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HLT-HMS',true,now()),
('ind_hlt','hlt_hms_order','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HLT-HMS',true,now()),
('ind_hlt','hlt_hms_nursing_observation','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HLT-HMS',true,now()),
('ind_hlt','hlt_hms_ot_case','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HLT-HMS',true,now()),
('ind_hlt','hlt_hms_discharge_summary','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HLT-HMS',true,now()),
('ind_hlt','hlt_lis_order','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HLT-LIS',true,now()),
('ind_hlt','hlt_lis_order_test','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HLT-LIS',true,now()),
('ind_hlt','hlt_lis_specimen','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HLT-LIS',true,now()),
('ind_hlt','hlt_lis_rejection','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HLT-LIS',true,now()),
('ind_hlt','hlt_lis_result','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HLT-LIS',true,now()),
('ind_hlt','hlt_lis_critical_alert','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HLT-LIS',true,now()),
('ind_hlt','hlt_lis_delta_check','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HLT-LIS',true,now()),
('ind_hlt','hlt_lis_report','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HLT-LIS',true,now()),
('ind_hlt','hlt_lis_test_catalog','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HLT-LIS',true,now()),
('ind_hlt','hlt_ris_order','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HLT-RIS',true,now()),
('ind_hlt','hlt_ris_appointment','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HLT-RIS',true,now()),
('ind_hlt','hlt_ris_contrast_screen','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HLT-RIS',true,now()),
('ind_hlt','hlt_ris_exam','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HLT-RIS',true,now()),
('ind_hlt','hlt_ris_report','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HLT-RIS',true,now()),
('ind_hlt','hlt_ris_critical_finding','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HLT-RIS',true,now()),
('ind_hlt','hlt_pms_prescription','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HLT-PMS',true,now()),
('ind_hlt','hlt_pms_prescription_line','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HLT-PMS',true,now()),
('ind_hlt','hlt_pms_batch','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HLT-PMS',true,now()),
('ind_hlt','hlt_pms_dispense','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HLT-PMS',true,now()),
('ind_hlt','hlt_pms_dispense_line','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HLT-PMS',true,now()),
('ind_hlt','hlt_pms_controlled_register','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HLT-PMS',true,now()),
('ind_hlt','hlt_pms_recall','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HLT-PMS',true,now()),
('ind_hlt','hlt_pms_indent','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HLT-PMS',true,now()),
('ind_hlt','hlt_cms_appointment','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HLT-CMS',true,now()),
('ind_hlt','hlt_cms_encounter','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HLT-CMS',true,now()),
('ind_hlt','hlt_cms_procedure','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HLT-CMS',true,now()),
('ind_hlt','hlt_cms_referral','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HLT-CMS',true,now()),
('ind_hlt','hlt_cms_followup','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HLT-CMS',true,now()),
('ind_hlt','hlt_cms_teleconsult','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HLT-CMS',true,now());

COMMIT;
