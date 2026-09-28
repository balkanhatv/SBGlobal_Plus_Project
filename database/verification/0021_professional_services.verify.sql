-- SBGlobal Plus — Verification 0021: Professional Services suite database wave

DO $$
DECLARE
  missing integer;
BEGIN
  SELECT count(*) INTO missing
  FROM (VALUES
    ('psv_crm_lead','PSV-CRM'),('psv_crm_opportunity','PSV-CRM'),('psv_crm_proposal','PSV-CRM'),('psv_crm_activity','PSV-CRM'),
    ('psv_pjm_project','PSV-PJM'),('psv_pjm_work_item','PSV-PJM'),('psv_pjm_milestone','PSV-PJM'),('psv_pjm_change_request','PSV-PJM'),
    ('psv_sdm_contract_ref','PSV-SDM'),('psv_sdm_ticket','PSV-SDM'),('psv_sdm_sla_clock','PSV-SDM'),('psv_sdm_deliverable','PSV-SDM'),
    ('psv_rtm_resource','PSV-RTM'),('psv_rtm_allocation','PSV-RTM'),('psv_rtm_timesheet','PSV-RTM'),('psv_rtm_time_entry','PSV-RTM'),
    ('psv_sgm_booking','PSV-SGM'),('psv_sgm_shoot','PSV-SGM'),('psv_sgm_revision','PSV-SGM'),('psv_sgm_delivery','PSV-SGM')
  ) AS expected(table_name,owner_module)
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
    JOIN core_authz.rls_table_registry r
      ON r.schema_name=n.nspname AND r.table_name=c.relname
    WHERE n.nspname='ind_psv'
      AND c.relname=expected.table_name
      AND c.relrowsecurity
      AND c.relforcerowsecurity
      AND r.scope_class='TENANT_INDUSTRY'
      AND r.owner_module=expected.owner_module
      AND r.status='ACTIVE'
  );

  IF missing <> 0 THEN
    RAISE EXCEPTION 'Professional Services RLS/MS registry coverage missing: %', missing;
  END IF;
END $$;

DO $$
DECLARE
  bad integer;
BEGIN
  SELECT count(*) INTO bad
  FROM information_schema.columns c
  WHERE c.table_schema='ind_psv'
    AND c.table_name IN (
      'psv_crm_lead','psv_crm_opportunity','psv_crm_proposal','psv_crm_activity',
      'psv_pjm_project','psv_pjm_work_item','psv_pjm_milestone','psv_pjm_change_request',
      'psv_sdm_contract_ref','psv_sdm_ticket','psv_sdm_sla_clock','psv_sdm_deliverable',
      'psv_rtm_resource','psv_rtm_allocation','psv_rtm_timesheet','psv_rtm_time_entry',
      'psv_sgm_booking','psv_sgm_shoot','psv_sgm_revision','psv_sgm_delivery'
    )
    AND c.column_name IN ('tenant_id','industry_context_id')
    AND c.is_nullable <> 'NO';

  IF bad <> 0 THEN
    RAISE EXCEPTION 'Professional Services ownership columns must be NOT NULL: %', bad;
  END IF;
END $$;

DO $$
DECLARE
  ms_count integer;
BEGIN
  SELECT count(DISTINCT owner_module) INTO ms_count
  FROM core_authz.rls_table_registry
  WHERE schema_name='ind_psv' AND status='ACTIVE';

  IF ms_count <> 5 THEN
    RAISE EXCEPTION 'Expected 5 Professional Services canonical MS owners, found %', ms_count;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='ind_psv'
      AND tablename='psv_rtm_timesheet'
      AND indexdef LIKE '%principal_id%period_start%period_end%'
  ) THEN
    RAISE EXCEPTION 'Timesheet period uniqueness missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid=c.conrelid
    JOIN pg_namespace n ON n.oid=t.relnamespace
    WHERE n.nspname='ind_psv'
      AND t.relname='psv_sgm_delivery'
      AND c.contype='c'
      AND pg_get_constraintdef(c.oid) LIKE '%accepted_by%'
  ) THEN
    RAISE EXCEPTION 'Studio delivery acceptance evidence constraint missing';
  END IF;
END $$;
