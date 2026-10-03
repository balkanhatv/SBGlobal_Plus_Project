-- SBGlobal Plus — Migration 0022: NGO / Temple / Trust Industry database wave
-- Canonical MS: NGO-DMS, NGO-DFM, NGO-TAM, NGO-MVM
BEGIN;

CREATE TYPE ind_ngo.dms_confidentiality AS ENUM ('NORMAL','CONFIDENTIAL','ANONYMOUS_PUBLIC');
CREATE TYPE ind_ngo.dms_lifecycle AS ENUM ('PROSPECT','ACTIVE','LAPSED','REACTIVATED');
CREATE TYPE ind_ngo.dms_pledge_state AS ENUM ('RECORDED','REMINDER','PARTIAL','FULFILLED','CANCELLED');
CREATE TYPE ind_ngo.dms_segment_state AS ENUM ('ACTIVE','REMOVED');

CREATE TYPE ind_ngo.dfm_donation_state AS ENUM ('RECEIVED','RECEIPTED','ALLOCATED','REVERSED');
CREATE TYPE ind_ngo.dfm_receipt_state AS ENUM ('ISSUED','REVERSED');
CREATE TYPE ind_ngo.dfm_fund_state AS ENUM ('ACTIVE','CLOSED');
CREATE TYPE ind_ngo.dfm_utilization_state AS ENUM ('REQUESTED','APPROVED','POSTED','REVERSED');

CREATE TYPE ind_ngo.tam_offering_state AS ENUM ('ACTIVE','PAUSED','RETIRED');
CREATE TYPE ind_ngo.tam_booking_state AS ENUM ('HELD','CONFIRMED','PERFORMED','CANCELLED','NO_SHOW');
CREATE TYPE ind_ngo.tam_event_state AS ENUM ('PLANNED','APPROVED','EXECUTING','COMPLETED','SETTLED');
CREATE TYPE ind_ngo.tam_dispatch_state AS ENUM ('PENDING','PACKED','DISPATCHED','DELIVERED','FAILED');

CREATE TYPE ind_ngo.mvm_membership_state AS ENUM ('APPLIED','APPROVED','ACTIVE','LAPSED','RENEWED','CANCELLED');
CREATE TYPE ind_ngo.mvm_volunteer_state AS ENUM ('APPLIED','ACTIVE','SUSPENDED','INACTIVE');
CREATE TYPE ind_ngo.mvm_assignment_state AS ENUM ('PLANNED','ACCEPTED','ACTIVE','COMPLETED','CANCELLED');
CREATE TYPE ind_ngo.mvm_hours_state AS ENUM ('DRAFT','SUBMITTED','VERIFIED','REJECTED');

CREATE TABLE ind_ngo.ngo_dms_donor (
  id uuid PRIMARY KEY,
  donor_no text NOT NULL,
  principal_ref uuid,
  display_name text NOT NULL,
  confidentiality ind_ngo.dms_confidentiality NOT NULL,
  lifecycle ind_ngo.dms_lifecycle NOT NULL,
  consent_json jsonb NOT NULL DEFAULT '{}'::jsonb,

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
  UNIQUE (tenant_id,industry_context_id,donor_no)
);
CREATE INDEX ngo_dms_donor_principal_idx ON ind_ngo.ngo_dms_donor(tenant_id,industry_context_id,principal_ref);
CREATE INDEX ngo_dms_donor_lifecycle_idx ON ind_ngo.ngo_dms_donor(tenant_id,industry_context_id,lifecycle,updated_at);

CREATE TABLE ind_ngo.ngo_dms_pledge (
  id uuid PRIMARY KEY,
  donor_id uuid NOT NULL,
  campaign_ref uuid,
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  currency char(3) NOT NULL,
  due_date date,
  fulfilled_minor bigint NOT NULL DEFAULT 0 CHECK (fulfilled_minor >= 0),
  state ind_ngo.dms_pledge_state NOT NULL,

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
  FOREIGN KEY (tenant_id,industry_context_id,donor_id)
    REFERENCES ind_ngo.ngo_dms_donor(tenant_id,industry_context_id,id),
  CHECK (fulfilled_minor <= amount_minor)
);
CREATE INDEX ngo_dms_pledge_donor_state_idx ON ind_ngo.ngo_dms_pledge(tenant_id,industry_context_id,donor_id,state);
CREATE INDEX ngo_dms_pledge_state_idx ON ind_ngo.ngo_dms_pledge(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_ngo.ngo_dms_segment (
  id uuid PRIMARY KEY,
  donor_id uuid NOT NULL,
  segment_code text NOT NULL,
  calculated_at timestamptz NOT NULL,
  reason_code text NOT NULL,
  state ind_ngo.dms_segment_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,donor_id,segment_code,state),
  FOREIGN KEY (tenant_id,industry_context_id,donor_id)
    REFERENCES ind_ngo.ngo_dms_donor(tenant_id,industry_context_id,id)
);
CREATE INDEX ngo_dms_segment_state_idx ON ind_ngo.ngo_dms_segment(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_ngo.ngo_dms_engagement (
  id uuid PRIMARY KEY,
  donor_id uuid NOT NULL,
  channel text NOT NULL,
  campaign_ref uuid,
  consent_basis text NOT NULL,
  occurred_at timestamptz NOT NULL,
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
  FOREIGN KEY (tenant_id,industry_context_id,donor_id)
    REFERENCES ind_ngo.ngo_dms_donor(tenant_id,industry_context_id,id)
);
CREATE INDEX ngo_dms_engagement_donor_time_idx ON ind_ngo.ngo_dms_engagement(tenant_id,industry_context_id,donor_id,occurred_at DESC);

CREATE TABLE ind_ngo.ngo_dfm_fund (
  id uuid PRIMARY KEY,
  fund_code text NOT NULL,
  purpose_code text NOT NULL,
  restriction_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  balance_minor bigint NOT NULL CHECK (balance_minor >= 0),
  state ind_ngo.dfm_fund_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,fund_code)
);
CREATE INDEX ngo_dfm_fund_state_idx ON ind_ngo.ngo_dfm_fund(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_ngo.ngo_dfm_donation (
  id uuid PRIMARY KEY,
  donation_no text NOT NULL,
  donor_ref uuid,
  fund_ref uuid NOT NULL,
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  currency char(3) NOT NULL,
  method text NOT NULL,
  state ind_ngo.dfm_donation_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,donation_no),
  FOREIGN KEY (tenant_id,industry_context_id,fund_ref)
    REFERENCES ind_ngo.ngo_dfm_fund(tenant_id,industry_context_id,id)
);
CREATE INDEX ngo_dfm_donation_state_idx ON ind_ngo.ngo_dfm_donation(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_ngo.ngo_dfm_receipt (
  id uuid PRIMARY KEY,
  receipt_no text NOT NULL,
  donation_id uuid NOT NULL,
  issued_at timestamptz NOT NULL,
  reversal_of uuid,
  state ind_ngo.dfm_receipt_state NOT NULL,

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
  FOREIGN KEY (tenant_id,industry_context_id,donation_id)
    REFERENCES ind_ngo.ngo_dfm_donation(tenant_id,industry_context_id,id),
  FOREIGN KEY (tenant_id,industry_context_id,reversal_of)
    REFERENCES ind_ngo.ngo_dfm_receipt(tenant_id,industry_context_id,id)
);
CREATE INDEX ngo_dfm_receipt_state_idx ON ind_ngo.ngo_dfm_receipt(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_ngo.ngo_dfm_utilization (
  id uuid PRIMARY KEY,
  fund_id uuid NOT NULL,
  expense_ref uuid NOT NULL,
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  purpose_code text NOT NULL,
  approval_ref uuid,
  state ind_ngo.dfm_utilization_state NOT NULL,

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
  FOREIGN KEY (tenant_id,industry_context_id,fund_id)
    REFERENCES ind_ngo.ngo_dfm_fund(tenant_id,industry_context_id,id)
);
CREATE INDEX ngo_dfm_utilization_fund_state_idx ON ind_ngo.ngo_dfm_utilization(tenant_id,industry_context_id,fund_id,state);

CREATE TABLE ind_ngo.ngo_tam_offering (
  id uuid PRIMARY KEY,
  code text NOT NULL,
  name text NOT NULL,
  slot_policy_ref uuid NOT NULL,
  capacity integer CHECK (capacity IS NULL OR capacity > 0),
  price_minor bigint CHECK (price_minor IS NULL OR price_minor >= 0),
  state ind_ngo.tam_offering_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,code)
);
CREATE INDEX ngo_tam_offering_state_idx ON ind_ngo.ngo_tam_offering(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_ngo.ngo_tam_booking (
  id uuid PRIMARY KEY,
  booking_no text NOT NULL,
  offering_id uuid NOT NULL,
  devotee_ref uuid,
  slot_at timestamptz NOT NULL,
  qty integer NOT NULL CHECK (qty > 0),
  state ind_ngo.tam_booking_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,booking_no),
  FOREIGN KEY (tenant_id,industry_context_id,offering_id)
    REFERENCES ind_ngo.ngo_tam_offering(tenant_id,industry_context_id,id)
);
CREATE INDEX ngo_tam_booking_state_idx ON ind_ngo.ngo_tam_booking(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_ngo.ngo_tam_event (
  id uuid PRIMARY KEY,
  event_code text NOT NULL,
  name text NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  budget_minor bigint CHECK (budget_minor IS NULL OR budget_minor >= 0),
  state ind_ngo.tam_event_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,event_code),
  CHECK (end_at > start_at)
);
CREATE INDEX ngo_tam_event_state_idx ON ind_ngo.ngo_tam_event(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_ngo.ngo_tam_dispatch (
  id uuid PRIMARY KEY,
  booking_id uuid,
  event_id uuid,
  recipient_ref uuid,
  dispatch_type text NOT NULL,
  tracking_ref text,
  state ind_ngo.tam_dispatch_state NOT NULL,

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
  FOREIGN KEY (tenant_id,industry_context_id,booking_id)
    REFERENCES ind_ngo.ngo_tam_booking(tenant_id,industry_context_id,id),
  FOREIGN KEY (tenant_id,industry_context_id,event_id)
    REFERENCES ind_ngo.ngo_tam_event(tenant_id,industry_context_id,id),
  CHECK (booking_id IS NOT NULL OR event_id IS NOT NULL)
);
CREATE INDEX ngo_tam_dispatch_state_idx ON ind_ngo.ngo_tam_dispatch(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_ngo.ngo_mvm_membership (
  id uuid PRIMARY KEY,
  membership_no text NOT NULL,
  principal_ref uuid NOT NULL,
  type_code text NOT NULL,
  valid_from date NOT NULL,
  valid_to date,
  state ind_ngo.mvm_membership_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,membership_no),
  CHECK (valid_to IS NULL OR valid_to >= valid_from)
);
CREATE INDEX ngo_mvm_membership_state_idx ON ind_ngo.ngo_mvm_membership(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_ngo.ngo_mvm_volunteer (
  id uuid PRIMARY KEY,
  principal_ref uuid NOT NULL,
  skills_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  availability_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  consent_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  state ind_ngo.mvm_volunteer_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,principal_ref)
);
CREATE INDEX ngo_mvm_volunteer_state_idx ON ind_ngo.ngo_mvm_volunteer(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_ngo.ngo_mvm_assignment (
  id uuid PRIMARY KEY,
  volunteer_id uuid NOT NULL,
  event_or_activity_ref uuid NOT NULL,
  role_code text NOT NULL,
  scheduled_start timestamptz NOT NULL,
  scheduled_end timestamptz NOT NULL,
  state ind_ngo.mvm_assignment_state NOT NULL,

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
  FOREIGN KEY (tenant_id,industry_context_id,volunteer_id)
    REFERENCES ind_ngo.ngo_mvm_volunteer(tenant_id,industry_context_id,id),
  CHECK (scheduled_end > scheduled_start)
);
CREATE INDEX ngo_mvm_assignment_volunteer_state_idx ON ind_ngo.ngo_mvm_assignment(tenant_id,industry_context_id,volunteer_id,state);

CREATE TABLE ind_ngo.ngo_mvm_hours (
  id uuid PRIMARY KEY,
  assignment_id uuid NOT NULL,
  work_date date NOT NULL,
  hours numeric NOT NULL CHECK (hours > 0),
  submitted_by uuid NOT NULL,
  verified_by uuid,
  state ind_ngo.mvm_hours_state NOT NULL,

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
  FOREIGN KEY (tenant_id,industry_context_id,assignment_id)
    REFERENCES ind_ngo.ngo_mvm_assignment(tenant_id,industry_context_id,id)
);
CREATE INDEX ngo_mvm_hours_state_idx ON ind_ngo.ngo_mvm_hours(tenant_id,industry_context_id,state,updated_at);


ALTER TABLE ind_ngo.ngo_dms_donor ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_ngo.ngo_dms_donor FORCE ROW LEVEL SECURITY;
CREATE POLICY ngo_dms_donor_industry_policy ON ind_ngo.ngo_dms_donor
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_ngo.ngo_dms_pledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_ngo.ngo_dms_pledge FORCE ROW LEVEL SECURITY;
CREATE POLICY ngo_dms_pledge_industry_policy ON ind_ngo.ngo_dms_pledge
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_ngo.ngo_dms_segment ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_ngo.ngo_dms_segment FORCE ROW LEVEL SECURITY;
CREATE POLICY ngo_dms_segment_industry_policy ON ind_ngo.ngo_dms_segment
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_ngo.ngo_dms_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_ngo.ngo_dms_engagement FORCE ROW LEVEL SECURITY;
CREATE POLICY ngo_dms_engagement_industry_policy ON ind_ngo.ngo_dms_engagement
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_ngo.ngo_dfm_fund ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_ngo.ngo_dfm_fund FORCE ROW LEVEL SECURITY;
CREATE POLICY ngo_dfm_fund_industry_policy ON ind_ngo.ngo_dfm_fund
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_ngo.ngo_dfm_donation ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_ngo.ngo_dfm_donation FORCE ROW LEVEL SECURITY;
CREATE POLICY ngo_dfm_donation_industry_policy ON ind_ngo.ngo_dfm_donation
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_ngo.ngo_dfm_receipt ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_ngo.ngo_dfm_receipt FORCE ROW LEVEL SECURITY;
CREATE POLICY ngo_dfm_receipt_industry_policy ON ind_ngo.ngo_dfm_receipt
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_ngo.ngo_dfm_utilization ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_ngo.ngo_dfm_utilization FORCE ROW LEVEL SECURITY;
CREATE POLICY ngo_dfm_utilization_industry_policy ON ind_ngo.ngo_dfm_utilization
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_ngo.ngo_tam_offering ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_ngo.ngo_tam_offering FORCE ROW LEVEL SECURITY;
CREATE POLICY ngo_tam_offering_industry_policy ON ind_ngo.ngo_tam_offering
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_ngo.ngo_tam_booking ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_ngo.ngo_tam_booking FORCE ROW LEVEL SECURITY;
CREATE POLICY ngo_tam_booking_industry_policy ON ind_ngo.ngo_tam_booking
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_ngo.ngo_tam_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_ngo.ngo_tam_event FORCE ROW LEVEL SECURITY;
CREATE POLICY ngo_tam_event_industry_policy ON ind_ngo.ngo_tam_event
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_ngo.ngo_tam_dispatch ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_ngo.ngo_tam_dispatch FORCE ROW LEVEL SECURITY;
CREATE POLICY ngo_tam_dispatch_industry_policy ON ind_ngo.ngo_tam_dispatch
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_ngo.ngo_mvm_membership ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_ngo.ngo_mvm_membership FORCE ROW LEVEL SECURITY;
CREATE POLICY ngo_mvm_membership_industry_policy ON ind_ngo.ngo_mvm_membership
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_ngo.ngo_mvm_volunteer ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_ngo.ngo_mvm_volunteer FORCE ROW LEVEL SECURITY;
CREATE POLICY ngo_mvm_volunteer_industry_policy ON ind_ngo.ngo_mvm_volunteer
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_ngo.ngo_mvm_assignment ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_ngo.ngo_mvm_assignment FORCE ROW LEVEL SECURITY;
CREATE POLICY ngo_mvm_assignment_industry_policy ON ind_ngo.ngo_mvm_assignment
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_ngo.ngo_mvm_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_ngo.ngo_mvm_hours FORCE ROW LEVEL SECURITY;
CREATE POLICY ngo_mvm_hours_industry_policy ON ind_ngo.ngo_mvm_hours
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

INSERT INTO core_authz.rls_table_registry
(schema_name,table_name,scope_class,policy_class,owner_module,force_rls_required,registered_at)
VALUES
('ind_ngo','ngo_dms_donor','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','NGO-DMS',true,now()),
('ind_ngo','ngo_dms_pledge','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','NGO-DMS',true,now()),
('ind_ngo','ngo_dms_segment','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','NGO-DMS',true,now()),
('ind_ngo','ngo_dms_engagement','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','NGO-DMS',true,now()),
('ind_ngo','ngo_dfm_fund','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','NGO-DFM',true,now()),
('ind_ngo','ngo_dfm_donation','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','NGO-DFM',true,now()),
('ind_ngo','ngo_dfm_receipt','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','NGO-DFM',true,now()),
('ind_ngo','ngo_dfm_utilization','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','NGO-DFM',true,now()),
('ind_ngo','ngo_tam_offering','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','NGO-TAM',true,now()),
('ind_ngo','ngo_tam_booking','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','NGO-TAM',true,now()),
('ind_ngo','ngo_tam_event','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','NGO-TAM',true,now()),
('ind_ngo','ngo_tam_dispatch','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','NGO-TAM',true,now()),
('ind_ngo','ngo_mvm_membership','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','NGO-MVM',true,now()),
('ind_ngo','ngo_mvm_volunteer','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','NGO-MVM',true,now()),
('ind_ngo','ngo_mvm_assignment','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','NGO-MVM',true,now()),
('ind_ngo','ngo_mvm_hours','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','NGO-MVM',true,now());

COMMIT;
