-- SBGlobal Plus — Database Bootstrap Migration 0001
-- Authority: DD-05 CORE DATA MODEL, DATABASE & RLS DESIGN
-- Scope: platform directory, Core tenancy/context, recovered shared-definition contracts.
-- This migration is intentionally SQL-first. No ORM/tooling assumption is introduced.

BEGIN;

CREATE SCHEMA IF NOT EXISTS platform_directory;
CREATE SCHEMA IF NOT EXISTS core_identity;
CREATE SCHEMA IF NOT EXISTS core_tenancy;
CREATE SCHEMA IF NOT EXISTS core_authz;
CREATE SCHEMA IF NOT EXISTS core_commercial;
CREATE SCHEMA IF NOT EXISTS core_config;
CREATE SCHEMA IF NOT EXISTS core_master;
CREATE SCHEMA IF NOT EXISTS core_workflow;
CREATE SCHEMA IF NOT EXISTS core_notification;
CREATE SCHEMA IF NOT EXISTS core_document;
CREATE SCHEMA IF NOT EXISTS core_audit;
CREATE SCHEMA IF NOT EXISTS core_integration;
CREATE SCHEMA IF NOT EXISTS core_projection;

CREATE SCHEMA IF NOT EXISTS ind_hlt;
CREATE SCHEMA IF NOT EXISTS ind_edu;
CREATE SCHEMA IF NOT EXISTS ind_rtl;
CREATE SCHEMA IF NOT EXISTS ind_hsp;
CREATE SCHEMA IF NOT EXISTS ind_mfg;
CREATE SCHEMA IF NOT EXISTS ind_psv;
CREATE SCHEMA IF NOT EXISTS ind_gov;
CREATE SCHEMA IF NOT EXISTS ind_ngo;
CREATE SCHEMA IF NOT EXISTS ind_sfm;

CREATE TYPE platform_directory.data_home_status AS ENUM ('ACTIVE','SUSPENDED','RETIRED');
CREATE TYPE core_tenancy.tenant_status AS ENUM ('PROVISIONING','ACTIVE','SUSPENDED','OFFBOARDING','ARCHIVED','PURGED');
CREATE TYPE core_tenancy.industry_context_status AS ENUM ('PENDING','ACTIVE','SUSPENDED','DISABLED');
CREATE TYPE core_tenancy.org_unit_type AS ENUM ('BRANCH','DEPARTMENT','LOCATION','OTHER');
CREATE TYPE core_tenancy.org_unit_status AS ENUM ('ACTIVE','SUSPENDED','ARCHIVED');

CREATE TYPE core_config.owner_scope AS ENUM ('PLATFORM','TENANT','INDUSTRY');
CREATE TYPE core_config.definition_status AS ENUM ('DRAFT','REVIEW','PUBLISHED','ACTIVE','RETIRED');
CREATE TYPE core_config.rule_safety_class AS ENUM ('BUSINESS','CONFIGURATION','VALIDATION');
CREATE TYPE core_config.form_field_type AS ENUM ('TEXT','NUMBER','DECIMAL','DATE','DATETIME','BOOLEAN','SELECT','MULTISELECT','REFERENCE','FILE','JSON_STRUCTURED');
CREATE TYPE core_config.activation_status AS ENUM ('PENDING','ACTIVE','DISABLED');
CREATE TYPE core_config.accessibility_validation_status AS ENUM ('PENDING','PASS','FAIL');
CREATE TYPE core_config.export_type AS ENUM ('DATA_ACCESS','PORTABILITY','TENANT_EXPORT','ADMIN_EXPORT');
CREATE TYPE core_config.export_status AS ENUM ('REQUESTED','VALIDATING','APPROVAL_REQUIRED','APPROVED','GENERATING','READY','DOWNLOADED','EXPIRED','REJECTED','CANCELLED');

CREATE TABLE platform_directory.data_home (
  id uuid PRIMARY KEY,
  code text NOT NULL UNIQUE,
  region_code text NOT NULL,
  jurisdiction_code text NOT NULL,
  topology_class text NOT NULL,
  status platform_directory.data_home_status NOT NULL,
  routing_version bigint NOT NULL DEFAULT 1,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE core_tenancy.tenant (
  id uuid PRIMARY KEY,
  tenant_code text NOT NULL UNIQUE,
  legal_name text NOT NULL,
  display_name text NOT NULL,
  status core_tenancy.tenant_status NOT NULL,
  primary_industry_code text NOT NULL,
  data_home_id uuid NOT NULL REFERENCES platform_directory.data_home(id),
  residency_region_code text NOT NULL,
  current_subscription_id uuid,
  config_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE INDEX tenant_status_idx ON core_tenancy.tenant(status);
CREATE INDEX tenant_data_home_idx ON core_tenancy.tenant(data_home_id);

CREATE TABLE core_tenancy.industry_context (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_code text NOT NULL,
  status core_tenancy.industry_context_status NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  activated_at timestamptz,
  deactivated_at timestamptz,
  activation_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  UNIQUE (tenant_id, industry_code),
  UNIQUE (tenant_id, id)
);

CREATE UNIQUE INDEX industry_context_one_primary_per_tenant_idx
  ON core_tenancy.industry_context(tenant_id)
  WHERE is_primary = true AND status <> 'DISABLED';

CREATE INDEX industry_context_tenant_status_idx
  ON core_tenancy.industry_context(tenant_id, status);

CREATE TABLE core_tenancy.org_unit (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  parent_id uuid,
  unit_type core_tenancy.org_unit_type NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  path_key text NOT NULL,
  status core_tenancy.org_unit_status NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  UNIQUE (tenant_id, code),
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, parent_id)
    REFERENCES core_tenancy.org_unit(tenant_id, id)
);

CREATE INDEX org_unit_parent_idx
  ON core_tenancy.org_unit(tenant_id, parent_id);
CREATE INDEX org_unit_path_idx
  ON core_tenancy.org_unit(tenant_id, path_key);

CREATE TABLE core_tenancy.org_unit_industry (
  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  org_unit_id uuid NOT NULL,
  industry_context_id uuid NOT NULL,
  status core_tenancy.org_unit_status NOT NULL,
  config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_id, org_unit_id, industry_context_id),
  FOREIGN KEY (tenant_id, org_unit_id)
    REFERENCES core_tenancy.org_unit(tenant_id, id),
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id)
);

CREATE OR REPLACE FUNCTION core_tenancy.current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.tenant_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION core_tenancy.current_industry_context_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.industry_context_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION core_tenancy.current_scope_class()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.scope_class', true), '')
$$;

ALTER TABLE core_tenancy.industry_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_tenancy.industry_context FORCE ROW LEVEL SECURITY;
CREATE POLICY industry_context_tenant_policy
  ON core_tenancy.industry_context
  USING (tenant_id = core_tenancy.current_tenant_id())
  WITH CHECK (tenant_id = core_tenancy.current_tenant_id());

ALTER TABLE core_tenancy.org_unit ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_tenancy.org_unit FORCE ROW LEVEL SECURITY;
CREATE POLICY org_unit_tenant_policy
  ON core_tenancy.org_unit
  USING (tenant_id = core_tenancy.current_tenant_id())
  WITH CHECK (tenant_id = core_tenancy.current_tenant_id());

ALTER TABLE core_tenancy.org_unit_industry ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_tenancy.org_unit_industry FORCE ROW LEVEL SECURITY;
CREATE POLICY org_unit_industry_context_policy
  ON core_tenancy.org_unit_industry
  USING (
    tenant_id = core_tenancy.current_tenant_id()
    AND industry_context_id = core_tenancy.current_industry_context_id()
  )
  WITH CHECK (
    tenant_id = core_tenancy.current_tenant_id()
    AND industry_context_id = core_tenancy.current_industry_context_id()
  );

CREATE TABLE core_config.metadata_definition (
  id uuid PRIMARY KEY,
  owner_scope core_config.owner_scope NOT NULL,
  tenant_id uuid,
  industry_context_id uuid,
  code text NOT NULL,
  kind text NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  status core_config.definition_status NOT NULL,
  schema_json jsonb NOT NULL,
  schema_version integer NOT NULL CHECK (schema_version > 0),
  created_by uuid NOT NULL,
  approved_by uuid,
  effective_from timestamptz,
  effective_to timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CHECK (
    (owner_scope = 'PLATFORM' AND tenant_id IS NULL AND industry_context_id IS NULL)
    OR (owner_scope = 'TENANT' AND tenant_id IS NOT NULL AND industry_context_id IS NULL)
    OR (owner_scope = 'INDUSTRY' AND tenant_id IS NOT NULL AND industry_context_id IS NOT NULL)
  ),
  FOREIGN KEY (tenant_id) REFERENCES core_tenancy.tenant(id),
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id)
);

CREATE UNIQUE INDEX metadata_definition_version_uq
  ON core_config.metadata_definition (
    owner_scope,
    COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(industry_context_id, '00000000-0000-0000-0000-000000000000'::uuid),
    code,
    version
  );

CREATE UNIQUE INDEX metadata_definition_active_uq
  ON core_config.metadata_definition (
    owner_scope,
    COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(industry_context_id, '00000000-0000-0000-0000-000000000000'::uuid),
    code
  )
  WHERE status = 'ACTIVE';

CREATE TABLE core_config.rule_definition (
  id uuid PRIMARY KEY,
  owner_scope core_config.owner_scope NOT NULL,
  tenant_id uuid,
  industry_context_id uuid,
  code text NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  status core_config.definition_status NOT NULL,
  schema_version integer NOT NULL CHECK (schema_version > 0),
  input_schema_json jsonb NOT NULL,
  condition_ast_json jsonb NOT NULL,
  decision_json jsonb NOT NULL,
  priority integer NOT NULL DEFAULT 100,
  safety_class core_config.rule_safety_class NOT NULL,
  required_permission text,
  created_by uuid NOT NULL,
  approved_by uuid,
  effective_from timestamptz,
  effective_to timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CHECK (
    (owner_scope = 'PLATFORM' AND tenant_id IS NULL AND industry_context_id IS NULL)
    OR (owner_scope = 'TENANT' AND tenant_id IS NOT NULL AND industry_context_id IS NULL)
    OR (owner_scope = 'INDUSTRY' AND tenant_id IS NOT NULL AND industry_context_id IS NOT NULL)
  ),
  FOREIGN KEY (tenant_id) REFERENCES core_tenancy.tenant(id),
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id)
);

CREATE UNIQUE INDEX rule_definition_version_uq
  ON core_config.rule_definition (
    owner_scope,
    COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(industry_context_id, '00000000-0000-0000-0000-000000000000'::uuid),
    code,
    version
  );

CREATE UNIQUE INDEX rule_definition_active_uq
  ON core_config.rule_definition (
    owner_scope,
    COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(industry_context_id, '00000000-0000-0000-0000-000000000000'::uuid),
    code
  )
  WHERE status = 'ACTIVE';

CREATE TABLE core_config.form_definition (
  id uuid PRIMARY KEY,
  owner_scope core_config.owner_scope NOT NULL,
  tenant_id uuid,
  industry_context_id uuid,
  code text NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  status core_config.definition_status NOT NULL,
  schema_version integer NOT NULL CHECK (schema_version > 0),
  purpose_code text NOT NULL,
  submit_operation_id text,
  layout_schema_json jsonb NOT NULL,
  validation_rule_refs text[] NOT NULL DEFAULT '{}',
  localization_key_prefix text,
  allowed_surface_classes text[] NOT NULL,
  created_by uuid NOT NULL,
  approved_by uuid,
  effective_from timestamptz,
  effective_to timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CHECK (
    (owner_scope = 'PLATFORM' AND tenant_id IS NULL AND industry_context_id IS NULL)
    OR (owner_scope = 'TENANT' AND tenant_id IS NOT NULL AND industry_context_id IS NULL)
    OR (owner_scope = 'INDUSTRY' AND tenant_id IS NOT NULL AND industry_context_id IS NOT NULL)
  ),
  FOREIGN KEY (tenant_id) REFERENCES core_tenancy.tenant(id),
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id)
);

CREATE UNIQUE INDEX form_definition_version_uq
  ON core_config.form_definition (
    owner_scope,
    COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(industry_context_id, '00000000-0000-0000-0000-000000000000'::uuid),
    code,
    version
  );

CREATE UNIQUE INDEX form_definition_active_uq
  ON core_config.form_definition (
    owner_scope,
    COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(industry_context_id, '00000000-0000-0000-0000-000000000000'::uuid),
    code
  )
  WHERE status = 'ACTIVE';

CREATE TABLE core_config.form_field_definition (
  id uuid PRIMARY KEY,
  form_definition_id uuid NOT NULL REFERENCES core_config.form_definition(id) ON DELETE RESTRICT,
  field_key text NOT NULL,
  field_type core_config.form_field_type NOT NULL,
  label_key text NOT NULL,
  required boolean NOT NULL DEFAULT false,
  read_only boolean NOT NULL DEFAULT false,
  visibility_rule_ref text,
  validation_schema_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  reference_catalog_ref text,
  sort_order integer NOT NULL DEFAULT 0,
  sensitivity_class text NOT NULL,
  created_at timestamptz NOT NULL,
  UNIQUE (form_definition_id, field_key)
);

CREATE TABLE core_config.country_pack (
  id uuid PRIMARY KEY,
  country_code char(2) NOT NULL,
  code text NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  status core_config.definition_status NOT NULL,
  locale_codes text[] NOT NULL,
  default_currency_code char(3),
  default_timezone text,
  default_date_format text,
  address_schema_json jsonb,
  phone_schema_json jsonb,
  reference_bundle_ref text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL,
  approved_by uuid,
  effective_from timestamptz,
  UNIQUE (country_code, code, version)
);

CREATE UNIQUE INDEX country_pack_active_uq
  ON core_config.country_pack(country_code, code)
  WHERE status = 'ACTIVE';

CREATE TABLE core_config.tenant_country_pack_activation (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  country_pack_id uuid NOT NULL REFERENCES core_config.country_pack(id),
  status core_config.activation_status NOT NULL,
  config_override_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  activated_at timestamptz,
  disabled_at timestamptz,
  row_version bigint NOT NULL DEFAULT 1,
  UNIQUE (tenant_id, country_pack_id)
);

CREATE TABLE core_config.brand_configuration (
  id uuid PRIMARY KEY,
  owner_scope core_config.owner_scope NOT NULL,
  tenant_id uuid,
  industry_context_id uuid,
  code text NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  status core_config.definition_status NOT NULL,
  token_json jsonb NOT NULL,
  typography_json jsonb NOT NULL,
  logo_document_id uuid,
  favicon_document_id uuid,
  accessibility_validation_status core_config.accessibility_validation_status NOT NULL DEFAULT 'PENDING',
  created_by uuid NOT NULL,
  approved_by uuid,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CHECK (
    (owner_scope = 'PLATFORM' AND tenant_id IS NULL AND industry_context_id IS NULL)
    OR (owner_scope = 'TENANT' AND tenant_id IS NOT NULL AND industry_context_id IS NULL)
    OR (owner_scope = 'INDUSTRY' AND tenant_id IS NOT NULL AND industry_context_id IS NOT NULL)
  ),
  CHECK (status <> 'ACTIVE' OR accessibility_validation_status = 'PASS'),
  FOREIGN KEY (tenant_id) REFERENCES core_tenancy.tenant(id),
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id)
);

CREATE UNIQUE INDEX brand_configuration_version_uq
  ON core_config.brand_configuration (
    owner_scope,
    COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(industry_context_id, '00000000-0000-0000-0000-000000000000'::uuid),
    code,
    version
  );

CREATE UNIQUE INDEX brand_configuration_active_uq
  ON core_config.brand_configuration (
    owner_scope,
    COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(industry_context_id, '00000000-0000-0000-0000-000000000000'::uuid),
    code
  )
  WHERE status = 'ACTIVE';

CREATE TABLE core_config.data_export_request (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid,
  requester_principal_id uuid NOT NULL,
  subject_principal_id uuid,
  scope_class text NOT NULL,
  export_type core_config.export_type NOT NULL,
  requested_resource_classes text[] NOT NULL,
  residency_policy_version text NOT NULL,
  sensitivity_ceiling text NOT NULL,
  status core_config.export_status NOT NULL,
  approval_ref text,
  document_id uuid,
  expires_at timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id)
);

CREATE INDEX data_export_request_tenant_status_idx
  ON core_config.data_export_request(tenant_id, status, created_at DESC);

-- Core config RLS:
-- PLATFORM rows are not made readable through tenant policies.
-- TENANT rows require matching app.tenant_id.
-- INDUSTRY rows require matching tenant + industry context.
CREATE OR REPLACE FUNCTION core_config.row_visible_to_current_context(
  p_owner_scope core_config.owner_scope,
  p_tenant_id uuid,
  p_industry_context_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN p_owner_scope = 'PLATFORM' THEN core_tenancy.current_scope_class() = 'PLATFORM_GLOBAL'
    WHEN p_owner_scope = 'TENANT' THEN p_tenant_id = core_tenancy.current_tenant_id()
    WHEN p_owner_scope = 'INDUSTRY' THEN
      p_tenant_id = core_tenancy.current_tenant_id()
      AND p_industry_context_id = core_tenancy.current_industry_context_id()
    ELSE false
  END
$$;

ALTER TABLE core_config.metadata_definition ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_config.metadata_definition FORCE ROW LEVEL SECURITY;
CREATE POLICY metadata_definition_context_policy
  ON core_config.metadata_definition
  USING (core_config.row_visible_to_current_context(owner_scope, tenant_id, industry_context_id))
  WITH CHECK (core_config.row_visible_to_current_context(owner_scope, tenant_id, industry_context_id));

ALTER TABLE core_config.rule_definition ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_config.rule_definition FORCE ROW LEVEL SECURITY;
CREATE POLICY rule_definition_context_policy
  ON core_config.rule_definition
  USING (core_config.row_visible_to_current_context(owner_scope, tenant_id, industry_context_id))
  WITH CHECK (core_config.row_visible_to_current_context(owner_scope, tenant_id, industry_context_id));

ALTER TABLE core_config.form_definition ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_config.form_definition FORCE ROW LEVEL SECURITY;
CREATE POLICY form_definition_context_policy
  ON core_config.form_definition
  USING (core_config.row_visible_to_current_context(owner_scope, tenant_id, industry_context_id))
  WITH CHECK (core_config.row_visible_to_current_context(owner_scope, tenant_id, industry_context_id));

ALTER TABLE core_config.tenant_country_pack_activation ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_config.tenant_country_pack_activation FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_country_pack_activation_tenant_policy
  ON core_config.tenant_country_pack_activation
  USING (tenant_id = core_tenancy.current_tenant_id())
  WITH CHECK (tenant_id = core_tenancy.current_tenant_id());

ALTER TABLE core_config.brand_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_config.brand_configuration FORCE ROW LEVEL SECURITY;
CREATE POLICY brand_configuration_context_policy
  ON core_config.brand_configuration
  USING (core_config.row_visible_to_current_context(owner_scope, tenant_id, industry_context_id))
  WITH CHECK (core_config.row_visible_to_current_context(owner_scope, tenant_id, industry_context_id));

ALTER TABLE core_config.data_export_request ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_config.data_export_request FORCE ROW LEVEL SECURITY;
CREATE POLICY data_export_request_context_policy
  ON core_config.data_export_request
  USING (
    tenant_id = core_tenancy.current_tenant_id()
    AND (
      industry_context_id IS NULL
      OR industry_context_id = core_tenancy.current_industry_context_id()
    )
  )
  WITH CHECK (
    tenant_id = core_tenancy.current_tenant_id()
    AND (
      industry_context_id IS NULL
      OR industry_context_id = core_tenancy.current_industry_context_id()
    )
  );

COMMIT;
