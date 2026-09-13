-- SBGlobal Plus — Migration 0029: scope immutability, identity isolation and least privilege
-- Audit correction: DEV-DB-AC-008 / DEV-DB-AC-010.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='sbg_identity_service_rw') THEN
    CREATE ROLE sbg_identity_service_rw NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='sbg_control_plane_rw') THEN
    CREATE ROLE sbg_control_plane_rw NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
END $$;

ALTER ROLE sbg_identity_service_rw NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
ALTER ROLE sbg_control_plane_rw NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;

-- Catalog fields use the governed scope vocabulary; arbitrary strings fail closed.
ALTER TABLE core_authz.permission_definition
  ADD CONSTRAINT permission_definition_scope_class_ck
  CHECK (scope_class IN ('PLATFORM_GLOBAL','TENANT_CORE','TENANT_INDUSTRY','EXPLICIT_CROSS_CONTEXT'));
ALTER TABLE core_commercial.entitlement_definition
  ADD CONSTRAINT entitlement_definition_scope_class_ck
  CHECK (scope_class IN ('PLATFORM_GLOBAL','TENANT_CORE','TENANT_INDUSTRY','EXPLICIT_CROSS_CONTEXT'));
ALTER TABLE core_ai.ai_tool_definition
  ADD CONSTRAINT ai_tool_definition_scope_class_ck
  CHECK (scope_class IN ('PLATFORM_GLOBAL','TENANT_CORE','TENANT_INDUSTRY','EXPLICIT_CROSS_CONTEXT'));
ALTER TABLE core_identity.platform_principal
  ADD CONSTRAINT platform_principal_allowed_scopes_ck CHECK (
    allowed_scope_classes IS NULL OR (
      array_position(allowed_scope_classes,NULL) IS NULL
      AND allowed_scope_classes<@ARRAY[
        'PLATFORM_GLOBAL','TENANT_CORE','TENANT_INDUSTRY','EXPLICIT_CROSS_CONTEXT'
      ]::text[]
    )
  );

-- A resolved tenant is itself tenant-owned. Before this correction the table had no
-- RLS even though application/service roles could read and write it.
ALTER TABLE core_tenancy.tenant ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_tenancy.tenant FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_resolved_context_policy ON core_tenancy.tenant
  USING (
    id=core_tenancy.current_tenant_id()
    OR current_user IN ('sbg_identity_service_rw','sbg_control_plane_rw')
  )
  WITH CHECK (
    id=core_tenancy.current_tenant_id()
    OR current_user IN ('sbg_identity_service_rw','sbg_control_plane_rw')
  );

-- Identity directory lookup occurs only through the identity boundary. The app may
-- see its current principal and principals with an active membership in its resolved
-- tenant, but it cannot mutate the platform identity directory.
ALTER TABLE core_identity.platform_principal ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_identity.platform_principal FORCE ROW LEVEL SECURITY;
CREATE POLICY platform_principal_identity_service_policy ON core_identity.platform_principal
  USING (current_user IN ('sbg_identity_service_rw','sbg_control_plane_rw'))
  WITH CHECK (current_user IN ('sbg_identity_service_rw','sbg_control_plane_rw'));
CREATE POLICY platform_principal_resolved_read_policy ON core_identity.platform_principal
  FOR SELECT
  USING (
    id=core_tenancy.current_principal_id()
    OR EXISTS (
      SELECT 1
      FROM core_identity.tenant_membership membership
      WHERE membership.principal_id=platform_principal.id
        AND membership.tenant_id=core_tenancy.current_tenant_id()
        AND membership.status='ACTIVE'
        AND (membership.valid_from IS NULL OR membership.valid_from<=now())
        AND (membership.valid_until IS NULL OR membership.valid_until>now())
    )
  );

ALTER TABLE core_identity.identity_provider_link ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_identity.identity_provider_link FORCE ROW LEVEL SECURITY;
CREATE POLICY identity_provider_link_service_policy ON core_identity.identity_provider_link
  USING (current_user IN ('sbg_identity_service_rw','sbg_control_plane_rw'))
  WITH CHECK (current_user IN ('sbg_identity_service_rw','sbg_control_plane_rw'));

-- The identity boundary must resolve sessions and credentials before an application
-- tenant context exists, so it receives explicit policies rather than BYPASSRLS.
CREATE POLICY tenant_membership_identity_service_policy ON core_identity.tenant_membership
  USING (current_user IN ('sbg_identity_service_rw','sbg_control_plane_rw'))
  WITH CHECK (current_user IN ('sbg_identity_service_rw','sbg_control_plane_rw'));
CREATE POLICY api_credential_identity_service_policy ON core_identity.api_credential
  USING (current_user IN ('sbg_identity_service_rw','sbg_control_plane_rw'))
  WITH CHECK (current_user IN ('sbg_identity_service_rw','sbg_control_plane_rw'));
CREATE POLICY device_registration_identity_service_policy ON core_identity.device_registration
  USING (current_user IN ('sbg_identity_service_rw','sbg_control_plane_rw'))
  WITH CHECK (current_user IN ('sbg_identity_service_rw','sbg_control_plane_rw'));
CREATE POLICY session_version_identity_service_policy ON core_identity.session_version
  USING (current_user IN ('sbg_identity_service_rw','sbg_control_plane_rw'))
  WITH CHECK (current_user IN ('sbg_identity_service_rw','sbg_control_plane_rw'));

-- Persist the operator-elevation contract that DD-05 and DD-16 already require.
CREATE TABLE core_authz.operator_elevation (
  id uuid PRIMARY KEY,
  operator_principal_id uuid NOT NULL REFERENCES core_identity.platform_principal(id),
  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid,
  purpose_code text NOT NULL,
  ticket_reference text,
  approved_by uuid REFERENCES core_identity.platform_principal(id),
  starts_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('PENDING','ACTIVE','REVOKED','EXPIRED')),
  permission_profile_id uuid NOT NULL,
  created_at timestamptz NOT NULL,
  revoked_at timestamptz,
  FOREIGN KEY (tenant_id,industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id,id),
  CHECK (expires_at>starts_at),
  CHECK (revoked_at IS NULL OR revoked_at>=created_at),
  CHECK (status<>'REVOKED' OR revoked_at IS NOT NULL)
);
CREATE INDEX operator_elevation_active_target_idx
  ON core_authz.operator_elevation(tenant_id,industry_context_id,operator_principal_id,expires_at)
  WHERE status='ACTIVE';
ALTER TABLE core_authz.operator_elevation ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_authz.operator_elevation FORCE ROW LEVEL SECURITY;
CREATE POLICY operator_elevation_control_policy ON core_authz.operator_elevation
  USING (current_user='sbg_control_plane_rw')
  WITH CHECK (current_user='sbg_control_plane_rw');
CREATE POLICY operator_elevation_current_read_policy ON core_authz.operator_elevation
  FOR SELECT
  USING (
    id::text=NULLIF(current_setting('app.operator_elevation_id',true),'')
    AND operator_principal_id=core_tenancy.current_principal_id()
    AND tenant_id=core_tenancy.current_tenant_id()
    AND (
      industry_context_id IS NULL
      OR industry_context_id=core_tenancy.current_industry_context_id()
    )
    AND status='ACTIVE'
    AND starts_at<=now()
    AND expires_at>now()
  );

-- Ownership and scope are immutable for every tenant-owned row. Dynamic attachment
-- covers Core and all nine Industry schemas and automatically covers future tables
-- when this audit assertion is rerun after a migration.
CREATE OR REPLACE FUNCTION core_tenancy.enforce_immutable_scope_ownership()
RETURNS trigger
LANGUAGE plpgsql
SET search_path=pg_catalog
AS $$
DECLARE
  old_row jsonb := to_jsonb(OLD);
  new_row jsonb := to_jsonb(NEW);
  protected_key text;
BEGIN
  FOREACH protected_key IN ARRAY ARRAY[
    'tenant_id','industry_context_id','source_industry_context_id',
    'target_industry_context_id','scope_class','owner_scope'
  ]
  LOOP
    IF old_row ? protected_key
       AND (old_row->protected_key) IS DISTINCT FROM (new_row->protected_key) THEN
      RAISE EXCEPTION 'immutable ownership/scope column % cannot change on %.%',
        protected_key,TG_TABLE_SCHEMA,TG_TABLE_NAME
        USING ERRCODE='42501';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION core_tenancy.enforce_immutable_scope_ownership() FROM PUBLIC;

DO $$
DECLARE
  target record;
BEGIN
  FOR target IN
    SELECT namespace.nspname AS schema_name,relation.relname AS table_name
    FROM pg_class relation
    JOIN pg_namespace namespace ON namespace.oid=relation.relnamespace
    WHERE relation.relkind IN ('r','p')
      AND NOT relation.relispartition
      AND (
        left(namespace.nspname,5)='core_'
        OR left(namespace.nspname,4)='ind_'
      )
      AND EXISTS (
        SELECT 1 FROM pg_attribute attribute
        WHERE attribute.attrelid=relation.oid
          AND attribute.attname IN ('tenant_id','industry_context_id','scope_class','owner_scope')
          AND attribute.attnum>0
          AND NOT attribute.attisdropped
      )
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS immutable_scope_ownership ON %I.%I',target.schema_name,target.table_name);
    EXECUTE format(
      'CREATE TRIGGER immutable_scope_ownership BEFORE UPDATE ON %I.%I FOR EACH ROW EXECUTE FUNCTION core_tenancy.enforce_immutable_scope_ownership()',
      target.schema_name,target.table_name
    );
  END LOOP;
END $$;

-- Remove blanket future grants. Every later migration must state its runtime grants.
ALTER DEFAULT PRIVILEGES IN SCHEMA core_identity,core_tenancy,core_authz,core_commercial,core_config,core_master,core_workflow,core_notification,core_document,core_projection
  REVOKE SELECT,INSERT,UPDATE,DELETE ON TABLES FROM sbg_app_rw;
ALTER DEFAULT PRIVILEGES IN SCHEMA ind_hlt,ind_edu,ind_rtl,ind_hsp,ind_mfg,ind_psv,ind_gov,ind_ngo,ind_sfm
  REVOKE SELECT,INSERT,UPDATE,DELETE ON TABLES FROM sbg_app_rw;

-- Sensitive identity material and governance registries are not general app tables.
-- 0009 granted audit append/read but omitted the schema usage required to reach it.
GRANT USAGE ON SCHEMA core_audit TO sbg_app_rw;
REVOKE ALL PRIVILEGES ON core_identity.identity_provider_link,core_identity.api_credential FROM sbg_app_rw,sbg_worker_rw,sbg_monitor_ro;
REVOKE INSERT,UPDATE,DELETE ON core_identity.platform_principal FROM sbg_app_rw,sbg_worker_rw;
REVOKE ALL PRIVILEGES ON core_authz.rls_table_registry FROM sbg_app_rw,sbg_worker_rw,sbg_monitor_ro;
GRANT SELECT ON core_authz.rls_table_registry TO sbg_control_plane_rw;

GRANT USAGE ON SCHEMA core_identity,core_tenancy TO sbg_identity_service_rw;
GRANT SELECT ON core_tenancy.tenant,core_tenancy.industry_context TO sbg_identity_service_rw;
GRANT SELECT,INSERT,UPDATE ON core_identity.platform_principal,core_identity.identity_provider_link,
  core_identity.tenant_membership,core_identity.api_credential,core_identity.device_registration,
  core_identity.session_version TO sbg_identity_service_rw;

GRANT USAGE ON SCHEMA platform_directory,core_identity,core_tenancy,core_authz,core_commercial,core_config,core_ai,core_integration TO sbg_control_plane_rw;
REVOKE ALL PRIVILEGES ON core_authz.operator_elevation FROM sbg_app_rw,sbg_worker_rw,sbg_monitor_ro;
GRANT SELECT ON core_authz.operator_elevation TO sbg_app_rw;
GRANT SELECT,INSERT,UPDATE,DELETE ON core_authz.operator_elevation TO sbg_control_plane_rw;
GRANT ALL PRIVILEGES ON core_authz.operator_elevation TO sbg_migration_admin;
GRANT SELECT ON core_tenancy.tenant,core_tenancy.industry_context,core_identity.platform_principal TO sbg_control_plane_rw;

-- Platform catalogs are read-only to request/runtime roles and writable only through
-- the explicit control-plane boundary.
REVOKE INSERT,UPDATE,DELETE ON
  core_authz.permission_definition,
  core_commercial.commercial_route_policy,core_commercial.plan,core_commercial.plan_version,
  core_commercial.entitlement_definition,core_commercial.add_on,
  core_config.country_pack,
  core_integration.event_catalog,core_integration.integration_definition,
  core_integration.integration_capability,core_integration.provider_adapter
FROM sbg_app_rw,sbg_worker_rw;

GRANT SELECT ON
  core_authz.permission_definition,
  core_commercial.commercial_route_policy,core_commercial.plan,core_commercial.plan_version,
  core_commercial.entitlement_definition,core_commercial.add_on,
  core_config.country_pack,
  core_integration.event_catalog,core_integration.integration_definition,
  core_integration.integration_capability,core_integration.provider_adapter
TO sbg_app_rw;

GRANT SELECT,INSERT,UPDATE,DELETE ON
  core_authz.permission_definition,
  core_commercial.commercial_route_policy,core_commercial.plan,core_commercial.plan_version,
  core_commercial.entitlement_definition,core_commercial.add_on,
  core_config.country_pack,
  core_ai.ai_provider,core_ai.ai_model,core_ai.ai_capability,core_ai.ai_tool_definition,
  core_integration.event_catalog,core_integration.integration_definition,
  core_integration.integration_capability,core_integration.provider_adapter
TO sbg_control_plane_rw;

-- Explicitly immutable/versioned evidence cannot be rewritten by application roles.
REVOKE UPDATE,DELETE ON core_commercial.subscription_transition,
  core_commercial.entitlement_snapshot,core_commercial.entitlement_snapshot_fact
FROM sbg_app_rw,sbg_worker_rw;

-- Industry deletion is by governed lifecycle/retention processing, never direct app DML.
DO $$
DECLARE
  target record;
BEGIN
  FOR target IN
    SELECT schemaname,tablename
    FROM pg_tables
    WHERE schemaname IN ('ind_hlt','ind_edu','ind_rtl','ind_hsp','ind_mfg','ind_psv','ind_gov','ind_ngo','ind_sfm')
  LOOP
    EXECUTE format('REVOKE DELETE ON %I.%I FROM sbg_app_rw',target.schemaname,target.tablename);
  END LOOP;
END $$;

REVOKE ALL ON FUNCTION platform_directory.ensure_evidence_month_partitions(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION platform_directory.ensure_evidence_month_partitions(date) TO sbg_migration_admin;

INSERT INTO core_authz.rls_table_registry
(schema_name,table_name,scope_class,policy_class,owner_module,force_rls_required,status,registered_at)
VALUES
('core_tenancy','tenant','TENANT_CORE','RLS-TENANT-READ/WRITE','Tenancy',true,'ACTIVE',now()),
('core_identity','platform_principal','MIXED_SCOPED','RLS-IDENTITY-DIRECTORY','Identity',true,'ACTIVE',now()),
('core_identity','identity_provider_link','MIXED_SCOPED','RLS-IDENTITY-SERVICE','Identity',true,'ACTIVE',now()),
('core_authz','operator_elevation','MIXED_SCOPED','RLS-OPERATOR','Authorization',true,'ACTIVE',now())
ON CONFLICT (schema_name,table_name) DO UPDATE
SET scope_class=EXCLUDED.scope_class,
    policy_class=EXCLUDED.policy_class,
    owner_module=EXCLUDED.owner_module,
    force_rls_required=EXCLUDED.force_rls_required,
    status='ACTIVE';

COMMIT;
