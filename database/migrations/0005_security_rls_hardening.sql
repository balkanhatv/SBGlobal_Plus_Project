-- SBGlobal Plus — Migration 0005: Identity/Authorization/Entitlement RLS hardening
BEGIN;

CREATE OR REPLACE FUNCTION core_tenancy.current_principal_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.principal_id', true), '')::uuid
$$;

-- DD-03 SessionVersion allows tenant_id to be null for global identity invalidation.
ALTER TABLE core_identity.session_version
  DROP CONSTRAINT session_version_pkey;
ALTER TABLE core_identity.session_version
  ALTER COLUMN tenant_id DROP NOT NULL;

CREATE UNIQUE INDEX session_version_scope_uq
  ON core_identity.session_version(
    principal_id,
    COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

ALTER TABLE core_identity.session_version ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_identity.session_version FORCE ROW LEVEL SECURITY;
CREATE POLICY session_version_context_policy
  ON core_identity.session_version
  USING (
    principal_id = core_tenancy.current_principal_id()
    AND (
      tenant_id IS NULL
      OR tenant_id = core_tenancy.current_tenant_id()
    )
  )
  WITH CHECK (
    principal_id = core_tenancy.current_principal_id()
    AND (
      tenant_id IS NULL
      OR tenant_id = core_tenancy.current_tenant_id()
    )
  );

-- Replace broad API credential policy: global credentials are platform-only.
DROP POLICY api_credential_context_policy ON core_identity.api_credential;
CREATE POLICY api_credential_context_policy
  ON core_identity.api_credential
  USING (
    (tenant_id IS NULL AND core_tenancy.current_scope_class() = 'PLATFORM_GLOBAL')
    OR (
      tenant_id = core_tenancy.current_tenant_id()
      AND (industry_context_id IS NULL OR industry_context_id = core_tenancy.current_industry_context_id())
    )
  )
  WITH CHECK (
    (tenant_id IS NULL AND core_tenancy.current_scope_class() = 'PLATFORM_GLOBAL')
    OR (
      tenant_id = core_tenancy.current_tenant_id()
      AND (industry_context_id IS NULL OR industry_context_id = core_tenancy.current_industry_context_id())
    )
  );

-- Role templates are scoped assets; role permissions inherit their parent scope.
ALTER TABLE core_authz.role_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_authz.role_template FORCE ROW LEVEL SECURITY;
CREATE POLICY role_template_context_policy
  ON core_authz.role_template
  USING (
    (owner_scope = 'PLATFORM' AND core_tenancy.current_scope_class() = 'PLATFORM_GLOBAL')
    OR (owner_scope = 'TENANT' AND tenant_id = core_tenancy.current_tenant_id())
    OR (
      owner_scope = 'INDUSTRY'
      AND tenant_id = core_tenancy.current_tenant_id()
      AND industry_context_id = core_tenancy.current_industry_context_id()
    )
  )
  WITH CHECK (
    (owner_scope = 'PLATFORM' AND core_tenancy.current_scope_class() = 'PLATFORM_GLOBAL')
    OR (owner_scope = 'TENANT' AND tenant_id = core_tenancy.current_tenant_id())
    OR (
      owner_scope = 'INDUSTRY'
      AND tenant_id = core_tenancy.current_tenant_id()
      AND industry_context_id = core_tenancy.current_industry_context_id()
    )
  );

ALTER TABLE core_authz.role_permission ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_authz.role_permission FORCE ROW LEVEL SECURITY;
CREATE POLICY role_permission_parent_context_policy
  ON core_authz.role_permission
  USING (
    EXISTS (
      SELECT 1
      FROM core_authz.role_template parent
      WHERE parent.id = role_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM core_authz.role_template parent
      WHERE parent.id = role_id
    )
  );

-- Industry-scoped entitlement facts must not bleed into a sibling active Industry Context.
DROP POLICY entitlement_snapshot_fact_parent_policy
  ON core_commercial.entitlement_snapshot_fact;

CREATE POLICY entitlement_snapshot_fact_parent_policy
  ON core_commercial.entitlement_snapshot_fact
  USING (
    EXISTS (
      SELECT 1
      FROM core_commercial.entitlement_snapshot parent
      WHERE parent.id = snapshot_id
        AND parent.tenant_id = core_tenancy.current_tenant_id()
    )
    AND (
      industry_context_id IS NULL
      OR industry_context_id = core_tenancy.current_industry_context_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM core_commercial.entitlement_snapshot parent
      WHERE parent.id = snapshot_id
        AND parent.tenant_id = core_tenancy.current_tenant_id()
    )
    AND (
      industry_context_id IS NULL
      OR industry_context_id = core_tenancy.current_industry_context_id()
    )
  );

COMMIT;
