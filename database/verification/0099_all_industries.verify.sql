-- SBGlobal Plus — Cross-Industry Database Verification
-- Expected: 9 Current Supported Industry schemas, 41 canonical MS owners, 181 canonical Industry tables.

DO $$
DECLARE
  schema_count integer;
  ms_count integer;
  table_count integer;
BEGIN
  SELECT count(*) INTO schema_count
  FROM pg_namespace
  WHERE nspname IN ('ind_hlt','ind_edu','ind_rtl','ind_hsp','ind_mfg','ind_psv','ind_gov','ind_ngo','ind_sfm');

  IF schema_count <> 9 THEN
    RAISE EXCEPTION 'Expected 9 Industry schemas, found %', schema_count;
  END IF;

  SELECT count(DISTINCT owner_module), count(*)
    INTO ms_count, table_count
  FROM core_authz.rls_table_registry
  WHERE schema_name IN ('ind_hlt','ind_edu','ind_rtl','ind_hsp','ind_mfg','ind_psv','ind_gov','ind_ngo','ind_sfm')
    AND status='ACTIVE';

  IF ms_count <> 41 THEN
    RAISE EXCEPTION 'Expected 41 canonical Management-System owners, found %', ms_count;
  END IF;

  IF table_count <> 181 THEN
    RAISE EXCEPTION 'Expected 181 registered canonical Industry tables, found %', table_count;
  END IF;
END $$;

DO $$
DECLARE
  mismatch integer;
BEGIN
  WITH expected(schema_name, ms_count, table_count) AS (
    VALUES
      ('ind_hlt',5,37),
      ('ind_edu',5,20),
      ('ind_rtl',5,20),
      ('ind_hsp',4,16),
      ('ind_mfg',5,20),
      ('ind_psv',5,20),
      ('ind_gov',4,16),
      ('ind_ngo',4,16),
      ('ind_sfm',4,16)
  ),
  actual AS (
    SELECT schema_name,
           count(DISTINCT owner_module)::integer AS ms_count,
           count(*)::integer AS table_count
    FROM core_authz.rls_table_registry
    WHERE schema_name LIKE 'ind_%'
      AND status='ACTIVE'
    GROUP BY schema_name
  )
  SELECT count(*) INTO mismatch
  FROM expected e
  LEFT JOIN actual a USING(schema_name)
  WHERE a.schema_name IS NULL
     OR a.ms_count <> e.ms_count
     OR a.table_count <> e.table_count;

  IF mismatch <> 0 THEN
    RAISE EXCEPTION 'Per-Industry canonical MS/table count mismatch in % schemas', mismatch;
  END IF;
END $$;

DO $$
DECLARE
  missing_rls integer;
BEGIN
  SELECT count(*) INTO missing_rls
  FROM core_authz.rls_table_registry r
  JOIN pg_namespace n ON n.nspname=r.schema_name
  JOIN pg_class c ON c.relnamespace=n.oid AND c.relname=r.table_name
  WHERE r.schema_name LIKE 'ind_%'
    AND r.status='ACTIVE'
    AND (NOT c.relrowsecurity OR NOT c.relforcerowsecurity);

  IF missing_rls <> 0 THEN
    RAISE EXCEPTION 'Industry tables missing forced RLS: %', missing_rls;
  END IF;
END $$;

DO $$
DECLARE
  nullable_ownership integer;
BEGIN
  SELECT count(*) INTO nullable_ownership
  FROM core_authz.rls_table_registry r
  JOIN information_schema.columns c
    ON c.table_schema=r.schema_name
   AND c.table_name=r.table_name
  WHERE r.schema_name LIKE 'ind_%'
    AND r.status='ACTIVE'
    AND c.column_name IN ('tenant_id','industry_context_id')
    AND c.is_nullable <> 'NO';

  IF nullable_ownership <> 0 THEN
    RAISE EXCEPTION 'Industry ownership columns unexpectedly nullable: %', nullable_ownership;
  END IF;
END $$;

DO $$
DECLARE
  missing_ownership_columns integer;
BEGIN
  WITH industry_tables AS (
    SELECT schema_name, table_name
    FROM core_authz.rls_table_registry
    WHERE schema_name LIKE 'ind_%'
      AND status='ACTIVE'
  )
  SELECT count(*) INTO missing_ownership_columns
  FROM industry_tables t
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema=t.schema_name AND c.table_name=t.table_name AND c.column_name='tenant_id'
  )
  OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema=t.schema_name AND c.table_name=t.table_name AND c.column_name='industry_context_id'
  );

  IF missing_ownership_columns <> 0 THEN
    RAISE EXCEPTION 'Industry tables missing tenant/industry ownership columns: %', missing_ownership_columns;
  END IF;
END $$;

DO $$
DECLARE
  bad_owner integer;
BEGIN
  SELECT count(*) INTO bad_owner
  FROM core_authz.rls_table_registry
  WHERE schema_name LIKE 'ind_%'
    AND status='ACTIVE'
    AND owner_module NOT IN (
      'HLT-HMS','HLT-LIS','HLT-RIS','HLT-PMS','HLT-CMS',
      'EDU-SMS','EDU-CUM','EDU-CTM','EDU-LMS','EDU-EMS',
      'RTL-RSM','RTL-POS','RTL-IWM','RTL-OMS','RTL-MKT',
      'HSP-HMS','HSP-RMS','HSP-BEM','HSP-RBM',
      'MFG-PMS','MFG-IWM','MFG-QMS','MFG-PRO','MFG-MMS',
      'PSV-CRM','PSV-PJM','PSV-SDM','PSV-RTM','PSV-SGM',
      'GOV-CSM','GOV-CFM','GOV-PLM','GOV-RTM',
      'NGO-DMS','NGO-DFM','NGO-TAM','NGO-MVM',
      'SFM-SGM','SFM-PMS','SFM-VMS','SFM-FMM'
    );

  IF bad_owner <> 0 THEN
    RAISE EXCEPTION 'Non-canonical Industry MS owner IDs present: %', bad_owner;
  END IF;
END $$;

DO $$
DECLARE
  prefix_mismatch integer;
BEGIN
  SELECT count(*) INTO prefix_mismatch
  FROM core_authz.rls_table_registry
  WHERE schema_name LIKE 'ind_%'
    AND status='ACTIVE'
    AND NOT (
      (schema_name='ind_hlt' AND owner_module LIKE 'HLT-%')
      OR (schema_name='ind_edu' AND owner_module LIKE 'EDU-%')
      OR (schema_name='ind_rtl' AND owner_module LIKE 'RTL-%')
      OR (schema_name='ind_hsp' AND owner_module LIKE 'HSP-%')
      OR (schema_name='ind_mfg' AND owner_module LIKE 'MFG-%')
      OR (schema_name='ind_psv' AND owner_module LIKE 'PSV-%')
      OR (schema_name='ind_gov' AND owner_module LIKE 'GOV-%')
      OR (schema_name='ind_ngo' AND owner_module LIKE 'NGO-%')
      OR (schema_name='ind_sfm' AND owner_module LIKE 'SFM-%')
    );

  IF prefix_mismatch <> 0 THEN
    RAISE EXCEPTION 'Cross-Industry owner/schema leakage detected: %', prefix_mismatch;
  END IF;
END $$;

-- Equal-first-class means every Current Supported Industry has explicit registered tables;
-- it does not require equal table counts.
SELECT schema_name,
       count(DISTINCT owner_module) AS management_systems,
       count(*) AS registered_tables
FROM core_authz.rls_table_registry
WHERE schema_name LIKE 'ind_%'
  AND status='ACTIVE'
GROUP BY schema_name
ORDER BY schema_name;
