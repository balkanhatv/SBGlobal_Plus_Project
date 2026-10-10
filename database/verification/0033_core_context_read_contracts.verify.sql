-- SBGlobal Plus — Verification 0033: DD-041/DD-042 Core read-side physical contracts
DO $$
DECLARE active_count integer; registry_count integer;
BEGIN
  SELECT count(*) INTO active_count
  FROM core_master.current_supported_industry WHERE status='ACTIVE';
  IF active_count<>9 THEN
    RAISE EXCEPTION 'expected exactly 9 active Current Supported Industries, found %',active_count;
  END IF;

  IF (SELECT array_agg(industry_code ORDER BY sort_order)
      FROM core_master.current_supported_industry WHERE status='ACTIVE')
     <> ARRAY['HLT','EDU','RTL','HSP','MFG','PSV','GOV','NGO','SFM']::text[] THEN
    RAISE EXCEPTION 'Current Supported Industry catalog code/order mismatch';
  END IF;

  SELECT count(*) INTO registry_count
  FROM core_authz.rls_table_registry
  WHERE (schema_name,table_name) IN (
    ('core_authz','compiled_permission_subject'),
    ('core_authz','compiled_permission_snapshot')
  ) AND status='ACTIVE' AND force_rls_required;
  IF registry_count<>2 THEN
    RAISE EXCEPTION 'compiled permission tables missing active RLS registry entries';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='core_authz' AND c.relname='compiled_permission_subject'
      AND c.relrowsecurity AND c.relforcerowsecurity
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='core_authz' AND c.relname='compiled_permission_snapshot'
      AND c.relrowsecurity AND c.relforcerowsecurity
  ) THEN
    RAISE EXCEPTION 'compiled permission RLS must be enabled and forced';
  END IF;

  IF NOT has_table_privilege('sbg_app_rw','core_authz.compiled_permission_subject','SELECT')
     OR NOT has_table_privilege('sbg_app_rw','core_authz.compiled_permission_snapshot','SELECT')
     OR has_table_privilege('sbg_app_rw','core_authz.compiled_permission_subject','INSERT')
     OR has_table_privilege('sbg_app_rw','core_authz.compiled_permission_snapshot','UPDATE') THEN
    RAISE EXCEPTION 'application compiled-permission grants are not read-only';
  END IF;

  IF NOT has_table_privilege('sbg_app_rw','core_master.current_supported_industry','SELECT')
     OR has_table_privilege('sbg_app_rw','core_master.current_supported_industry','UPDATE')
     OR NOT has_table_privilege('sbg_control_plane_rw','core_master.current_supported_industry','INSERT')
     OR NOT has_table_privilege('sbg_control_plane_rw','core_master.current_supported_industry','UPDATE')
     OR NOT has_table_privilege('sbg_control_plane_rw','core_master.current_supported_industry','DELETE') THEN
    RAISE EXCEPTION 'Industry presentation catalog grants are incorrect';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname='compiled_permission_subject_current_snapshot_fk'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='core_authz'
      AND indexname='compiled_permission_snapshot_one_current_uq'
  ) THEN
    RAISE EXCEPTION 'compiled permission current pointer/version constraints missing';
  END IF;
END $$;
