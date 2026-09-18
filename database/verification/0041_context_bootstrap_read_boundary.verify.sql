-- Verification 0041: DD-057 pre-context Tenant directory bootstrap
DO $$
DECLARE unsafe integer;
BEGIN
  SELECT count(*) INTO unsafe
  FROM pg_roles
  WHERE rolname='sbg_context_bootstrap_ro'
    AND (rolsuper OR rolcreatedb OR rolcreaterole OR rolcanlogin OR rolinherit OR rolbypassrls);
  IF unsafe<>0 OR NOT EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname='sbg_context_bootstrap_ro'
  ) THEN
    RAISE EXCEPTION 'context bootstrap role absent or over-privileged';
  END IF;

  IF NOT has_table_privilege('sbg_context_bootstrap_ro','platform_directory.data_home','SELECT')
     OR NOT has_table_privilege('sbg_context_bootstrap_ro','core_tenancy.tenant','SELECT')
     OR NOT has_table_privilege('sbg_context_bootstrap_ro','core_tenancy.industry_context','SELECT')
     OR NOT has_table_privilege('sbg_context_bootstrap_ro','core_tenancy.org_unit','SELECT')
     OR NOT has_table_privilege('sbg_context_bootstrap_ro','core_identity.tenant_membership','SELECT')
     OR NOT has_table_privilege('sbg_context_bootstrap_ro','core_master.current_supported_industry','SELECT') THEN
    RAISE EXCEPTION 'context bootstrap read grants incomplete';
  END IF;

  IF has_table_privilege('sbg_context_bootstrap_ro','core_tenancy.tenant','UPDATE')
     OR has_table_privilege('sbg_context_bootstrap_ro','core_identity.tenant_membership','INSERT')
     OR has_table_privilege('sbg_context_bootstrap_ro','platform_directory.data_home','DELETE')
     OR has_table_privilege('sbg_context_bootstrap_ro','core_identity.api_credential','SELECT')
     OR has_table_privilege('sbg_context_bootstrap_ro','core_identity.identity_provider_link','SELECT')
     OR has_table_privilege('sbg_context_bootstrap_ro','core_identity.platform_principal','SELECT') THEN
    RAISE EXCEPTION 'context bootstrap role leaked write/sensitive identity privilege';
  END IF;

  IF (SELECT count(*) FROM pg_policies
      WHERE schemaname='core_tenancy'
        AND policyname IN (
          'tenant_context_bootstrap_read',
          'industry_context_bootstrap_read',
          'org_unit_context_bootstrap_read'
        ))<>3
     OR NOT EXISTS (
       SELECT 1 FROM pg_policies
       WHERE schemaname='core_identity'
         AND tablename='tenant_membership'
         AND policyname='tenant_membership_context_bootstrap_read'
     ) THEN
    RAISE EXCEPTION 'context bootstrap RLS policies missing';
  END IF;
END $$;
