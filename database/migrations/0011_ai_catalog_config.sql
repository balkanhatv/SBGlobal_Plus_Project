-- SBGlobal Plus — Migration 0011: AI catalog, configuration, prompt and provisioning
BEGIN;

CREATE SCHEMA IF NOT EXISTS core_ai;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TYPE core_ai.ai_policy_effect AS ENUM ('ALLOW','DENY','RESTRICT');
CREATE TYPE core_ai.prompt_status AS ENUM ('DRAFT','REVIEW','PUBLISHED','ACTIVE','RETIRED');
CREATE TYPE core_ai.provisioning_status AS ENUM ('ACTIVE','SUPERSEDED','REVOKED');
CREATE TYPE core_ai.media_type AS ENUM ('IMAGE','SVG','ICON','INFOGRAPHIC','PRESENTATION','VIDEO','ANIMATION','VOICE','AUDIO');

CREATE TABLE core_ai.ai_provider (
  id uuid PRIMARY KEY,
  code text NOT NULL UNIQUE,
  status text NOT NULL,
  adapter_type text NOT NULL,
  supported_regions text[] NOT NULL DEFAULT '{}',
  supported_capabilities text[] NOT NULL DEFAULT '{}',
  security_class text NOT NULL,
  residency_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  credential_ref text NOT NULL,
  health_state text NOT NULL,
  version bigint NOT NULL CHECK (version > 0),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE core_ai.ai_model (
  id uuid PRIMARY KEY,
  provider_id uuid NOT NULL REFERENCES core_ai.ai_provider(id),
  model_code text NOT NULL,
  display_name text NOT NULL,
  capabilities text[] NOT NULL DEFAULT '{}',
  context_window_class text NOT NULL,
  input_modalities text[] NOT NULL DEFAULT '{}',
  output_modalities text[] NOT NULL DEFAULT '{}',
  residency_regions text[] NOT NULL DEFAULT '{}',
  sensitivity_ceiling text NOT NULL CHECK (
    sensitivity_ceiling IN ('PUBLIC','INTERNAL','CONFIDENTIAL','SENSITIVE_PERSONAL','REGULATED')
  ),
  cost_class text NOT NULL,
  latency_class text NOT NULL,
  status text NOT NULL,
  version bigint NOT NULL CHECK (version > 0),
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(provider_id, model_code, version)
);

CREATE TABLE core_ai.ai_capability (
  id uuid PRIMARY KEY,
  code text NOT NULL UNIQUE,
  category text NOT NULL CHECK (
    category IN ('CHAT','EMBEDDING','EXTRACTION','CLASSIFICATION','RERANK','OCR','IMAGE','VIDEO','AUDIO','PRESENTATION','DOCUMENT_INTELLIGENCE','AGENT','TOOL','API')
  ),
  required_entitlement text,
  default_policy_class text NOT NULL,
  schema_version integer NOT NULL CHECK (schema_version > 0),
  status text NOT NULL
);

CREATE TABLE core_ai.tenant_ai_config (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  enabled boolean NOT NULL,
  allowed_capabilities text[] NOT NULL DEFAULT '{}',
  allowed_provider_ids uuid[] NOT NULL DEFAULT '{}',
  allowed_model_ids uuid[] NOT NULL DEFAULT '{}',
  max_sensitivity_class text NOT NULL CHECK (
    max_sensitivity_class IN ('PUBLIC','INTERNAL','CONFIDENTIAL','SENSITIVE_PERSONAL','REGULATED')
  ),
  residency_policy_id uuid NOT NULL,
  monthly_budget_policy_ref text,
  retention_policy_id uuid NOT NULL,
  prompt_override_policy_id uuid NOT NULL,
  version bigint NOT NULL CHECK (version > 0),
  updated_at timestamptz NOT NULL,
  UNIQUE(tenant_id, version)
);

CREATE UNIQUE INDEX tenant_ai_config_latest_active_uq
  ON core_ai.tenant_ai_config(tenant_id, version);

CREATE TABLE core_ai.industry_ai_config (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  enabled boolean NOT NULL,
  allowed_capabilities text[] NOT NULL DEFAULT '{}',
  allowed_provider_ids uuid[] NOT NULL DEFAULT '{}',
  allowed_model_ids uuid[] NOT NULL DEFAULT '{}',
  domain_prompt_set_id uuid,
  country_pack_refs uuid[] NOT NULL DEFAULT '{}',
  localization_profile_ref text,
  version bigint NOT NULL CHECK (version > 0),
  updated_at timestamptz NOT NULL,
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  UNIQUE(tenant_id, industry_context_id, version)
);

CREATE TABLE core_ai.ai_policy (
  id uuid PRIMARY KEY,
  owner_scope core_config.owner_scope NOT NULL,
  tenant_id uuid,
  industry_context_id uuid,
  code text NOT NULL,
  priority integer NOT NULL DEFAULT 100,
  effect core_ai.ai_policy_effect NOT NULL,
  condition_ast_json jsonb NOT NULL,
  constraint_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  version integer NOT NULL CHECK (version > 0),
  status text NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CHECK (
    (owner_scope='PLATFORM' AND tenant_id IS NULL AND industry_context_id IS NULL)
    OR (owner_scope='TENANT' AND tenant_id IS NOT NULL AND industry_context_id IS NULL)
    OR (owner_scope='INDUSTRY' AND tenant_id IS NOT NULL AND industry_context_id IS NOT NULL)
  ),
  FOREIGN KEY (tenant_id) REFERENCES core_tenancy.tenant(id),
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id)
);

CREATE UNIQUE INDEX ai_policy_scope_code_version_uq
  ON core_ai.ai_policy(
    owner_scope,
    COALESCE(tenant_id,'00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(industry_context_id,'00000000-0000-0000-0000-000000000000'::uuid),
    code,
    version
  );

CREATE TABLE core_ai.prompt_template (
  id uuid PRIMARY KEY,
  owner_scope core_config.owner_scope NOT NULL,
  tenant_id uuid,
  industry_context_id uuid,
  code text NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  system_template text NOT NULL,
  variable_schema_json jsonb NOT NULL,
  grounding_required boolean NOT NULL DEFAULT false,
  allowed_override_fields text[] NOT NULL DEFAULT '{}',
  status core_ai.prompt_status NOT NULL,
  created_by uuid NOT NULL REFERENCES core_identity.platform_principal(id),
  approved_by uuid REFERENCES core_identity.platform_principal(id),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CHECK (
    (owner_scope='PLATFORM' AND tenant_id IS NULL AND industry_context_id IS NULL)
    OR (owner_scope='TENANT' AND tenant_id IS NOT NULL AND industry_context_id IS NULL)
    OR (owner_scope='INDUSTRY' AND tenant_id IS NOT NULL AND industry_context_id IS NOT NULL)
  ),
  FOREIGN KEY (tenant_id) REFERENCES core_tenancy.tenant(id),
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id)
);

CREATE UNIQUE INDEX prompt_template_scope_code_version_uq
  ON core_ai.prompt_template(
    owner_scope,
    COALESCE(tenant_id,'00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(industry_context_id,'00000000-0000-0000-0000-000000000000'::uuid),
    code,
    version
  );

CREATE UNIQUE INDEX prompt_template_active_uq
  ON core_ai.prompt_template(
    owner_scope,
    COALESCE(tenant_id,'00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(industry_context_id,'00000000-0000-0000-0000-000000000000'::uuid),
    code
  ) WHERE status='ACTIVE';

CREATE TABLE core_ai.ai_provisioning_snapshot (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid,
  version bigint NOT NULL CHECK (version > 0),
  subscription_version bigint NOT NULL,
  entitlement_snapshot_version bigint NOT NULL,
  industry_activation_version bigint,
  ms_pack_versions jsonb NOT NULL DEFAULT '{}'::jsonb,
  country_pack_versions jsonb NOT NULL DEFAULT '{}'::jsonb,
  tenant_ai_config_version bigint NOT NULL,
  allowed_capability_ids uuid[] NOT NULL,
  allowed_api_classes text[] NOT NULL,
  allowed_provider_ids uuid[] NOT NULL,
  allowed_model_classes text[] NOT NULL,
  budget_policy_ref text,
  status core_ai.provisioning_status NOT NULL,
  compiled_at timestamptz NOT NULL,
  valid_until timestamptz,
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  CHECK (valid_until IS NULL OR valid_until > compiled_at)
);

CREATE UNIQUE INDEX ai_provisioning_snapshot_scope_version_uq
  ON core_ai.ai_provisioning_snapshot(
    tenant_id,
    COALESCE(industry_context_id,'00000000-0000-0000-0000-000000000000'::uuid),
    version
  );

CREATE UNIQUE INDEX ai_provisioning_snapshot_active_uq
  ON core_ai.ai_provisioning_snapshot(
    tenant_id,
    COALESCE(industry_context_id,'00000000-0000-0000-0000-000000000000'::uuid)
  ) WHERE status='ACTIVE';

CREATE TABLE core_ai.ai_media_request (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid,
  principal_id uuid NOT NULL REFERENCES core_identity.platform_principal(id),
  capability_code text NOT NULL REFERENCES core_ai.ai_capability(code),
  media_type core_ai.media_type NOT NULL,
  prompt_template_id uuid REFERENCES core_ai.prompt_template(id),
  prompt_version integer,
  brand_config_version bigint,
  localization_profile_ref text,
  input_document_refs uuid[] NOT NULL DEFAULT '{}',
  sensitivity_class text NOT NULL CHECK (
    sensitivity_class IN ('PUBLIC','INTERNAL','CONFIDENTIAL','SENSITIVE_PERSONAL','REGULATED')
  ),
  residency_requirement text NOT NULL,
  moderation_policy_ref text NOT NULL,
  status text NOT NULL,
  created_at timestamptz NOT NULL,
  completed_at timestamptz,
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  CHECK (completed_at IS NULL OR completed_at >= created_at)
);

ALTER TABLE core_ai.tenant_ai_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_ai.tenant_ai_config FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_ai_config_tenant_policy ON core_ai.tenant_ai_config
  USING (tenant_id=core_tenancy.current_tenant_id())
  WITH CHECK (tenant_id=core_tenancy.current_tenant_id());

ALTER TABLE core_ai.industry_ai_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_ai.industry_ai_config FORCE ROW LEVEL SECURITY;
CREATE POLICY industry_ai_config_context_policy ON core_ai.industry_ai_config
  USING (
    tenant_id=core_tenancy.current_tenant_id()
    AND industry_context_id=core_tenancy.current_industry_context_id()
  )
  WITH CHECK (
    tenant_id=core_tenancy.current_tenant_id()
    AND industry_context_id=core_tenancy.current_industry_context_id()
  );

ALTER TABLE core_ai.ai_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_ai.ai_policy FORCE ROW LEVEL SECURITY;
CREATE POLICY ai_policy_scope_policy ON core_ai.ai_policy
  USING (core_config.row_visible_to_current_context(owner_scope,tenant_id,industry_context_id))
  WITH CHECK (core_config.row_visible_to_current_context(owner_scope,tenant_id,industry_context_id));

ALTER TABLE core_ai.prompt_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_ai.prompt_template FORCE ROW LEVEL SECURITY;
CREATE POLICY prompt_template_scope_policy ON core_ai.prompt_template
  USING (core_config.row_visible_to_current_context(owner_scope,tenant_id,industry_context_id))
  WITH CHECK (core_config.row_visible_to_current_context(owner_scope,tenant_id,industry_context_id));

ALTER TABLE core_ai.ai_provisioning_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_ai.ai_provisioning_snapshot FORCE ROW LEVEL SECURITY;
CREATE POLICY ai_provisioning_snapshot_context_policy ON core_ai.ai_provisioning_snapshot
  USING (
    tenant_id=core_tenancy.current_tenant_id()
    AND (industry_context_id IS NULL OR industry_context_id=core_tenancy.current_industry_context_id())
  )
  WITH CHECK (
    tenant_id=core_tenancy.current_tenant_id()
    AND (industry_context_id IS NULL OR industry_context_id=core_tenancy.current_industry_context_id())
  );

ALTER TABLE core_ai.ai_media_request ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_ai.ai_media_request FORCE ROW LEVEL SECURITY;
CREATE POLICY ai_media_request_context_policy ON core_ai.ai_media_request
  USING (
    tenant_id=core_tenancy.current_tenant_id()
    AND (industry_context_id IS NULL OR industry_context_id=core_tenancy.current_industry_context_id())
  )
  WITH CHECK (
    tenant_id=core_tenancy.current_tenant_id()
    AND principal_id=core_tenancy.current_principal_id()
    AND (industry_context_id IS NULL OR industry_context_id=core_tenancy.current_industry_context_id())
  );

INSERT INTO core_authz.rls_table_registry
(schema_name,table_name,scope_class,policy_class,owner_module,force_rls_required,registered_at)
VALUES
('core_ai','tenant_ai_config','TENANT_CORE','RLS-TENANT-READ/WRITE','AI',true,now()),
('core_ai','industry_ai_config','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','AI',true,now()),
('core_ai','ai_policy','MIXED_SCOPED','RLS-PLATFORM/TENANT/INDUSTRY','AI',true,now()),
('core_ai','prompt_template','MIXED_SCOPED','RLS-PLATFORM/TENANT/INDUSTRY','AI',true,now()),
('core_ai','ai_provisioning_snapshot','MIXED_SCOPED','RLS-TENANT/RLS-INDUSTRY','AI',true,now()),
('core_ai','ai_media_request','MIXED_SCOPED','RLS-TENANT/RLS-INDUSTRY','AI',true,now());

COMMIT;
