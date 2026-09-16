-- SBGlobal Plus — Migration 0033: Core read-side physical contracts for DD-041 / DD-042
BEGIN;

CREATE TYPE core_authz.compiled_permission_snapshot_status AS ENUM
  ('CURRENT','SUPERSEDED','INVALIDATED');
CREATE TYPE core_master.current_industry_status AS ENUM ('ACTIVE','RETIRED');

CREATE TABLE core_authz.compiled_permission_subject (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid,
  principal_id uuid NOT NULL REFERENCES core_identity.platform_principal(id),
  membership_id uuid REFERENCES core_identity.tenant_membership(id),
  org_unit_id uuid,
  scope_class text NOT NULL CHECK (scope_class IN ('TENANT_CORE','TENANT_INDUSTRY')),
  current_snapshot_id uuid,
  current_version bigint NOT NULL DEFAULT 0 CHECK (current_version >= 0),
  row_version bigint NOT NULL DEFAULT 1 CHECK (row_version > 0),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CHECK (
    (scope_class='TENANT_CORE' AND industry_context_id IS NULL)
    OR (scope_class='TENANT_INDUSTRY' AND industry_context_id IS NOT NULL)
  ),
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  FOREIGN KEY (tenant_id, org_unit_id)
    REFERENCES core_tenancy.org_unit(tenant_id, id)
);

CREATE UNIQUE INDEX compiled_permission_subject_scope_uq
  ON core_authz.compiled_permission_subject(
    tenant_id,
    COALESCE(industry_context_id,'00000000-0000-0000-0000-000000000000'::uuid),
    principal_id,
    COALESCE(membership_id,'00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(org_unit_id,'00000000-0000-0000-0000-000000000000'::uuid),
    scope_class
  );

CREATE TABLE core_authz.compiled_permission_snapshot (
  id uuid PRIMARY KEY,
  subject_id uuid NOT NULL REFERENCES core_authz.compiled_permission_subject(id),
  version bigint NOT NULL CHECK (version > 0),
  status core_authz.compiled_permission_snapshot_status NOT NULL,
  role_ids uuid[] NOT NULL DEFAULT '{}',
  permission_schema_version integer NOT NULL DEFAULT 1 CHECK (permission_schema_version > 0),
  permission_set_json jsonb NOT NULL CHECK (jsonb_typeof(permission_set_json)='object'),
  source_fingerprint text NOT NULL CHECK (length(source_fingerprint) >= 16),
  compiled_at timestamptz NOT NULL,
  superseded_at timestamptz,
  invalidated_at timestamptz,
  UNIQUE (subject_id, version),
  UNIQUE (subject_id, id, version),
  CHECK (
    (status='CURRENT' AND superseded_at IS NULL AND invalidated_at IS NULL)
    OR (status='SUPERSEDED' AND superseded_at IS NOT NULL AND invalidated_at IS NULL)
    OR (status='INVALIDATED' AND invalidated_at IS NOT NULL)
  )
);

CREATE UNIQUE INDEX compiled_permission_snapshot_one_current_uq
  ON core_authz.compiled_permission_snapshot(subject_id)
  WHERE status='CURRENT';

ALTER TABLE core_authz.compiled_permission_subject
  ADD CONSTRAINT compiled_permission_subject_current_snapshot_fk
  FOREIGN KEY (id,current_snapshot_id,current_version)
  REFERENCES core_authz.compiled_permission_snapshot(subject_id,id,version)
  DEFERRABLE INITIALLY DEFERRED;

CREATE OR REPLACE FUNCTION core_authz.validate_compiled_permission_subject()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=pg_catalog
AS $$
DECLARE target_status text; target_version bigint;
BEGIN
  IF NEW.membership_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM core_identity.tenant_membership membership
    WHERE membership.id=NEW.membership_id
      AND membership.tenant_id=NEW.tenant_id
      AND membership.principal_id=NEW.principal_id
      AND membership.status='ACTIVE'
      AND (membership.valid_from IS NULL OR membership.valid_from<=now())
      AND (membership.valid_until IS NULL OR membership.valid_until>now())
  ) THEN
    RAISE EXCEPTION 'compiled permission subject membership mismatch' USING ERRCODE='23514';
  END IF;

  IF NEW.current_snapshot_id IS NULL THEN
    IF TG_OP='INSERT' AND NEW.current_version<>0 THEN
      RAISE EXCEPTION 'new permission subject without snapshot starts at version zero' USING ERRCODE='23514';
    ELSIF TG_OP='UPDATE' AND NEW.current_version<>OLD.current_version THEN
      RAISE EXCEPTION 'clearing current snapshot cannot rewrite last issued version' USING ERRCODE='23514';
    END IF;
  ELSE
    SELECT status::text,version INTO target_status,target_version
    FROM core_authz.compiled_permission_snapshot
    WHERE id=NEW.current_snapshot_id AND subject_id=NEW.id;
    IF NOT FOUND OR target_status<>'CURRENT' OR target_version<>NEW.current_version THEN
      RAISE EXCEPTION 'permission subject current pointer/version requires CURRENT matching snapshot' USING ERRCODE='23514';
    END IF;
    IF TG_OP='UPDATE' AND NEW.current_snapshot_id IS DISTINCT FROM OLD.current_snapshot_id
      AND NEW.current_version<>OLD.current_version+1 THEN
      RAISE EXCEPTION 'permission version must advance exactly by one' USING ERRCODE='23514';
    END IF;
  END IF;
  NEW.row_version := CASE WHEN TG_OP='UPDATE' THEN OLD.row_version+1 ELSE NEW.row_version END;
  NEW.updated_at := CASE WHEN TG_OP='UPDATE' THEN now() ELSE NEW.updated_at END;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION core_authz.validate_compiled_permission_subject() FROM PUBLIC;
CREATE TRIGGER compiled_permission_subject_integrity
  BEFORE INSERT OR UPDATE ON core_authz.compiled_permission_subject
  FOR EACH ROW EXECUTE FUNCTION core_authz.validate_compiled_permission_subject();

CREATE OR REPLACE FUNCTION core_authz.prevent_compiled_permission_payload_rewrite()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.id<>OLD.id OR NEW.subject_id<>OLD.subject_id OR NEW.version<>OLD.version
    OR NEW.role_ids<>OLD.role_ids
    OR NEW.permission_schema_version<>OLD.permission_schema_version
    OR NEW.permission_set_json<>OLD.permission_set_json
    OR NEW.source_fingerprint<>OLD.source_fingerprint
    OR NEW.compiled_at<>OLD.compiled_at THEN
    RAISE EXCEPTION 'compiled permission snapshot payload is immutable' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION core_authz.prevent_compiled_permission_payload_rewrite() FROM PUBLIC;
CREATE TRIGGER compiled_permission_snapshot_immutable
  BEFORE UPDATE ON core_authz.compiled_permission_snapshot
  FOR EACH ROW EXECUTE FUNCTION core_authz.prevent_compiled_permission_payload_rewrite();

ALTER TABLE core_authz.compiled_permission_subject ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_authz.compiled_permission_subject FORCE ROW LEVEL SECURITY;
CREATE POLICY compiled_permission_subject_context_policy
  ON core_authz.compiled_permission_subject
  USING (
    tenant_id=core_tenancy.current_tenant_id()
    AND (
      (scope_class='TENANT_CORE'
        AND core_tenancy.current_scope_class()='TENANT_CORE'
        AND industry_context_id IS NULL)
      OR
      (scope_class='TENANT_INDUSTRY'
        AND core_tenancy.current_scope_class()='TENANT_INDUSTRY'
        AND industry_context_id=core_tenancy.current_industry_context_id())
    )
  )
  WITH CHECK (
    tenant_id=core_tenancy.current_tenant_id()
    AND (
      (scope_class='TENANT_CORE'
        AND core_tenancy.current_scope_class()='TENANT_CORE'
        AND industry_context_id IS NULL)
      OR
      (scope_class='TENANT_INDUSTRY'
        AND core_tenancy.current_scope_class()='TENANT_INDUSTRY'
        AND industry_context_id=core_tenancy.current_industry_context_id())
    )
  );

ALTER TABLE core_authz.compiled_permission_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_authz.compiled_permission_snapshot FORCE ROW LEVEL SECURITY;
CREATE POLICY compiled_permission_snapshot_context_policy
  ON core_authz.compiled_permission_snapshot
  USING (EXISTS (
    SELECT 1 FROM core_authz.compiled_permission_subject subject
    WHERE subject.id=subject_id
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM core_authz.compiled_permission_subject subject
    WHERE subject.id=subject_id
  ));

CREATE TABLE core_master.current_supported_industry (
  industry_code text PRIMARY KEY CHECK (industry_code ~ '^[A-Z]{3}$'),
  display_key text NOT NULL UNIQUE CHECK (display_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  display_name text NOT NULL,
  route_slug text NOT NULL UNIQUE CHECK (route_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  sort_order smallint NOT NULL UNIQUE CHECK (sort_order > 0),
  icon_key text NOT NULL,
  experience_package_key text NOT NULL UNIQUE,
  version bigint NOT NULL CHECK (version > 0),
  status core_master.current_industry_status NOT NULL,
  promotion_evidence_ref text NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  retired_at timestamptz,
  CHECK (
    (status='ACTIVE' AND retired_at IS NULL)
    OR (status='RETIRED' AND retired_at IS NOT NULL)
  )
);

INSERT INTO core_master.current_supported_industry
(industry_code,display_key,display_name,route_slug,sort_order,icon_key,experience_package_key,version,status,promotion_evidence_ref,created_at,updated_at)
VALUES
('HLT','healthcare-diagnostics','Healthcare & Diagnostics','healthcare-diagnostics',1,'industry-healthcare','industry.hlt',1,'ACTIVE','BASELINE-CURRENT-SUPPORTED-9',now(),now()),
('EDU','education','Education','education',2,'industry-education','industry.edu',1,'ACTIVE','BASELINE-CURRENT-SUPPORTED-9',now(),now()),
('RTL','retail','Retail & Commerce','retail',3,'industry-retail','industry.rtl',1,'ACTIVE','BASELINE-CURRENT-SUPPORTED-9',now(),now()),
('HSP','hospitality','Hospitality','hospitality',4,'industry-hospitality','industry.hsp',1,'ACTIVE','BASELINE-CURRENT-SUPPORTED-9',now(),now()),
('MFG','manufacturing','Manufacturing','manufacturing',5,'industry-manufacturing','industry.mfg',1,'ACTIVE','BASELINE-CURRENT-SUPPORTED-9',now(),now()),
('PSV','professional-services','Professional Services','professional-services',6,'industry-professional-services','industry.psv',1,'ACTIVE','BASELINE-CURRENT-SUPPORTED-9',now(),now()),
('GOV','government-public-sector','Government & Public Sector','government-public-sector',7,'industry-government','industry.gov',1,'ACTIVE','BASELINE-CURRENT-SUPPORTED-9',now(),now()),
('NGO','ngo-temple-trust','NGO / Temple / Trust','ngo-temple-trust',8,'industry-ngo-trust','industry.ngo',1,'ACTIVE','BASELINE-CURRENT-SUPPORTED-9',now(),now()),
('SFM','security-facility-management','Security & Facility Management','security-facility-management',9,'industry-security-facility','industry.sfm',1,'ACTIVE','BASELINE-CURRENT-SUPPORTED-9',now(),now());

INSERT INTO core_authz.rls_table_registry
(schema_name,table_name,scope_class,policy_class,owner_module,force_rls_required,status,registered_at)
VALUES
('core_authz','compiled_permission_subject','MIXED_SCOPED','RLS-TENANT/RLS-INDUSTRY','Authorization',true,'ACTIVE',now()),
('core_authz','compiled_permission_snapshot','MIXED_SCOPED','RLS-PARENT-SCOPE','Authorization',true,'ACTIVE',now());

REVOKE ALL ON core_authz.compiled_permission_subject,core_authz.compiled_permission_snapshot
  FROM PUBLIC,sbg_app_rw,sbg_worker_rw,sbg_monitor_ro;
GRANT SELECT ON core_authz.compiled_permission_subject,core_authz.compiled_permission_snapshot
  TO sbg_app_rw;
GRANT ALL PRIVILEGES ON core_authz.compiled_permission_subject,core_authz.compiled_permission_snapshot
  TO sbg_migration_admin;

GRANT USAGE ON SCHEMA core_master TO sbg_app_rw,sbg_control_plane_rw,sbg_migration_admin;
REVOKE ALL ON core_master.current_supported_industry
  FROM PUBLIC,sbg_app_rw,sbg_worker_rw,sbg_monitor_ro;
GRANT SELECT ON core_master.current_supported_industry TO sbg_app_rw;
GRANT SELECT,INSERT,UPDATE,DELETE ON core_master.current_supported_industry TO sbg_control_plane_rw;
GRANT ALL PRIVILEGES ON core_master.current_supported_industry TO sbg_migration_admin;

COMMIT;
