-- SBGlobal Plus — Migration 0003: Identity & Authorization core
BEGIN;

CREATE TYPE core_identity.principal_type AS ENUM ('HUMAN','API_CLIENT','SERVICE','PLATFORM_OPERATOR');
CREATE TYPE core_identity.principal_status AS ENUM ('PENDING','ACTIVE','SUSPENDED','REVOKED');
CREATE TYPE core_identity.provider_code AS ENUM ('CLERK','AUTHJS','OTHER_APPROVED');
CREATE TYPE core_identity.link_status AS ENUM ('ACTIVE','SUSPENDED','REVOKED');
CREATE TYPE core_identity.membership_status AS ENUM ('INVITED','ACTIVE','SUSPENDED','REVOKED');
CREATE TYPE core_identity.credential_status AS ENUM ('ACTIVE','SUSPENDED','REVOKED','EXPIRED');
CREATE TYPE core_identity.device_status AS ENUM ('PENDING','TRUSTED','REVOKED','RISK_HOLD');

CREATE TYPE core_authz.permission_status AS ENUM ('ACTIVE','RETIRED');
CREATE TYPE core_authz.role_owner_scope AS ENUM ('PLATFORM','TENANT','INDUSTRY');
CREATE TYPE core_authz.role_status AS ENUM ('DRAFT','ACTIVE','RETIRED');
CREATE TYPE core_authz.permission_effect AS ENUM ('ALLOW','DENY');
CREATE TYPE core_authz.assignment_status AS ENUM ('ACTIVE','SUSPENDED','REVOKED','EXPIRED');
CREATE TYPE core_authz.abac_effect AS ENUM ('DENY','RESTRICT');
CREATE TYPE core_authz.policy_status AS ENUM ('DRAFT','ACTIVE','RETIRED');

CREATE TABLE core_identity.platform_principal (
  id uuid PRIMARY KEY,
  principal_type core_identity.principal_type NOT NULL,
  status core_identity.principal_status NOT NULL,
  display_name text,
  primary_email_norm text,
  primary_mobile_norm text,
  auth_epoch bigint NOT NULL DEFAULT 1,
  service_code text,
  owning_module text,
  allowed_scope_classes text[],
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CHECK (
    (principal_type = 'SERVICE' AND service_code IS NOT NULL AND owning_module IS NOT NULL)
    OR principal_type <> 'SERVICE'
  )
);

CREATE INDEX platform_principal_email_idx
  ON core_identity.platform_principal(primary_email_norm)
  WHERE primary_email_norm IS NOT NULL;
CREATE INDEX platform_principal_mobile_idx
  ON core_identity.platform_principal(primary_mobile_norm)
  WHERE primary_mobile_norm IS NOT NULL;

CREATE TABLE core_identity.identity_provider_link (
  id uuid PRIMARY KEY,
  principal_id uuid NOT NULL REFERENCES core_identity.platform_principal(id),
  provider core_identity.provider_code NOT NULL,
  provider_subject text NOT NULL,
  tenant_hint uuid,
  created_at timestamptz NOT NULL,
  last_verified_at timestamptz,
  status core_identity.link_status NOT NULL,
  UNIQUE (provider, provider_subject)
);

CREATE TABLE core_identity.tenant_membership (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  principal_id uuid NOT NULL REFERENCES core_identity.platform_principal(id),
  status core_identity.membership_status NOT NULL,
  default_org_unit_id uuid,
  valid_from timestamptz,
  valid_until timestamptz,
  membership_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  FOREIGN KEY (tenant_id, default_org_unit_id)
    REFERENCES core_tenancy.org_unit(tenant_id, id),
  CHECK (valid_until IS NULL OR valid_from IS NULL OR valid_until > valid_from)
);

CREATE UNIQUE INDEX tenant_membership_one_active_uq
  ON core_identity.tenant_membership(tenant_id, principal_id)
  WHERE status = 'ACTIVE';

CREATE TABLE core_authz.permission_definition (
  id uuid PRIMARY KEY,
  code text NOT NULL UNIQUE,
  domain text NOT NULL,
  module text NOT NULL,
  resource_or_capability text NOT NULL,
  action text NOT NULL,
  scope_class text NOT NULL,
  sensitivity_ceiling text NOT NULL,
  description text NOT NULL,
  status core_authz.permission_status NOT NULL,
  version integer NOT NULL CHECK (version > 0)
);

CREATE TABLE core_authz.role_template (
  id uuid PRIMARY KEY,
  code text NOT NULL,
  owner_scope core_authz.role_owner_scope NOT NULL,
  tenant_id uuid,
  industry_context_id uuid,
  industry_code text,
  name text NOT NULL,
  description text,
  immutable_seed boolean NOT NULL DEFAULT false,
  version integer NOT NULL CHECK (version > 0),
  status core_authz.role_status NOT NULL,
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

CREATE UNIQUE INDEX role_template_scope_code_version_uq
  ON core_authz.role_template(
    owner_scope,
    COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(industry_context_id, '00000000-0000-0000-0000-000000000000'::uuid),
    code,
    version
  );

CREATE TABLE core_authz.role_permission (
  role_id uuid NOT NULL REFERENCES core_authz.role_template(id),
  permission_id uuid NOT NULL REFERENCES core_authz.permission_definition(id),
  effect core_authz.permission_effect NOT NULL,
  constraints_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  version integer NOT NULL CHECK (version > 0),
  PRIMARY KEY (role_id, permission_id, version)
);

CREATE TABLE core_authz.role_assignment (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid,
  membership_id uuid,
  principal_id uuid NOT NULL REFERENCES core_identity.platform_principal(id),
  role_id uuid NOT NULL REFERENCES core_authz.role_template(id),
  org_unit_id uuid,
  valid_from timestamptz,
  valid_until timestamptz,
  status core_authz.assignment_status NOT NULL,
  created_by uuid NOT NULL REFERENCES core_identity.platform_principal(id),
  created_at timestamptz NOT NULL,
  CHECK (membership_id IS NOT NULL OR principal_id IS NOT NULL),
  CHECK (valid_until IS NULL OR valid_from IS NULL OR valid_until > valid_from),
  FOREIGN KEY (membership_id) REFERENCES core_identity.tenant_membership(id),
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  FOREIGN KEY (tenant_id, org_unit_id)
    REFERENCES core_tenancy.org_unit(tenant_id, id)
);

CREATE INDEX role_assignment_tenant_principal_idx
  ON core_authz.role_assignment(tenant_id, principal_id, status);
CREATE INDEX role_assignment_tenant_industry_idx
  ON core_authz.role_assignment(tenant_id, industry_context_id, status);

CREATE TABLE core_identity.api_credential (
  id uuid PRIMARY KEY,
  tenant_id uuid,
  industry_context_id uuid,
  principal_id uuid NOT NULL REFERENCES core_identity.platform_principal(id),
  key_prefix text NOT NULL,
  secret_hash text NOT NULL,
  status core_identity.credential_status NOT NULL,
  permission_profile_id uuid,
  expires_at timestamptz,
  last_used_at timestamptz,
  allowed_cidrs cidr[],
  credential_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  revoked_at timestamptz,
  FOREIGN KEY (tenant_id) REFERENCES core_tenancy.tenant(id),
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id)
);

CREATE UNIQUE INDEX api_credential_key_prefix_uq
  ON core_identity.api_credential(key_prefix);

CREATE TABLE core_identity.device_registration (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  principal_id uuid NOT NULL REFERENCES core_identity.platform_principal(id),
  device_fingerprint_hash text NOT NULL,
  platform text NOT NULL,
  status core_identity.device_status NOT NULL,
  public_key text,
  app_instance_id text,
  last_seen_at timestamptz,
  risk_level text NOT NULL,
  registration_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE INDEX device_registration_tenant_principal_idx
  ON core_identity.device_registration(tenant_id, principal_id, status);

CREATE TABLE core_identity.session_version (
  principal_id uuid NOT NULL REFERENCES core_identity.platform_principal(id),
  tenant_id uuid,
  version bigint NOT NULL,
  changed_at timestamptz NOT NULL,
  reason_code text NOT NULL,
  PRIMARY KEY (principal_id, tenant_id),
  FOREIGN KEY (tenant_id) REFERENCES core_tenancy.tenant(id)
);

CREATE TABLE core_authz.abac_policy (
  id uuid PRIMARY KEY,
  code text NOT NULL,
  tenant_id uuid,
  industry_context_id uuid,
  applies_to_permission_pattern text NOT NULL,
  priority integer NOT NULL DEFAULT 100,
  effect core_authz.abac_effect NOT NULL,
  expression_version integer NOT NULL CHECK (expression_version > 0),
  expression_ast_json jsonb NOT NULL,
  valid_from timestamptz,
  valid_until timestamptz,
  status core_authz.policy_status NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CHECK (valid_until IS NULL OR valid_from IS NULL OR valid_until > valid_from),
  FOREIGN KEY (tenant_id) REFERENCES core_tenancy.tenant(id),
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id)
);

CREATE UNIQUE INDEX abac_policy_scope_code_version_uq
  ON core_authz.abac_policy(
    COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(industry_context_id, '00000000-0000-0000-0000-000000000000'::uuid),
    code,
    expression_version
  );

-- Tenant-scoped forced RLS.
ALTER TABLE core_identity.tenant_membership ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_identity.tenant_membership FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_membership_tenant_policy ON core_identity.tenant_membership
  USING (tenant_id = core_tenancy.current_tenant_id())
  WITH CHECK (tenant_id = core_tenancy.current_tenant_id());

ALTER TABLE core_authz.role_assignment ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_authz.role_assignment FORCE ROW LEVEL SECURITY;
CREATE POLICY role_assignment_context_policy ON core_authz.role_assignment
  USING (
    tenant_id = core_tenancy.current_tenant_id()
    AND (industry_context_id IS NULL OR industry_context_id = core_tenancy.current_industry_context_id())
  )
  WITH CHECK (
    tenant_id = core_tenancy.current_tenant_id()
    AND (industry_context_id IS NULL OR industry_context_id = core_tenancy.current_industry_context_id())
  );

ALTER TABLE core_identity.api_credential ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_identity.api_credential FORCE ROW LEVEL SECURITY;
CREATE POLICY api_credential_context_policy ON core_identity.api_credential
  USING (
    tenant_id IS NULL
    OR (
      tenant_id = core_tenancy.current_tenant_id()
      AND (industry_context_id IS NULL OR industry_context_id = core_tenancy.current_industry_context_id())
    )
  )
  WITH CHECK (
    tenant_id IS NULL
    OR (
      tenant_id = core_tenancy.current_tenant_id()
      AND (industry_context_id IS NULL OR industry_context_id = core_tenancy.current_industry_context_id())
    )
  );

ALTER TABLE core_identity.device_registration ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_identity.device_registration FORCE ROW LEVEL SECURITY;
CREATE POLICY device_registration_tenant_policy ON core_identity.device_registration
  USING (tenant_id = core_tenancy.current_tenant_id())
  WITH CHECK (tenant_id = core_tenancy.current_tenant_id());

ALTER TABLE core_authz.abac_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_authz.abac_policy FORCE ROW LEVEL SECURITY;
CREATE POLICY abac_policy_context_policy ON core_authz.abac_policy
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

COMMIT;
