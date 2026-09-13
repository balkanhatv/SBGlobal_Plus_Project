-- SBGlobal Plus — Migration 0004: Commercial & Entitlement core
BEGIN;

CREATE TYPE core_commercial.catalog_status AS ENUM ('DRAFT','ACTIVE','RETIRED');
CREATE TYPE core_commercial.subscription_state AS ENUM ('PENDING','TRIAL','ACTIVE','GRACE','SUSPENDED','EXPIRED','CANCELLED');
CREATE TYPE core_commercial.license_type AS ENUM ('INDUSTRY','MANAGEMENT_SYSTEM','SEAT','SURFACE','API_SERVICE');
CREATE TYPE core_commercial.license_status AS ENUM ('PENDING','ACTIVE','SUSPENDED','REVOKED','EXPIRED');
CREATE TYPE core_commercial.entitlement_value_type AS ENUM ('BOOLEAN','INTEGER','DECIMAL','TEXT','SET');
CREATE TYPE core_commercial.override_type AS ENUM ('ALLOW','DENY','LIMIT_SET','LIMIT_DELTA');
CREATE TYPE core_commercial.snapshot_status AS ENUM ('CURRENT','SUPERSEDED','INVALIDATED');

CREATE TABLE core_commercial.commercial_route_policy (
  id uuid PRIMARY KEY,
  code text NOT NULL UNIQUE,
  self_serve_enabled boolean NOT NULL,
  sales_assisted_enabled boolean NOT NULL,
  market_scope_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  approval_required boolean NOT NULL DEFAULT false,
  version integer NOT NULL CHECK (version > 0),
  status core_commercial.catalog_status NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE core_commercial.plan (
  id uuid PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  status core_commercial.catalog_status NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE INDEX plan_status_idx ON core_commercial.plan(status);

CREATE TABLE core_commercial.plan_version (
  id uuid PRIMARY KEY,
  plan_id uuid NOT NULL REFERENCES core_commercial.plan(id),
  version_no integer NOT NULL CHECK (version_no > 0),
  status core_commercial.catalog_status NOT NULL,
  effective_from timestamptz,
  effective_to timestamptz,
  route_policy_id uuid NOT NULL REFERENCES core_commercial.commercial_route_policy(id),
  entitlement_template_json jsonb NOT NULL,
  limit_set_json jsonb NOT NULL,
  trial_policy_json jsonb,
  billing_policy_json jsonb NOT NULL,
  support_class text NOT NULL,
  published_at timestamptz,
  created_by uuid NOT NULL REFERENCES core_identity.platform_principal(id),
  created_at timestamptz NOT NULL,
  UNIQUE (plan_id, version_no),
  CHECK (effective_to IS NULL OR effective_from IS NULL OR effective_to > effective_from),
  CHECK (status <> 'ACTIVE' OR published_at IS NOT NULL)
);

CREATE UNIQUE INDEX plan_version_one_active_idx
  ON core_commercial.plan_version(plan_id)
  WHERE status = 'ACTIVE';

CREATE TABLE core_commercial.subscription (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  plan_version_id uuid NOT NULL REFERENCES core_commercial.plan_version(id),
  state core_commercial.subscription_state NOT NULL,
  billing_anchor_at timestamptz,
  period_start timestamptz,
  period_end timestamptz,
  trial_end_at timestamptz,
  grace_end_at timestamptz,
  auto_renew boolean NOT NULL DEFAULT true,
  billing_timezone text NOT NULL,
  current_invoice_id uuid,
  version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  cancelled_at timestamptz,
  CHECK (period_end IS NULL OR period_start IS NULL OR period_end > period_start)
);

CREATE UNIQUE INDEX subscription_one_current_per_tenant_idx
  ON core_commercial.subscription(tenant_id)
  WHERE state IN ('PENDING','TRIAL','ACTIVE','GRACE','SUSPENDED');

CREATE INDEX subscription_tenant_state_idx
  ON core_commercial.subscription(tenant_id, state);

CREATE TABLE core_commercial.subscription_transition (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  subscription_id uuid NOT NULL REFERENCES core_commercial.subscription(id),
  from_state core_commercial.subscription_state,
  to_state core_commercial.subscription_state NOT NULL,
  trigger_code text NOT NULL,
  actor_principal_id uuid REFERENCES core_identity.platform_principal(id),
  source_event_id uuid,
  reason_code text,
  occurred_at timestamptz NOT NULL,
  correlation_id uuid NOT NULL
);

CREATE UNIQUE INDEX subscription_transition_source_event_uq
  ON core_commercial.subscription_transition(subscription_id, source_event_id)
  WHERE source_event_id IS NOT NULL;

CREATE INDEX subscription_transition_tenant_time_idx
  ON core_commercial.subscription_transition(tenant_id, occurred_at DESC);

CREATE TABLE core_commercial.license (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  subscription_id uuid NOT NULL REFERENCES core_commercial.subscription(id),
  license_type core_commercial.license_type NOT NULL,
  subject_key text NOT NULL,
  industry_context_id uuid,
  principal_id uuid REFERENCES core_identity.platform_principal(id),
  status core_commercial.license_status NOT NULL,
  valid_from timestamptz NOT NULL,
  valid_until timestamptz,
  limit_json jsonb,
  assigned_by uuid REFERENCES core_identity.platform_principal(id),
  revoked_by uuid REFERENCES core_identity.platform_principal(id),
  revoke_reason text,
  version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CHECK (valid_until IS NULL OR valid_until > valid_from),
  CHECK (
    license_type NOT IN ('INDUSTRY','MANAGEMENT_SYSTEM')
    OR industry_context_id IS NOT NULL
  ),
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id)
);

CREATE INDEX license_tenant_status_idx ON core_commercial.license(tenant_id, status);
CREATE INDEX license_subject_idx ON core_commercial.license(tenant_id, subject_key, status);
CREATE INDEX license_industry_idx ON core_commercial.license(tenant_id, industry_context_id, status);
CREATE INDEX license_principal_idx ON core_commercial.license(tenant_id, principal_id, status);

CREATE TABLE core_commercial.entitlement_definition (
  id uuid PRIMARY KEY,
  code text NOT NULL UNIQUE,
  category text NOT NULL,
  value_type core_commercial.entitlement_value_type NOT NULL,
  scope_class text NOT NULL,
  description text NOT NULL,
  deny_semantics text NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  status core_commercial.catalog_status NOT NULL
);

CREATE TABLE core_commercial.add_on (
  id uuid PRIMARY KEY,
  code text NOT NULL UNIQUE,
  entitlement_delta_json jsonb NOT NULL,
  eligibility_json jsonb NOT NULL,
  status core_commercial.catalog_status NOT NULL,
  version integer NOT NULL CHECK (version > 0)
);

CREATE TABLE core_commercial.tenant_add_on (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  add_on_id uuid NOT NULL REFERENCES core_commercial.add_on(id),
  subscription_id uuid NOT NULL REFERENCES core_commercial.subscription(id),
  status core_commercial.catalog_status NOT NULL,
  quantity numeric NOT NULL CHECK (quantity >= 0),
  effective_from timestamptz NOT NULL,
  effective_to timestamptz,
  source_order_id uuid,
  version bigint NOT NULL DEFAULT 1,
  CHECK (effective_to IS NULL OR effective_to > effective_from)
);

CREATE TABLE core_commercial.tenant_override (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid,
  entitlement_code text NOT NULL REFERENCES core_commercial.entitlement_definition(code),
  override_type core_commercial.override_type NOT NULL,
  value_json jsonb NOT NULL,
  reason_code text NOT NULL,
  approved_by uuid NOT NULL REFERENCES core_identity.platform_principal(id),
  effective_from timestamptz NOT NULL,
  expires_at timestamptz,
  status core_commercial.catalog_status NOT NULL,
  created_at timestamptz NOT NULL,
  CHECK (expires_at IS NULL OR expires_at > effective_from),
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id)
);

CREATE TABLE core_commercial.usage_meter (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid,
  meter_code text NOT NULL,
  period_key text NOT NULL,
  used_value numeric NOT NULL DEFAULT 0 CHECK (used_value >= 0),
  reserved_value numeric NOT NULL DEFAULT 0 CHECK (reserved_value >= 0),
  version bigint NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL,
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id)
);

CREATE UNIQUE INDEX usage_meter_scope_period_uq
  ON core_commercial.usage_meter(
    tenant_id,
    COALESCE(industry_context_id, '00000000-0000-0000-0000-000000000000'::uuid),
    meter_code,
    period_key
  );

CREATE TABLE core_commercial.entitlement_snapshot (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  version bigint NOT NULL CHECK (version > 0),
  source_subscription_id uuid NOT NULL REFERENCES core_commercial.subscription(id),
  source_plan_version_id uuid NOT NULL REFERENCES core_commercial.plan_version(id),
  compiled_at timestamptz NOT NULL,
  valid_from timestamptz NOT NULL,
  expires_at timestamptz,
  source_fingerprint text NOT NULL,
  status core_commercial.snapshot_status NOT NULL,
  deny_set_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (tenant_id, version),
  CHECK (expires_at IS NULL OR expires_at > valid_from)
);

CREATE UNIQUE INDEX entitlement_snapshot_one_current_idx
  ON core_commercial.entitlement_snapshot(tenant_id)
  WHERE status = 'CURRENT';

CREATE TABLE core_commercial.entitlement_snapshot_fact (
  snapshot_id uuid NOT NULL REFERENCES core_commercial.entitlement_snapshot(id),
  entitlement_code text NOT NULL REFERENCES core_commercial.entitlement_definition(code),
  industry_context_id uuid,
  value_json jsonb NOT NULL,
  source_type text NOT NULL,
  source_id uuid NOT NULL,
  effective_from timestamptz NOT NULL,
  effective_to timestamptz,
  CHECK (effective_to IS NULL OR effective_to > effective_from)
);

CREATE UNIQUE INDEX entitlement_snapshot_fact_scope_uq
  ON core_commercial.entitlement_snapshot_fact(
    snapshot_id,
    entitlement_code,
    COALESCE(industry_context_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

-- Tenant-scoped forced RLS.
ALTER TABLE core_commercial.subscription ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_commercial.subscription FORCE ROW LEVEL SECURITY;
CREATE POLICY subscription_tenant_policy ON core_commercial.subscription
  USING (tenant_id = core_tenancy.current_tenant_id())
  WITH CHECK (tenant_id = core_tenancy.current_tenant_id());

ALTER TABLE core_commercial.subscription_transition ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_commercial.subscription_transition FORCE ROW LEVEL SECURITY;
CREATE POLICY subscription_transition_tenant_policy ON core_commercial.subscription_transition
  USING (tenant_id = core_tenancy.current_tenant_id())
  WITH CHECK (tenant_id = core_tenancy.current_tenant_id());

ALTER TABLE core_commercial.license ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_commercial.license FORCE ROW LEVEL SECURITY;
CREATE POLICY license_context_policy ON core_commercial.license
  USING (
    tenant_id = core_tenancy.current_tenant_id()
    AND (industry_context_id IS NULL OR industry_context_id = core_tenancy.current_industry_context_id())
  )
  WITH CHECK (
    tenant_id = core_tenancy.current_tenant_id()
    AND (industry_context_id IS NULL OR industry_context_id = core_tenancy.current_industry_context_id())
  );

ALTER TABLE core_commercial.tenant_add_on ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_commercial.tenant_add_on FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_add_on_tenant_policy ON core_commercial.tenant_add_on
  USING (tenant_id = core_tenancy.current_tenant_id())
  WITH CHECK (tenant_id = core_tenancy.current_tenant_id());

ALTER TABLE core_commercial.tenant_override ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_commercial.tenant_override FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_override_context_policy ON core_commercial.tenant_override
  USING (
    tenant_id = core_tenancy.current_tenant_id()
    AND (industry_context_id IS NULL OR industry_context_id = core_tenancy.current_industry_context_id())
  )
  WITH CHECK (
    tenant_id = core_tenancy.current_tenant_id()
    AND (industry_context_id IS NULL OR industry_context_id = core_tenancy.current_industry_context_id())
  );

ALTER TABLE core_commercial.usage_meter ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_commercial.usage_meter FORCE ROW LEVEL SECURITY;
CREATE POLICY usage_meter_context_policy ON core_commercial.usage_meter
  USING (
    tenant_id = core_tenancy.current_tenant_id()
    AND (industry_context_id IS NULL OR industry_context_id = core_tenancy.current_industry_context_id())
  )
  WITH CHECK (
    tenant_id = core_tenancy.current_tenant_id()
    AND (industry_context_id IS NULL OR industry_context_id = core_tenancy.current_industry_context_id())
  );

ALTER TABLE core_commercial.entitlement_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_commercial.entitlement_snapshot FORCE ROW LEVEL SECURITY;
CREATE POLICY entitlement_snapshot_tenant_policy ON core_commercial.entitlement_snapshot
  USING (tenant_id = core_tenancy.current_tenant_id())
  WITH CHECK (tenant_id = core_tenancy.current_tenant_id());

ALTER TABLE core_commercial.entitlement_snapshot_fact ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_commercial.entitlement_snapshot_fact FORCE ROW LEVEL SECURITY;
CREATE POLICY entitlement_snapshot_fact_parent_policy ON core_commercial.entitlement_snapshot_fact
  USING (
    EXISTS (
      SELECT 1
      FROM core_commercial.entitlement_snapshot parent
      WHERE parent.id = snapshot_id
        AND parent.tenant_id = core_tenancy.current_tenant_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM core_commercial.entitlement_snapshot parent
      WHERE parent.id = snapshot_id
        AND parent.tenant_id = core_tenancy.current_tenant_id()
    )
  );

COMMIT;
