-- SBGlobal Plus — Verification 0019: Manufacturing suite database wave

DO $$
DECLARE
  missing integer;
BEGIN
  SELECT count(*) INTO missing
  FROM (VALUES
    ('mfg_pms_bom','MFG-PMS'),('mfg_pms_routing','MFG-PMS'),('mfg_pms_production_order','MFG-PMS'),('mfg_pms_operation_exec','MFG-PMS'),
    ('mfg_iwm_balance','MFG-IWM'),('mfg_iwm_movement','MFG-IWM'),('mfg_iwm_reservation','MFG-IWM'),('mfg_iwm_cycle_count','MFG-IWM'),
    ('mfg_qms_inspection_plan','MFG-QMS'),('mfg_qms_inspection','MFG-QMS'),('mfg_qms_ncr','MFG-QMS'),('mfg_qms_capa','MFG-QMS'),
    ('mfg_pro_pr','MFG-PRO'),('mfg_pro_po','MFG-PRO'),('mfg_pro_grn','MFG-PRO'),('mfg_pro_match','MFG-PRO'),
    ('mfg_mms_asset','MFG-MMS'),('mfg_mms_schedule','MFG-MMS'),('mfg_mms_work_order','MFG-MMS'),('mfg_mms_downtime','MFG-MMS')
  ) AS expected(table_name,owner_module)
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
    JOIN core_authz.rls_table_registry r
      ON r.schema_name=n.nspname AND r.table_name=c.relname
    WHERE n.nspname='ind_mfg'
      AND c.relname=expected.table_name
      AND c.relrowsecurity
      AND c.relforcerowsecurity
      AND r.scope_class='TENANT_INDUSTRY'
      AND r.owner_module=expected.owner_module
      AND r.status='ACTIVE'
  );

  IF missing <> 0 THEN
    RAISE EXCEPTION 'Manufacturing RLS/MS registry coverage missing: %', missing;
  END IF;
END $$;

DO $$
DECLARE
  bad integer;
BEGIN
  SELECT count(*) INTO bad
  FROM information_schema.columns c
  WHERE c.table_schema='ind_mfg'
    AND c.table_name IN (
      'mfg_pms_bom','mfg_pms_routing','mfg_pms_production_order','mfg_pms_operation_exec',
      'mfg_iwm_balance','mfg_iwm_movement','mfg_iwm_reservation','mfg_iwm_cycle_count',
      'mfg_qms_inspection_plan','mfg_qms_inspection','mfg_qms_ncr','mfg_qms_capa',
      'mfg_pro_pr','mfg_pro_po','mfg_pro_grn','mfg_pro_match',
      'mfg_mms_asset','mfg_mms_schedule','mfg_mms_work_order','mfg_mms_downtime'
    )
    AND c.column_name IN ('tenant_id','industry_context_id')
    AND c.is_nullable <> 'NO';

  IF bad <> 0 THEN
    RAISE EXCEPTION 'Manufacturing ownership columns must be NOT NULL: %', bad;
  END IF;
END $$;

DO $$
DECLARE
  ms_count integer;
BEGIN
  SELECT count(DISTINCT owner_module) INTO ms_count
  FROM core_authz.rls_table_registry
  WHERE schema_name='ind_mfg' AND status='ACTIVE';

  IF ms_count <> 5 THEN
    RAISE EXCEPTION 'Expected 5 Manufacturing canonical MS owners, found %', ms_count;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='ind_mfg'
      AND indexname='mfg_iwm_balance_scope_item_lot_uq'
  ) THEN
    RAISE EXCEPTION 'Manufacturing lot/serial balance uniqueness index missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='ind_mfg'
      AND indexname='mfg_mms_downtime_one_open_idx'
  ) THEN
    RAISE EXCEPTION 'Manufacturing one-open-downtime invariant missing';
  END IF;
END $$;
