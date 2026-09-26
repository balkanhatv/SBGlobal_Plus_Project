-- SBGlobal Plus — Migration 0006: Document & Storage metadata
BEGIN;

CREATE TYPE core_document.document_status AS ENUM (
  'UPLOADING','SCANNING','ACTIVE','QUARANTINED','REJECTED','DELETED','PURGED'
);
CREATE TYPE core_document.virus_scan_status AS ENUM ('PENDING','CLEAN','INFECTED','ERROR');
CREATE TYPE core_document.storage_object_status AS ENUM ('TEMPORARY','QUARANTINED','ACTIVE','DELETED','PURGED');
CREATE TYPE core_document.upload_session_status AS ENUM ('CREATED','UPLOADING','UPLOADED','VALIDATING','SCANNING','ACTIVATED','REJECTED','EXPIRED','CANCELLED');
CREATE TYPE core_document.acl_subject_type AS ENUM ('PRINCIPAL','ROLE','ORG_UNIT');
CREATE TYPE core_document.acl_permission AS ENUM ('VIEW','DOWNLOAD','SHARE','DELETE_VERSION');
CREATE TYPE core_document.acl_effect AS ENUM ('ALLOW','DENY');

CREATE TABLE core_document.storage_object (
  id uuid PRIMARY KEY,
  data_home_id uuid NOT NULL REFERENCES platform_directory.data_home(id),
  provider_ref_encrypted text,
  bucket_class text NOT NULL,
  object_key text NOT NULL,
  object_version text,
  size_bytes bigint NOT NULL CHECK (size_bytes >= 0),
  checksum_sha256 text NOT NULL,
  encryption_key_ref text NOT NULL,
  status core_document.storage_object_status NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE UNIQUE INDEX storage_object_location_version_uq
  ON core_document.storage_object(
    data_home_id,
    bucket_class,
    object_key,
    COALESCE(object_version, '')
  );

REVOKE ALL ON core_document.storage_object FROM PUBLIC;

CREATE TABLE core_document.document_meta (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid,
  scope_class text NOT NULL CHECK (scope_class IN ('TENANT_CORE','TENANT_INDUSTRY')),
  source_module text NOT NULL,
  source_ms text,
  source_resource_type text NOT NULL,
  source_resource_id text NOT NULL,
  filename_display text NOT NULL,
  media_type text NOT NULL,
  size_bytes bigint NOT NULL CHECK (size_bytes >= 0),
  checksum_sha256 text NOT NULL,
  storage_object_id uuid NOT NULL REFERENCES core_document.storage_object(id),
  owner_principal_id uuid REFERENCES core_identity.platform_principal(id),
  acl_policy_id uuid,
  sensitivity_class text NOT NULL CHECK (
    sensitivity_class IN ('PUBLIC','INTERNAL','CONFIDENTIAL','SENSITIVE_PERSONAL','REGULATED')
  ),
  retention_class text NOT NULL,
  residency_region text NOT NULL,
  status core_document.document_status NOT NULL,
  virus_scan_status core_document.virus_scan_status NOT NULL,
  version_no integer NOT NULL CHECK (version_no >= 1),
  parent_document_id uuid REFERENCES core_document.document_meta(id),
  derivative_type text,
  is_demo boolean NOT NULL DEFAULT false,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid REFERENCES core_identity.platform_principal(id),
  updated_at timestamptz NOT NULL,
  updated_by uuid REFERENCES core_identity.platform_principal(id),
  CHECK (
    (scope_class = 'TENANT_CORE' AND industry_context_id IS NULL)
    OR (scope_class = 'TENANT_INDUSTRY' AND industry_context_id IS NOT NULL)
  ),
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id)
);

CREATE INDEX document_meta_source_idx
  ON core_document.document_meta(
    tenant_id,
    industry_context_id,
    source_module,
    source_resource_type,
    source_resource_id
  );
CREATE INDEX document_meta_status_idx
  ON core_document.document_meta(tenant_id, industry_context_id, status);
CREATE INDEX document_meta_checksum_idx
  ON core_document.document_meta(tenant_id, industry_context_id, checksum_sha256);
CREATE INDEX document_meta_retention_idx
  ON core_document.document_meta(tenant_id, retention_class, status, updated_at);
CREATE INDEX document_meta_parent_idx
  ON core_document.document_meta(tenant_id, parent_document_id);

CREATE TABLE core_document.document_upload_session (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid,
  scope_class text NOT NULL CHECK (scope_class IN ('TENANT_CORE','TENANT_INDUSTRY')),
  principal_id uuid NOT NULL REFERENCES core_identity.platform_principal(id),
  expected_media_types text[] NOT NULL,
  max_size_class text NOT NULL,
  expires_at timestamptz NOT NULL,
  status core_document.upload_session_status NOT NULL,
  temp_object_ref text,
  checksum_expected text,
  created_at timestamptz NOT NULL,
  CHECK (
    (scope_class = 'TENANT_CORE' AND industry_context_id IS NULL)
    OR (scope_class = 'TENANT_INDUSTRY' AND industry_context_id IS NOT NULL)
  ),
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id)
);

CREATE INDEX document_upload_session_scope_idx
  ON core_document.document_upload_session(tenant_id, industry_context_id, status, expires_at);

CREATE TABLE core_document.document_acl (
  id uuid PRIMARY KEY,
  document_id uuid NOT NULL REFERENCES core_document.document_meta(id),
  subject_type core_document.acl_subject_type NOT NULL,
  subject_id uuid NOT NULL,
  permission core_document.acl_permission NOT NULL,
  effect core_document.acl_effect NOT NULL,
  valid_until timestamptz,
  created_at timestamptz NOT NULL,
  UNIQUE (document_id, subject_type, subject_id, permission)
);

ALTER TABLE core_document.document_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_document.document_meta FORCE ROW LEVEL SECURITY;
CREATE POLICY document_meta_context_policy
  ON core_document.document_meta
  USING (
    tenant_id = core_tenancy.current_tenant_id()
    AND (
      (scope_class = 'TENANT_CORE' AND industry_context_id IS NULL)
      OR (
        scope_class = 'TENANT_INDUSTRY'
        AND industry_context_id = core_tenancy.current_industry_context_id()
      )
    )
  )
  WITH CHECK (
    tenant_id = core_tenancy.current_tenant_id()
    AND (
      (scope_class = 'TENANT_CORE' AND industry_context_id IS NULL)
      OR (
        scope_class = 'TENANT_INDUSTRY'
        AND industry_context_id = core_tenancy.current_industry_context_id()
      )
    )
  );

ALTER TABLE core_document.document_upload_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_document.document_upload_session FORCE ROW LEVEL SECURITY;
CREATE POLICY document_upload_session_context_policy
  ON core_document.document_upload_session
  USING (
    tenant_id = core_tenancy.current_tenant_id()
    AND (
      (scope_class = 'TENANT_CORE' AND industry_context_id IS NULL)
      OR (
        scope_class = 'TENANT_INDUSTRY'
        AND industry_context_id = core_tenancy.current_industry_context_id()
      )
    )
  )
  WITH CHECK (
    tenant_id = core_tenancy.current_tenant_id()
    AND principal_id = core_tenancy.current_principal_id()
    AND (
      (scope_class = 'TENANT_CORE' AND industry_context_id IS NULL)
      OR (
        scope_class = 'TENANT_INDUSTRY'
        AND industry_context_id = core_tenancy.current_industry_context_id()
      )
    )
  );

ALTER TABLE core_document.document_acl ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_document.document_acl FORCE ROW LEVEL SECURITY;
CREATE POLICY document_acl_parent_context_policy
  ON core_document.document_acl
  USING (
    EXISTS (
      SELECT 1
      FROM core_document.document_meta parent
      WHERE parent.id = document_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM core_document.document_meta parent
      WHERE parent.id = document_id
    )
  );

-- External anonymous/public sharing is intentionally absent.
-- No public ShareGrant table or public object ACL is created by this migration.

COMMIT;
