-- SBGlobal Plus — Migration 0025: API idempotency and Integration Registry
BEGIN;

CREATE TYPE core_integration.idempotency_state AS ENUM ('IN_PROGRESS','SUCCEEDED','FAILED_RETRYABLE','FAILED_FINAL');
CREATE TYPE core_integration.integration_status AS ENUM ('PENDING','ACTIVE','PAUSED','ERROR','REVOKED');
CREATE TYPE core_integration.integration_direction AS ENUM ('INBOUND','OUTBOUND','BIDIRECTIONAL');
CREATE TYPE core_integration.integration_health_state AS ENUM ('UNKNOWN','HEALTHY','DEGRADED','UNAVAILABLE','AUTH_ERROR','RATE_LIMITED','POLICY_BLOCKED');

CREATE TABLE core_integration.idempotency_record (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid,
  credential_or_principal_id uuid NOT NULL,
  operation_id text NOT NULL,
  idempotency_key_hash text NOT NULL,
  request_fingerprint text NOT NULL,
  response_status text,
  response_reference text,
  state core_integration.idempotency_state NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  FOREIGN KEY (tenant_id,industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id,id),
  CHECK (expires_at > created_at)
);
CREATE UNIQUE INDEX idempotency_record_scope_key_uq
  ON core_integration.idempotency_record(
    tenant_id,
    COALESCE(industry_context_id,'00000000-0000-0000-0000-000000000000'::uuid),
    credential_or_principal_id,
    operation_id,
    idempotency_key_hash
  );

CREATE TABLE core_integration.integration_definition (
  id uuid PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  provider_family text NOT NULL,
  capability_codes text[] NOT NULL DEFAULT '{}',
  adapter_contract_version text NOT NULL,
  owner_scope core_config.owner_scope NOT NULL,
  status text NOT NULL,
  data_transfer_class text NOT NULL,
  residency_metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE core_integration.credential_reference (
  id uuid PRIMARY KEY,
  tenant_id uuid,
  industry_context_id uuid,
  secret_store_provider text NOT NULL,
  secret_reference text NOT NULL,
  credential_type text NOT NULL,
  key_version bigint NOT NULL CHECK (key_version > 0),
  status text NOT NULL,
  rotated_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES core_tenancy.tenant(id),
  FOREIGN KEY (tenant_id,industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id,id),
  CHECK (industry_context_id IS NULL OR tenant_id IS NOT NULL)
);

CREATE TABLE core_integration.tenant_integration (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid,
  integration_definition_id uuid NOT NULL REFERENCES core_integration.integration_definition(id),
  scope_class text NOT NULL CHECK (scope_class IN ('TENANT_CORE','TENANT_INDUSTRY')),
  display_name text NOT NULL,
  status core_integration.integration_status NOT NULL,
  credential_reference_id uuid NOT NULL REFERENCES core_integration.credential_reference(id),
  config_json_encrypted_or_safe jsonb NOT NULL DEFAULT '{}'::jsonb,
  enabled_capabilities text[] NOT NULL DEFAULT '{}',
  permission_profile_id uuid,
  health_state core_integration.integration_health_state NOT NULL DEFAULT 'UNKNOWN',
  last_health_at timestamptz,
  version bigint NOT NULL CHECK (version > 0),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  FOREIGN KEY (tenant_id,industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id,id),
  CHECK (
    (scope_class='TENANT_CORE' AND industry_context_id IS NULL)
    OR (scope_class='TENANT_INDUSTRY' AND industry_context_id IS NOT NULL)
  )
);
CREATE UNIQUE INDEX tenant_integration_scope_definition_name_uq
  ON core_integration.tenant_integration(
    tenant_id,
    COALESCE(industry_context_id,'00000000-0000-0000-0000-000000000000'::uuid),
    integration_definition_id,
    display_name
  );

CREATE TABLE core_integration.integration_capability (
  id uuid PRIMARY KEY,
  integration_definition_id uuid NOT NULL REFERENCES core_integration.integration_definition(id),
  capability_code text NOT NULL,
  direction core_integration.integration_direction NOT NULL,
  operation_contract_id text,
  event_types text[] NOT NULL DEFAULT '{}',
  data_class text NOT NULL,
  idempotency_class text NOT NULL,
  rate_class text NOT NULL,
  status text NOT NULL,
  UNIQUE(integration_definition_id,capability_code)
);

CREATE TABLE core_integration.provider_adapter (
  id uuid PRIMARY KEY,
  definition_id uuid NOT NULL REFERENCES core_integration.integration_definition(id),
  adapter_code text NOT NULL,
  contract_version text NOT NULL,
  auth_method text NOT NULL,
  timeout_class text NOT NULL,
  retry_class text NOT NULL,
  circuit_class text NOT NULL,
  health_probe_class text NOT NULL,
  normalized_error_map_version text NOT NULL,
  status text NOT NULL,
  UNIQUE(definition_id,adapter_code,contract_version)
);

CREATE TABLE core_integration.sync_cursor (
  id uuid PRIMARY KEY,
  tenant_integration_id uuid NOT NULL REFERENCES core_integration.tenant_integration(id),
  capability_code text NOT NULL,
  industry_context_id uuid,
  cursor_encrypted_or_opaque text NOT NULL,
  watermark_time timestamptz,
  source_version text,
  updated_at timestamptz NOT NULL,
  UNIQUE(tenant_integration_id,capability_code,industry_context_id)
);

ALTER TABLE core_integration.idempotency_record ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_integration.idempotency_record FORCE ROW LEVEL SECURITY;
CREATE POLICY idempotency_record_context_policy ON core_integration.idempotency_record
 USING (
   tenant_id=core_tenancy.current_tenant_id()
   AND (industry_context_id IS NULL OR industry_context_id=core_tenancy.current_industry_context_id())
 )
 WITH CHECK (
   tenant_id=core_tenancy.current_tenant_id()
   AND (industry_context_id IS NULL OR industry_context_id=core_tenancy.current_industry_context_id())
 );

ALTER TABLE core_integration.credential_reference ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_integration.credential_reference FORCE ROW LEVEL SECURITY;
CREATE POLICY credential_reference_context_policy ON core_integration.credential_reference
 USING (
   (tenant_id IS NULL AND core_tenancy.current_scope_class()='PLATFORM_GLOBAL')
   OR (
     tenant_id=core_tenancy.current_tenant_id()
     AND (industry_context_id IS NULL OR industry_context_id=core_tenancy.current_industry_context_id())
   )
 )
 WITH CHECK (
   (tenant_id IS NULL AND core_tenancy.current_scope_class()='PLATFORM_GLOBAL')
   OR (
     tenant_id=core_tenancy.current_tenant_id()
     AND (industry_context_id IS NULL OR industry_context_id=core_tenancy.current_industry_context_id())
   )
 );

ALTER TABLE core_integration.tenant_integration ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_integration.tenant_integration FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_integration_context_policy ON core_integration.tenant_integration
 USING (
   tenant_id=core_tenancy.current_tenant_id()
   AND (industry_context_id IS NULL OR industry_context_id=core_tenancy.current_industry_context_id())
 )
 WITH CHECK (
   tenant_id=core_tenancy.current_tenant_id()
   AND (industry_context_id IS NULL OR industry_context_id=core_tenancy.current_industry_context_id())
 );

ALTER TABLE core_integration.sync_cursor ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_integration.sync_cursor FORCE ROW LEVEL SECURITY;
CREATE POLICY sync_cursor_parent_context_policy ON core_integration.sync_cursor
 USING (
   EXISTS (
     SELECT 1 FROM core_integration.tenant_integration parent
     WHERE parent.id=tenant_integration_id
   )
 )
 WITH CHECK (
   EXISTS (
     SELECT 1 FROM core_integration.tenant_integration parent
     WHERE parent.id=tenant_integration_id
       AND parent.industry_context_id IS NOT DISTINCT FROM industry_context_id
   )
 );

INSERT INTO core_authz.rls_table_registry
(schema_name,table_name,scope_class,policy_class,owner_module,force_rls_required,registered_at)
VALUES
('core_integration','idempotency_record','MIXED_SCOPED','RLS-TENANT/RLS-INDUSTRY','API',true,now()),
('core_integration','credential_reference','MIXED_SCOPED','RLS-PLATFORM/TENANT/INDUSTRY','Integration',true,now()),
('core_integration','tenant_integration','MIXED_SCOPED','RLS-TENANT/RLS-INDUSTRY','Integration',true,now()),
('core_integration','sync_cursor','MIXED_SCOPED','RLS-PARENT-SCOPE','Integration',true,now());

COMMIT;
