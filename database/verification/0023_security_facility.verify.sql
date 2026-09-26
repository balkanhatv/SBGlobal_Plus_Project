-- SBGlobal Plus — Verification 0023: Security & Facility suite database wave

DO $$
DECLARE
  missing integer;
BEGIN
  SELECT count(*) INTO missing
  FROM (VALUES
    ('sfm_sgm_post','SFM-SGM'),('sfm_sgm_roster','SFM-SGM'),('sfm_sgm_attendance','SFM-SGM'),('sfm_sgm_handover','SFM-SGM'),
    ('sfm_pms_route','SFM-PMS'),('sfm_pms_round','SFM-PMS'),('sfm_pms_scan','SFM-PMS'),('sfm_pms_incident','SFM-PMS'),
    ('sfm_vms_visitor','SFM-VMS'),('sfm_vms_visit','SFM-VMS'),('sfm_vms_badge','SFM-VMS'),('sfm_vms_approval','SFM-VMS'),
    ('sfm_fmm_asset','SFM-FMM'),('sfm_fmm_ticket','SFM-FMM'),('sfm_fmm_work_order','SFM-FMM'),('sfm_fmm_pm_schedule','SFM-FMM')
  ) AS expected(table_name,owner_module)
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
    JOIN core_authz.rls_table_registry r
      ON r.schema_name=n.nspname AND r.table_name=c.relname
    WHERE n.nspname='ind_sfm'
      AND c.relname=expected.table_name
      AND c.relrowsecurity
      AND c.relforcerowsecurity
      AND r.scope_class='TENANT_INDUSTRY'
      AND r.owner_module=expected.owner_module
      AND r.status='ACTIVE'
  );

  IF missing <> 0 THEN
    RAISE EXCEPTION 'Security/Facility RLS/MS registry coverage missing: %', missing;
  END IF;
END $$;

DO $$
DECLARE
  bad integer;
BEGIN
  SELECT count(*) INTO bad
  FROM information_schema.columns c
  WHERE c.table_schema='ind_sfm'
    AND c.table_name IN (
      'sfm_sgm_post','sfm_sgm_roster','sfm_sgm_attendance','sfm_sgm_handover',
      'sfm_pms_route','sfm_pms_round','sfm_pms_scan','sfm_pms_incident',
      'sfm_vms_visitor','sfm_vms_visit','sfm_vms_badge','sfm_vms_approval',
      'sfm_fmm_asset','sfm_fmm_ticket','sfm_fmm_work_order','sfm_fmm_pm_schedule'
    )
    AND c.column_name IN ('tenant_id','industry_context_id')
    AND c.is_nullable <> 'NO';

  IF bad <> 0 THEN
    RAISE EXCEPTION 'Security/Facility ownership columns must be NOT NULL: %', bad;
  END IF;
END $$;

DO $$
DECLARE
  ms_count integer;
BEGIN
  SELECT count(DISTINCT owner_module) INTO ms_count
  FROM core_authz.rls_table_registry
  WHERE schema_name='ind_sfm' AND status='ACTIVE';

  IF ms_count <> 4 THEN
    RAISE EXCEPTION 'Expected 4 Security/Facility canonical MS owners, found %', ms_count;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='ind_sfm'
      AND tablename='sfm_pms_scan'
      AND indexdef LIKE '%round_id%checkpoint_code%scanned_at%'
  ) THEN
    RAISE EXCEPTION 'Patrol scan attribution uniqueness missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid=c.conrelid
    JOIN pg_namespace n ON n.oid=t.relnamespace
    WHERE n.nspname='ind_sfm'
      AND t.relname='sfm_vms_badge'
      AND c.contype='c'
      AND pg_get_constraintdef(c.oid) LIKE '%expires_at%issued_at%'
  ) THEN
    RAISE EXCEPTION 'Visitor badge expiry constraint missing';
  END IF;
END $$;
