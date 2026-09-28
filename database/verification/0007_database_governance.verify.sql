-- SBGlobal Plus — Verification 0007: RLS registry preflight

DO $$
DECLARE
  missing_table integer;
  rls_mismatch integer;
BEGIN
  SELECT count(*) INTO missing_table
  FROM core_authz.rls_table_registry r
  LEFT JOIN pg_namespace n ON n.nspname = r.schema_name
  LEFT JOIN pg_class c ON c.relnamespace = n.oid AND c.relname = r.table_name
  WHERE r.status='ACTIVE'
    AND c.oid IS NULL;

  IF missing_table <> 0 THEN
    RAISE EXCEPTION 'RLS registry references % missing physical tables', missing_table;
  END IF;

  SELECT count(*) INTO rls_mismatch
  FROM core_authz.rls_table_registry r
  JOIN pg_namespace n ON n.nspname = r.schema_name
  JOIN pg_class c ON c.relnamespace = n.oid AND c.relname = r.table_name
  WHERE r.status='ACTIVE'
    AND r.force_rls_required
    AND (NOT c.relrowsecurity OR NOT c.relforcerowsecurity);

  IF rls_mismatch <> 0 THEN
    RAISE EXCEPTION 'Release-blocking RLS mismatch on % registered tables', rls_mismatch;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM core_authz.rls_table_registry
    WHERE status='ACTIVE'
      AND scope_class='TENANT_INDUSTRY'
      AND policy_class NOT LIKE '%INDUSTRY%'
  ) THEN
    RAISE EXCEPTION 'TENANT_INDUSTRY registry row lacks Industry-scoped policy classification';
  END IF;
END $$;
