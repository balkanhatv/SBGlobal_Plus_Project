-- SBGlobal Plus — Migration 0041: DD-057 pre-context Tenant directory bootstrap
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='sbg_context_bootstrap_ro') THEN
    CREATE ROLE sbg_context_bootstrap_ro
      NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
END $$;

ALTER ROLE sbg_context_bootstrap_ro
  NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;

GRANT USAGE ON SCHEMA platform_directory,core_tenancy,core_identity,core_master
  TO sbg_context_bootstrap_ro;

GRANT SELECT ON
  platform_directory.data_home,
  core_tenancy.tenant,
  core_tenancy.industry_context,
  core_tenancy.org_unit,
  core_identity.tenant_membership,
  core_master.current_supported_industry
TO sbg_context_bootstrap_ro;

REVOKE INSERT,UPDATE,DELETE ON
  platform_directory.data_home,
  core_tenancy.tenant,
  core_tenancy.industry_context,
  core_tenancy.org_unit,
  core_identity.tenant_membership,
  core_master.current_supported_industry
FROM sbg_context_bootstrap_ro;

REVOKE ALL PRIVILEGES ON
  core_identity.identity_provider_link,
  core_identity.api_credential,
  core_identity.device_registration,
  core_identity.session_version,
  core_identity.platform_principal
FROM sbg_context_bootstrap_ro;

-- This role is a pre-context directory reader. It deliberately receives narrow
-- SELECT-only RLS policies instead of BYPASSRLS, because Tenant/DataHome must be
-- resolved before an application RequestScopedSql context can exist.
CREATE POLICY tenant_context_bootstrap_read
  ON core_tenancy.tenant FOR SELECT
  USING (current_user='sbg_context_bootstrap_ro');

CREATE POLICY industry_context_bootstrap_read
  ON core_tenancy.industry_context FOR SELECT
  USING (current_user='sbg_context_bootstrap_ro');

CREATE POLICY org_unit_context_bootstrap_read
  ON core_tenancy.org_unit FOR SELECT
  USING (current_user='sbg_context_bootstrap_ro');

CREATE POLICY tenant_membership_context_bootstrap_read
  ON core_identity.tenant_membership FOR SELECT
  USING (current_user='sbg_context_bootstrap_ro');

COMMIT;
