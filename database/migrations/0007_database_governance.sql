-- SBGlobal Plus — Migration 0007: Database governance registry
BEGIN;

CREATE TABLE core_authz.rls_table_registry (
  schema_name text NOT NULL,
  table_name text NOT NULL,
  scope_class text NOT NULL,
  policy_class text NOT NULL,
  owner_module text NOT NULL,
  force_rls_required boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'ACTIVE',
  registered_at timestamptz NOT NULL,
  PRIMARY KEY (schema_name, table_name),
  CHECK (scope_class IN ('TENANT_CORE','TENANT_INDUSTRY','MIXED_SCOPED')),
  CHECK (status IN ('ACTIVE','RETIRED'))
);

CREATE TABLE platform_directory.migration_ledger (
  id uuid PRIMARY KEY,
  data_home_id uuid NOT NULL REFERENCES platform_directory.data_home(id),
  module_code text NOT NULL,
  migration_version text NOT NULL,
  migration_checksum_sha256 text NOT NULL,
  status text NOT NULL,
  release_ref text,
  started_at timestamptz,
  completed_at timestamptz,
  error_code text,
  applied_by_ref text,
  created_at timestamptz NOT NULL,
  UNIQUE (data_home_id, module_code, migration_version),
  CHECK (status IN ('PENDING','APPLYING','APPLIED','FAILED','ROLLED_BACK'))
);

CREATE INDEX migration_ledger_data_home_status_idx
  ON platform_directory.migration_ledger(data_home_id, status, created_at DESC);

INSERT INTO core_authz.rls_table_registry
(schema_name, table_name, scope_class, policy_class, owner_module, force_rls_required, registered_at)
VALUES
('core_tenancy','industry_context','TENANT_CORE','RLS-TENANT-READ/WRITE','Tenancy',true,now()),
('core_tenancy','org_unit','TENANT_CORE','RLS-TENANT-READ/WRITE','Tenancy',true,now()),
('core_tenancy','org_unit_industry','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','Tenancy',true,now()),
('core_config','metadata_definition','MIXED_SCOPED','RLS-TENANT/RLS-INDUSTRY','Metadata',true,now()),
('core_config','rule_definition','MIXED_SCOPED','RLS-TENANT/RLS-INDUSTRY','RulesPolicy',true,now()),
('core_config','form_definition','MIXED_SCOPED','RLS-TENANT/RLS-INDUSTRY','Forms',true,now()),
('core_config','form_field_definition','MIXED_SCOPED','RLS-PARENT-SCOPE','Forms',true,now()),
('core_config','tenant_country_pack_activation','TENANT_CORE','RLS-TENANT-READ/WRITE','Localization',true,now()),
('core_config','brand_configuration','MIXED_SCOPED','RLS-TENANT/RLS-INDUSTRY','Branding',true,now()),
('core_config','data_export_request','MIXED_SCOPED','RLS-TENANT/RLS-INDUSTRY','DataGovernance',true,now()),
('core_identity','tenant_membership','TENANT_CORE','RLS-TENANT-READ/WRITE','Identity',true,now()),
('core_identity','api_credential','MIXED_SCOPED','RLS-PLATFORM/TENANT/INDUSTRY','Identity',true,now()),
('core_identity','device_registration','TENANT_CORE','RLS-TENANT-READ/WRITE','Identity',true,now()),
('core_identity','session_version','MIXED_SCOPED','RLS-PRINCIPAL/TENANT','Identity',true,now()),
('core_authz','role_template','MIXED_SCOPED','RLS-PLATFORM/TENANT/INDUSTRY','Authorization',true,now()),
('core_authz','role_permission','MIXED_SCOPED','RLS-PARENT-SCOPE','Authorization',true,now()),
('core_authz','role_assignment','MIXED_SCOPED','RLS-TENANT/RLS-INDUSTRY','Authorization',true,now()),
('core_authz','abac_policy','MIXED_SCOPED','RLS-PLATFORM/TENANT/INDUSTRY','Authorization',true,now()),
('core_commercial','subscription','TENANT_CORE','RLS-TENANT-READ/WRITE','Commercial',true,now()),
('core_commercial','subscription_transition','TENANT_CORE','RLS-TENANT-READ/WRITE','Commercial',true,now()),
('core_commercial','license','MIXED_SCOPED','RLS-TENANT/RLS-INDUSTRY','Commercial',true,now()),
('core_commercial','tenant_add_on','TENANT_CORE','RLS-TENANT-READ/WRITE','Commercial',true,now()),
('core_commercial','tenant_override','MIXED_SCOPED','RLS-TENANT/RLS-INDUSTRY','Commercial',true,now()),
('core_commercial','usage_meter','MIXED_SCOPED','RLS-TENANT/RLS-INDUSTRY','Commercial',true,now()),
('core_commercial','entitlement_snapshot','TENANT_CORE','RLS-TENANT-READ/WRITE','Commercial',true,now()),
('core_commercial','entitlement_snapshot_fact','MIXED_SCOPED','RLS-PARENT+INDUSTRY','Commercial',true,now()),
('core_document','document_meta','MIXED_SCOPED','RLS-TENANT/RLS-INDUSTRY','Document',true,now()),
('core_document','document_upload_session','MIXED_SCOPED','RLS-TENANT/RLS-INDUSTRY','Document',true,now()),
('core_document','document_acl','MIXED_SCOPED','RLS-PARENT-SCOPE','Document',true,now());

COMMIT;
