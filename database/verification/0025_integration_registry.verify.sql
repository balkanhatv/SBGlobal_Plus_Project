-- Verification 0025: Integration Registry and idempotency

DO $$
DECLARE missing integer;
BEGIN
 SELECT count(*) INTO missing
 FROM (VALUES
  ('idempotency_record'),('credential_reference'),('tenant_integration'),('sync_cursor')
 ) expected(table_name)
 WHERE NOT EXISTS (
  SELECT 1 FROM pg_class c
  JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='core_integration' AND c.relname=expected.table_name
    AND c.relrowsecurity AND c.relforcerowsecurity
 );
 IF missing<>0 THEN RAISE EXCEPTION 'Scoped Integration tables missing forced RLS: %',missing; END IF;
END $$;

DO $$
BEGIN
 IF NOT EXISTS (
   SELECT 1 FROM pg_indexes
   WHERE schemaname='core_integration'
     AND indexname='idempotency_record_scope_key_uq'
 ) THEN RAISE EXCEPTION 'Scoped idempotency uniqueness missing'; END IF;

 IF EXISTS (
   SELECT 1 FROM information_schema.columns
   WHERE table_schema='core_integration'
     AND table_name='credential_reference'
     AND column_name='secret_reference'
     AND data_type<>'text'
 ) THEN RAISE EXCEPTION 'Credential reference storage contract changed unexpectedly'; END IF;
END $$;

DO $$
BEGIN
 IF NOT EXISTS (
   SELECT 1 FROM pg_constraint c
   JOIN pg_class t ON t.oid=c.conrelid
   JOIN pg_namespace n ON n.oid=t.relnamespace
   WHERE n.nspname='core_integration'
     AND t.relname='tenant_integration'
     AND c.contype='c'
     AND pg_get_constraintdef(c.oid) LIKE '%TENANT_INDUSTRY%'
 ) THEN RAISE EXCEPTION 'TenantIntegration scope/Industry Context contract missing'; END IF;
END $$;
