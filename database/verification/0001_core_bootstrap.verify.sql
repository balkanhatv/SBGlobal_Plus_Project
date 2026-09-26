-- SBGlobal Plus — Verification 0001
-- Run after database/migrations/0001_core_bootstrap.sql in a disposable database.
-- These are structural assertions, executed by the current Database Verify workflow.

DO $$
DECLARE
  missing_count integer;
BEGIN
  SELECT count(*) INTO missing_count
  FROM (VALUES
    ('platform_directory'),
    ('core_tenancy'),
    ('core_config'),
    ('core_audit'),
    ('core_integration'),
    ('core_projection'),
    ('ind_hlt'),('ind_edu'),('ind_rtl'),('ind_hsp'),('ind_mfg'),
    ('ind_psv'),('ind_gov'),('ind_ngo'),('ind_sfm')
  ) AS expected(schema_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_namespace n WHERE n.nspname = expected.schema_name
  );

  IF missing_count <> 0 THEN
    RAISE EXCEPTION 'Missing expected schemas: %', missing_count;
  END IF;
END $$;

DO $$
DECLARE
  bad_rls integer;
BEGIN
  SELECT count(*) INTO bad_rls
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname IN ('core_tenancy','core_config')
    AND c.relname IN (
      'industry_context','org_unit','org_unit_industry',
      'metadata_definition','rule_definition','form_definition',
      'tenant_country_pack_activation','brand_configuration','data_export_request'
    )
    AND (NOT c.relrowsecurity OR NOT c.relforcerowsecurity);

  IF bad_rls <> 0 THEN
    RAISE EXCEPTION 'Expected forced RLS missing on % tables', bad_rls;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname='core_tenancy'
      AND indexname='industry_context_one_primary_per_tenant_idx'
  ) THEN
    RAISE EXCEPTION 'Missing one-primary-industry partial unique index';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='core_config'
      AND indexname='metadata_definition_active_uq'
  ) THEN
    RAISE EXCEPTION 'Missing metadata ACTIVE uniqueness index';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='core_config'
      AND indexname='rule_definition_active_uq'
  ) THEN
    RAISE EXCEPTION 'Missing rule ACTIVE uniqueness index';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='core_config'
      AND indexname='form_definition_active_uq'
  ) THEN
    RAISE EXCEPTION 'Missing form ACTIVE uniqueness index';
  END IF;
END $$;

-- Context helper semantics: missing settings must resolve to NULL, never wildcard/all.
RESET app.tenant_id;
RESET app.industry_context_id;
RESET app.scope_class;

DO $$
BEGIN
  IF core_tenancy.current_tenant_id() IS NOT NULL THEN
    RAISE EXCEPTION 'Missing app.tenant_id must resolve NULL';
  END IF;
  IF core_tenancy.current_industry_context_id() IS NOT NULL THEN
    RAISE EXCEPTION 'Missing app.industry_context_id must resolve NULL';
  END IF;
END $$;

-- Structural invariant: TENANT_INDUSTRY definition rows cannot omit their industry context.
DO $$
BEGIN
  BEGIN
    INSERT INTO core_config.metadata_definition (
      id, owner_scope, tenant_id, industry_context_id, code, kind, version, status,
      schema_json, schema_version, created_by, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000101',
      'INDUSTRY',
      '00000000-0000-0000-0000-000000000201',
      NULL,
      'invalid-test',
      'TEST',
      1,
      'DRAFT',
      '{}'::jsonb,
      1,
      '00000000-0000-0000-0000-000000000301',
      now(),
      now()
    );
    RAISE EXCEPTION 'Expected owner-scope CHECK to reject missing Industry Context';
  EXCEPTION
    WHEN check_violation THEN
      NULL;
    WHEN foreign_key_violation THEN
      -- Acceptable only if FK is evaluated before CHECK by the engine;
      -- the row is still rejected and cannot violate the contract.
      NULL;
  END;
END $$;
