-- SBGlobal Plus — Migration 0045: governed Commercial plan-change evidence
-- DD-062 physical assessment/remediation/route-resolution persistence and producer boundaries.
BEGIN;

CREATE TYPE core_commercial.plan_change_effective_timing AS ENUM ('IMMEDIATE','NEXT_RENEWAL');
CREATE TYPE core_commercial.plan_change_route_class AS ENUM ('SELF_SERVE','SALES_ASSISTED');
CREATE TYPE core_commercial.plan_change_remediation_state AS ENUM ('NOT_REQUIRED','PENDING','SATISFIED');
CREATE TYPE core_commercial.plan_change_resolution_state AS ENUM ('PENDING','SATISFIED','REJECTED');

CREATE TABLE core_commercial.plan_change_assessment (
  assessment_id uuid NOT NULL,
  assessment_version integer NOT NULL CHECK (assessment_version > 0),
  tenant_id uuid NOT NULL,
  subscription_id uuid NOT NULL,
  source_plan_version_id uuid NOT NULL REFERENCES core_commercial.plan_version(id),
  target_plan_version_id uuid NOT NULL REFERENCES core_commercial.plan_version(id),
  effective_timing core_commercial.plan_change_effective_timing NOT NULL,
  expected_subscription_version bigint NOT NULL CHECK (expected_subscription_version > 0),
  route_class core_commercial.plan_change_route_class NOT NULL,
  route_policy_id uuid NOT NULL REFERENCES core_commercial.commercial_route_policy(id),
  route_policy_version integer NOT NULL CHECK (route_policy_version > 0),
  impact_reference text NOT NULL,
  entitlement_diff_reference text NOT NULL,
  blocking_impact_codes text[] NOT NULL DEFAULT '{}'::text[],
  remediation_state core_commercial.plan_change_remediation_state NOT NULL,
  source_fingerprint text NOT NULL,
  correlation_id uuid NOT NULL,
  created_at timestamptz NOT NULL,
  PRIMARY KEY (assessment_id,assessment_version),
  UNIQUE (tenant_id,assessment_id,assessment_version),
  FOREIGN KEY (tenant_id,subscription_id)
    REFERENCES core_commercial.subscription(tenant_id,id),
  CHECK (source_plan_version_id <> target_plan_version_id),
  CHECK (length(impact_reference) BETWEEN 1 AND 512),
  CHECK (length(entitlement_diff_reference) BETWEEN 1 AND 512),
  CHECK (length(source_fingerprint) BETWEEN 16 AND 512),
  CHECK (cardinality(blocking_impact_codes) <= 64),
  CHECK (array_position(blocking_impact_codes,NULL) IS NULL),
  CHECK (
    (cardinality(blocking_impact_codes)=0 AND remediation_state IN ('NOT_REQUIRED','SATISFIED'))
    OR (cardinality(blocking_impact_codes)>0 AND remediation_state='PENDING')
  )
);

CREATE INDEX plan_change_assessment_subscription_idx
  ON core_commercial.plan_change_assessment(
    tenant_id,subscription_id,assessment_id,assessment_version DESC
  );

CREATE TABLE core_commercial.plan_change_remediation_evidence (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  assessment_id uuid NOT NULL,
  assessment_version integer NOT NULL,
  evidence_version integer NOT NULL CHECK (evidence_version > 0),
  remediation_state core_commercial.plan_change_remediation_state NOT NULL,
  evidence_reference text NOT NULL,
  producer_module text NOT NULL,
  correlation_id uuid NOT NULL,
  resolved_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL,
  UNIQUE (tenant_id,assessment_id,assessment_version,evidence_version),
  FOREIGN KEY (tenant_id,assessment_id,assessment_version)
    REFERENCES core_commercial.plan_change_assessment(tenant_id,assessment_id,assessment_version),
  CHECK (remediation_state='SATISFIED'),
  CHECK (producer_module='Commercial'),
  CHECK (length(evidence_reference) BETWEEN 1 AND 512),
  CHECK (resolved_at >= created_at)
);

CREATE TABLE core_commercial.plan_change_route_resolution (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  assessment_id uuid NOT NULL,
  assessment_version integer NOT NULL,
  route_class core_commercial.plan_change_route_class NOT NULL,
  resolution_state core_commercial.plan_change_resolution_state NOT NULL,
  evidence_reference text,
  billing_preview_reference text,
  effective_at timestamptz,
  producer_module text NOT NULL,
  evidence_version integer NOT NULL CHECK (evidence_version > 0),
  resolved_at timestamptz,
  correlation_id uuid NOT NULL,
  created_at timestamptz NOT NULL,
  UNIQUE (tenant_id,assessment_id,assessment_version,evidence_version),
  FOREIGN KEY (tenant_id,assessment_id,assessment_version)
    REFERENCES core_commercial.plan_change_assessment(tenant_id,assessment_id,assessment_version),
  CHECK (
    (route_class='SELF_SERVE' AND producer_module='Billing')
    OR (route_class='SALES_ASSISTED' AND producer_module='Workflow')
  ),
  CHECK (evidence_reference IS NULL OR length(evidence_reference) BETWEEN 1 AND 512),
  CHECK (billing_preview_reference IS NULL OR length(billing_preview_reference) BETWEEN 1 AND 512),
  CHECK (
    (resolution_state='PENDING' AND resolved_at IS NULL)
    OR (resolution_state IN ('SATISFIED','REJECTED') AND resolved_at IS NOT NULL AND evidence_reference IS NOT NULL)
  ),
  CHECK (resolved_at IS NULL OR resolved_at >= created_at)
);

CREATE INDEX plan_change_route_resolution_latest_idx
  ON core_commercial.plan_change_route_resolution(
    tenant_id,assessment_id,assessment_version,evidence_version DESC
  );

CREATE OR REPLACE FUNCTION core_commercial.validate_plan_change_assessment_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=pg_catalog
AS $$
DECLARE
  subscription_row record;
  target_row record;
  prior_row record;
  max_version integer;
BEGIN
  SELECT subscription.plan_version_id,subscription.version
  INTO subscription_row
  FROM core_commercial.subscription subscription
  WHERE subscription.tenant_id=NEW.tenant_id
    AND subscription.id=NEW.subscription_id
  FOR SHARE;

  IF NOT FOUND
     OR subscription_row.plan_version_id<>NEW.source_plan_version_id
     OR subscription_row.version<>NEW.expected_subscription_version THEN
    RAISE EXCEPTION 'plan-change assessment source Subscription is stale'
      USING ERRCODE='40001';
  END IF;

  SELECT version.route_policy_id,route.version AS route_policy_version,
         route.self_serve_enabled,route.sales_assisted_enabled
  INTO target_row
  FROM core_commercial.plan_version version
  JOIN core_commercial.plan plan
    ON plan.id=version.plan_id AND plan.status='ACTIVE'
  JOIN core_commercial.commercial_route_policy route
    ON route.id=version.route_policy_id AND route.status='ACTIVE'
  WHERE version.id=NEW.target_plan_version_id
    AND version.status='ACTIVE'
    AND (version.effective_from IS NULL OR version.effective_from<=NEW.created_at)
    AND (version.effective_to IS NULL OR version.effective_to>NEW.created_at);

  IF NOT FOUND
     OR target_row.route_policy_id<>NEW.route_policy_id
     OR target_row.route_policy_version<>NEW.route_policy_version
     OR (NEW.route_class='SELF_SERVE' AND NOT target_row.self_serve_enabled)
     OR (NEW.route_class='SALES_ASSISTED' AND NOT target_row.sales_assisted_enabled) THEN
    RAISE EXCEPTION 'plan-change assessment target route is invalid'
      USING ERRCODE='23514';
  END IF;

  SELECT max(assessment_version) INTO max_version
  FROM core_commercial.plan_change_assessment
  WHERE tenant_id=NEW.tenant_id AND assessment_id=NEW.assessment_id;

  IF NEW.assessment_version=1 THEN
    IF max_version IS NOT NULL OR NEW.remediation_state='SATISFIED' THEN
      RAISE EXCEPTION 'initial plan-change assessment version is invalid'
        USING ERRCODE='23514';
    END IF;
  ELSE
    IF max_version IS DISTINCT FROM NEW.assessment_version-1 THEN
      RAISE EXCEPTION 'plan-change assessment versions must be contiguous'
        USING ERRCODE='23514';
    END IF;

    SELECT * INTO prior_row
    FROM core_commercial.plan_change_assessment
    WHERE tenant_id=NEW.tenant_id
      AND assessment_id=NEW.assessment_id
      AND assessment_version=NEW.assessment_version-1;

    IF prior_row.subscription_id<>NEW.subscription_id
       OR prior_row.source_plan_version_id<>NEW.source_plan_version_id
       OR prior_row.target_plan_version_id<>NEW.target_plan_version_id
       OR prior_row.effective_timing<>NEW.effective_timing
       OR prior_row.expected_subscription_version<>NEW.expected_subscription_version THEN
      RAISE EXCEPTION 'plan-change assessment core binding cannot change across versions'
        USING ERRCODE='23514';
    END IF;

    IF NEW.remediation_state='SATISFIED' AND NOT EXISTS (
      SELECT 1
      FROM core_commercial.plan_change_remediation_evidence evidence
      WHERE evidence.tenant_id=NEW.tenant_id
        AND evidence.assessment_id=NEW.assessment_id
        AND evidence.assessment_version=NEW.assessment_version-1
        AND evidence.remediation_state='SATISFIED'
    ) THEN
      RAISE EXCEPTION 'remediation-satisfied assessment requires prior server evidence'
        USING ERRCODE='23514';
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM unnest(NEW.blocking_impact_codes) AS impact(code)
    WHERE impact.code='' OR length(impact.code)>128
  ) OR (
    SELECT count(*)<>count(DISTINCT impact.code)
    FROM unnest(NEW.blocking_impact_codes) AS impact(code)
  ) THEN
    RAISE EXCEPTION 'blocking impact codes are invalid'
      USING ERRCODE='23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER plan_change_assessment_insert_guard
  BEFORE INSERT ON core_commercial.plan_change_assessment
  FOR EACH ROW EXECUTE FUNCTION core_commercial.validate_plan_change_assessment_insert();

CREATE OR REPLACE FUNCTION core_commercial.validate_plan_change_remediation_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=pg_catalog
AS $$
DECLARE
  expected_version integer;
BEGIN
  SELECT COALESCE(max(evidence_version),0)+1 INTO expected_version
  FROM core_commercial.plan_change_remediation_evidence
  WHERE tenant_id=NEW.tenant_id
    AND assessment_id=NEW.assessment_id
    AND assessment_version=NEW.assessment_version;

  IF NEW.evidence_version<>expected_version THEN
    RAISE EXCEPTION 'remediation evidence versions must be contiguous'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER plan_change_remediation_insert_guard
  BEFORE INSERT ON core_commercial.plan_change_remediation_evidence
  FOR EACH ROW EXECUTE FUNCTION core_commercial.validate_plan_change_remediation_insert();

CREATE OR REPLACE FUNCTION core_commercial.validate_plan_change_resolution_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=pg_catalog
AS $$
DECLARE
  assessment_row record;
  expected_version integer;
BEGIN
  SELECT route_class,effective_timing,created_at
  INTO assessment_row
  FROM core_commercial.plan_change_assessment
  WHERE tenant_id=NEW.tenant_id
    AND assessment_id=NEW.assessment_id
    AND assessment_version=NEW.assessment_version;

  IF NOT FOUND OR assessment_row.route_class<>NEW.route_class THEN
    RAISE EXCEPTION 'route resolution does not match assessment route'
      USING ERRCODE='23514';
  END IF;

  SELECT COALESCE(max(evidence_version),0)+1 INTO expected_version
  FROM core_commercial.plan_change_route_resolution
  WHERE tenant_id=NEW.tenant_id
    AND assessment_id=NEW.assessment_id
    AND assessment_version=NEW.assessment_version;

  IF NEW.evidence_version<>expected_version THEN
    RAISE EXCEPTION 'route resolution evidence versions must be contiguous'
      USING ERRCODE='23514';
  END IF;

  IF NEW.route_class='SALES_ASSISTED' AND NEW.billing_preview_reference IS NOT NULL THEN
    RAISE EXCEPTION 'sales-assisted resolution cannot carry Billing preview authority'
      USING ERRCODE='23514';
  END IF;

  IF NEW.resolution_state='SATISFIED'
     AND assessment_row.effective_timing='NEXT_RENEWAL'
     AND NEW.effective_at IS NULL THEN
    RAISE EXCEPTION 'next-renewal satisfied resolution requires server-owned effective_at'
      USING ERRCODE='23514';
  END IF;

  IF NEW.effective_at IS NOT NULL AND NEW.effective_at<assessment_row.created_at THEN
    RAISE EXCEPTION 'route resolution effective_at predates assessment'
      USING ERRCODE='23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER plan_change_resolution_insert_guard
  BEFORE INSERT ON core_commercial.plan_change_route_resolution
  FOR EACH ROW EXECUTE FUNCTION core_commercial.validate_plan_change_resolution_insert();

ALTER TABLE core_commercial.plan_change_assessment ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_commercial.plan_change_assessment FORCE ROW LEVEL SECURITY;
ALTER TABLE core_commercial.plan_change_remediation_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_commercial.plan_change_remediation_evidence FORCE ROW LEVEL SECURITY;
ALTER TABLE core_commercial.plan_change_route_resolution ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_commercial.plan_change_route_resolution FORCE ROW LEVEL SECURITY;

CREATE POLICY plan_change_assessment_tenant_select
  ON core_commercial.plan_change_assessment
  FOR SELECT
  USING (tenant_id=core_tenancy.current_tenant_id());

CREATE POLICY plan_change_assessment_commercial_insert
  ON core_commercial.plan_change_assessment
  FOR INSERT TO sbg_commercial_transition_compiler_rw
  WITH CHECK (false);

CREATE POLICY plan_change_remediation_tenant_select
  ON core_commercial.plan_change_remediation_evidence
  FOR SELECT
  USING (tenant_id=core_tenancy.current_tenant_id());

CREATE POLICY plan_change_resolution_tenant_select
  ON core_commercial.plan_change_route_resolution
  FOR SELECT
  USING (tenant_id=core_tenancy.current_tenant_id());

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='sbg_commercial_plan_change_evidence_rw') THEN
    CREATE ROLE sbg_commercial_plan_change_evidence_rw
      NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='sbg_billing_plan_change_evidence_rw') THEN
    CREATE ROLE sbg_billing_plan_change_evidence_rw
      NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
END $$;

ALTER ROLE sbg_commercial_plan_change_evidence_rw
  NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
ALTER ROLE sbg_billing_plan_change_evidence_rw
  NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;

DROP POLICY plan_change_assessment_commercial_insert
  ON core_commercial.plan_change_assessment;

CREATE POLICY plan_change_assessment_commercial_insert
  ON core_commercial.plan_change_assessment
  FOR INSERT TO sbg_commercial_plan_change_evidence_rw
  WITH CHECK (tenant_id=core_tenancy.current_tenant_id());

CREATE POLICY plan_change_remediation_commercial_insert
  ON core_commercial.plan_change_remediation_evidence
  FOR INSERT TO sbg_commercial_plan_change_evidence_rw
  WITH CHECK (
    tenant_id=core_tenancy.current_tenant_id()
    AND producer_module='Commercial'
  );

CREATE POLICY plan_change_resolution_billing_insert
  ON core_commercial.plan_change_route_resolution
  FOR INSERT TO sbg_billing_plan_change_evidence_rw
  WITH CHECK (
    tenant_id=core_tenancy.current_tenant_id()
    AND route_class='SELF_SERVE'
    AND producer_module='Billing'
  );

CREATE POLICY plan_change_resolution_workflow_insert
  ON core_commercial.plan_change_route_resolution
  FOR INSERT TO sbg_workflow_worker_rw
  WITH CHECK (
    tenant_id=core_tenancy.current_tenant_id()
    AND route_class='SALES_ASSISTED'
    AND producer_module='Workflow'
  );

GRANT USAGE ON SCHEMA core_commercial,core_tenancy
  TO sbg_commercial_plan_change_evidence_rw,sbg_billing_plan_change_evidence_rw;
GRANT USAGE ON SCHEMA core_commercial TO sbg_workflow_worker_rw;

GRANT SELECT ON
  core_commercial.subscription,
  core_commercial.plan_version,
  core_commercial.commercial_route_policy,
  core_commercial.plan_change_assessment,
  core_commercial.plan_change_remediation_evidence,
  core_commercial.plan_change_route_resolution
TO sbg_commercial_plan_change_evidence_rw;

GRANT INSERT ON
  core_commercial.plan_change_assessment,
  core_commercial.plan_change_remediation_evidence
TO sbg_commercial_plan_change_evidence_rw;

GRANT SELECT ON core_commercial.plan_change_assessment
TO sbg_billing_plan_change_evidence_rw,sbg_workflow_worker_rw;

GRANT INSERT ON core_commercial.plan_change_route_resolution
TO sbg_billing_plan_change_evidence_rw,sbg_workflow_worker_rw;

GRANT SELECT ON
  core_commercial.plan_change_assessment,
  core_commercial.plan_change_remediation_evidence,
  core_commercial.plan_change_route_resolution
TO sbg_commercial_transition_compiler_rw;

REVOKE ALL ON
  core_commercial.plan_change_assessment,
  core_commercial.plan_change_remediation_evidence,
  core_commercial.plan_change_route_resolution
FROM PUBLIC,sbg_app_rw,sbg_worker_rw,sbg_control_plane_rw;

REVOKE UPDATE,DELETE ON
  core_commercial.plan_change_assessment,
  core_commercial.plan_change_remediation_evidence,
  core_commercial.plan_change_route_resolution
FROM sbg_commercial_plan_change_evidence_rw,
     sbg_billing_plan_change_evidence_rw,
     sbg_workflow_worker_rw,
     sbg_commercial_transition_compiler_rw;

REVOKE INSERT ON core_commercial.plan_change_route_resolution
FROM sbg_commercial_plan_change_evidence_rw,sbg_commercial_transition_compiler_rw;
REVOKE INSERT ON
  core_commercial.plan_change_assessment,
  core_commercial.plan_change_remediation_evidence
FROM sbg_billing_plan_change_evidence_rw,sbg_workflow_worker_rw,sbg_commercial_transition_compiler_rw;

INSERT INTO core_authz.rls_table_registry
(schema_name,table_name,scope_class,policy_class,owner_module,force_rls_required,registered_at)
VALUES
('core_commercial','plan_change_assessment','TENANT_CORE','RLS-TENANT-COMMERCIAL-EVIDENCE','Commercial',true,now()),
('core_commercial','plan_change_remediation_evidence','TENANT_CORE','RLS-TENANT-APPEND-ONLY','Commercial',true,now()),
('core_commercial','plan_change_route_resolution','TENANT_CORE','RLS-TENANT-PRODUCER-BOUND','Commercial',true,now());

COMMIT;
