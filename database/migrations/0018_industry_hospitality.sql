-- SBGlobal Plus — Migration 0018: Hospitality Industry database wave
-- Canonical MS: HSP-HMS, HSP-RMS, HSP-BEM, HSP-RBM
BEGIN;

CREATE TYPE ind_hsp.hms_stay_state AS ENUM ('RESERVED','CHECKED_IN','IN_HOUSE','CHECKOUT_PENDING','CHECKED_OUT','CLOSED');
CREATE TYPE ind_hsp.hms_folio_state AS ENUM ('OPEN','SETTLEMENT_PENDING','SETTLED','TRANSFERRED','CLOSED');
CREATE TYPE ind_hsp.hms_housekeeping_state AS ENUM ('DIRTY','CLEANING','INSPECTED','READY','OUT_OF_ORDER');

CREATE TYPE ind_hsp.rms_service_type AS ENUM ('TABLE','TAKEAWAY','DELIVERY');
CREATE TYPE ind_hsp.rms_order_state AS ENUM ('OPEN','KOT_SENT','PREPARING','SERVED','BILLING','SETTLED','VOIDED');
CREATE TYPE ind_hsp.rms_line_state AS ENUM ('NEW','KOT_SENT','PREPARING','SERVED','REVERSED');
CREATE TYPE ind_hsp.rms_kot_state AS ENUM ('QUEUED','PREPARING','READY','SERVED');

CREATE TYPE ind_hsp.bem_enquiry_state AS ENUM ('NEW','QUALIFIED','PROPOSAL','SITE_VISIT','BOOKING_PENDING','LOST');
CREATE TYPE ind_hsp.bem_booking_state AS ENUM ('TENTATIVE','CONFIRMED','EXECUTING','COMPLETED','SETTLED','CANCELLED');
CREATE TYPE ind_hsp.bem_function_sheet_state AS ENUM ('DRAFT','REVIEW','APPROVED','SUPERSEDED');
CREATE TYPE ind_hsp.bem_charge_state AS ENUM ('PLANNED','POSTED','REVERSED');

CREATE TYPE ind_hsp.rbm_reservation_state AS ENUM ('TENTATIVE','CONFIRMED','CANCELLED','NO_SHOW','CHECKED_IN','COMPLETED');
CREATE TYPE ind_hsp.rbm_rate_plan_state AS ENUM ('DRAFT','ACTIVE','RETIRED');

CREATE TABLE ind_hsp.hsp_hms_stay (
  id uuid PRIMARY KEY,
  reservation_ref uuid NOT NULL,
  guest_ref uuid NOT NULL,
  room_ref uuid,
  checkin_at timestamptz,
  checkout_at timestamptz,
  state ind_hsp.hms_stay_state NOT NULL,

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
  CHECK (checkout_at IS NULL OR checkin_at IS NULL OR checkout_at >= checkin_at)
);
CREATE INDEX hsp_hms_stay_room_state_idx ON ind_hsp.hsp_hms_stay(tenant_id,industry_context_id,room_ref,state);
CREATE INDEX hsp_hms_stay_state_idx ON ind_hsp.hsp_hms_stay(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_hsp.hsp_hms_folio (
  id uuid PRIMARY KEY,
  stay_id uuid NOT NULL,
  folio_no text NOT NULL,
  currency char(3) NOT NULL,
  balance_minor bigint NOT NULL,
  state ind_hsp.hms_folio_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,folio_no),
  FOREIGN KEY (tenant_id,industry_context_id,stay_id)
    REFERENCES ind_hsp.hsp_hms_stay(tenant_id,industry_context_id,id)
);
CREATE INDEX hsp_hms_folio_stay_idx ON ind_hsp.hsp_hms_folio(tenant_id,industry_context_id,stay_id);

CREATE TABLE ind_hsp.hsp_hms_housekeeping (
  id uuid PRIMARY KEY,
  room_ref uuid NOT NULL,
  assigned_to uuid,
  state ind_hsp.hms_housekeeping_state NOT NULL,
  priority_code text NOT NULL,
  completed_at timestamptz,

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
  UNIQUE (tenant_id,industry_context_id,id)
);
CREATE INDEX hsp_hms_housekeeping_room_state_idx ON ind_hsp.hsp_hms_housekeeping(tenant_id,industry_context_id,room_ref,state);
CREATE INDEX hsp_hms_housekeeping_open_idx ON ind_hsp.hsp_hms_housekeeping(tenant_id,industry_context_id,state) WHERE state <> 'READY';

CREATE TABLE ind_hsp.hsp_hms_folio_entry (
  id uuid PRIMARY KEY,
  folio_id uuid NOT NULL,
  entry_type text NOT NULL,
  amount_minor bigint NOT NULL,
  source_ref text NOT NULL,
  posted_at timestamptz NOT NULL,
  reversal_of uuid,

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
  FOREIGN KEY (tenant_id,industry_context_id,folio_id)
    REFERENCES ind_hsp.hsp_hms_folio(tenant_id,industry_context_id,id),
  FOREIGN KEY (tenant_id,industry_context_id,reversal_of)
    REFERENCES ind_hsp.hsp_hms_folio_entry(tenant_id,industry_context_id,id)
);
CREATE INDEX hsp_hms_folio_entry_folio_idx ON ind_hsp.hsp_hms_folio_entry(tenant_id,industry_context_id,folio_id,posted_at);

CREATE TABLE ind_hsp.hsp_rms_order (
  id uuid PRIMARY KEY,
  order_no text NOT NULL,
  service_type ind_hsp.rms_service_type NOT NULL,
  table_ref uuid,
  state ind_hsp.rms_order_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,order_no)
);
CREATE INDEX hsp_rms_order_state_idx ON ind_hsp.hsp_rms_order(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_hsp.hsp_rms_line (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL,
  menu_item_ref uuid NOT NULL,
  qty numeric NOT NULL CHECK (qty > 0),
  modifier_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  state ind_hsp.rms_line_state NOT NULL,
  price_minor bigint NOT NULL CHECK (price_minor >= 0),

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
  FOREIGN KEY (tenant_id,industry_context_id,order_id)
    REFERENCES ind_hsp.hsp_rms_order(tenant_id,industry_context_id,id)
);
CREATE INDEX hsp_rms_line_order_idx ON ind_hsp.hsp_rms_line(tenant_id,industry_context_id,order_id);

CREATE TABLE ind_hsp.hsp_rms_kot (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL,
  ticket_no text NOT NULL,
  station_code text NOT NULL,
  state ind_hsp.rms_kot_state NOT NULL,
  fired_at timestamptz NOT NULL,

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
  FOREIGN KEY (tenant_id,industry_context_id,order_id)
    REFERENCES ind_hsp.hsp_rms_order(tenant_id,industry_context_id,id)
);
CREATE INDEX hsp_rms_kot_active_idx ON ind_hsp.hsp_rms_kot(tenant_id,industry_context_id,state) WHERE state <> 'SERVED';

CREATE TABLE ind_hsp.hsp_rms_reversal (
  id uuid PRIMARY KEY,
  order_line_id uuid NOT NULL,
  reason_code text NOT NULL,
  approved_by uuid,
  reversed_at timestamptz NOT NULL,

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
  FOREIGN KEY (tenant_id,industry_context_id,order_line_id)
    REFERENCES ind_hsp.hsp_rms_line(tenant_id,industry_context_id,id)
);
CREATE INDEX hsp_rms_reversal_line_idx ON ind_hsp.hsp_rms_reversal(tenant_id,industry_context_id,order_line_id,reversed_at);

CREATE TABLE ind_hsp.hsp_bem_enquiry (
  id uuid PRIMARY KEY,
  enquiry_no text NOT NULL,
  client_ref uuid,
  event_type text NOT NULL,
  preferred_at timestamptz NOT NULL,
  guest_count integer NOT NULL CHECK (guest_count > 0),
  state ind_hsp.bem_enquiry_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,enquiry_no)
);
CREATE INDEX hsp_bem_enquiry_state_idx ON ind_hsp.hsp_bem_enquiry(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_hsp.hsp_bem_booking (
  id uuid PRIMARY KEY,
  enquiry_id uuid NOT NULL,
  venue_ref uuid NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  package_code text,
  state ind_hsp.bem_booking_state NOT NULL,

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
  FOREIGN KEY (tenant_id,industry_context_id,enquiry_id)
    REFERENCES ind_hsp.hsp_bem_enquiry(tenant_id,industry_context_id,id),
  CHECK (end_at > start_at)
);
CREATE INDEX hsp_bem_booking_enquiry_idx ON ind_hsp.hsp_bem_booking(tenant_id,industry_context_id,enquiry_id);
CREATE INDEX hsp_bem_booking_venue_time_idx ON ind_hsp.hsp_bem_booking(tenant_id,industry_context_id,venue_ref,start_at,end_at,state);

CREATE TABLE ind_hsp.hsp_bem_function_sheet (
  id uuid PRIMARY KEY,
  booking_id uuid NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  schedule_json jsonb NOT NULL,
  service_json jsonb NOT NULL,
  state ind_hsp.bem_function_sheet_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,booking_id,version),
  FOREIGN KEY (tenant_id,industry_context_id,booking_id)
    REFERENCES ind_hsp.hsp_bem_booking(tenant_id,industry_context_id,id)
);
CREATE INDEX hsp_bem_function_sheet_active_idx ON ind_hsp.hsp_bem_function_sheet(tenant_id,industry_context_id,state) WHERE state IN ('DRAFT','REVIEW','APPROVED');

CREATE TABLE ind_hsp.hsp_bem_charge (
  id uuid PRIMARY KEY,
  booking_id uuid NOT NULL,
  charge_type text NOT NULL,
  amount_minor bigint NOT NULL,
  currency char(3) NOT NULL,
  source_ref text NOT NULL,
  state ind_hsp.bem_charge_state NOT NULL,

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
    REFERENCES ind_hsp.hsp_bem_booking(tenant_id,industry_context_id,id)
);
CREATE INDEX hsp_bem_charge_booking_idx ON ind_hsp.hsp_bem_charge(tenant_id,industry_context_id,booking_id,state);

CREATE TABLE ind_hsp.hsp_rbm_rate_plan (
  id uuid PRIMARY KEY,
  code text NOT NULL,
  currency char(3) NOT NULL,
  base_rate_minor bigint NOT NULL CHECK (base_rate_minor >= 0),
  cancellation_policy_ref uuid NOT NULL,
  guarantee_policy_ref uuid NOT NULL,
  state ind_hsp.rbm_rate_plan_state NOT NULL,

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
CREATE INDEX hsp_rbm_rate_plan_active_idx ON ind_hsp.hsp_rbm_rate_plan(tenant_id,industry_context_id,state) WHERE state='ACTIVE';

CREATE TABLE ind_hsp.hsp_rbm_reservation (
  id uuid PRIMARY KEY,
  reservation_no text NOT NULL,
  guest_ref uuid NOT NULL,
  room_type_ref uuid NOT NULL,
  arrival date NOT NULL,
  departure date NOT NULL,
  rate_plan_ref uuid NOT NULL,
  state ind_hsp.rbm_reservation_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,reservation_no),
  FOREIGN KEY (tenant_id,industry_context_id,rate_plan_ref)
    REFERENCES ind_hsp.hsp_rbm_rate_plan(tenant_id,industry_context_id,id),
  CHECK (departure > arrival)
);
CREATE INDEX hsp_rbm_reservation_state_idx ON ind_hsp.hsp_rbm_reservation(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_hsp.hsp_rbm_availability (
  id uuid PRIMARY KEY,
  property_ref uuid NOT NULL,
  room_type_ref uuid NOT NULL,
  business_date date NOT NULL,
  physical integer NOT NULL CHECK (physical >= 0),
  blocked integer NOT NULL DEFAULT 0 CHECK (blocked >= 0),
  allocated integer NOT NULL DEFAULT 0 CHECK (allocated >= 0),
  booked integer NOT NULL DEFAULT 0 CHECK (booked >= 0),
  overbook_tolerance integer NOT NULL DEFAULT 0 CHECK (overbook_tolerance >= 0),

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
  UNIQUE (tenant_id,industry_context_id,property_ref,room_type_ref,business_date)
);
CREATE INDEX hsp_rbm_availability_property_idx ON ind_hsp.hsp_rbm_availability(tenant_id,industry_context_id,property_ref,business_date);

CREATE TABLE ind_hsp.hsp_rbm_channel_alloc (
  id uuid PRIMARY KEY,
  channel_integration_id uuid NOT NULL,
  room_type_ref uuid NOT NULL,
  business_date date NOT NULL,
  allocated_qty integer NOT NULL CHECK (allocated_qty >= 0),
  sold_qty integer NOT NULL CHECK (sold_qty >= 0),
  sync_version bigint NOT NULL CHECK (sync_version > 0),

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
  UNIQUE (tenant_id,industry_context_id,channel_integration_id,room_type_ref,business_date)
);


ALTER TABLE ind_hsp.hsp_hms_stay ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hsp.hsp_hms_stay FORCE ROW LEVEL SECURITY;
CREATE POLICY hsp_hms_stay_industry_policy ON ind_hsp.hsp_hms_stay
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hsp.hsp_hms_folio ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hsp.hsp_hms_folio FORCE ROW LEVEL SECURITY;
CREATE POLICY hsp_hms_folio_industry_policy ON ind_hsp.hsp_hms_folio
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hsp.hsp_hms_housekeeping ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hsp.hsp_hms_housekeeping FORCE ROW LEVEL SECURITY;
CREATE POLICY hsp_hms_housekeeping_industry_policy ON ind_hsp.hsp_hms_housekeeping
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hsp.hsp_hms_folio_entry ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hsp.hsp_hms_folio_entry FORCE ROW LEVEL SECURITY;
CREATE POLICY hsp_hms_folio_entry_industry_policy ON ind_hsp.hsp_hms_folio_entry
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hsp.hsp_rms_order ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hsp.hsp_rms_order FORCE ROW LEVEL SECURITY;
CREATE POLICY hsp_rms_order_industry_policy ON ind_hsp.hsp_rms_order
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hsp.hsp_rms_line ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hsp.hsp_rms_line FORCE ROW LEVEL SECURITY;
CREATE POLICY hsp_rms_line_industry_policy ON ind_hsp.hsp_rms_line
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hsp.hsp_rms_kot ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hsp.hsp_rms_kot FORCE ROW LEVEL SECURITY;
CREATE POLICY hsp_rms_kot_industry_policy ON ind_hsp.hsp_rms_kot
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hsp.hsp_rms_reversal ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hsp.hsp_rms_reversal FORCE ROW LEVEL SECURITY;
CREATE POLICY hsp_rms_reversal_industry_policy ON ind_hsp.hsp_rms_reversal
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hsp.hsp_bem_enquiry ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hsp.hsp_bem_enquiry FORCE ROW LEVEL SECURITY;
CREATE POLICY hsp_bem_enquiry_industry_policy ON ind_hsp.hsp_bem_enquiry
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hsp.hsp_bem_booking ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hsp.hsp_bem_booking FORCE ROW LEVEL SECURITY;
CREATE POLICY hsp_bem_booking_industry_policy ON ind_hsp.hsp_bem_booking
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hsp.hsp_bem_function_sheet ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hsp.hsp_bem_function_sheet FORCE ROW LEVEL SECURITY;
CREATE POLICY hsp_bem_function_sheet_industry_policy ON ind_hsp.hsp_bem_function_sheet
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hsp.hsp_bem_charge ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hsp.hsp_bem_charge FORCE ROW LEVEL SECURITY;
CREATE POLICY hsp_bem_charge_industry_policy ON ind_hsp.hsp_bem_charge
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hsp.hsp_rbm_rate_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hsp.hsp_rbm_rate_plan FORCE ROW LEVEL SECURITY;
CREATE POLICY hsp_rbm_rate_plan_industry_policy ON ind_hsp.hsp_rbm_rate_plan
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hsp.hsp_rbm_reservation ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hsp.hsp_rbm_reservation FORCE ROW LEVEL SECURITY;
CREATE POLICY hsp_rbm_reservation_industry_policy ON ind_hsp.hsp_rbm_reservation
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hsp.hsp_rbm_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hsp.hsp_rbm_availability FORCE ROW LEVEL SECURITY;
CREATE POLICY hsp_rbm_availability_industry_policy ON ind_hsp.hsp_rbm_availability
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_hsp.hsp_rbm_channel_alloc ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_hsp.hsp_rbm_channel_alloc FORCE ROW LEVEL SECURITY;
CREATE POLICY hsp_rbm_channel_alloc_industry_policy ON ind_hsp.hsp_rbm_channel_alloc
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

INSERT INTO core_authz.rls_table_registry
(schema_name,table_name,scope_class,policy_class,owner_module,force_rls_required,registered_at)
VALUES
('ind_hsp','hsp_hms_stay','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HSP-HMS',true,now()),
('ind_hsp','hsp_hms_folio','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HSP-HMS',true,now()),
('ind_hsp','hsp_hms_housekeeping','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HSP-HMS',true,now()),
('ind_hsp','hsp_hms_folio_entry','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HSP-HMS',true,now()),
('ind_hsp','hsp_rms_order','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HSP-RMS',true,now()),
('ind_hsp','hsp_rms_line','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HSP-RMS',true,now()),
('ind_hsp','hsp_rms_kot','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HSP-RMS',true,now()),
('ind_hsp','hsp_rms_reversal','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HSP-RMS',true,now()),
('ind_hsp','hsp_bem_enquiry','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HSP-BEM',true,now()),
('ind_hsp','hsp_bem_booking','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HSP-BEM',true,now()),
('ind_hsp','hsp_bem_function_sheet','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HSP-BEM',true,now()),
('ind_hsp','hsp_bem_charge','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HSP-BEM',true,now()),
('ind_hsp','hsp_rbm_rate_plan','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HSP-RBM',true,now()),
('ind_hsp','hsp_rbm_reservation','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HSP-RBM',true,now()),
('ind_hsp','hsp_rbm_availability','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HSP-RBM',true,now()),
('ind_hsp','hsp_rbm_channel_alloc','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','HSP-RBM',true,now());

COMMIT;
