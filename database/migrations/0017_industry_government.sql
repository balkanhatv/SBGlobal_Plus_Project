-- SBGlobal Plus — Migration 0017: Government/Public Sector Industry database wave
-- Canonical MS: GOV-CSM, GOV-CFM, GOV-PLM, GOV-RTM
BEGIN;

CREATE TYPE ind_gov.csm_request_state AS ENUM ('SUBMITTED','ACKNOWLEDGED','TRIAGED','ASSIGNED','PROCESSING','INFO_REQUESTED','RESOLVED','CLOSED','REOPENED','ESCALATED');
CREATE TYPE ind_gov.csm_sla_state AS ENUM ('RUNNING','PAUSED','MET','BREACHED','ESCALATED');
CREATE TYPE ind_gov.csm_appeal_state AS ENUM ('SUBMITTED','REVIEW','HEARING','DECIDED','CLOSED');

CREATE TYPE ind_gov.cfm_file_state AS ENUM ('CREATED','IN_PROCESS','APPROVAL','DISPOSED','ARCHIVED');
CREATE TYPE ind_gov.cfm_decision AS ENUM ('APPROVE','RETURN','REJECT','DISPOSE');

CREATE TYPE ind_gov.plm_application_state AS ENUM ('SUBMITTED','FEE_PENDING','SCRUTINY','DEFICIENCY','INSPECTION','DECISION','APPROVED','REJECTED','ISSUED');
CREATE TYPE ind_gov.plm_scrutiny_result AS ENUM ('PASS','DEFICIENT');
CREATE TYPE ind_gov.plm_inspection_state AS ENUM ('SCHEDULED','COMPLETED','FAILED','APPROVED');
CREATE TYPE ind_gov.plm_license_state AS ENUM ('ACTIVE','SUSPENDED','REVOKED','EXPIRED','RENEWED');

CREATE TYPE ind_gov.rtm_assessment_state AS ENUM ('DRAFT','ASSESSED','FINALIZED','REVISED');
CREATE TYPE ind_gov.rtm_demand_state AS ENUM ('ISSUED','PART_PAID','PAID','ARREARS','REVERSED');
CREATE TYPE ind_gov.rtm_receipt_state AS ENUM ('ISSUED','REVERSED');
CREATE TYPE ind_gov.rtm_case_type AS ENUM ('RECOVERY','REFUND');
CREATE TYPE ind_gov.rtm_case_state AS ENUM ('OPEN','REVIEW','APPROVED','EXECUTED','CLOSED');

CREATE TABLE ind_gov.gov_csm_request (
  id uuid PRIMARY KEY,
  request_no text NOT NULL,
  service_code text NOT NULL,
  citizen_ref uuid,
  channel text NOT NULL,
  state ind_gov.csm_request_state NOT NULL,

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
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  UNIQUE (tenant_id,industry_context_id,id),
  UNIQUE (tenant_id,industry_context_id,request_no)
);
CREATE INDEX gov_csm_request_state_idx ON ind_gov.gov_csm_request(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_gov.gov_csm_sla (
  id uuid PRIMARY KEY,
  request_id uuid NOT NULL,
  category_code text NOT NULL,
  due_at timestamptz NOT NULL,
  escalation_level integer NOT NULL DEFAULT 0 CHECK (escalation_level >= 0),
  state ind_gov.csm_sla_state NOT NULL,

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
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  UNIQUE (tenant_id,industry_context_id,id),
  UNIQUE (tenant_id,industry_context_id,request_id),
  FOREIGN KEY (tenant_id,industry_context_id,request_id)
    REFERENCES ind_gov.gov_csm_request(tenant_id,industry_context_id,id)
);
CREATE INDEX gov_csm_sla_state_idx ON ind_gov.gov_csm_sla(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_gov.gov_csm_action (
  id uuid PRIMARY KEY,
  request_id uuid NOT NULL,
  action_type_code text NOT NULL,
  note text,
  actor_id uuid NOT NULL,
  from_state text,
  to_state text NOT NULL,
  occurred_at timestamptz NOT NULL,

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
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  UNIQUE (tenant_id,industry_context_id,id),
  FOREIGN KEY (tenant_id,industry_context_id,request_id)
    REFERENCES ind_gov.gov_csm_request(tenant_id,industry_context_id,id)
);
CREATE INDEX gov_csm_action_request_idx ON ind_gov.gov_csm_action(tenant_id,industry_context_id,request_id,occurred_at);

CREATE TABLE ind_gov.gov_csm_appeal (
  id uuid PRIMARY KEY,
  request_id uuid NOT NULL,
  appeal_no text NOT NULL,
  reason text NOT NULL,
  authority_ref uuid NOT NULL,
  state ind_gov.csm_appeal_state NOT NULL,

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
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  UNIQUE (tenant_id,industry_context_id,id),
  UNIQUE (tenant_id,industry_context_id,appeal_no),
  FOREIGN KEY (tenant_id,industry_context_id,request_id)
    REFERENCES ind_gov.gov_csm_request(tenant_id,industry_context_id,id)
);
CREATE INDEX gov_csm_appeal_state_idx ON ind_gov.gov_csm_appeal(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_gov.gov_cfm_file (
  id uuid PRIMARY KEY,
  file_no text NOT NULL,
  subject text NOT NULL,
  classification text NOT NULL,
  current_desk_ref uuid,
  state ind_gov.cfm_file_state NOT NULL,

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
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  UNIQUE (tenant_id,industry_context_id,id),
  UNIQUE (tenant_id,industry_context_id,file_no)
);
CREATE INDEX gov_cfm_file_state_idx ON ind_gov.gov_cfm_file(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_gov.gov_cfm_noting (
  id uuid PRIMARY KEY,
  file_id uuid NOT NULL,
  sequence_no integer NOT NULL CHECK (sequence_no > 0),
  author_id uuid NOT NULL,
  content_document_ref uuid NOT NULL,
  supersedes_noting_id uuid,
  occurred_at timestamptz NOT NULL,

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
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  UNIQUE (tenant_id,industry_context_id,id),
  UNIQUE (tenant_id,industry_context_id,file_id,sequence_no),
  FOREIGN KEY (tenant_id,industry_context_id,file_id)
    REFERENCES ind_gov.gov_cfm_file(tenant_id,industry_context_id,id),
  FOREIGN KEY (tenant_id,industry_context_id,supersedes_noting_id)
    REFERENCES ind_gov.gov_cfm_noting(tenant_id,industry_context_id,id)
);
CREATE INDEX gov_cfm_noting_file_idx ON ind_gov.gov_cfm_noting(tenant_id,industry_context_id,file_id,sequence_no);

CREATE TABLE ind_gov.gov_cfm_movement (
  id uuid PRIMARY KEY,
  file_id uuid NOT NULL,
  from_desk_ref uuid,
  to_desk_ref uuid NOT NULL,
  forwarded_by uuid NOT NULL,
  received_by uuid,
  forwarded_at timestamptz NOT NULL,
  received_at timestamptz,

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
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  UNIQUE (tenant_id,industry_context_id,id),
  FOREIGN KEY (tenant_id,industry_context_id,file_id)
    REFERENCES ind_gov.gov_cfm_file(tenant_id,industry_context_id,id),
  CHECK (received_at IS NULL OR received_at >= forwarded_at)
);
CREATE INDEX gov_cfm_movement_file_idx ON ind_gov.gov_cfm_movement(tenant_id,industry_context_id,file_id,forwarded_at);

CREATE TABLE ind_gov.gov_cfm_decision (
  id uuid PRIMARY KEY,
  file_id uuid NOT NULL,
  level_code text NOT NULL,
  authority_id uuid NOT NULL,
  decision ind_gov.cfm_decision NOT NULL,
  reason text,
  occurred_at timestamptz NOT NULL,

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
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  UNIQUE (tenant_id,industry_context_id,id),
  FOREIGN KEY (tenant_id,industry_context_id,file_id)
    REFERENCES ind_gov.gov_cfm_file(tenant_id,industry_context_id,id)
);
CREATE INDEX gov_cfm_decision_file_idx ON ind_gov.gov_cfm_decision(tenant_id,industry_context_id,file_id,occurred_at);

CREATE TABLE ind_gov.gov_plm_application (
  id uuid PRIMARY KEY,
  application_no text NOT NULL,
  permit_type text NOT NULL,
  applicant_ref uuid NOT NULL,
  state ind_gov.plm_application_state NOT NULL,

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
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  UNIQUE (tenant_id,industry_context_id,id),
  UNIQUE (tenant_id,industry_context_id,application_no)
);
CREATE INDEX gov_plm_application_state_idx ON ind_gov.gov_plm_application(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_gov.gov_plm_scrutiny (
  id uuid PRIMARY KEY,
  application_id uuid NOT NULL,
  checklist_version text NOT NULL,
  result ind_gov.plm_scrutiny_result NOT NULL,
  deficiency_json jsonb,
  officer_id uuid NOT NULL,
  completed_at timestamptz NOT NULL,

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
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  UNIQUE (tenant_id,industry_context_id,id),
  FOREIGN KEY (tenant_id,industry_context_id,application_id)
    REFERENCES ind_gov.gov_plm_application(tenant_id,industry_context_id,id)
);
CREATE INDEX gov_plm_scrutiny_application_idx ON ind_gov.gov_plm_scrutiny(tenant_id,industry_context_id,application_id,checklist_version);

CREATE TABLE ind_gov.gov_plm_inspection (
  id uuid PRIMARY KEY,
  application_id uuid NOT NULL,
  inspector_id uuid NOT NULL,
  scheduled_at timestamptz NOT NULL,
  performed_at timestamptz,
  finding_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  state ind_gov.plm_inspection_state NOT NULL,

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
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  UNIQUE (tenant_id,industry_context_id,id),
  FOREIGN KEY (tenant_id,industry_context_id,application_id)
    REFERENCES ind_gov.gov_plm_application(tenant_id,industry_context_id,id),
  CHECK (performed_at IS NULL OR performed_at >= scheduled_at)
);
CREATE INDEX gov_plm_inspection_state_idx ON ind_gov.gov_plm_inspection(tenant_id,industry_context_id,application_id,state);

CREATE TABLE ind_gov.gov_plm_license (
  id uuid PRIMARY KEY,
  application_id uuid NOT NULL,
  license_no text NOT NULL,
  qr_verification_ref uuid NOT NULL,
  valid_from date NOT NULL,
  valid_to date,
  state ind_gov.plm_license_state NOT NULL,
  version integer NOT NULL CHECK (version > 0),

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
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  UNIQUE (tenant_id,industry_context_id,id),
  UNIQUE (tenant_id,industry_context_id,license_no,version),
  FOREIGN KEY (tenant_id,industry_context_id,application_id)
    REFERENCES ind_gov.gov_plm_application(tenant_id,industry_context_id,id),
  CHECK (valid_to IS NULL OR valid_to >= valid_from)
);
CREATE INDEX gov_plm_license_state_idx ON ind_gov.gov_plm_license(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_gov.gov_rtm_assessment (
  id uuid PRIMARY KEY,
  assessment_no text NOT NULL,
  taxpayer_ref uuid NOT NULL,
  tax_head_code text NOT NULL,
  period_key text NOT NULL,
  assessed_minor bigint NOT NULL CHECK (assessed_minor >= 0),
  state ind_gov.rtm_assessment_state NOT NULL,

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
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  UNIQUE (tenant_id,industry_context_id,id),
  UNIQUE (tenant_id,industry_context_id,assessment_no)
);
CREATE INDEX gov_rtm_assessment_state_idx ON ind_gov.gov_rtm_assessment(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_gov.gov_rtm_demand (
  id uuid PRIMARY KEY,
  assessment_id uuid NOT NULL,
  demand_no text NOT NULL,
  due_date date NOT NULL,
  amount_minor bigint NOT NULL CHECK (amount_minor >= 0),
  balance_minor bigint NOT NULL CHECK (balance_minor >= 0 AND balance_minor <= amount_minor),
  state ind_gov.rtm_demand_state NOT NULL,

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
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  UNIQUE (tenant_id,industry_context_id,id),
  UNIQUE (tenant_id,industry_context_id,demand_no),
  FOREIGN KEY (tenant_id,industry_context_id,assessment_id)
    REFERENCES ind_gov.gov_rtm_assessment(tenant_id,industry_context_id,id)
);
CREATE INDEX gov_rtm_demand_state_idx ON ind_gov.gov_rtm_demand(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_gov.gov_rtm_receipt (
  id uuid PRIMARY KEY,
  receipt_no text NOT NULL,
  demand_id uuid,
  payment_ref uuid NOT NULL,
  amount_minor bigint NOT NULL CHECK (amount_minor >= 0),
  issued_at timestamptz NOT NULL,
  reversal_of uuid,
  state ind_gov.rtm_receipt_state NOT NULL,

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
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  UNIQUE (tenant_id,industry_context_id,id),
  UNIQUE (tenant_id,industry_context_id,receipt_no),
  FOREIGN KEY (tenant_id,industry_context_id,demand_id)
    REFERENCES ind_gov.gov_rtm_demand(tenant_id,industry_context_id,id),
  FOREIGN KEY (tenant_id,industry_context_id,reversal_of)
    REFERENCES ind_gov.gov_rtm_receipt(tenant_id,industry_context_id,id)
);
CREATE INDEX gov_rtm_receipt_state_idx ON ind_gov.gov_rtm_receipt(tenant_id,industry_context_id,state,issued_at DESC);

CREATE TABLE ind_gov.gov_rtm_case (
  id uuid PRIMARY KEY,
  taxpayer_ref uuid NOT NULL,
  demand_id uuid,
  case_type ind_gov.rtm_case_type NOT NULL,
  amount_minor bigint NOT NULL CHECK (amount_minor >= 0),
  reason text NOT NULL,
  state ind_gov.rtm_case_state NOT NULL,

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
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  UNIQUE (tenant_id,industry_context_id,id),
  FOREIGN KEY (tenant_id,industry_context_id,demand_id)
    REFERENCES ind_gov.gov_rtm_demand(tenant_id,industry_context_id,id)
);
CREATE INDEX gov_rtm_case_type_state_idx ON ind_gov.gov_rtm_case(tenant_id,industry_context_id,case_type,state,updated_at);


ALTER TABLE ind_gov.gov_csm_request ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_gov.gov_csm_request FORCE ROW LEVEL SECURITY;
CREATE POLICY gov_csm_request_industry_policy ON ind_gov.gov_csm_request
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_gov.gov_csm_sla ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_gov.gov_csm_sla FORCE ROW LEVEL SECURITY;
CREATE POLICY gov_csm_sla_industry_policy ON ind_gov.gov_csm_sla
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_gov.gov_csm_action ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_gov.gov_csm_action FORCE ROW LEVEL SECURITY;
CREATE POLICY gov_csm_action_industry_policy ON ind_gov.gov_csm_action
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_gov.gov_csm_appeal ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_gov.gov_csm_appeal FORCE ROW LEVEL SECURITY;
CREATE POLICY gov_csm_appeal_industry_policy ON ind_gov.gov_csm_appeal
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_gov.gov_cfm_file ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_gov.gov_cfm_file FORCE ROW LEVEL SECURITY;
CREATE POLICY gov_cfm_file_industry_policy ON ind_gov.gov_cfm_file
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_gov.gov_cfm_noting ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_gov.gov_cfm_noting FORCE ROW LEVEL SECURITY;
CREATE POLICY gov_cfm_noting_industry_policy ON ind_gov.gov_cfm_noting
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_gov.gov_cfm_movement ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_gov.gov_cfm_movement FORCE ROW LEVEL SECURITY;
CREATE POLICY gov_cfm_movement_industry_policy ON ind_gov.gov_cfm_movement
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_gov.gov_cfm_decision ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_gov.gov_cfm_decision FORCE ROW LEVEL SECURITY;
CREATE POLICY gov_cfm_decision_industry_policy ON ind_gov.gov_cfm_decision
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_gov.gov_plm_application ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_gov.gov_plm_application FORCE ROW LEVEL SECURITY;
CREATE POLICY gov_plm_application_industry_policy ON ind_gov.gov_plm_application
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_gov.gov_plm_scrutiny ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_gov.gov_plm_scrutiny FORCE ROW LEVEL SECURITY;
CREATE POLICY gov_plm_scrutiny_industry_policy ON ind_gov.gov_plm_scrutiny
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_gov.gov_plm_inspection ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_gov.gov_plm_inspection FORCE ROW LEVEL SECURITY;
CREATE POLICY gov_plm_inspection_industry_policy ON ind_gov.gov_plm_inspection
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_gov.gov_plm_license ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_gov.gov_plm_license FORCE ROW LEVEL SECURITY;
CREATE POLICY gov_plm_license_industry_policy ON ind_gov.gov_plm_license
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_gov.gov_rtm_assessment ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_gov.gov_rtm_assessment FORCE ROW LEVEL SECURITY;
CREATE POLICY gov_rtm_assessment_industry_policy ON ind_gov.gov_rtm_assessment
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_gov.gov_rtm_demand ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_gov.gov_rtm_demand FORCE ROW LEVEL SECURITY;
CREATE POLICY gov_rtm_demand_industry_policy ON ind_gov.gov_rtm_demand
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_gov.gov_rtm_receipt ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_gov.gov_rtm_receipt FORCE ROW LEVEL SECURITY;
CREATE POLICY gov_rtm_receipt_industry_policy ON ind_gov.gov_rtm_receipt
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_gov.gov_rtm_case ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_gov.gov_rtm_case FORCE ROW LEVEL SECURITY;
CREATE POLICY gov_rtm_case_industry_policy ON ind_gov.gov_rtm_case
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

INSERT INTO core_authz.rls_table_registry
(schema_name,table_name,scope_class,policy_class,owner_module,force_rls_required,registered_at)
VALUES
('ind_gov','gov_csm_request','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','GOV-CSM',true,now()),
('ind_gov','gov_csm_sla','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','GOV-CSM',true,now()),
('ind_gov','gov_csm_action','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','GOV-CSM',true,now()),
('ind_gov','gov_csm_appeal','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','GOV-CSM',true,now()),
('ind_gov','gov_cfm_file','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','GOV-CFM',true,now()),
('ind_gov','gov_cfm_noting','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','GOV-CFM',true,now()),
('ind_gov','gov_cfm_movement','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','GOV-CFM',true,now()),
('ind_gov','gov_cfm_decision','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','GOV-CFM',true,now()),
('ind_gov','gov_plm_application','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','GOV-PLM',true,now()),
('ind_gov','gov_plm_scrutiny','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','GOV-PLM',true,now()),
('ind_gov','gov_plm_inspection','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','GOV-PLM',true,now()),
('ind_gov','gov_plm_license','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','GOV-PLM',true,now()),
('ind_gov','gov_rtm_assessment','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','GOV-RTM',true,now()),
('ind_gov','gov_rtm_demand','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','GOV-RTM',true,now()),
('ind_gov','gov_rtm_receipt','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','GOV-RTM',true,now()),
('ind_gov','gov_rtm_case','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','GOV-RTM',true,now());

COMMIT;
