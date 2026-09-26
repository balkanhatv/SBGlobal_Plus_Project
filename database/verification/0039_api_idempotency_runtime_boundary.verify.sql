-- Verification 0039: DD-06 idempotency runtime exact-scope boundary
DO $$
DECLARE policy_expr text;
BEGIN
  IF NOT has_table_privilege('sbg_app_rw','core_integration.idempotency_record','SELECT')
     OR NOT has_table_privilege('sbg_app_rw','core_integration.idempotency_record','INSERT')
     OR NOT has_table_privilege('sbg_app_rw','core_integration.idempotency_record','UPDATE') THEN
    RAISE EXCEPTION 'application role lacks governed idempotency state-machine privileges';
  END IF;

  IF has_table_privilege('sbg_app_rw','core_integration.idempotency_record','DELETE') THEN
    RAISE EXCEPTION 'application role must not DELETE idempotency records';
  END IF;

  SELECT qual INTO policy_expr
  FROM pg_policies
  WHERE schemaname='core_integration'
    AND tablename='idempotency_record'
    AND policyname='idempotency_record_context_policy';

  IF policy_expr IS NULL
     OR policy_expr NOT LIKE '%TENANT_CORE%'
     OR policy_expr NOT LIKE '%TENANT_INDUSTRY%'
     OR policy_expr NOT LIKE '%current_industry_context_id%' THEN
    RAISE EXCEPTION 'idempotency exact-scope RLS policy missing/incomplete';
  END IF;
END $$;
