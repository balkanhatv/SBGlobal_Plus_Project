-- SBGlobal Plus — Verification 0018: Hospitality suite database wave

DO $$
DECLARE
  missing integer;
BEGIN
  SELECT count(*) INTO missing
  FROM (VALUES
    ('hsp_hms_stay','HSP-HMS'),('hsp_hms_folio','HSP-HMS'),('hsp_hms_housekeeping','HSP-HMS'),('hsp_hms_folio_entry','HSP-HMS'),
    ('hsp_rms_order','HSP-RMS'),('hsp_rms_line','HSP-RMS'),('hsp_rms_kot','HSP-RMS'),('hsp_rms_reversal','HSP-RMS'),
    ('hsp_bem_enquiry','HSP-BEM'),('hsp_bem_booking','HSP-BEM'),('hsp_bem_function_sheet','HSP-BEM'),('hsp_bem_charge','HSP-BEM'),
    ('hsp_rbm_rate_plan','HSP-RBM'),('hsp_rbm_reservation','HSP-RBM'),('hsp_rbm_availability','HSP-RBM'),('hsp_rbm_channel_alloc','HSP-RBM')
  ) AS expected(table_name,owner_module)
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
    JOIN core_authz.rls_table_registry r
      ON r.schema_name=n.nspname AND r.table_name=c.relname
    WHERE n.nspname='ind_hsp'
      AND c.relname=expected.table_name
      AND c.relrowsecurity
      AND c.relforcerowsecurity
      AND r.scope_class='TENANT_INDUSTRY'
      AND r.owner_module=expected.owner_module
      AND r.status='ACTIVE'
  );

  IF missing <> 0 THEN
    RAISE EXCEPTION 'Hospitality RLS/MS registry coverage missing: %', missing;
  END IF;
END $$;

DO $$
DECLARE
  bad integer;
BEGIN
  SELECT count(*) INTO bad
  FROM information_schema.columns c
  WHERE c.table_schema='ind_hsp'
    AND c.table_name IN (
      'hsp_hms_stay','hsp_hms_folio','hsp_hms_housekeeping','hsp_hms_folio_entry',
      'hsp_rms_order','hsp_rms_line','hsp_rms_kot','hsp_rms_reversal',
      'hsp_bem_enquiry','hsp_bem_booking','hsp_bem_function_sheet','hsp_bem_charge',
      'hsp_rbm_rate_plan','hsp_rbm_reservation','hsp_rbm_availability','hsp_rbm_channel_alloc'
    )
    AND c.column_name IN ('tenant_id','industry_context_id')
    AND c.is_nullable <> 'NO';

  IF bad <> 0 THEN
    RAISE EXCEPTION 'Hospitality ownership columns must be NOT NULL: %', bad;
  END IF;
END $$;

DO $$
DECLARE
  ms_count integer;
BEGIN
  SELECT count(DISTINCT owner_module) INTO ms_count
  FROM core_authz.rls_table_registry
  WHERE schema_name='ind_hsp' AND status='ACTIVE';

  IF ms_count <> 4 THEN
    RAISE EXCEPTION 'Expected 4 Hospitality canonical MS owners, found %', ms_count;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='ind_hsp'
      AND tablename='hsp_hms_folio'
      AND indexdef LIKE '%folio_no%'
  ) THEN
    RAISE EXCEPTION 'Hotel folio business-number uniqueness/index missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid=c.conrelid
    JOIN pg_namespace n ON n.oid=t.relnamespace
    WHERE n.nspname='ind_hsp'
      AND t.relname='hsp_hms_folio_entry'
      AND c.contype='f'
      AND pg_get_constraintdef(c.oid) LIKE '%reversal_of%'
  ) THEN
    RAISE EXCEPTION 'Hotel folio reversal lineage FK missing';
  END IF;
END $$;
