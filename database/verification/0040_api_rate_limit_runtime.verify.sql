-- Verification 0040: distributed rate-limit role/state boundary
DO $$
DECLARE bad integer;
BEGIN
  SELECT count(*) INTO bad
  FROM pg_roles
  WHERE rolname='sbg_rate_limiter_rw'
    AND (rolsuper OR rolcreatedb OR rolcreaterole OR rolbypassrls);
  IF bad<>0 THEN
    RAISE EXCEPTION 'rate limiter role must remain least privilege NOBYPASSRLS';
  END IF;

  IF NOT has_table_privilege('sbg_rate_limiter_rw','core_integration.rate_limit_bucket','SELECT')
     OR NOT has_table_privilege('sbg_rate_limiter_rw','core_integration.rate_limit_bucket','INSERT')
     OR NOT has_table_privilege('sbg_rate_limiter_rw','core_integration.rate_limit_bucket','UPDATE')
     OR has_table_privilege('sbg_rate_limiter_rw','core_integration.rate_limit_bucket','DELETE') THEN
    RAISE EXCEPTION 'rate limiter bucket privilege boundary invalid';
  END IF;

  IF NOT has_table_privilege('sbg_rate_limiter_rw','core_integration.rate_limit_concurrency_lease','SELECT')
     OR NOT has_table_privilege('sbg_rate_limiter_rw','core_integration.rate_limit_concurrency_lease','INSERT')
     OR NOT has_table_privilege('sbg_rate_limiter_rw','core_integration.rate_limit_concurrency_lease','DELETE')
     OR has_table_privilege('sbg_rate_limiter_rw','core_integration.rate_limit_concurrency_lease','UPDATE') THEN
    RAISE EXCEPTION 'rate limiter lease privilege boundary invalid';
  END IF;

  IF has_table_privilege('sbg_app_rw','core_integration.rate_limit_bucket','SELECT')
     OR has_table_privilege('sbg_app_rw','core_integration.rate_limit_concurrency_lease','SELECT')
     OR has_table_privilege('sbg_integration_service_rw','core_integration.rate_limit_bucket','SELECT') THEN
    RAISE EXCEPTION 'rate limiter state leaked to ordinary runtime roles';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='core_integration' AND table_name='rate_limit_bucket'
      AND column_name='bucket_key_hash'
  ) OR EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='core_integration' AND table_name='rate_limit_bucket'
      AND column_name IN ('tenant_id','industry_context_id','principal_id','credential_id','ip_address','ip_hash')
  ) THEN
    RAISE EXCEPTION 'rate limiter bucket must store only opaque bucket identity';
  END IF;
END $$;
