-- SBGlobal Plus — Migration 0047: atomic plan-change evidence/publication serialization
-- DD-078: serialize DD-066 evidence appends with DD-065 publication for one Tenant+assessment.
BEGIN;

CREATE OR REPLACE FUNCTION core_commercial.acquire_plan_change_assessment_lock(
  p_tenant_id uuid,
  p_assessment_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=pg_catalog
AS $$
BEGIN
  IF p_tenant_id IS NULL OR p_assessment_id IS NULL THEN
    RAISE EXCEPTION 'plan-change assessment lock requires Tenant and assessment'
      USING ERRCODE='23514';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      p_tenant_id::text || ':' || p_assessment_id::text,
      78078
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION
  core_commercial.acquire_plan_change_assessment_lock(uuid,uuid)
FROM PUBLIC;

GRANT EXECUTE ON FUNCTION
  core_commercial.acquire_plan_change_assessment_lock(uuid,uuid)
TO sbg_commercial_transition_compiler_rw;

CREATE OR REPLACE FUNCTION core_commercial.serialize_plan_change_evidence_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=pg_catalog
AS $$
BEGIN
  PERFORM core_commercial.acquire_plan_change_assessment_lock(
    NEW.tenant_id,
    NEW.assessment_id
  );
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION
  core_commercial.serialize_plan_change_evidence_insert()
FROM PUBLIC;

CREATE TRIGGER a_plan_change_evidence_serialization_guard
  BEFORE INSERT ON core_commercial.plan_change_assessment
  FOR EACH ROW EXECUTE FUNCTION core_commercial.serialize_plan_change_evidence_insert();

CREATE TRIGGER a_plan_change_evidence_serialization_guard
  BEFORE INSERT ON core_commercial.plan_change_remediation_evidence
  FOR EACH ROW EXECUTE FUNCTION core_commercial.serialize_plan_change_evidence_insert();

CREATE TRIGGER a_plan_change_evidence_serialization_guard
  BEFORE INSERT ON core_commercial.plan_change_route_resolution
  FOR EACH ROW EXECUTE FUNCTION core_commercial.serialize_plan_change_evidence_insert();

COMMIT;
