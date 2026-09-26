-- F-14 / A-04 / DD-04: published PlanVersion content is immutable.
-- Additive audit correction; earlier migrations and existing rows are preserved.
BEGIN;

CREATE FUNCTION core_commercial.enforce_published_plan_version_immutability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path=pg_catalog
AS $$
BEGIN
  -- published_at also protects a previously published row regardless of status.
  -- RETIRED legacy rows remain protected even if their publication marker is null.
  IF OLD.published_at IS NOT NULL OR OLD.status IN ('ACTIVE','RETIRED') THEN
    IF NEW.status='DRAFT'
       OR (to_jsonb(NEW)-'status') IS DISTINCT FROM (to_jsonb(OLD)-'status') THEN
      RAISE EXCEPTION 'published PlanVersion content is immutable; publish a new version'
        USING ERRCODE='23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION core_commercial.enforce_published_plan_version_immutability()
FROM PUBLIC;

CREATE TRIGGER published_plan_version_immutable
  BEFORE UPDATE ON core_commercial.plan_version
  FOR EACH ROW EXECUTE FUNCTION core_commercial.enforce_published_plan_version_immutability();

-- Runtime catalog management preserves history through retirement, not deletion.
-- Administrative migration/test-fixture ownership remains separate from runtime.
REVOKE DELETE,TRUNCATE ON core_commercial.plan_version
FROM PUBLIC,sbg_control_plane_rw;

COMMIT;
