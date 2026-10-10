-- SBGlobal Plus — Migration 0019: Manufacturing Industry database wave
-- Canonical MS: MFG-PMS, MFG-IWM, MFG-QMS, MFG-PRO, MFG-MMS
BEGIN;

CREATE TYPE ind_mfg.pms_version_state AS ENUM ('DRAFT','APPROVED','ACTIVE','RETIRED');
CREATE TYPE ind_mfg.pms_order_state AS ENUM ('PLANNED','RELEASED','MATERIAL_ISSUED','IN_PROGRESS','QC','HOLD','COMPLETED','CLOSED','SCRAPPED');
CREATE TYPE ind_mfg.pms_operation_state AS ENUM ('PENDING','RUNNING','COMPLETED','HOLD');

CREATE TYPE ind_mfg.iwm_quality_state AS ENUM ('AVAILABLE','HOLD','REJECTED');
CREATE TYPE ind_mfg.iwm_movement_type AS ENUM ('GRN','PUTAWAY','RESERVE','ISSUE','RETURN','FG_RECEIPT','TRANSFER','ADJUST','SCRAP');
CREATE TYPE ind_mfg.iwm_reservation_state AS ENUM ('HELD','ISSUED','RELEASED');
CREATE TYPE ind_mfg.iwm_cycle_count_state AS ENUM ('PLANNED','COUNTED','REVIEW','APPROVED','ADJUSTED');

CREATE TYPE ind_mfg.qms_plan_state AS ENUM ('DRAFT','APPROVED','ACTIVE','RETIRED');
CREATE TYPE ind_mfg.qms_inspection_state AS ENUM ('PLANNED','IN_PROGRESS','PASS','FAIL','DEVIATION','HOLD','DISPOSED');
CREATE TYPE ind_mfg.qms_disposition AS ENUM ('REWORK','ACCEPT_DEVIATION','SCRAP','PENDING');
CREATE TYPE ind_mfg.qms_ncr_state AS ENUM ('OPEN','REVIEW','APPROVED','CLOSED');
CREATE TYPE ind_mfg.qms_capa_state AS ENUM ('OPEN','IMPLEMENTED','VERIFIED','CLOSED');

CREATE TYPE ind_mfg.pro_pr_state AS ENUM ('DRAFT','SUBMITTED','APPROVED','REJECTED','SOURCING','PO_CREATED','CLOSED');
CREATE TYPE ind_mfg.pro_po_state AS ENUM ('DRAFT','APPROVED','ISSUED','PART_RECEIVED','RECEIVED','CLOSED','CANCELLED');
CREATE TYPE ind_mfg.pro_quality_gate_state AS ENUM ('PENDING','PASS','FAIL','HOLD');
CREATE TYPE ind_mfg.pro_grn_state AS ENUM ('DRAFT','POSTED','REVERSED');
CREATE TYPE ind_mfg.pro_match_state AS ENUM ('PENDING','MATCHED','EXCEPTION','APPROVED');

CREATE TYPE ind_mfg.mms_asset_state AS ENUM ('ACTIVE','DOWN','MAINTENANCE','RETIRED');
CREATE TYPE ind_mfg.mms_schedule_state AS ENUM ('ACTIVE','PAUSED','RETIRED');
CREATE TYPE ind_mfg.mms_work_source AS ENUM ('PREVENTIVE','BREAKDOWN');
CREATE TYPE ind_mfg.mms_work_state AS ENUM ('OPEN','ASSIGNED','IN_PROGRESS','WAITING_PARTS','VERIFICATION','CLOSED','CANCELLED');

CREATE TABLE ind_mfg.mfg_pms_bom (
  id uuid PRIMARY KEY,
  item_ref uuid NOT NULL,
  version_no integer NOT NULL CHECK (version_no > 0),
  effective_from timestamptz NOT NULL,
  state ind_mfg.pms_version_state NOT NULL,
  component_json jsonb NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,item_ref,version_no)
);
CREATE INDEX mfg_pms_bom_state_idx ON ind_mfg.mfg_pms_bom(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_mfg.mfg_pms_routing (
  id uuid PRIMARY KEY,
  item_ref uuid NOT NULL,
  version_no integer NOT NULL CHECK (version_no > 0),
  operation_json jsonb NOT NULL,
  state ind_mfg.pms_version_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,item_ref,version_no)
);
CREATE INDEX mfg_pms_routing_state_idx ON ind_mfg.mfg_pms_routing(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_mfg.mfg_pms_production_order (
  id uuid PRIMARY KEY,
  order_no text NOT NULL,
  item_ref uuid NOT NULL,
  qty numeric NOT NULL CHECK (qty > 0),
  bom_version_id uuid NOT NULL,
  routing_version_id uuid NOT NULL,
  planned_start timestamptz NOT NULL,
  planned_end timestamptz NOT NULL,
  state ind_mfg.pms_order_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,order_no),
  FOREIGN KEY (tenant_id,industry_context_id,bom_version_id)
    REFERENCES ind_mfg.mfg_pms_bom(tenant_id,industry_context_id,id),
  FOREIGN KEY (tenant_id,industry_context_id,routing_version_id)
    REFERENCES ind_mfg.mfg_pms_routing(tenant_id,industry_context_id,id),
  CHECK (planned_end > planned_start)
);
CREATE INDEX mfg_pms_order_state_idx ON ind_mfg.mfg_pms_production_order(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_mfg.mfg_pms_operation_exec (
  id uuid PRIMARY KEY,
  production_order_id uuid NOT NULL,
  sequence_no integer NOT NULL CHECK (sequence_no > 0),
  work_center_ref uuid NOT NULL,
  started_at timestamptz,
  completed_at timestamptz,
  good_qty numeric NOT NULL DEFAULT 0 CHECK (good_qty >= 0),
  scrap_qty numeric NOT NULL DEFAULT 0 CHECK (scrap_qty >= 0),
  state ind_mfg.pms_operation_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,production_order_id,sequence_no),
  FOREIGN KEY (tenant_id,industry_context_id,production_order_id)
    REFERENCES ind_mfg.mfg_pms_production_order(tenant_id,industry_context_id,id),
  CHECK (completed_at IS NULL OR started_at IS NULL OR completed_at >= started_at)
);
CREATE INDEX mfg_pms_operation_state_idx ON ind_mfg.mfg_pms_operation_exec(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_mfg.mfg_iwm_balance (
  id uuid PRIMARY KEY,
  location_ref uuid NOT NULL,
  item_ref uuid NOT NULL,
  lot_serial_ref text,
  on_hand numeric NOT NULL DEFAULT 0 CHECK (on_hand >= 0),
  reserved numeric NOT NULL DEFAULT 0 CHECK (reserved >= 0 AND reserved <= on_hand),
  quality_state ind_mfg.iwm_quality_state NOT NULL,
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
  UNIQUE (tenant_id,industry_context_id,id)
);
CREATE UNIQUE INDEX mfg_iwm_balance_scope_item_lot_uq
  ON ind_mfg.mfg_iwm_balance(
    tenant_id,industry_context_id,location_ref,item_ref,COALESCE(lot_serial_ref,'')
  );
CREATE INDEX mfg_iwm_balance_location_idx ON ind_mfg.mfg_iwm_balance(tenant_id,industry_context_id,location_ref);

CREATE TABLE ind_mfg.mfg_iwm_movement (
  id uuid PRIMARY KEY,
  movement_no text NOT NULL,
  type ind_mfg.iwm_movement_type NOT NULL,
  item_ref uuid NOT NULL,
  qty numeric NOT NULL CHECK (qty > 0),
  lot_serial_ref text,
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
CREATE INDEX mfg_iwm_movement_item_idx ON ind_mfg.mfg_iwm_movement(tenant_id,industry_context_id,item_ref,created_at DESC);

CREATE TABLE ind_mfg.mfg_iwm_reservation (
  id uuid PRIMARY KEY,
  production_order_ref uuid NOT NULL,
  item_ref uuid NOT NULL,
  qty numeric NOT NULL CHECK (qty > 0),
  lot_serial_ref text,
  state ind_mfg.iwm_reservation_state NOT NULL,

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
CREATE INDEX mfg_iwm_reservation_order_state_idx ON ind_mfg.mfg_iwm_reservation(tenant_id,industry_context_id,production_order_ref,state);
CREATE INDEX mfg_iwm_reservation_state_idx ON ind_mfg.mfg_iwm_reservation(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_mfg.mfg_iwm_cycle_count (
  id uuid PRIMARY KEY,
  count_no text NOT NULL,
  location_ref uuid NOT NULL,
  state ind_mfg.iwm_cycle_count_state NOT NULL,
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
CREATE INDEX mfg_iwm_cycle_count_state_idx ON ind_mfg.mfg_iwm_cycle_count(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_mfg.mfg_qms_inspection_plan (
  id uuid PRIMARY KEY,
  code text NOT NULL,
  item_or_process_ref text NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  characteristic_json jsonb NOT NULL,
  state ind_mfg.qms_plan_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,code,version)
);
CREATE INDEX mfg_qms_plan_state_idx ON ind_mfg.mfg_qms_inspection_plan(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_mfg.mfg_qms_inspection (
  id uuid PRIMARY KEY,
  source_type text NOT NULL,
  source_ref uuid NOT NULL,
  plan_id uuid NOT NULL,
  lot_ref text,
  state ind_mfg.qms_inspection_state NOT NULL,
  inspector_id uuid NOT NULL,

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
  FOREIGN KEY (tenant_id,industry_context_id,plan_id)
    REFERENCES ind_mfg.mfg_qms_inspection_plan(tenant_id,industry_context_id,id)
);
CREATE INDEX mfg_qms_inspection_source_state_idx ON ind_mfg.mfg_qms_inspection(tenant_id,industry_context_id,source_ref,state);
CREATE INDEX mfg_qms_inspection_state_idx ON ind_mfg.mfg_qms_inspection(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_mfg.mfg_qms_ncr (
  id uuid PRIMARY KEY,
  ncr_no text NOT NULL,
  inspection_id uuid NOT NULL,
  defect_code text NOT NULL,
  severity_code text NOT NULL,
  disposition ind_mfg.qms_disposition NOT NULL,
  state ind_mfg.qms_ncr_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,ncr_no),
  FOREIGN KEY (tenant_id,industry_context_id,inspection_id)
    REFERENCES ind_mfg.mfg_qms_inspection(tenant_id,industry_context_id,id)
);
CREATE INDEX mfg_qms_ncr_state_idx ON ind_mfg.mfg_qms_ncr(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_mfg.mfg_qms_capa (
  id uuid PRIMARY KEY,
  ncr_id uuid NOT NULL,
  cause text NOT NULL,
  corrective_action text NOT NULL,
  preventive_action text,
  owner_id uuid NOT NULL,
  due_at timestamptz NOT NULL,
  state ind_mfg.qms_capa_state NOT NULL,

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
  FOREIGN KEY (tenant_id,industry_context_id,ncr_id)
    REFERENCES ind_mfg.mfg_qms_ncr(tenant_id,industry_context_id,id)
);
CREATE INDEX mfg_qms_capa_owner_state_idx ON ind_mfg.mfg_qms_capa(tenant_id,industry_context_id,owner_id,state);
CREATE INDEX mfg_qms_capa_state_idx ON ind_mfg.mfg_qms_capa(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_mfg.mfg_pro_pr (
  id uuid PRIMARY KEY,
  pr_no text NOT NULL,
  requester_id uuid NOT NULL,
  need_by date,
  total_estimate_minor bigint CHECK (total_estimate_minor IS NULL OR total_estimate_minor >= 0),
  state ind_mfg.pro_pr_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,pr_no)
);
CREATE INDEX mfg_pro_pr_state_idx ON ind_mfg.mfg_pro_pr(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_mfg.mfg_pro_po (
  id uuid PRIMARY KEY,
  po_no text NOT NULL,
  vendor_ref uuid NOT NULL,
  currency char(3) NOT NULL,
  total_minor bigint NOT NULL CHECK (total_minor >= 0),
  approval_ref uuid,
  state ind_mfg.pro_po_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,po_no)
);
CREATE INDEX mfg_pro_po_state_idx ON ind_mfg.mfg_pro_po(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_mfg.mfg_pro_grn (
  id uuid PRIMARY KEY,
  grn_no text NOT NULL,
  po_id uuid NOT NULL,
  received_at timestamptz NOT NULL,
  receiver_id uuid NOT NULL,
  quality_gate_state ind_mfg.pro_quality_gate_state NOT NULL,
  state ind_mfg.pro_grn_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,grn_no),
  FOREIGN KEY (tenant_id,industry_context_id,po_id)
    REFERENCES ind_mfg.mfg_pro_po(tenant_id,industry_context_id,id)
);
CREATE INDEX mfg_pro_grn_state_idx ON ind_mfg.mfg_pro_grn(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_mfg.mfg_pro_match (
  id uuid PRIMARY KEY,
  po_id uuid NOT NULL,
  grn_id uuid NOT NULL,
  supplier_invoice_ref text NOT NULL,
  amount_minor bigint NOT NULL CHECK (amount_minor >= 0),
  variance_minor bigint NOT NULL,
  state ind_mfg.pro_match_state NOT NULL,

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
  FOREIGN KEY (tenant_id,industry_context_id,po_id)
    REFERENCES ind_mfg.mfg_pro_po(tenant_id,industry_context_id,id),
  FOREIGN KEY (tenant_id,industry_context_id,grn_id)
    REFERENCES ind_mfg.mfg_pro_grn(tenant_id,industry_context_id,id)
);
CREATE INDEX mfg_pro_match_po_state_idx ON ind_mfg.mfg_pro_match(tenant_id,industry_context_id,po_id,state);
CREATE INDEX mfg_pro_match_state_idx ON ind_mfg.mfg_pro_match(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_mfg.mfg_mms_asset (
  id uuid PRIMARY KEY,
  asset_code text NOT NULL,
  category text NOT NULL,
  location_ref uuid NOT NULL,
  criticality text NOT NULL,
  state ind_mfg.mms_asset_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,asset_code)
);
CREATE INDEX mfg_mms_asset_state_idx ON ind_mfg.mfg_mms_asset(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_mfg.mfg_mms_schedule (
  id uuid PRIMARY KEY,
  asset_id uuid NOT NULL,
  maintenance_type text NOT NULL,
  recurrence_rule text NOT NULL,
  next_due_at timestamptz NOT NULL,
  state ind_mfg.mms_schedule_state NOT NULL,

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
  FOREIGN KEY (tenant_id,industry_context_id,asset_id)
    REFERENCES ind_mfg.mfg_mms_asset(tenant_id,industry_context_id,id)
);
CREATE INDEX mfg_mms_schedule_due_state_idx ON ind_mfg.mfg_mms_schedule(tenant_id,industry_context_id,next_due_at,state);

CREATE TABLE ind_mfg.mfg_mms_work_order (
  id uuid PRIMARY KEY,
  wo_no text NOT NULL,
  asset_id uuid NOT NULL,
  source ind_mfg.mms_work_source NOT NULL,
  priority_code text NOT NULL,
  assigned_to uuid,
  state ind_mfg.mms_work_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,wo_no),
  FOREIGN KEY (tenant_id,industry_context_id,asset_id)
    REFERENCES ind_mfg.mfg_mms_asset(tenant_id,industry_context_id,id)
);
CREATE INDEX mfg_mms_work_order_state_idx ON ind_mfg.mfg_mms_work_order(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_mfg.mfg_mms_downtime (
  id uuid PRIMARY KEY,
  asset_id uuid NOT NULL,
  work_order_id uuid,
  started_at timestamptz NOT NULL,
  ended_at timestamptz,
  cause_code text,
  production_order_ref uuid,

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
  FOREIGN KEY (tenant_id,industry_context_id,asset_id)
    REFERENCES ind_mfg.mfg_mms_asset(tenant_id,industry_context_id,id),
  FOREIGN KEY (tenant_id,industry_context_id,work_order_id)
    REFERENCES ind_mfg.mfg_mms_work_order(tenant_id,industry_context_id,id),
  CHECK (ended_at IS NULL OR ended_at >= started_at)
);
CREATE INDEX mfg_mms_downtime_asset_idx ON ind_mfg.mfg_mms_downtime(tenant_id,industry_context_id,asset_id,started_at DESC);
CREATE UNIQUE INDEX mfg_mms_downtime_one_open_idx
  ON ind_mfg.mfg_mms_downtime(tenant_id,industry_context_id,asset_id)
  WHERE ended_at IS NULL AND deleted_at IS NULL;


ALTER TABLE ind_mfg.mfg_pms_bom ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_mfg.mfg_pms_bom FORCE ROW LEVEL SECURITY;
CREATE POLICY mfg_pms_bom_industry_policy ON ind_mfg.mfg_pms_bom
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_mfg.mfg_pms_routing ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_mfg.mfg_pms_routing FORCE ROW LEVEL SECURITY;
CREATE POLICY mfg_pms_routing_industry_policy ON ind_mfg.mfg_pms_routing
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_mfg.mfg_pms_production_order ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_mfg.mfg_pms_production_order FORCE ROW LEVEL SECURITY;
CREATE POLICY mfg_pms_production_order_industry_policy ON ind_mfg.mfg_pms_production_order
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_mfg.mfg_pms_operation_exec ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_mfg.mfg_pms_operation_exec FORCE ROW LEVEL SECURITY;
CREATE POLICY mfg_pms_operation_exec_industry_policy ON ind_mfg.mfg_pms_operation_exec
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_mfg.mfg_iwm_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_mfg.mfg_iwm_balance FORCE ROW LEVEL SECURITY;
CREATE POLICY mfg_iwm_balance_industry_policy ON ind_mfg.mfg_iwm_balance
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_mfg.mfg_iwm_movement ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_mfg.mfg_iwm_movement FORCE ROW LEVEL SECURITY;
CREATE POLICY mfg_iwm_movement_industry_policy ON ind_mfg.mfg_iwm_movement
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_mfg.mfg_iwm_reservation ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_mfg.mfg_iwm_reservation FORCE ROW LEVEL SECURITY;
CREATE POLICY mfg_iwm_reservation_industry_policy ON ind_mfg.mfg_iwm_reservation
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_mfg.mfg_iwm_cycle_count ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_mfg.mfg_iwm_cycle_count FORCE ROW LEVEL SECURITY;
CREATE POLICY mfg_iwm_cycle_count_industry_policy ON ind_mfg.mfg_iwm_cycle_count
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_mfg.mfg_qms_inspection_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_mfg.mfg_qms_inspection_plan FORCE ROW LEVEL SECURITY;
CREATE POLICY mfg_qms_inspection_plan_industry_policy ON ind_mfg.mfg_qms_inspection_plan
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_mfg.mfg_qms_inspection ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_mfg.mfg_qms_inspection FORCE ROW LEVEL SECURITY;
CREATE POLICY mfg_qms_inspection_industry_policy ON ind_mfg.mfg_qms_inspection
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_mfg.mfg_qms_ncr ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_mfg.mfg_qms_ncr FORCE ROW LEVEL SECURITY;
CREATE POLICY mfg_qms_ncr_industry_policy ON ind_mfg.mfg_qms_ncr
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_mfg.mfg_qms_capa ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_mfg.mfg_qms_capa FORCE ROW LEVEL SECURITY;
CREATE POLICY mfg_qms_capa_industry_policy ON ind_mfg.mfg_qms_capa
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_mfg.mfg_pro_pr ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_mfg.mfg_pro_pr FORCE ROW LEVEL SECURITY;
CREATE POLICY mfg_pro_pr_industry_policy ON ind_mfg.mfg_pro_pr
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_mfg.mfg_pro_po ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_mfg.mfg_pro_po FORCE ROW LEVEL SECURITY;
CREATE POLICY mfg_pro_po_industry_policy ON ind_mfg.mfg_pro_po
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_mfg.mfg_pro_grn ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_mfg.mfg_pro_grn FORCE ROW LEVEL SECURITY;
CREATE POLICY mfg_pro_grn_industry_policy ON ind_mfg.mfg_pro_grn
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_mfg.mfg_pro_match ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_mfg.mfg_pro_match FORCE ROW LEVEL SECURITY;
CREATE POLICY mfg_pro_match_industry_policy ON ind_mfg.mfg_pro_match
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_mfg.mfg_mms_asset ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_mfg.mfg_mms_asset FORCE ROW LEVEL SECURITY;
CREATE POLICY mfg_mms_asset_industry_policy ON ind_mfg.mfg_mms_asset
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_mfg.mfg_mms_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_mfg.mfg_mms_schedule FORCE ROW LEVEL SECURITY;
CREATE POLICY mfg_mms_schedule_industry_policy ON ind_mfg.mfg_mms_schedule
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_mfg.mfg_mms_work_order ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_mfg.mfg_mms_work_order FORCE ROW LEVEL SECURITY;
CREATE POLICY mfg_mms_work_order_industry_policy ON ind_mfg.mfg_mms_work_order
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_mfg.mfg_mms_downtime ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_mfg.mfg_mms_downtime FORCE ROW LEVEL SECURITY;
CREATE POLICY mfg_mms_downtime_industry_policy ON ind_mfg.mfg_mms_downtime
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

INSERT INTO core_authz.rls_table_registry
(schema_name,table_name,scope_class,policy_class,owner_module,force_rls_required,registered_at)
VALUES
('ind_mfg','mfg_pms_bom','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','MFG-PMS',true,now()),
('ind_mfg','mfg_pms_routing','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','MFG-PMS',true,now()),
('ind_mfg','mfg_pms_production_order','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','MFG-PMS',true,now()),
('ind_mfg','mfg_pms_operation_exec','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','MFG-PMS',true,now()),
('ind_mfg','mfg_iwm_balance','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','MFG-IWM',true,now()),
('ind_mfg','mfg_iwm_movement','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','MFG-IWM',true,now()),
('ind_mfg','mfg_iwm_reservation','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','MFG-IWM',true,now()),
('ind_mfg','mfg_iwm_cycle_count','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','MFG-IWM',true,now()),
('ind_mfg','mfg_qms_inspection_plan','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','MFG-QMS',true,now()),
('ind_mfg','mfg_qms_inspection','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','MFG-QMS',true,now()),
('ind_mfg','mfg_qms_ncr','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','MFG-QMS',true,now()),
('ind_mfg','mfg_qms_capa','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','MFG-QMS',true,now()),
('ind_mfg','mfg_pro_pr','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','MFG-PRO',true,now()),
('ind_mfg','mfg_pro_po','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','MFG-PRO',true,now()),
('ind_mfg','mfg_pro_grn','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','MFG-PRO',true,now()),
('ind_mfg','mfg_pro_match','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','MFG-PRO',true,now()),
('ind_mfg','mfg_mms_asset','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','MFG-MMS',true,now()),
('ind_mfg','mfg_mms_schedule','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','MFG-MMS',true,now()),
('ind_mfg','mfg_mms_work_order','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','MFG-MMS',true,now()),
('ind_mfg','mfg_mms_downtime','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','MFG-MMS',true,now());

COMMIT;
