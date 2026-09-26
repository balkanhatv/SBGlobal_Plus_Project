-- SBGlobal Plus — Verification 0017: Government suite database wave

DO $$
DECLARE
  missing integer;
BEGIN
  SELECT count(*) INTO missing
  FROM (VALUES
    ('gov_csm_request','GOV-CSM'),('gov_csm_sla','GOV-CSM'),('gov_csm_action','GOV-CSM'),('gov_csm_appeal','GOV-CSM'),
    ('gov_cfm_file','GOV-CFM'),('gov_cfm_noting','GOV-CFM'),('gov_cfm_movement','GOV-CFM'),('gov_cfm_decision','GOV-CFM'),
    ('gov_plm_application','GOV-PLM'),('gov_plm_scrutiny','GOV-PLM'),('gov_plm_inspection','GOV-PLM'),('gov_plm_license','GOV-PLM'),
    ('gov_rtm_assessment','GOV-RTM'),('gov_rtm_demand','GOV-RTM'),('gov_rtm_receipt','GOV-RTM'),('gov_rtm_case','GOV-RTM')
  ) AS expected(table_name,owner_module)
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
    JOIN core_authz.rls_table_registry r
      ON r.schema_name=n.nspname AND r.table_name=c.relname
    WHERE n.nspname='ind_gov'
      AND c.relname=expected.table_name
      AND c.relrowsecurity
      AND c.relforcerowsecurity
      AND r.scope_class='TENANT_INDUSTRY'
      AND r.owner_module=expected.owner_module
      AND r.status='ACTIVE'
  );

  IF missing <> 0 THEN
    RAISE EXCEPTION 'Government RLS/MS registry coverage missing: %', missing;
  END IF;
END $$;

DO $$
DECLARE
  bad integer;
BEGIN
  SELECT count(*) INTO bad
  FROM information_schema.columns c
  WHERE c.table_schema='ind_gov'
    AND c.table_name IN (
      'gov_csm_request','gov_csm_sla','gov_csm_action','gov_csm_appeal',
      'gov_cfm_file','gov_cfm_noting','gov_cfm_movement','gov_cfm_decision',
      'gov_plm_application','gov_plm_scrutiny','gov_plm_inspection','gov_plm_license',
      'gov_rtm_assessment','gov_rtm_demand','gov_rtm_receipt','gov_rtm_case'
    )
    AND c.column_name IN ('tenant_id','industry_context_id')
    AND c.is_nullable <> 'NO';

  IF bad <> 0 THEN
    RAISE EXCEPTION 'Government ownership columns must be NOT NULL: %', bad;
  END IF;
END $$;

DO $$
DECLARE
  ms_count integer;
BEGIN
  SELECT count(DISTINCT owner_module) INTO ms_count
  FROM core_authz.rls_table_registry
  WHERE schema_name='ind_gov' AND status='ACTIVE';

  IF ms_count <> 4 THEN
    RAISE EXCEPTION 'Expected 4 Government canonical MS owners, found %', ms_count;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='ind_gov'
      AND tablename='gov_rtm_receipt'
      AND indexdef LIKE '%receipt_no%'
  ) THEN
    RAISE EXCEPTION 'Government receipt immutable business-number uniqueness missing';
  END IF;
END $$;
