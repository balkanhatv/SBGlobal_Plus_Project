-- SBGlobal Plus — Verification 0022: NGO / Temple / Trust suite database wave

DO $$
DECLARE
  missing integer;
BEGIN
  SELECT count(*) INTO missing
  FROM (VALUES
    ('ngo_dms_donor','NGO-DMS'),('ngo_dms_pledge','NGO-DMS'),('ngo_dms_segment','NGO-DMS'),('ngo_dms_engagement','NGO-DMS'),
    ('ngo_dfm_fund','NGO-DFM'),('ngo_dfm_donation','NGO-DFM'),('ngo_dfm_receipt','NGO-DFM'),('ngo_dfm_utilization','NGO-DFM'),
    ('ngo_tam_offering','NGO-TAM'),('ngo_tam_booking','NGO-TAM'),('ngo_tam_event','NGO-TAM'),('ngo_tam_dispatch','NGO-TAM'),
    ('ngo_mvm_membership','NGO-MVM'),('ngo_mvm_volunteer','NGO-MVM'),('ngo_mvm_assignment','NGO-MVM'),('ngo_mvm_hours','NGO-MVM')
  ) AS expected(table_name,owner_module)
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
    JOIN core_authz.rls_table_registry r
      ON r.schema_name=n.nspname AND r.table_name=c.relname
    WHERE n.nspname='ind_ngo'
      AND c.relname=expected.table_name
      AND c.relrowsecurity
      AND c.relforcerowsecurity
      AND r.scope_class='TENANT_INDUSTRY'
      AND r.owner_module=expected.owner_module
      AND r.status='ACTIVE'
  );

  IF missing <> 0 THEN
    RAISE EXCEPTION 'NGO/Temple/Trust RLS/MS registry coverage missing: %', missing;
  END IF;
END $$;

DO $$
DECLARE
  bad integer;
BEGIN
  SELECT count(*) INTO bad
  FROM information_schema.columns c
  WHERE c.table_schema='ind_ngo'
    AND c.table_name IN (
      'ngo_dms_donor','ngo_dms_pledge','ngo_dms_segment','ngo_dms_engagement',
      'ngo_dfm_fund','ngo_dfm_donation','ngo_dfm_receipt','ngo_dfm_utilization',
      'ngo_tam_offering','ngo_tam_booking','ngo_tam_event','ngo_tam_dispatch',
      'ngo_mvm_membership','ngo_mvm_volunteer','ngo_mvm_assignment','ngo_mvm_hours'
    )
    AND c.column_name IN ('tenant_id','industry_context_id')
    AND c.is_nullable <> 'NO';

  IF bad <> 0 THEN
    RAISE EXCEPTION 'NGO/Temple/Trust ownership columns must be NOT NULL: %', bad;
  END IF;
END $$;

DO $$
DECLARE
  ms_count integer;
BEGIN
  SELECT count(DISTINCT owner_module) INTO ms_count
  FROM core_authz.rls_table_registry
  WHERE schema_name='ind_ngo' AND status='ACTIVE';

  IF ms_count <> 4 THEN
    RAISE EXCEPTION 'Expected 4 NGO/Temple/Trust canonical MS owners, found %', ms_count;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid=c.conrelid
    JOIN pg_namespace n ON n.oid=t.relnamespace
    WHERE n.nspname='ind_ngo'
      AND t.relname='ngo_dfm_receipt'
      AND c.contype='f'
      AND pg_get_constraintdef(c.oid) LIKE '%reversal_of%'
  ) THEN
    RAISE EXCEPTION 'Donation receipt reversal lineage FK missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid=c.conrelid
    JOIN pg_namespace n ON n.oid=t.relnamespace
    WHERE n.nspname='ind_ngo'
      AND t.relname='ngo_tam_dispatch'
      AND c.contype='c'
      AND pg_get_constraintdef(c.oid) LIKE '%booking_id%event_id%'
  ) THEN
    RAISE EXCEPTION 'Temple dispatch must reference booking or event';
  END IF;
END $$;
