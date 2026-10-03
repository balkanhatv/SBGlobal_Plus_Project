-- SBGlobal Plus — Migration 0023: Security & Facility Management Industry database wave
-- Canonical MS: SFM-SGM, SFM-PMS, SFM-VMS, SFM-FMM
BEGIN;

CREATE TYPE ind_sfm.sgm_post_state AS ENUM ('ACTIVE','INACTIVE');
CREATE TYPE ind_sfm.sgm_roster_state AS ENUM ('PLANNED','PUBLISHED','CHECKED_IN','ACTIVE','RELIEVED','COMPLETED','ABSENT');
CREATE TYPE ind_sfm.sgm_attendance_event AS ENUM ('CHECK_IN','CHECK_OUT','RELIEF');
CREATE TYPE ind_sfm.sgm_attendance_validation AS ENUM ('VALID','OUT_OF_FENCE','MANUAL_OVERRIDE');
CREATE TYPE ind_sfm.sgm_handover_state AS ENUM ('REQUESTED','ASSIGNED','HANDOVER','COMPLETED');

CREATE TYPE ind_sfm.pms_route_state AS ENUM ('ACTIVE','PAUSED','RETIRED');
CREATE TYPE ind_sfm.pms_round_state AS ENUM ('SCHEDULED','STARTED','IN_PROGRESS','EXCEPTION','COMPLETED','REVIEWED');
CREATE TYPE ind_sfm.pms_scan_method AS ENUM ('QR','NFC','MANUAL');
CREATE TYPE ind_sfm.pms_scan_validation AS ENUM ('VALID','LATE','INVALID');
CREATE TYPE ind_sfm.pms_incident_state AS ENUM ('REPORTED','ACKNOWLEDGED','INVESTIGATING','RESOLVED','CLOSED');

CREATE TYPE ind_sfm.vms_blacklist_state AS ENUM ('NOT_CHECKED','CLEAR','REVIEW','BLOCKED');
CREATE TYPE ind_sfm.vms_visit_state AS ENUM ('PREREGISTERED','ARRIVED','APPROVAL_PENDING','APPROVED','CHECKED_IN','CHECKED_OUT','DENIED','OVERSTAY');
CREATE TYPE ind_sfm.vms_badge_state AS ENUM ('ISSUED','ACTIVE','EXPIRED','RETURNED','REVOKED');
CREATE TYPE ind_sfm.vms_decision AS ENUM ('APPROVE','DENY');

CREATE TYPE ind_sfm.fmm_asset_state AS ENUM ('ACTIVE','DOWN','MAINTENANCE','RETIRED');
CREATE TYPE ind_sfm.fmm_ticket_state AS ENUM ('RAISED','CATEGORIZED','ASSIGNED','IN_PROGRESS','RESOLVED','VERIFICATION','CLOSED','ESCALATED');
CREATE TYPE ind_sfm.fmm_work_state AS ENUM ('OPEN','ACCEPTED','IN_PROGRESS','WAITING','RESOLVED','VERIFIED','CLOSED');
CREATE TYPE ind_sfm.fmm_schedule_state AS ENUM ('ACTIVE','PAUSED','RETIRED');

CREATE TABLE ind_sfm.sfm_sgm_post (
  id uuid PRIMARY KEY,
  site_ref uuid NOT NULL,
  post_code text NOT NULL,
  skill_requirements jsonb NOT NULL DEFAULT '[]'::jsonb,
  geofence_json jsonb NOT NULL,
  state ind_sfm.sgm_post_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,site_ref,post_code)
);
CREATE INDEX sfm_sgm_post_state_idx ON ind_sfm.sfm_sgm_post(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_sfm.sfm_sgm_roster (
  id uuid PRIMARY KEY,
  post_id uuid NOT NULL,
  guard_principal_id uuid NOT NULL,
  shift_start timestamptz NOT NULL,
  shift_end timestamptz NOT NULL,
  state ind_sfm.sgm_roster_state NOT NULL,

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
  FOREIGN KEY (tenant_id,industry_context_id,post_id)
    REFERENCES ind_sfm.sfm_sgm_post(tenant_id,industry_context_id,id),
  CHECK (shift_end > shift_start)
);
CREATE INDEX sfm_sgm_roster_guard_time_idx ON ind_sfm.sfm_sgm_roster(tenant_id,industry_context_id,guard_principal_id,shift_start);
CREATE INDEX sfm_sgm_roster_state_idx ON ind_sfm.sfm_sgm_roster(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_sfm.sfm_sgm_attendance (
  id uuid PRIMARY KEY,
  roster_id uuid NOT NULL,
  event_type ind_sfm.sgm_attendance_event NOT NULL,
  occurred_at timestamptz NOT NULL,
  geo_evidence jsonb NOT NULL,
  validation ind_sfm.sgm_attendance_validation NOT NULL,
  device_id uuid NOT NULL,

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
  FOREIGN KEY (tenant_id,industry_context_id,roster_id)
    REFERENCES ind_sfm.sfm_sgm_roster(tenant_id,industry_context_id,id)
);
CREATE INDEX sfm_sgm_attendance_roster_idx ON ind_sfm.sfm_sgm_attendance(tenant_id,industry_context_id,roster_id,occurred_at);

CREATE TABLE ind_sfm.sfm_sgm_handover (
  id uuid PRIMARY KEY,
  roster_id uuid NOT NULL,
  relief_guard_id uuid,
  note_document_id uuid,
  approved_by uuid,
  state ind_sfm.sgm_handover_state NOT NULL,

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
  FOREIGN KEY (tenant_id,industry_context_id,roster_id)
    REFERENCES ind_sfm.sfm_sgm_roster(tenant_id,industry_context_id,id)
);
CREATE INDEX sfm_sgm_handover_roster_state_idx ON ind_sfm.sfm_sgm_handover(tenant_id,industry_context_id,roster_id,state);

CREATE TABLE ind_sfm.sfm_pms_route (
  id uuid PRIMARY KEY,
  site_ref uuid NOT NULL,
  route_code text NOT NULL,
  checkpoint_json jsonb NOT NULL,
  schedule_policy_ref uuid NOT NULL,
  state ind_sfm.pms_route_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,site_ref,route_code)
);
CREATE INDEX sfm_pms_route_state_idx ON ind_sfm.sfm_pms_route(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_sfm.sfm_pms_round (
  id uuid PRIMARY KEY,
  route_id uuid NOT NULL,
  guard_principal_id uuid NOT NULL,
  scheduled_start timestamptz NOT NULL,
  scheduled_end timestamptz NOT NULL,
  state ind_sfm.pms_round_state NOT NULL,

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
  FOREIGN KEY (tenant_id,industry_context_id,route_id)
    REFERENCES ind_sfm.sfm_pms_route(tenant_id,industry_context_id,id),
  CHECK (scheduled_end > scheduled_start)
);
CREATE INDEX sfm_pms_round_route_time_idx ON ind_sfm.sfm_pms_round(tenant_id,industry_context_id,route_id,scheduled_start);
CREATE INDEX sfm_pms_round_state_idx ON ind_sfm.sfm_pms_round(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_sfm.sfm_pms_scan (
  id uuid PRIMARY KEY,
  round_id uuid NOT NULL,
  checkpoint_code text NOT NULL,
  scanned_at timestamptz NOT NULL,
  method ind_sfm.pms_scan_method NOT NULL,
  device_id uuid NOT NULL,
  geo_evidence jsonb,
  validation ind_sfm.pms_scan_validation NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,round_id,checkpoint_code,scanned_at),
  FOREIGN KEY (tenant_id,industry_context_id,round_id)
    REFERENCES ind_sfm.sfm_pms_round(tenant_id,industry_context_id,id)
);
CREATE INDEX sfm_pms_scan_round_idx ON ind_sfm.sfm_pms_scan(tenant_id,industry_context_id,round_id,scanned_at);

CREATE TABLE ind_sfm.sfm_pms_incident (
  id uuid PRIMARY KEY,
  round_id uuid,
  category_code text NOT NULL,
  severity_code text NOT NULL,
  occurred_at timestamptz NOT NULL,
  document_ids uuid[] NOT NULL DEFAULT '{}',
  state ind_sfm.pms_incident_state NOT NULL,

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
  FOREIGN KEY (tenant_id,industry_context_id,round_id)
    REFERENCES ind_sfm.sfm_pms_round(tenant_id,industry_context_id,id)
);
CREATE INDEX sfm_pms_incident_severity_state_idx ON ind_sfm.sfm_pms_incident(tenant_id,industry_context_id,severity_code,state);
CREATE INDEX sfm_pms_incident_state_idx ON ind_sfm.sfm_pms_incident(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_sfm.sfm_vms_visitor (
  id uuid PRIMARY KEY,
  visitor_no text NOT NULL,
  name text NOT NULL,
  contact_norm text,
  identity_ref_encrypted text,
  privacy_class text NOT NULL,
  blacklist_match_state ind_sfm.vms_blacklist_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,visitor_no)
);
CREATE INDEX sfm_vms_visitor_updated_idx ON ind_sfm.sfm_vms_visitor(tenant_id,industry_context_id,updated_at);

CREATE TABLE ind_sfm.sfm_vms_visit (
  id uuid PRIMARY KEY,
  visitor_id uuid NOT NULL,
  host_principal_id uuid NOT NULL,
  site_ref uuid NOT NULL,
  expected_from timestamptz NOT NULL,
  expected_to timestamptz NOT NULL,
  purpose text NOT NULL,
  state ind_sfm.vms_visit_state NOT NULL,

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
  FOREIGN KEY (tenant_id,industry_context_id,visitor_id)
    REFERENCES ind_sfm.sfm_vms_visitor(tenant_id,industry_context_id,id),
  CHECK (expected_to > expected_from)
);
CREATE INDEX sfm_vms_visit_site_state_idx ON ind_sfm.sfm_vms_visit(tenant_id,industry_context_id,site_ref,state);
CREATE INDEX sfm_vms_visit_state_idx ON ind_sfm.sfm_vms_visit(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_sfm.sfm_vms_badge (
  id uuid PRIMARY KEY,
  visit_id uuid NOT NULL,
  badge_code text NOT NULL,
  issued_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  state ind_sfm.vms_badge_state NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,badge_code),
  FOREIGN KEY (tenant_id,industry_context_id,visit_id)
    REFERENCES ind_sfm.sfm_vms_visit(tenant_id,industry_context_id,id),
  CHECK (expires_at > issued_at)
);
CREATE INDEX sfm_vms_badge_state_idx ON ind_sfm.sfm_vms_badge(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_sfm.sfm_vms_approval (
  id uuid PRIMARY KEY,
  visit_id uuid NOT NULL,
  host_principal_id uuid NOT NULL,
  decision ind_sfm.vms_decision NOT NULL,
  reason text,
  decided_at timestamptz NOT NULL,

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
  UNIQUE (tenant_id,industry_context_id,visit_id,host_principal_id),
  FOREIGN KEY (tenant_id,industry_context_id,visit_id)
    REFERENCES ind_sfm.sfm_vms_visit(tenant_id,industry_context_id,id)
);
CREATE INDEX sfm_vms_approval_visit_idx ON ind_sfm.sfm_vms_approval(tenant_id,industry_context_id,visit_id);

CREATE TABLE ind_sfm.sfm_fmm_asset (
  id uuid PRIMARY KEY,
  asset_code text NOT NULL,
  site_ref uuid NOT NULL,
  category text NOT NULL,
  location text,
  criticality text NOT NULL,
  state ind_sfm.fmm_asset_state NOT NULL,

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
CREATE INDEX sfm_fmm_asset_state_idx ON ind_sfm.sfm_fmm_asset(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_sfm.sfm_fmm_ticket (
  id uuid PRIMARY KEY,
  ticket_no text NOT NULL,
  asset_id uuid,
  category_code text NOT NULL,
  priority_code text NOT NULL,
  requester_id uuid,
  state ind_sfm.fmm_ticket_state NOT NULL,

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
  FOREIGN KEY (tenant_id,industry_context_id,asset_id)
    REFERENCES ind_sfm.sfm_fmm_asset(tenant_id,industry_context_id,id)
);
CREATE INDEX sfm_fmm_ticket_state_idx ON ind_sfm.sfm_fmm_ticket(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_sfm.sfm_fmm_work_order (
  id uuid PRIMARY KEY,
  ticket_id uuid,
  asset_id uuid NOT NULL,
  assigned_principal_or_vendor_ref uuid NOT NULL,
  due_at timestamptz,
  state ind_sfm.fmm_work_state NOT NULL,

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
  FOREIGN KEY (tenant_id,industry_context_id,ticket_id)
    REFERENCES ind_sfm.sfm_fmm_ticket(tenant_id,industry_context_id,id),
  FOREIGN KEY (tenant_id,industry_context_id,asset_id)
    REFERENCES ind_sfm.sfm_fmm_asset(tenant_id,industry_context_id,id)
);
CREATE INDEX sfm_fmm_work_order_state_due_idx ON ind_sfm.sfm_fmm_work_order(tenant_id,industry_context_id,state,due_at);

CREATE TABLE ind_sfm.sfm_fmm_pm_schedule (
  id uuid PRIMARY KEY,
  asset_id uuid NOT NULL,
  recurrence_rule text NOT NULL,
  next_due_at timestamptz NOT NULL,
  work_template_ref uuid,
  state ind_sfm.fmm_schedule_state NOT NULL,

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
    REFERENCES ind_sfm.sfm_fmm_asset(tenant_id,industry_context_id,id)
);
CREATE INDEX sfm_fmm_pm_schedule_due_idx ON ind_sfm.sfm_fmm_pm_schedule(tenant_id,industry_context_id,next_due_at);
CREATE INDEX sfm_fmm_pm_schedule_state_idx ON ind_sfm.sfm_fmm_pm_schedule(tenant_id,industry_context_id,state,updated_at);


ALTER TABLE ind_sfm.sfm_sgm_post ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_sfm.sfm_sgm_post FORCE ROW LEVEL SECURITY;
CREATE POLICY sfm_sgm_post_industry_policy ON ind_sfm.sfm_sgm_post
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_sfm.sfm_sgm_roster ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_sfm.sfm_sgm_roster FORCE ROW LEVEL SECURITY;
CREATE POLICY sfm_sgm_roster_industry_policy ON ind_sfm.sfm_sgm_roster
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_sfm.sfm_sgm_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_sfm.sfm_sgm_attendance FORCE ROW LEVEL SECURITY;
CREATE POLICY sfm_sgm_attendance_industry_policy ON ind_sfm.sfm_sgm_attendance
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_sfm.sfm_sgm_handover ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_sfm.sfm_sgm_handover FORCE ROW LEVEL SECURITY;
CREATE POLICY sfm_sgm_handover_industry_policy ON ind_sfm.sfm_sgm_handover
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_sfm.sfm_pms_route ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_sfm.sfm_pms_route FORCE ROW LEVEL SECURITY;
CREATE POLICY sfm_pms_route_industry_policy ON ind_sfm.sfm_pms_route
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_sfm.sfm_pms_round ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_sfm.sfm_pms_round FORCE ROW LEVEL SECURITY;
CREATE POLICY sfm_pms_round_industry_policy ON ind_sfm.sfm_pms_round
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_sfm.sfm_pms_scan ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_sfm.sfm_pms_scan FORCE ROW LEVEL SECURITY;
CREATE POLICY sfm_pms_scan_industry_policy ON ind_sfm.sfm_pms_scan
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_sfm.sfm_pms_incident ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_sfm.sfm_pms_incident FORCE ROW LEVEL SECURITY;
CREATE POLICY sfm_pms_incident_industry_policy ON ind_sfm.sfm_pms_incident
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_sfm.sfm_vms_visitor ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_sfm.sfm_vms_visitor FORCE ROW LEVEL SECURITY;
CREATE POLICY sfm_vms_visitor_industry_policy ON ind_sfm.sfm_vms_visitor
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_sfm.sfm_vms_visit ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_sfm.sfm_vms_visit FORCE ROW LEVEL SECURITY;
CREATE POLICY sfm_vms_visit_industry_policy ON ind_sfm.sfm_vms_visit
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_sfm.sfm_vms_badge ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_sfm.sfm_vms_badge FORCE ROW LEVEL SECURITY;
CREATE POLICY sfm_vms_badge_industry_policy ON ind_sfm.sfm_vms_badge
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_sfm.sfm_vms_approval ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_sfm.sfm_vms_approval FORCE ROW LEVEL SECURITY;
CREATE POLICY sfm_vms_approval_industry_policy ON ind_sfm.sfm_vms_approval
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_sfm.sfm_fmm_asset ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_sfm.sfm_fmm_asset FORCE ROW LEVEL SECURITY;
CREATE POLICY sfm_fmm_asset_industry_policy ON ind_sfm.sfm_fmm_asset
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_sfm.sfm_fmm_ticket ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_sfm.sfm_fmm_ticket FORCE ROW LEVEL SECURITY;
CREATE POLICY sfm_fmm_ticket_industry_policy ON ind_sfm.sfm_fmm_ticket
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_sfm.sfm_fmm_work_order ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_sfm.sfm_fmm_work_order FORCE ROW LEVEL SECURITY;
CREATE POLICY sfm_fmm_work_order_industry_policy ON ind_sfm.sfm_fmm_work_order
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_sfm.sfm_fmm_pm_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_sfm.sfm_fmm_pm_schedule FORCE ROW LEVEL SECURITY;
CREATE POLICY sfm_fmm_pm_schedule_industry_policy ON ind_sfm.sfm_fmm_pm_schedule
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

INSERT INTO core_authz.rls_table_registry
(schema_name,table_name,scope_class,policy_class,owner_module,force_rls_required,registered_at)
VALUES
('ind_sfm','sfm_sgm_post','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','SFM-SGM',true,now()),
('ind_sfm','sfm_sgm_roster','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','SFM-SGM',true,now()),
('ind_sfm','sfm_sgm_attendance','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','SFM-SGM',true,now()),
('ind_sfm','sfm_sgm_handover','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','SFM-SGM',true,now()),
('ind_sfm','sfm_pms_route','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','SFM-PMS',true,now()),
('ind_sfm','sfm_pms_round','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','SFM-PMS',true,now()),
('ind_sfm','sfm_pms_scan','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','SFM-PMS',true,now()),
('ind_sfm','sfm_pms_incident','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','SFM-PMS',true,now()),
('ind_sfm','sfm_vms_visitor','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','SFM-VMS',true,now()),
('ind_sfm','sfm_vms_visit','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','SFM-VMS',true,now()),
('ind_sfm','sfm_vms_badge','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','SFM-VMS',true,now()),
('ind_sfm','sfm_vms_approval','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','SFM-VMS',true,now()),
('ind_sfm','sfm_fmm_asset','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','SFM-FMM',true,now()),
('ind_sfm','sfm_fmm_ticket','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','SFM-FMM',true,now()),
('ind_sfm','sfm_fmm_work_order','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','SFM-FMM',true,now()),
('ind_sfm','sfm_fmm_pm_schedule','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','SFM-FMM',true,now());

COMMIT;
