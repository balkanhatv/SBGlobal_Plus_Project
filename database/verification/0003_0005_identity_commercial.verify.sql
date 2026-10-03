-- SBGlobal Plus — Verification 0003-0005
-- Structural database assertions for Identity/Authorization/Commercial bootstrap.

DO $$
DECLARE
  bad integer;
BEGIN
  SELECT count(*) INTO bad
  FROM pg_type t
  JOIN pg_namespace n ON n.oid=t.typnamespace
  JOIN pg_enum e ON e.enumtypid=t.oid
  WHERE n.nspname='core_commercial'
    AND t.typname='subscription_state'
    AND e.enumlabel='PAST_DUE';

  IF bad <> 0 THEN
    RAISE EXCEPTION 'PAST_DUE must not exist in canonical subscription_state';
  END IF;
END $$;

DO $$
DECLARE
  tenant_column_nullable text;
BEGIN
  SELECT cols.is_nullable INTO tenant_column_nullable
  FROM information_schema.columns cols
  WHERE cols.table_schema='core_identity'
    AND cols.table_name='session_version'
    AND cols.column_name='tenant_id';

  IF tenant_column_nullable <> 'YES' THEN
    RAISE EXCEPTION 'session_version.tenant_id must remain nullable for global invalidation';
  END IF;
END $$;

DO $$
DECLARE
  missing integer;
BEGIN
  SELECT count(*) INTO missing
  FROM (VALUES
    ('core_identity','tenant_membership'),
    ('core_identity','api_credential'),
    ('core_identity','device_registration'),
    ('core_identity','session_version'),
    ('core_authz','role_template'),
    ('core_authz','role_permission'),
    ('core_authz','role_assignment'),
    ('core_authz','abac_policy'),
    ('core_commercial','subscription'),
    ('core_commercial','subscription_transition'),
    ('core_commercial','license'),
    ('core_commercial','tenant_add_on'),
    ('core_commercial','tenant_override'),
    ('core_commercial','usage_meter'),
    ('core_commercial','entitlement_snapshot'),
    ('core_commercial','entitlement_snapshot_fact')
  ) AS expected(schema_name, table_name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname=expected.schema_name
      AND c.relname=expected.table_name
      AND c.relrowsecurity
      AND c.relforcerowsecurity
  );

  IF missing <> 0 THEN
    RAISE EXCEPTION 'Expected forced RLS missing on % scoped tables', missing;
  END IF;
END $$;

DO $$
DECLARE
  missing integer;
BEGIN
  SELECT count(*) INTO missing
  FROM (VALUES
    ('core_identity','session_version','session_version_scope_uq'),
    ('core_tenancy','industry_context','industry_context_one_primary_per_tenant_idx'),
    ('core_commercial','subscription','subscription_one_current_per_tenant_idx'),
    ('core_commercial','entitlement_snapshot','entitlement_snapshot_one_current_idx'),
    ('core_commercial','usage_meter','usage_meter_scope_period_uq')
  ) AS expected(schema_name, table_name, index_name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_indexes i
    WHERE i.schemaname=expected.schema_name
      AND i.tablename=expected.table_name
      AND i.indexname=expected.index_name
  );

  IF missing <> 0 THEN
    RAISE EXCEPTION 'Expected critical unique/index contract missing: %', missing;
  END IF;
END $$;

-- Platform/global credential isolation policy must explicitly reference PLATFORM_GLOBAL.
DO $$
DECLARE
  expression_text text;
BEGIN
  SELECT COALESCE(qual,'') || ' ' || COALESCE(with_check,'')
    INTO expression_text
  FROM pg_policies
  WHERE schemaname='core_identity'
    AND tablename='api_credential'
    AND policyname='api_credential_context_policy';

  IF expression_text NOT LIKE '%PLATFORM_GLOBAL%' THEN
    RAISE EXCEPTION 'api_credential policy must restrict global credentials to PLATFORM_GLOBAL';
  END IF;
END $$;

-- Industry entitlement fact policy must include current Industry Context.
DO $$
DECLARE
  expression_text text;
BEGIN
  SELECT COALESCE(qual,'') || ' ' || COALESCE(with_check,'')
    INTO expression_text
  FROM pg_policies
  WHERE schemaname='core_commercial'
    AND tablename='entitlement_snapshot_fact'
    AND policyname='entitlement_snapshot_fact_parent_policy';

  IF expression_text NOT LIKE '%current_industry_context_id%' THEN
    RAISE EXCEPTION 'entitlement snapshot facts must be Industry Context scoped';
  END IF;
END $$;
