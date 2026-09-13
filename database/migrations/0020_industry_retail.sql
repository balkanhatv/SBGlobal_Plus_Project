-- SBGlobal Plus — Migration 0020: Retail & Commerce Industry database wave
-- Canonical MS: RTL-RSM, RTL-POS, RTL-IWM, RTL-OMS, RTL-MKT
BEGIN;

CREATE TYPE ind_rtl.rsm_store_day_state AS ENUM ('PLANNED','OPENING','TRADING','CLOSING','RECONCILIATION','CLOSED');
CREATE TYPE ind_rtl.rsm_cash_movement_type AS ENUM ('FLOAT','PICKUP','BANKING','VARIANCE');
CREATE TYPE ind_rtl.rsm_shift_state AS ENUM ('PLANNED','OPEN','CLOSED','RECONCILED');
CREATE TYPE ind_rtl.rsm_checklist_state AS ENUM ('PENDING','DONE','EXCEPTION');

CREATE TYPE ind_rtl.pos_session_state AS ENUM ('OPEN','LOCKED','CLOSING','CLOSED','RECONCILED');
CREATE TYPE ind_rtl.pos_sale_state AS ENUM ('DRAFT','TENDERING','PAID','VOIDED','REFUNDED_PARTIAL','REFUNDED_FULL');
CREATE TYPE ind_rtl.pos_tender_state AS ENUM ('PENDING','AUTHORIZED','CAPTURED','FAILED','REVERSED');

CREATE TYPE ind_rtl.iwm_movement_type AS ENUM ('RECEIPT','PUTAWAY','RESERVE','RELEASE','PICK','SHIP','TRANSFER','ADJUST');
CREATE TYPE ind_rtl.iwm_reservation_state AS ENUM ('HELD','COMMITTED','RELEASED','EXPIRED');
CREATE TYPE ind_rtl.iwm_cycle_count_state AS ENUM ('PLANNED','COUNTING','REVIEW','APPROVED','POSTED');

CREATE TYPE ind_rtl.oms_order_state AS ENUM ('PLACED','PAYMENT_PENDING','PAID','ALLOCATED','PICKED','PACKED','SHIPPED','DELIVERED','CLOSED','CANCELLED');
CREATE TYPE ind_rtl.oms_shipment_state AS ENUM ('PLANNED','DISPATCHED','IN_TRANSIT','DELIVERED','FAILED','RETURNED');
CREATE TYPE ind_rtl.oms_return_state AS ENUM ('REQUESTED','APPROVED','RECEIVED','INSPECTED','REFUND_APPROVED','REFUNDED','REJECTED');

CREATE TYPE ind_rtl.mkt_kyc_status AS ENUM ('PENDING','VERIFIED','REJECTED');
CREATE TYPE ind_rtl.mkt_seller_state AS ENUM ('APPLIED','REVIEW','APPROVED','SUSPENDED','REVOKED');
CREATE TYPE ind_rtl.mkt_listing_state AS ENUM ('DRAFT','REVIEW','ACTIVE','PAUSED','REJECTED');
CREATE TYPE ind_rtl.mkt_seller_order_state AS ENUM ('ROUTED','ACCEPTED','FULFILLED','RETURNED','SETTLED');
CREATE TYPE ind_rtl.mkt_settlement_state AS ENUM ('DRAFT','APPROVED','PAID','REVERSED');

CREATE TABLE ind_rtl.rtl_rsm_store_day (
  id uuid PRIMARY KEY,
  store_ref uuid NOT NULL,
  business_date date NOT NULL,
  state ind_rtl.rsm_store_day_state NOT NULL,
  opened_by uuid,
  closed_by uuid,

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
  UNIQUE (tenant_id,industry_context_id,store_ref,business_date)
);
CREATE INDEX rtl_rsm_store_day_state_idx ON ind_rtl.rtl_rsm_store_day(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_rtl.rtl_rsm_cash_movement (
  id uuid PRIMARY KEY,
  store_day_id uuid NOT NULL,
  movement_type ind_rtl.rsm_cash_movement_type NOT NULL,
  amount_minor bigint NOT NULL CHECK (amount_minor >= 0),
  currency char(3) NOT NULL,
  reason_code text,
  actor_id uuid NOT NULL,

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
  FOREIGN KEY (tenant_id,industry_context_id,store_day_id)
    REFERENCES ind_rtl.rtl_rsm_store_day(tenant_id,industry_context_id,id)
);
CREATE INDEX rtl_rsm_cash_movement_day_idx ON ind_rtl.rtl_rsm_cash_movement(tenant_id,industry_context_id,store_day_id,created_at);

CREATE TABLE ind_rtl.rtl_rsm_counter_shift (
  id uuid PRIMARY KEY,
  store_day_id uuid NOT NULL,
  counter_code text NOT NULL,
  principal_id uuid NOT NULL,
  started_at timestamptz NOT NULL,
  ended_at timestamptz,
  state ind_rtl.rsm_shift_state NOT NULL,

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
  FOREIGN KEY (tenant_id,industry_context_id,store_day_id)
    REFERENCES ind_rtl.rtl_rsm_store_day(tenant_id,industry_context_id,id),
  CHECK (ended_at IS NULL OR ended_at >= started_at)
);
CREATE INDEX rtl_rsm_counter_shift_day_state_idx ON ind_rtl.rtl_rsm_counter_shift(tenant_id,industry_context_id,store_day_id,state);
CREATE UNIQUE INDEX rtl_rsm_counter_shift_one_open_idx
  ON ind_rtl.rtl_rsm_counter_shift(tenant_id,industry_context_id,counter_code,principal_id)
  WHERE state='OPEN' AND deleted_at IS NULL;

CREATE TABLE ind_rtl.rtl_rsm_checklist (
  id uuid PRIMARY KEY,
  store_day_id uuid NOT NULL,
  checklist_code text NOT NULL,
  item_code text NOT NULL,
  state ind_rtl.rsm_checklist_state NOT NULL,
  completed_by uuid,
  note text,

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
  UNIQUE (tenant_id,industry_context_id,store_day_id,checklist_code,item_code),
  FOREIGN KEY (tenant_id,industry_context_id,store_day_id)
    REFERENCES ind_rtl.rtl_rsm_store_day(tenant_id,industry_context_id,id)
);

CREATE TABLE ind_rtl.rtl_pos_session (
  id uuid PRIMARY KEY,
  store_day_ref uuid NOT NULL,
  counter_code text NOT NULL,
  cashier_id uuid NOT NULL,
  opening_float_minor bigint NOT NULL CHECK (opening_float_minor >= 0),
  state ind_rtl.pos_session_state NOT NULL,

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
CREATE INDEX rtl_pos_session_state_idx ON ind_rtl.rtl_pos_session(tenant_id,industry_context_id,state,updated_at);
CREATE UNIQUE INDEX rtl_pos_session_one_open_counter_cashier_idx
  ON ind_rtl.rtl_pos_session(tenant_id,industry_context_id,counter_code,cashier_id)
  WHERE state='OPEN' AND deleted_at IS NULL;

CREATE TABLE ind_rtl.rtl_pos_sale (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL,
  sale_no text NOT NULL,
  customer_ref uuid,
  total_minor bigint NOT NULL CHECK (total_minor >= 0),
  tax_minor bigint NOT NULL CHECK (tax_minor >= 0),
  currency char(3) NOT NULL,
  state ind_rtl.pos_sale_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,sale_no),
  FOREIGN KEY (tenant_id,industry_context_id,session_id)
    REFERENCES ind_rtl.rtl_pos_session(tenant_id,industry_context_id,id)
);
CREATE INDEX rtl_pos_sale_session_idx ON ind_rtl.rtl_pos_sale(tenant_id,industry_context_id,session_id);

CREATE TABLE ind_rtl.rtl_pos_sale_line (
  id uuid PRIMARY KEY,
  sale_id uuid NOT NULL,
  product_ref uuid NOT NULL,
  variant_ref uuid,
  qty numeric NOT NULL CHECK (qty > 0),
  unit_price_minor bigint NOT NULL CHECK (unit_price_minor >= 0),
  tax_minor bigint NOT NULL CHECK (tax_minor >= 0),
  discount_minor bigint NOT NULL DEFAULT 0 CHECK (discount_minor >= 0),
  price_list_version text NOT NULL,

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
  FOREIGN KEY (tenant_id,industry_context_id,sale_id)
    REFERENCES ind_rtl.rtl_pos_sale(tenant_id,industry_context_id,id)
);
CREATE INDEX rtl_pos_sale_line_active_idx ON ind_rtl.rtl_pos_sale_line(tenant_id,industry_context_id,updated_at) WHERE deleted_at IS NULL;

CREATE TABLE ind_rtl.rtl_pos_tender (
  id uuid PRIMARY KEY,
  sale_id uuid NOT NULL,
  tender_type text NOT NULL,
  amount_minor bigint NOT NULL CHECK (amount_minor >= 0),
  external_payment_ref text,
  state ind_rtl.pos_tender_state NOT NULL,

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
  FOREIGN KEY (tenant_id,industry_context_id,sale_id)
    REFERENCES ind_rtl.rtl_pos_sale(tenant_id,industry_context_id,id)
);
CREATE INDEX rtl_pos_tender_sale_state_idx ON ind_rtl.rtl_pos_tender(tenant_id,industry_context_id,sale_id,state);

CREATE TABLE ind_rtl.rtl_iwm_stock_balance (
  id uuid PRIMARY KEY,
  location_ref uuid NOT NULL,
  product_ref uuid NOT NULL,
  variant_ref uuid,
  on_hand numeric NOT NULL CHECK (on_hand >= 0),
  reserved numeric NOT NULL CHECK (reserved >= 0),
  available numeric NOT NULL CHECK (available >= 0),
  version bigint NOT NULL CHECK (version > 0),

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
  CHECK (reserved <= on_hand),
  CHECK (available <= on_hand)
);
CREATE UNIQUE INDEX rtl_iwm_stock_balance_scope_product_variant_uq
  ON ind_rtl.rtl_iwm_stock_balance(
    tenant_id,industry_context_id,location_ref,product_ref,
    COALESCE(variant_ref,'00000000-0000-0000-0000-000000000000'::uuid)
  );
CREATE INDEX rtl_iwm_stock_balance_location_idx ON ind_rtl.rtl_iwm_stock_balance(tenant_id,industry_context_id,location_ref,product_ref);

CREATE TABLE ind_rtl.rtl_iwm_stock_movement (
  id uuid PRIMARY KEY,
  movement_no text NOT NULL,
  type ind_rtl.iwm_movement_type NOT NULL,
  product_ref uuid NOT NULL,
  qty numeric NOT NULL CHECK (qty > 0),
  from_location uuid,
  to_location uuid,
  source_ref text NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,movement_no)
);
CREATE INDEX rtl_iwm_stock_movement_product_idx ON ind_rtl.rtl_iwm_stock_movement(tenant_id,industry_context_id,product_ref,created_at DESC);

CREATE TABLE ind_rtl.rtl_iwm_reservation (
  id uuid PRIMARY KEY,
  order_ref uuid NOT NULL,
  product_ref uuid NOT NULL,
  qty numeric NOT NULL CHECK (qty > 0),
  state ind_rtl.iwm_reservation_state NOT NULL,
  expires_at timestamptz,

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
CREATE INDEX rtl_iwm_reservation_order_state_idx ON ind_rtl.rtl_iwm_reservation(tenant_id,industry_context_id,order_ref,state);
CREATE INDEX rtl_iwm_reservation_active_idx ON ind_rtl.rtl_iwm_reservation(tenant_id,industry_context_id,state) WHERE state IN ('HELD','COMMITTED');

CREATE TABLE ind_rtl.rtl_iwm_cycle_count (
  id uuid PRIMARY KEY,
  location_ref uuid NOT NULL,
  count_no text NOT NULL,
  state ind_rtl.iwm_cycle_count_state NOT NULL,
  variance_json jsonb NOT NULL DEFAULT '{}'::jsonb,

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
  UNIQUE (tenant_id,industry_context_id,count_no)
);

CREATE TABLE ind_rtl.rtl_oms_order (
  id uuid PRIMARY KEY,
  order_no text NOT NULL,
  customer_ref uuid,
  channel text NOT NULL,
  currency char(3) NOT NULL,
  total_minor bigint NOT NULL CHECK (total_minor >= 0),
  state ind_rtl.oms_order_state NOT NULL,

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
CREATE INDEX rtl_oms_order_state_idx ON ind_rtl.rtl_oms_order(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_rtl.rtl_oms_order_line (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL,
  product_ref uuid NOT NULL,
  qty numeric NOT NULL CHECK (qty > 0),
  price_minor bigint NOT NULL CHECK (price_minor >= 0),
  tax_minor bigint NOT NULL CHECK (tax_minor >= 0),
  discount_minor bigint NOT NULL DEFAULT 0 CHECK (discount_minor >= 0),
  price_version text NOT NULL,
  fulfillment_state text NOT NULL,

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
    REFERENCES ind_rtl.rtl_oms_order(tenant_id,industry_context_id,id)
);
CREATE INDEX rtl_oms_order_line_order_idx ON ind_rtl.rtl_oms_order_line(tenant_id,industry_context_id,order_id);

CREATE TABLE ind_rtl.rtl_oms_shipment (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL,
  shipment_no text NOT NULL,
  courier_integration_id uuid,
  tracking_ref text,
  state ind_rtl.oms_shipment_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,shipment_no),
  FOREIGN KEY (tenant_id,industry_context_id,order_id)
    REFERENCES ind_rtl.rtl_oms_order(tenant_id,industry_context_id,id)
);
CREATE INDEX rtl_oms_shipment_active_idx ON ind_rtl.rtl_oms_shipment(tenant_id,industry_context_id,state) WHERE state IN ('PLANNED','DISPATCHED','IN_TRANSIT','FAILED');

CREATE TABLE ind_rtl.rtl_oms_return_case (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL,
  line_ref uuid,
  reason_code text NOT NULL,
  requested_at timestamptz NOT NULL,
  state ind_rtl.oms_return_state NOT NULL,

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
    REFERENCES ind_rtl.rtl_oms_order(tenant_id,industry_context_id,id)
);
CREATE INDEX rtl_oms_return_order_state_idx ON ind_rtl.rtl_oms_return_case(tenant_id,industry_context_id,order_id,state);

CREATE TABLE ind_rtl.rtl_mkt_seller (
  id uuid PRIMARY KEY,
  seller_code text NOT NULL,
  principal_or_org_ref uuid,
  kyc_status ind_rtl.mkt_kyc_status NOT NULL,
  state ind_rtl.mkt_seller_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,seller_code)
);
CREATE INDEX rtl_mkt_seller_state_idx ON ind_rtl.rtl_mkt_seller(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_rtl.rtl_mkt_listing (
  id uuid PRIMARY KEY,
  seller_id uuid NOT NULL,
  product_ref uuid NOT NULL,
  seller_sku text NOT NULL,
  price_minor bigint NOT NULL CHECK (price_minor >= 0),
  currency char(3) NOT NULL,
  state ind_rtl.mkt_listing_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,seller_id,seller_sku),
  FOREIGN KEY (tenant_id,industry_context_id,seller_id)
    REFERENCES ind_rtl.rtl_mkt_seller(tenant_id,industry_context_id,id)
);
CREATE INDEX rtl_mkt_listing_seller_idx ON ind_rtl.rtl_mkt_listing(tenant_id,industry_context_id,seller_id,state);

CREATE TABLE ind_rtl.rtl_mkt_seller_order (
  id uuid PRIMARY KEY,
  seller_id uuid NOT NULL,
  oms_order_ref uuid NOT NULL,
  gross_minor bigint NOT NULL CHECK (gross_minor >= 0),
  commission_minor bigint NOT NULL CHECK (commission_minor >= 0),
  net_minor bigint NOT NULL,
  state ind_rtl.mkt_seller_order_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,seller_id,oms_order_ref),
  FOREIGN KEY (tenant_id,industry_context_id,seller_id)
    REFERENCES ind_rtl.rtl_mkt_seller(tenant_id,industry_context_id,id)
);
CREATE INDEX rtl_mkt_seller_order_state_idx ON ind_rtl.rtl_mkt_seller_order(tenant_id,industry_context_id,state);

CREATE TABLE ind_rtl.rtl_mkt_settlement (
  id uuid PRIMARY KEY,
  seller_id uuid NOT NULL,
  period_key text NOT NULL,
  gross_minor bigint NOT NULL CHECK (gross_minor >= 0),
  commission_minor bigint NOT NULL CHECK (commission_minor >= 0),
  adjustments_minor bigint NOT NULL DEFAULT 0,
  payable_minor bigint NOT NULL,
  state ind_rtl.mkt_settlement_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,seller_id,period_key),
  FOREIGN KEY (tenant_id,industry_context_id,seller_id)
    REFERENCES ind_rtl.rtl_mkt_seller(tenant_id,industry_context_id,id)
);


ALTER TABLE ind_rtl.rtl_rsm_store_day ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_rtl.rtl_rsm_store_day FORCE ROW LEVEL SECURITY;
CREATE POLICY rtl_rsm_store_day_industry_policy ON ind_rtl.rtl_rsm_store_day
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_rtl.rtl_rsm_cash_movement ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_rtl.rtl_rsm_cash_movement FORCE ROW LEVEL SECURITY;
CREATE POLICY rtl_rsm_cash_movement_industry_policy ON ind_rtl.rtl_rsm_cash_movement
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_rtl.rtl_rsm_counter_shift ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_rtl.rtl_rsm_counter_shift FORCE ROW LEVEL SECURITY;
CREATE POLICY rtl_rsm_counter_shift_industry_policy ON ind_rtl.rtl_rsm_counter_shift
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_rtl.rtl_rsm_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_rtl.rtl_rsm_checklist FORCE ROW LEVEL SECURITY;
CREATE POLICY rtl_rsm_checklist_industry_policy ON ind_rtl.rtl_rsm_checklist
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_rtl.rtl_pos_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_rtl.rtl_pos_session FORCE ROW LEVEL SECURITY;
CREATE POLICY rtl_pos_session_industry_policy ON ind_rtl.rtl_pos_session
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_rtl.rtl_pos_sale ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_rtl.rtl_pos_sale FORCE ROW LEVEL SECURITY;
CREATE POLICY rtl_pos_sale_industry_policy ON ind_rtl.rtl_pos_sale
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_rtl.rtl_pos_sale_line ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_rtl.rtl_pos_sale_line FORCE ROW LEVEL SECURITY;
CREATE POLICY rtl_pos_sale_line_industry_policy ON ind_rtl.rtl_pos_sale_line
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_rtl.rtl_pos_tender ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_rtl.rtl_pos_tender FORCE ROW LEVEL SECURITY;
CREATE POLICY rtl_pos_tender_industry_policy ON ind_rtl.rtl_pos_tender
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_rtl.rtl_iwm_stock_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_rtl.rtl_iwm_stock_balance FORCE ROW LEVEL SECURITY;
CREATE POLICY rtl_iwm_stock_balance_industry_policy ON ind_rtl.rtl_iwm_stock_balance
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_rtl.rtl_iwm_stock_movement ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_rtl.rtl_iwm_stock_movement FORCE ROW LEVEL SECURITY;
CREATE POLICY rtl_iwm_stock_movement_industry_policy ON ind_rtl.rtl_iwm_stock_movement
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_rtl.rtl_iwm_reservation ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_rtl.rtl_iwm_reservation FORCE ROW LEVEL SECURITY;
CREATE POLICY rtl_iwm_reservation_industry_policy ON ind_rtl.rtl_iwm_reservation
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_rtl.rtl_iwm_cycle_count ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_rtl.rtl_iwm_cycle_count FORCE ROW LEVEL SECURITY;
CREATE POLICY rtl_iwm_cycle_count_industry_policy ON ind_rtl.rtl_iwm_cycle_count
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_rtl.rtl_oms_order ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_rtl.rtl_oms_order FORCE ROW LEVEL SECURITY;
CREATE POLICY rtl_oms_order_industry_policy ON ind_rtl.rtl_oms_order
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_rtl.rtl_oms_order_line ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_rtl.rtl_oms_order_line FORCE ROW LEVEL SECURITY;
CREATE POLICY rtl_oms_order_line_industry_policy ON ind_rtl.rtl_oms_order_line
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_rtl.rtl_oms_shipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_rtl.rtl_oms_shipment FORCE ROW LEVEL SECURITY;
CREATE POLICY rtl_oms_shipment_industry_policy ON ind_rtl.rtl_oms_shipment
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_rtl.rtl_oms_return_case ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_rtl.rtl_oms_return_case FORCE ROW LEVEL SECURITY;
CREATE POLICY rtl_oms_return_case_industry_policy ON ind_rtl.rtl_oms_return_case
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_rtl.rtl_mkt_seller ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_rtl.rtl_mkt_seller FORCE ROW LEVEL SECURITY;
CREATE POLICY rtl_mkt_seller_industry_policy ON ind_rtl.rtl_mkt_seller
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_rtl.rtl_mkt_listing ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_rtl.rtl_mkt_listing FORCE ROW LEVEL SECURITY;
CREATE POLICY rtl_mkt_listing_industry_policy ON ind_rtl.rtl_mkt_listing
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_rtl.rtl_mkt_seller_order ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_rtl.rtl_mkt_seller_order FORCE ROW LEVEL SECURITY;
CREATE POLICY rtl_mkt_seller_order_industry_policy ON ind_rtl.rtl_mkt_seller_order
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_rtl.rtl_mkt_settlement ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_rtl.rtl_mkt_settlement FORCE ROW LEVEL SECURITY;
CREATE POLICY rtl_mkt_settlement_industry_policy ON ind_rtl.rtl_mkt_settlement
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

INSERT INTO core_authz.rls_table_registry
(schema_name,table_name,scope_class,policy_class,owner_module,force_rls_required,registered_at)
VALUES
('ind_rtl','rtl_rsm_store_day','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','RTL-RSM',true,now()),
('ind_rtl','rtl_rsm_cash_movement','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','RTL-RSM',true,now()),
('ind_rtl','rtl_rsm_counter_shift','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','RTL-RSM',true,now()),
('ind_rtl','rtl_rsm_checklist','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','RTL-RSM',true,now()),
('ind_rtl','rtl_pos_session','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','RTL-POS',true,now()),
('ind_rtl','rtl_pos_sale','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','RTL-POS',true,now()),
('ind_rtl','rtl_pos_sale_line','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','RTL-POS',true,now()),
('ind_rtl','rtl_pos_tender','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','RTL-POS',true,now()),
('ind_rtl','rtl_iwm_stock_balance','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','RTL-IWM',true,now()),
('ind_rtl','rtl_iwm_stock_movement','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','RTL-IWM',true,now()),
('ind_rtl','rtl_iwm_reservation','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','RTL-IWM',true,now()),
('ind_rtl','rtl_iwm_cycle_count','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','RTL-IWM',true,now()),
('ind_rtl','rtl_oms_order','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','RTL-OMS',true,now()),
('ind_rtl','rtl_oms_order_line','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','RTL-OMS',true,now()),
('ind_rtl','rtl_oms_shipment','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','RTL-OMS',true,now()),
('ind_rtl','rtl_oms_return_case','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','RTL-OMS',true,now()),
('ind_rtl','rtl_mkt_seller','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','RTL-MKT',true,now()),
('ind_rtl','rtl_mkt_listing','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','RTL-MKT',true,now()),
('ind_rtl','rtl_mkt_seller_order','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','RTL-MKT',true,now()),
('ind_rtl','rtl_mkt_settlement','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','RTL-MKT',true,now());

COMMIT;
