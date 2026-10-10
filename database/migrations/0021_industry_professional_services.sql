-- SBGlobal Plus — Migration 0021: Professional Services Industry database wave
-- Canonical MS: PSV-CRM, PSV-PJM, PSV-SDM, PSV-RTM, PSV-SGM
BEGIN;

CREATE TYPE ind_psv.crm_lead_state AS ENUM ('NEW','QUALIFIED','DISQUALIFIED','CONVERTED');
CREATE TYPE ind_psv.crm_opportunity_stage AS ENUM ('QUALIFIED','DISCOVERY','PROPOSAL','NEGOTIATION','WON','LOST');
CREATE TYPE ind_psv.crm_proposal_state AS ENUM ('DRAFT','REVIEW','ISSUED','ACCEPTED','REJECTED','SUPERSEDED');

CREATE TYPE ind_psv.pjm_project_state AS ENUM ('SETUP','ACTIVE','HOLD','COMPLETING','COMPLETED','CLOSED');
CREATE TYPE ind_psv.pjm_work_item_state AS ENUM ('TODO','IN_PROGRESS','BLOCKED','DONE','CANCELLED');
CREATE TYPE ind_psv.pjm_milestone_state AS ENUM ('PLANNED','IN_PROGRESS','SUBMITTED','ACCEPTED','REJECTED','INVOICED');
CREATE TYPE ind_psv.pjm_change_state AS ENUM ('DRAFT','SUBMITTED','APPROVED','REJECTED','IMPLEMENTED');

CREATE TYPE ind_psv.sdm_contract_state AS ENUM ('ACTIVE','SUSPENDED','EXPIRED');
CREATE TYPE ind_psv.sdm_ticket_state AS ENUM ('RECEIVED','TRIAGED','ASSIGNED','IN_PROGRESS','CLIENT_WAIT','RESOLVED','ACCEPTED','CLOSED','ESCALATED');
CREATE TYPE ind_psv.sdm_sla_state AS ENUM ('RUNNING','PAUSED','MET','BREACHED');
CREATE TYPE ind_psv.sdm_deliverable_state AS ENUM ('PLANNED','IN_PROGRESS','SUBMITTED','REVISION','ACCEPTED');

CREATE TYPE ind_psv.rtm_resource_state AS ENUM ('ACTIVE','INACTIVE');
CREATE TYPE ind_psv.rtm_allocation_state AS ENUM ('PROPOSED','APPROVED','ACTIVE','ENDED');
CREATE TYPE ind_psv.rtm_timesheet_state AS ENUM ('DRAFT','SUBMITTED','REJECTED','APPROVED','LOCKED','BILLED');
CREATE TYPE ind_psv.rtm_time_entry_state AS ENUM ('DRAFT','APPROVED','REJECTED');

CREATE TYPE ind_psv.sgm_booking_state AS ENUM ('ENQUIRY','CONFIRMED','SCHEDULED','SHOT','EDITING','CLIENT_REVIEW','DELIVERED','ARCHIVED','CANCELLED');
CREATE TYPE ind_psv.sgm_shoot_state AS ENUM ('PLANNED','IN_PROGRESS','COMPLETED');
CREATE TYPE ind_psv.sgm_revision_state AS ENUM ('DRAFT','SUBMITTED','CHANGES_REQUESTED','APPROVED');
CREATE TYPE ind_psv.sgm_delivery_state AS ENUM ('PREPARED','SHARED','ACCEPTED','REVOKED');

CREATE TABLE ind_psv.psv_crm_lead (
  id uuid PRIMARY KEY,
  lead_no text NOT NULL,
  source text NOT NULL,
  owner_id uuid NOT NULL,
  contact_ref jsonb NOT NULL,
  state ind_psv.crm_lead_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,lead_no)
);
CREATE INDEX psv_crm_lead_state_idx ON ind_psv.psv_crm_lead(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_psv.psv_crm_opportunity (
  id uuid PRIMARY KEY,
  lead_id uuid,
  name text NOT NULL,
  owner_id uuid NOT NULL,
  value_minor bigint CHECK (value_minor IS NULL OR value_minor >= 0),
  currency char(3),
  probability integer NOT NULL CHECK (probability BETWEEN 0 AND 100),
  stage ind_psv.crm_opportunity_stage NOT NULL,

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
  FOREIGN KEY (tenant_id,industry_context_id,lead_id)
    REFERENCES ind_psv.psv_crm_lead(tenant_id,industry_context_id,id)
);
CREATE INDEX psv_crm_opportunity_lead_idx ON ind_psv.psv_crm_opportunity(tenant_id,industry_context_id,lead_id);
CREATE INDEX psv_crm_opportunity_stage_idx ON ind_psv.psv_crm_opportunity(tenant_id,industry_context_id,stage,updated_at);

CREATE TABLE ind_psv.psv_crm_proposal (
  id uuid PRIMARY KEY,
  opportunity_id uuid NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  document_id uuid NOT NULL,
  amount_minor bigint CHECK (amount_minor IS NULL OR amount_minor >= 0),
  state ind_psv.crm_proposal_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,opportunity_id,version),
  FOREIGN KEY (tenant_id,industry_context_id,opportunity_id)
    REFERENCES ind_psv.psv_crm_opportunity(tenant_id,industry_context_id,id)
);
CREATE INDEX psv_crm_proposal_state_idx ON ind_psv.psv_crm_proposal(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_psv.psv_crm_activity (
  id uuid PRIMARY KEY,
  lead_or_opp_ref uuid NOT NULL,
  activity_type_code text NOT NULL,
  due_at timestamptz,
  completed_at timestamptz,
  owner_id uuid NOT NULL,
  outcome text,

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
  CHECK (completed_at IS NULL OR due_at IS NULL OR completed_at >= due_at)
);
CREATE INDEX psv_crm_activity_owner_due_idx ON ind_psv.psv_crm_activity(tenant_id,industry_context_id,owner_id,due_at);
CREATE INDEX psv_crm_activity_subject_idx ON ind_psv.psv_crm_activity(tenant_id,industry_context_id,lead_or_opp_ref);

CREATE TABLE ind_psv.psv_pjm_project (
  id uuid PRIMARY KEY,
  project_no text NOT NULL,
  client_ref uuid NOT NULL,
  contract_ref uuid,
  manager_id uuid NOT NULL,
  budget_minor bigint CHECK (budget_minor IS NULL OR budget_minor >= 0),
  currency char(3),
  state ind_psv.pjm_project_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,project_no)
);
CREATE INDEX psv_pjm_project_state_idx ON ind_psv.psv_pjm_project(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_psv.psv_pjm_work_item (
  id uuid PRIMARY KEY,
  project_id uuid NOT NULL,
  parent_id uuid,
  title text NOT NULL,
  assignee_id uuid,
  planned_hours numeric CHECK (planned_hours IS NULL OR planned_hours >= 0),
  state ind_psv.pjm_work_item_state NOT NULL,

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
  FOREIGN KEY (tenant_id,industry_context_id,project_id)
    REFERENCES ind_psv.psv_pjm_project(tenant_id,industry_context_id,id),
  FOREIGN KEY (tenant_id,industry_context_id,parent_id)
    REFERENCES ind_psv.psv_pjm_work_item(tenant_id,industry_context_id,id)
);
CREATE INDEX psv_pjm_work_item_project_state_idx ON ind_psv.psv_pjm_work_item(tenant_id,industry_context_id,project_id,state);

CREATE TABLE ind_psv.psv_pjm_milestone (
  id uuid PRIMARY KEY,
  project_id uuid NOT NULL,
  code text NOT NULL,
  due_at timestamptz,
  amount_minor bigint CHECK (amount_minor IS NULL OR amount_minor >= 0),
  state ind_psv.pjm_milestone_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,project_id,code),
  FOREIGN KEY (tenant_id,industry_context_id,project_id)
    REFERENCES ind_psv.psv_pjm_project(tenant_id,industry_context_id,id)
);
CREATE INDEX psv_pjm_milestone_state_idx ON ind_psv.psv_pjm_milestone(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_psv.psv_pjm_change_request (
  id uuid PRIMARY KEY,
  project_id uuid NOT NULL,
  cr_no text NOT NULL,
  scope_delta text NOT NULL,
  cost_delta_minor bigint,
  schedule_delta_hours numeric,
  state ind_psv.pjm_change_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,project_id,cr_no),
  FOREIGN KEY (tenant_id,industry_context_id,project_id)
    REFERENCES ind_psv.psv_pjm_project(tenant_id,industry_context_id,id)
);
CREATE INDEX psv_pjm_change_state_idx ON ind_psv.psv_pjm_change_request(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_psv.psv_sdm_contract_ref (
  id uuid PRIMARY KEY,
  client_ref uuid NOT NULL,
  contract_external_ref uuid NOT NULL,
  service_code text NOT NULL,
  entitled_hours numeric CHECK (entitled_hours IS NULL OR entitled_hours >= 0),
  sla_policy_ref uuid NOT NULL,
  state ind_psv.sdm_contract_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,contract_external_ref,service_code)
);
CREATE INDEX psv_sdm_contract_state_idx ON ind_psv.psv_sdm_contract_ref(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_psv.psv_sdm_ticket (
  id uuid PRIMARY KEY,
  ticket_no text NOT NULL,
  contract_ref_id uuid NOT NULL,
  priority_code text NOT NULL,
  assigned_to uuid,
  state ind_psv.sdm_ticket_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,ticket_no),
  FOREIGN KEY (tenant_id,industry_context_id,contract_ref_id)
    REFERENCES ind_psv.psv_sdm_contract_ref(tenant_id,industry_context_id,id)
);
CREATE INDEX psv_sdm_ticket_state_idx ON ind_psv.psv_sdm_ticket(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_psv.psv_sdm_sla_clock (
  id uuid PRIMARY KEY,
  ticket_id uuid NOT NULL,
  metric_code text NOT NULL,
  started_at timestamptz NOT NULL,
  paused_at timestamptz,
  accumulated_pause_seconds bigint NOT NULL DEFAULT 0 CHECK (accumulated_pause_seconds >= 0),
  due_at timestamptz NOT NULL,
  state ind_psv.sdm_sla_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,ticket_id,metric_code),
  FOREIGN KEY (tenant_id,industry_context_id,ticket_id)
    REFERENCES ind_psv.psv_sdm_ticket(tenant_id,industry_context_id,id)
);
CREATE INDEX psv_sdm_sla_state_idx ON ind_psv.psv_sdm_sla_clock(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_psv.psv_sdm_deliverable (
  id uuid PRIMARY KEY,
  contract_ref_id uuid NOT NULL,
  project_ref uuid,
  title text NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  document_id uuid,
  state ind_psv.sdm_deliverable_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,contract_ref_id,title,version),
  FOREIGN KEY (tenant_id,industry_context_id,contract_ref_id)
    REFERENCES ind_psv.psv_sdm_contract_ref(tenant_id,industry_context_id,id)
);
CREATE INDEX psv_sdm_deliverable_state_idx ON ind_psv.psv_sdm_deliverable(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_psv.psv_rtm_resource (
  id uuid PRIMARY KEY,
  principal_id uuid NOT NULL,
  capacity_hours_week numeric NOT NULL CHECK (capacity_hours_week >= 0),
  skills_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  cost_rate_minor bigint CHECK (cost_rate_minor IS NULL OR cost_rate_minor >= 0),
  state ind_psv.rtm_resource_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,principal_id)
);
CREATE INDEX psv_rtm_resource_state_idx ON ind_psv.psv_rtm_resource(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_psv.psv_rtm_allocation (
  id uuid PRIMARY KEY,
  resource_id uuid NOT NULL,
  project_ref uuid NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  allocation_percent numeric NOT NULL CHECK (allocation_percent > 0 AND allocation_percent <= 100),
  state ind_psv.rtm_allocation_state NOT NULL,

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
  FOREIGN KEY (tenant_id,industry_context_id,resource_id)
    REFERENCES ind_psv.psv_rtm_resource(tenant_id,industry_context_id,id),
  CHECK (end_date >= start_date)
);
CREATE INDEX psv_rtm_allocation_state_idx ON ind_psv.psv_rtm_allocation(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_psv.psv_rtm_timesheet (
  id uuid PRIMARY KEY,
  principal_id uuid NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_hours numeric NOT NULL CHECK (total_hours >= 0),
  state ind_psv.rtm_timesheet_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,principal_id,period_start,period_end),
  CHECK (period_end >= period_start)
);
CREATE INDEX psv_rtm_timesheet_state_idx ON ind_psv.psv_rtm_timesheet(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_psv.psv_rtm_time_entry (
  id uuid PRIMARY KEY,
  timesheet_id uuid NOT NULL,
  project_ref uuid NOT NULL,
  task_ref uuid,
  work_date date NOT NULL,
  hours numeric NOT NULL CHECK (hours > 0),
  billable boolean NOT NULL,
  note text,
  state ind_psv.rtm_time_entry_state NOT NULL,

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
  FOREIGN KEY (tenant_id,industry_context_id,timesheet_id)
    REFERENCES ind_psv.psv_rtm_timesheet(tenant_id,industry_context_id,id)
);
CREATE INDEX psv_rtm_time_entry_state_idx ON ind_psv.psv_rtm_time_entry(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_psv.psv_sgm_booking (
  id uuid PRIMARY KEY,
  booking_no text NOT NULL,
  client_ref uuid NOT NULL,
  package_code text NOT NULL,
  shoot_at timestamptz NOT NULL,
  location text,
  state ind_psv.sgm_booking_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,booking_no)
);
CREATE INDEX psv_sgm_booking_state_idx ON ind_psv.psv_sgm_booking(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_psv.psv_sgm_shoot (
  id uuid PRIMARY KEY,
  booking_id uuid NOT NULL,
  crew_json jsonb NOT NULL,
  equipment_json jsonb NOT NULL,
  started_at timestamptz,
  completed_at timestamptz,
  state ind_psv.sgm_shoot_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,booking_id),
  FOREIGN KEY (tenant_id,industry_context_id,booking_id)
    REFERENCES ind_psv.psv_sgm_booking(tenant_id,industry_context_id,id),
  CHECK (completed_at IS NULL OR started_at IS NULL OR completed_at >= started_at)
);
CREATE INDEX psv_sgm_shoot_state_idx ON ind_psv.psv_sgm_shoot(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_psv.psv_sgm_revision (
  id uuid PRIMARY KEY,
  booking_id uuid NOT NULL,
  asset_group_ref uuid NOT NULL,
  revision_no integer NOT NULL CHECK (revision_no > 0),
  document_or_storage_ref uuid NOT NULL,
  state ind_psv.sgm_revision_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,asset_group_ref,revision_no),
  FOREIGN KEY (tenant_id,industry_context_id,booking_id)
    REFERENCES ind_psv.psv_sgm_booking(tenant_id,industry_context_id,id)
);
CREATE INDEX psv_sgm_revision_state_idx ON ind_psv.psv_sgm_revision(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_psv.psv_sgm_delivery (
  id uuid PRIMARY KEY,
  booking_id uuid NOT NULL,
  delivery_version integer NOT NULL CHECK (delivery_version > 0),
  document_vault_ref uuid NOT NULL,
  accepted_by uuid,
  accepted_at timestamptz,
  state ind_psv.sgm_delivery_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,booking_id,delivery_version),
  FOREIGN KEY (tenant_id,industry_context_id,booking_id)
    REFERENCES ind_psv.psv_sgm_booking(tenant_id,industry_context_id,id),
  CHECK (state <> 'ACCEPTED' OR (accepted_by IS NOT NULL AND accepted_at IS NOT NULL))
);
CREATE INDEX psv_sgm_delivery_state_idx ON ind_psv.psv_sgm_delivery(tenant_id,industry_context_id,state,updated_at);


ALTER TABLE ind_psv.psv_crm_lead ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_psv.psv_crm_lead FORCE ROW LEVEL SECURITY;
CREATE POLICY psv_crm_lead_industry_policy ON ind_psv.psv_crm_lead
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_psv.psv_crm_opportunity ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_psv.psv_crm_opportunity FORCE ROW LEVEL SECURITY;
CREATE POLICY psv_crm_opportunity_industry_policy ON ind_psv.psv_crm_opportunity
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_psv.psv_crm_proposal ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_psv.psv_crm_proposal FORCE ROW LEVEL SECURITY;
CREATE POLICY psv_crm_proposal_industry_policy ON ind_psv.psv_crm_proposal
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_psv.psv_crm_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_psv.psv_crm_activity FORCE ROW LEVEL SECURITY;
CREATE POLICY psv_crm_activity_industry_policy ON ind_psv.psv_crm_activity
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_psv.psv_pjm_project ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_psv.psv_pjm_project FORCE ROW LEVEL SECURITY;
CREATE POLICY psv_pjm_project_industry_policy ON ind_psv.psv_pjm_project
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_psv.psv_pjm_work_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_psv.psv_pjm_work_item FORCE ROW LEVEL SECURITY;
CREATE POLICY psv_pjm_work_item_industry_policy ON ind_psv.psv_pjm_work_item
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_psv.psv_pjm_milestone ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_psv.psv_pjm_milestone FORCE ROW LEVEL SECURITY;
CREATE POLICY psv_pjm_milestone_industry_policy ON ind_psv.psv_pjm_milestone
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_psv.psv_pjm_change_request ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_psv.psv_pjm_change_request FORCE ROW LEVEL SECURITY;
CREATE POLICY psv_pjm_change_request_industry_policy ON ind_psv.psv_pjm_change_request
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_psv.psv_sdm_contract_ref ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_psv.psv_sdm_contract_ref FORCE ROW LEVEL SECURITY;
CREATE POLICY psv_sdm_contract_ref_industry_policy ON ind_psv.psv_sdm_contract_ref
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_psv.psv_sdm_ticket ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_psv.psv_sdm_ticket FORCE ROW LEVEL SECURITY;
CREATE POLICY psv_sdm_ticket_industry_policy ON ind_psv.psv_sdm_ticket
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_psv.psv_sdm_sla_clock ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_psv.psv_sdm_sla_clock FORCE ROW LEVEL SECURITY;
CREATE POLICY psv_sdm_sla_clock_industry_policy ON ind_psv.psv_sdm_sla_clock
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_psv.psv_sdm_deliverable ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_psv.psv_sdm_deliverable FORCE ROW LEVEL SECURITY;
CREATE POLICY psv_sdm_deliverable_industry_policy ON ind_psv.psv_sdm_deliverable
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_psv.psv_rtm_resource ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_psv.psv_rtm_resource FORCE ROW LEVEL SECURITY;
CREATE POLICY psv_rtm_resource_industry_policy ON ind_psv.psv_rtm_resource
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_psv.psv_rtm_allocation ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_psv.psv_rtm_allocation FORCE ROW LEVEL SECURITY;
CREATE POLICY psv_rtm_allocation_industry_policy ON ind_psv.psv_rtm_allocation
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_psv.psv_rtm_timesheet ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_psv.psv_rtm_timesheet FORCE ROW LEVEL SECURITY;
CREATE POLICY psv_rtm_timesheet_industry_policy ON ind_psv.psv_rtm_timesheet
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_psv.psv_rtm_time_entry ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_psv.psv_rtm_time_entry FORCE ROW LEVEL SECURITY;
CREATE POLICY psv_rtm_time_entry_industry_policy ON ind_psv.psv_rtm_time_entry
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_psv.psv_sgm_booking ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_psv.psv_sgm_booking FORCE ROW LEVEL SECURITY;
CREATE POLICY psv_sgm_booking_industry_policy ON ind_psv.psv_sgm_booking
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_psv.psv_sgm_shoot ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_psv.psv_sgm_shoot FORCE ROW LEVEL SECURITY;
CREATE POLICY psv_sgm_shoot_industry_policy ON ind_psv.psv_sgm_shoot
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_psv.psv_sgm_revision ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_psv.psv_sgm_revision FORCE ROW LEVEL SECURITY;
CREATE POLICY psv_sgm_revision_industry_policy ON ind_psv.psv_sgm_revision
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_psv.psv_sgm_delivery ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_psv.psv_sgm_delivery FORCE ROW LEVEL SECURITY;
CREATE POLICY psv_sgm_delivery_industry_policy ON ind_psv.psv_sgm_delivery
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

INSERT INTO core_authz.rls_table_registry
(schema_name,table_name,scope_class,policy_class,owner_module,force_rls_required,registered_at)
VALUES
('ind_psv','psv_crm_lead','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','PSV-CRM',true,now()),
('ind_psv','psv_crm_opportunity','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','PSV-CRM',true,now()),
('ind_psv','psv_crm_proposal','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','PSV-CRM',true,now()),
('ind_psv','psv_crm_activity','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','PSV-CRM',true,now()),
('ind_psv','psv_pjm_project','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','PSV-PJM',true,now()),
('ind_psv','psv_pjm_work_item','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','PSV-PJM',true,now()),
('ind_psv','psv_pjm_milestone','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','PSV-PJM',true,now()),
('ind_psv','psv_pjm_change_request','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','PSV-PJM',true,now()),
('ind_psv','psv_sdm_contract_ref','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','PSV-SDM',true,now()),
('ind_psv','psv_sdm_ticket','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','PSV-SDM',true,now()),
('ind_psv','psv_sdm_sla_clock','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','PSV-SDM',true,now()),
('ind_psv','psv_sdm_deliverable','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','PSV-SDM',true,now()),
('ind_psv','psv_rtm_resource','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','PSV-RTM',true,now()),
('ind_psv','psv_rtm_allocation','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','PSV-RTM',true,now()),
('ind_psv','psv_rtm_timesheet','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','PSV-RTM',true,now()),
('ind_psv','psv_rtm_time_entry','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','PSV-RTM',true,now()),
('ind_psv','psv_sgm_booking','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','PSV-SGM',true,now()),
('ind_psv','psv_sgm_shoot','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','PSV-SGM',true,now()),
('ind_psv','psv_sgm_revision','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','PSV-SGM',true,now()),
('ind_psv','psv_sgm_delivery','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','PSV-SGM',true,now());

COMMIT;
