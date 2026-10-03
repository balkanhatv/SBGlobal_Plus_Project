-- SBGlobal Plus — Migration 0008: Audit, Event, Outbox & Webhook evidence
-- Physical partitioning resolution: DEV-DB-AC-001
BEGIN;

CREATE TYPE core_audit.audit_outcome AS ENUM ('SUCCESS','DENIED','FAILED');
CREATE TYPE core_integration.outbox_status AS ENUM ('PENDING','DISPATCHING','DISPATCHED','DEAD');
CREATE TYPE core_integration.webhook_subscription_status AS ENUM ('PENDING_VERIFICATION','ACTIVE','PAUSED','REVOKED');

CREATE TABLE core_integration.event_catalog (
  event_type text NOT NULL,
  event_version integer NOT NULL CHECK (event_version > 0),
  producer_module text NOT NULL,
  scope_class text NOT NULL,
  payload_schema_json jsonb NOT NULL,
  sensitivity_class text NOT NULL,
  ordering_key text,
  consumer_classes_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  retention_audit_posture text NOT NULL,
  webhook_eligible boolean NOT NULL DEFAULT false,
  backward_compatibility text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL,
  PRIMARY KEY (event_type, event_version),
  CHECK (scope_class IN ('PLATFORM_GLOBAL','TENANT_CORE','TENANT_INDUSTRY','EXPLICIT_CROSS_CONTEXT')),
  CHECK (sensitivity_class IN ('PUBLIC','INTERNAL','CONFIDENTIAL','SENSITIVE_PERSONAL','REGULATED')),
  CHECK (status IN ('ACTIVE','RETIRED'))
);

CREATE TABLE core_audit.audit_event_identity (
  id uuid PRIMARY KEY,
  occurred_at timestamptz NOT NULL,
  UNIQUE (id, occurred_at)
);
REVOKE ALL ON core_audit.audit_event_identity FROM PUBLIC;

CREATE TABLE core_integration.outbox_event_identity (
  id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL,
  UNIQUE (id, created_at)
);
REVOKE ALL ON core_integration.outbox_event_identity FROM PUBLIC;

CREATE TABLE core_integration.webhook_subscription (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  name text NOT NULL,
  endpoint_url text NOT NULL,
  status core_integration.webhook_subscription_status NOT NULL,
  secret_version bigint NOT NULL DEFAULT 1,
  event_filter_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  allowed_industry_context_ids uuid[] NOT NULL DEFAULT '{}',
  permission_profile_id uuid,
  created_by uuid NOT NULL REFERENCES core_identity.platform_principal(id),
  verified_at timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE INDEX webhook_subscription_tenant_status_idx
  ON core_integration.webhook_subscription(tenant_id, status);

CREATE INDEX webhook_subscription_industries_gin_idx
  ON core_integration.webhook_subscription
  USING gin(allowed_industry_context_ids);

CREATE TABLE core_integration.webhook_delivery_identity (
  id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL,
  subscription_id uuid NOT NULL REFERENCES core_integration.webhook_subscription(id),
  event_id uuid NOT NULL REFERENCES core_integration.outbox_event_identity(id),
  attempt_no integer NOT NULL CHECK (attempt_no > 0),
  UNIQUE (id, created_at),
  UNIQUE (subscription_id, event_id, attempt_no)
);
REVOKE ALL ON core_integration.webhook_delivery_identity FROM PUBLIC;

CREATE TABLE core_audit.audit_event (
  id uuid NOT NULL,
  tenant_id uuid,
  industry_context_id uuid,
  scope_class text NOT NULL,
  occurred_at timestamptz NOT NULL,
  actor_principal_id uuid REFERENCES core_identity.platform_principal(id),
  actor_type text NOT NULL,
  action_code text NOT NULL,
  resource_type text,
  resource_id text,
  outcome core_audit.audit_outcome NOT NULL,
  reason_code text,
  permission_code text,
  access_decision_id uuid,
  source_module text NOT NULL,
  correlation_id uuid NOT NULL,
  causation_id uuid,
  request_id text,
  data_home_id uuid REFERENCES platform_directory.data_home(id),
  region_code text,
  sensitivity_class text NOT NULL,
  evidence_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  schema_version integer NOT NULL CHECK (schema_version > 0),
  PRIMARY KEY (id, occurred_at),
  FOREIGN KEY (id, occurred_at)
    REFERENCES core_audit.audit_event_identity(id, occurred_at),
  FOREIGN KEY (tenant_id) REFERENCES core_tenancy.tenant(id),
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  CHECK (scope_class IN ('PLATFORM_GLOBAL','TENANT_CORE','TENANT_INDUSTRY','EXPLICIT_CROSS_CONTEXT')),
  CHECK (sensitivity_class IN ('PUBLIC','INTERNAL','CONFIDENTIAL','SENSITIVE_PERSONAL','REGULATED')),
  CHECK (
    (scope_class = 'PLATFORM_GLOBAL' AND tenant_id IS NULL AND industry_context_id IS NULL)
    OR (scope_class = 'TENANT_CORE' AND tenant_id IS NOT NULL AND industry_context_id IS NULL)
    OR (scope_class = 'TENANT_INDUSTRY' AND tenant_id IS NOT NULL AND industry_context_id IS NOT NULL)
    OR (scope_class = 'EXPLICIT_CROSS_CONTEXT' AND tenant_id IS NOT NULL)
  )
) PARTITION BY RANGE (occurred_at);

CREATE INDEX audit_event_tenant_context_time_idx
  ON core_audit.audit_event(tenant_id, industry_context_id, occurred_at DESC);
CREATE INDEX audit_event_principal_time_idx
  ON core_audit.audit_event(actor_principal_id, occurred_at DESC);
CREATE INDEX audit_event_resource_idx
  ON core_audit.audit_event(resource_type, resource_id, occurred_at DESC);
CREATE INDEX audit_event_action_idx
  ON core_audit.audit_event(action_code, occurred_at DESC);
CREATE INDEX audit_event_correlation_idx
  ON core_audit.audit_event(correlation_id, occurred_at DESC);
CREATE INDEX audit_event_denied_failed_idx
  ON core_audit.audit_event(tenant_id, occurred_at DESC)
  WHERE outcome IN ('DENIED','FAILED');

ALTER TABLE core_audit.audit_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_audit.audit_event FORCE ROW LEVEL SECURITY;
CREATE POLICY audit_event_context_policy
  ON core_audit.audit_event
  USING (
    (scope_class = 'PLATFORM_GLOBAL' AND core_tenancy.current_scope_class() = 'PLATFORM_GLOBAL')
    OR (
      tenant_id = core_tenancy.current_tenant_id()
      AND (
        (scope_class = 'TENANT_CORE' AND industry_context_id IS NULL)
        OR (scope_class = 'TENANT_INDUSTRY' AND industry_context_id = core_tenancy.current_industry_context_id())
        OR (
          scope_class = 'EXPLICIT_CROSS_CONTEXT'
          AND (industry_context_id IS NULL OR industry_context_id = core_tenancy.current_industry_context_id())
        )
      )
    )
  )
  WITH CHECK (
    (scope_class = 'PLATFORM_GLOBAL' AND core_tenancy.current_scope_class() = 'PLATFORM_GLOBAL')
    OR (
      tenant_id = core_tenancy.current_tenant_id()
      AND (
        (scope_class = 'TENANT_CORE' AND industry_context_id IS NULL)
        OR (scope_class = 'TENANT_INDUSTRY' AND industry_context_id = core_tenancy.current_industry_context_id())
        OR (
          scope_class = 'EXPLICIT_CROSS_CONTEXT'
          AND (industry_context_id IS NULL OR industry_context_id = core_tenancy.current_industry_context_id())
        )
      )
    )
  );

CREATE TABLE core_integration.outbox_event (
  id uuid NOT NULL,
  tenant_id uuid,
  industry_context_id uuid,
  event_type text NOT NULL,
  event_version integer NOT NULL CHECK (event_version > 0),
  aggregate_type text NOT NULL,
  aggregate_id text NOT NULL,
  aggregate_version bigint,
  envelope_jsonb jsonb NOT NULL,
  status core_integration.outbox_status NOT NULL,
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  available_at timestamptz NOT NULL,
  locked_at timestamptz,
  locked_by text,
  dispatched_at timestamptz,
  last_error_code text,
  created_at timestamptz NOT NULL,
  PRIMARY KEY (id, created_at),
  FOREIGN KEY (id, created_at)
    REFERENCES core_integration.outbox_event_identity(id, created_at),
  FOREIGN KEY (event_type, event_version)
    REFERENCES core_integration.event_catalog(event_type, event_version),
  FOREIGN KEY (tenant_id) REFERENCES core_tenancy.tenant(id),
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  CHECK (industry_context_id IS NULL OR tenant_id IS NOT NULL)
) PARTITION BY RANGE (created_at);

CREATE INDEX outbox_event_scheduler_idx
  ON core_integration.outbox_event(status, available_at);
CREATE INDEX outbox_event_scope_idx
  ON core_integration.outbox_event(tenant_id, industry_context_id, created_at DESC);
CREATE INDEX outbox_event_aggregate_idx
  ON core_integration.outbox_event(aggregate_type, aggregate_id, aggregate_version, created_at);

ALTER TABLE core_integration.outbox_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_integration.outbox_event FORCE ROW LEVEL SECURITY;
CREATE POLICY outbox_event_context_policy
  ON core_integration.outbox_event
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

ALTER TABLE core_integration.webhook_subscription ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_integration.webhook_subscription FORCE ROW LEVEL SECURITY;
CREATE POLICY webhook_subscription_tenant_policy
  ON core_integration.webhook_subscription
  USING (tenant_id = core_tenancy.current_tenant_id())
  WITH CHECK (tenant_id = core_tenancy.current_tenant_id());

CREATE TABLE core_integration.webhook_delivery (
  id uuid NOT NULL,
  subscription_id uuid NOT NULL REFERENCES core_integration.webhook_subscription(id),
  event_id uuid NOT NULL REFERENCES core_integration.outbox_event_identity(id),
  attempt_no integer NOT NULL CHECK (attempt_no > 0),
  endpoint_snapshot text NOT NULL,
  payload_digest text NOT NULL,
  status text NOT NULL,
  http_status integer,
  started_at timestamptz NOT NULL,
  completed_at timestamptz,
  next_attempt_at timestamptz,
  error_class text,
  correlation_id uuid NOT NULL,
  created_at timestamptz NOT NULL,
  PRIMARY KEY (id, created_at),
  FOREIGN KEY (id, created_at)
    REFERENCES core_integration.webhook_delivery_identity(id, created_at),
  CHECK (completed_at IS NULL OR completed_at >= started_at)
) PARTITION BY RANGE (created_at);

CREATE INDEX webhook_delivery_subscription_event_idx
  ON core_integration.webhook_delivery(subscription_id, event_id, created_at DESC);
CREATE INDEX webhook_delivery_retry_idx
  ON core_integration.webhook_delivery(status, next_attempt_at)
  WHERE next_attempt_at IS NOT NULL;

ALTER TABLE core_integration.webhook_delivery ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_integration.webhook_delivery FORCE ROW LEVEL SECURITY;
CREATE POLICY webhook_delivery_parent_context_policy
  ON core_integration.webhook_delivery
  USING (
    EXISTS (
      SELECT 1
      FROM core_integration.webhook_subscription subscription
      WHERE subscription.id = subscription_id
    )
    AND EXISTS (
      SELECT 1
      FROM core_integration.outbox_event event_row
      WHERE event_row.id = event_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM core_integration.webhook_subscription subscription
      WHERE subscription.id = subscription_id
    )
    AND EXISTS (
      SELECT 1
      FROM core_integration.outbox_event event_row
      WHERE event_row.id = event_id
    )
  );

CREATE OR REPLACE FUNCTION platform_directory.ensure_evidence_month_partitions(p_month date)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  month_start date := date_trunc('month', p_month)::date;
  month_end date := (date_trunc('month', p_month) + interval '1 month')::date;
  suffix text := to_char(month_start, 'YYYYMM');
  audit_partition text := 'audit_event_' || suffix;
  outbox_partition text := 'outbox_event_' || suffix;
  webhook_partition text := 'webhook_delivery_' || suffix;
BEGIN
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS core_audit.%I PARTITION OF core_audit.audit_event FOR VALUES FROM (%L) TO (%L)',
    audit_partition, month_start, month_end
  );
  EXECUTE format('ALTER TABLE core_audit.%I ENABLE ROW LEVEL SECURITY', audit_partition);
  EXECUTE format('ALTER TABLE core_audit.%I FORCE ROW LEVEL SECURITY', audit_partition);
  EXECUTE format('DROP POLICY IF EXISTS audit_event_context_policy ON core_audit.%I', audit_partition);
  EXECUTE format(
    'CREATE POLICY audit_event_context_policy ON core_audit.%I USING (
      (scope_class = ''PLATFORM_GLOBAL'' AND core_tenancy.current_scope_class() = ''PLATFORM_GLOBAL'')
      OR (
        tenant_id = core_tenancy.current_tenant_id()
        AND (
          (scope_class = ''TENANT_CORE'' AND industry_context_id IS NULL)
          OR (scope_class = ''TENANT_INDUSTRY'' AND industry_context_id = core_tenancy.current_industry_context_id())
          OR (
            scope_class = ''EXPLICIT_CROSS_CONTEXT''
            AND (industry_context_id IS NULL OR industry_context_id = core_tenancy.current_industry_context_id())
          )
        )
      )
    ) WITH CHECK (
      (scope_class = ''PLATFORM_GLOBAL'' AND core_tenancy.current_scope_class() = ''PLATFORM_GLOBAL'')
      OR (
        tenant_id = core_tenancy.current_tenant_id()
        AND (
          (scope_class = ''TENANT_CORE'' AND industry_context_id IS NULL)
          OR (scope_class = ''TENANT_INDUSTRY'' AND industry_context_id = core_tenancy.current_industry_context_id())
          OR (
            scope_class = ''EXPLICIT_CROSS_CONTEXT''
            AND (industry_context_id IS NULL OR industry_context_id = core_tenancy.current_industry_context_id())
          )
        )
      )
    )',
    audit_partition
  );

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS core_integration.%I PARTITION OF core_integration.outbox_event FOR VALUES FROM (%L) TO (%L)',
    outbox_partition, month_start, month_end
  );
  EXECUTE format('ALTER TABLE core_integration.%I ENABLE ROW LEVEL SECURITY', outbox_partition);
  EXECUTE format('ALTER TABLE core_integration.%I FORCE ROW LEVEL SECURITY', outbox_partition);
  EXECUTE format('DROP POLICY IF EXISTS outbox_event_context_policy ON core_integration.%I', outbox_partition);
  EXECUTE format(
    'CREATE POLICY outbox_event_context_policy ON core_integration.%I USING (
      (tenant_id IS NULL AND core_tenancy.current_scope_class() = ''PLATFORM_GLOBAL'')
      OR (
        tenant_id = core_tenancy.current_tenant_id()
        AND (industry_context_id IS NULL OR industry_context_id = core_tenancy.current_industry_context_id())
      )
    ) WITH CHECK (
      (tenant_id IS NULL AND core_tenancy.current_scope_class() = ''PLATFORM_GLOBAL'')
      OR (
        tenant_id = core_tenancy.current_tenant_id()
        AND (industry_context_id IS NULL OR industry_context_id = core_tenancy.current_industry_context_id())
      )
    )',
    outbox_partition
  );

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS core_integration.%I PARTITION OF core_integration.webhook_delivery FOR VALUES FROM (%L) TO (%L)',
    webhook_partition, month_start, month_end
  );
  EXECUTE format('ALTER TABLE core_integration.%I ENABLE ROW LEVEL SECURITY', webhook_partition);
  EXECUTE format('ALTER TABLE core_integration.%I FORCE ROW LEVEL SECURITY', webhook_partition);
  EXECUTE format('DROP POLICY IF EXISTS webhook_delivery_parent_context_policy ON core_integration.%I', webhook_partition);
  EXECUTE format(
    'CREATE POLICY webhook_delivery_parent_context_policy ON core_integration.%I USING (
      EXISTS (
        SELECT 1 FROM core_integration.webhook_subscription subscription
        WHERE subscription.id = subscription_id
      )
      AND EXISTS (
        SELECT 1 FROM core_integration.outbox_event event_row
        WHERE event_row.id = event_id
      )
    ) WITH CHECK (
      EXISTS (
        SELECT 1 FROM core_integration.webhook_subscription subscription
        WHERE subscription.id = subscription_id
      )
      AND EXISTS (
        SELECT 1 FROM core_integration.outbox_event event_row
        WHERE event_row.id = event_id
      )
    )',
    webhook_partition
  );
END;
$$;

SELECT platform_directory.ensure_evidence_month_partitions(current_date);
SELECT platform_directory.ensure_evidence_month_partitions((current_date + interval '1 month')::date);
SELECT platform_directory.ensure_evidence_month_partitions((current_date + interval '2 months')::date);

INSERT INTO core_authz.rls_table_registry
(schema_name, table_name, scope_class, policy_class, owner_module, force_rls_required, registered_at)
VALUES
('core_audit','audit_event','MIXED_SCOPED','RLS-PLATFORM/TENANT/INDUSTRY','Audit',true,now()),
('core_integration','outbox_event','MIXED_SCOPED','RLS-PLATFORM/TENANT/INDUSTRY','Integration',true,now()),
('core_integration','webhook_subscription','TENANT_CORE','RLS-TENANT-READ/WRITE','Integration',true,now()),
('core_integration','webhook_delivery','MIXED_SCOPED','RLS-PARENT-SCOPE','Integration',true,now());

COMMIT;
