-- SBGlobal Plus — Migration 0043: dedicated Commercial transition/compiler write boundary
-- DD-064 / DEV-COMMERCIAL-WRITER-BOUNDARY-001 prerequisite.
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname='sbg_commercial_transition_compiler_rw'
  ) THEN
    CREATE ROLE sbg_commercial_transition_compiler_rw
      NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
END $$;

ALTER ROLE sbg_commercial_transition_compiler_rw
  NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;

GRANT USAGE ON SCHEMA
  core_commercial,core_tenancy,core_integration,core_audit
TO sbg_commercial_transition_compiler_rw;

-- General application/worker roles are readers of Commercial truth, not mutation owners.
REVOKE INSERT,UPDATE,DELETE ON
  core_commercial.subscription,
  core_commercial.subscription_transition,
  core_commercial.license,
  core_commercial.tenant_add_on,
  core_commercial.tenant_override,
  core_commercial.usage_meter,
  core_commercial.entitlement_snapshot,
  core_commercial.entitlement_snapshot_fact
FROM sbg_app_rw,sbg_worker_rw;

-- Explicit source/catalog reads for plan assessment + entitlement compilation.
GRANT SELECT ON
  core_commercial.commercial_route_policy,
  core_commercial.plan,
  core_commercial.plan_version,
  core_commercial.entitlement_definition,
  core_commercial.add_on,
  core_commercial.subscription,
  core_commercial.subscription_transition,
  core_commercial.license,
  core_commercial.tenant_add_on,
  core_commercial.tenant_override,
  core_commercial.usage_meter,
  core_commercial.entitlement_snapshot,
  core_commercial.entitlement_snapshot_fact,
  core_tenancy.industry_context,
  core_integration.event_catalog
TO sbg_commercial_transition_compiler_rw;

-- The plan-change writer may change only the selected plan and optimistic version marker.
GRANT UPDATE (plan_version_id,version,updated_at)
  ON core_commercial.subscription
  TO sbg_commercial_transition_compiler_rw;

-- Immutable evidence/publication writes.
GRANT INSERT ON
  core_commercial.subscription_transition,
  core_commercial.entitlement_snapshot,
  core_commercial.entitlement_snapshot_fact
TO sbg_commercial_transition_compiler_rw;

GRANT UPDATE (status)
  ON core_commercial.entitlement_snapshot
  TO sbg_commercial_transition_compiler_rw;

-- Commercial business write + outbox + audit must be one authoritative transaction.
GRANT INSERT ON
  core_integration.outbox_event_identity,
  core_integration.outbox_event,
  core_audit.audit_event_identity,
  core_audit.audit_event
TO sbg_commercial_transition_compiler_rw;

REVOKE UPDATE,DELETE ON
  core_commercial.subscription_transition,
  core_commercial.entitlement_snapshot_fact,
  core_integration.outbox_event_identity,
  core_integration.outbox_event,
  core_audit.audit_event_identity,
  core_audit.audit_event
FROM sbg_commercial_transition_compiler_rw;

REVOKE INSERT,UPDATE,DELETE ON
  core_commercial.license,
  core_commercial.tenant_add_on,
  core_commercial.tenant_override,
  core_commercial.usage_meter,
  core_commercial.commercial_route_policy,
  core_commercial.plan,
  core_commercial.plan_version,
  core_commercial.entitlement_definition,
  core_commercial.add_on,
  core_integration.event_catalog
FROM sbg_commercial_transition_compiler_rw;

-- TENANT_CORE compilation intentionally reads all same-Tenant Industry-scoped inputs.
CREATE POLICY license_commercial_compiler_tenant_select
  ON core_commercial.license
  FOR SELECT TO sbg_commercial_transition_compiler_rw
  USING (tenant_id=core_tenancy.current_tenant_id());

CREATE POLICY tenant_override_commercial_compiler_tenant_select
  ON core_commercial.tenant_override
  FOR SELECT TO sbg_commercial_transition_compiler_rw
  USING (tenant_id=core_tenancy.current_tenant_id());

CREATE POLICY usage_meter_commercial_compiler_tenant_select
  ON core_commercial.usage_meter
  FOR SELECT TO sbg_commercial_transition_compiler_rw
  USING (tenant_id=core_tenancy.current_tenant_id());

CREATE POLICY entitlement_snapshot_fact_commercial_compiler_tenant_select
  ON core_commercial.entitlement_snapshot_fact
  FOR SELECT TO sbg_commercial_transition_compiler_rw
  USING (tenant_id=core_tenancy.current_tenant_id());

CREATE POLICY entitlement_snapshot_fact_commercial_compiler_tenant_insert
  ON core_commercial.entitlement_snapshot_fact
  FOR INSERT TO sbg_commercial_transition_compiler_rw
  WITH CHECK (tenant_id=core_tenancy.current_tenant_id());

-- Existing RLS helper functions were intentionally revoked from PUBLIC.
GRANT EXECUTE ON FUNCTION
  core_integration.outbox_row_visible(text,uuid,uuid,jsonb)
TO sbg_commercial_transition_compiler_rw;

GRANT EXECUTE ON FUNCTION
  core_audit.audit_row_visible(text,uuid,uuid,uuid,uuid)
TO sbg_commercial_transition_compiler_rw;

-- Additional role-specific restrictive policies prevent this writer from becoming
-- a generic tenant outbox/audit producer.
CREATE POLICY outbox_event_commercial_writer_restrictive
  ON core_integration.outbox_event
  AS RESTRICTIVE
  FOR ALL
  TO sbg_commercial_transition_compiler_rw
  USING (
    tenant_id=core_tenancy.current_tenant_id()
    AND industry_context_id IS NULL
    AND scope_class='TENANT_CORE'
    AND event_type IN ('subscription.transitioned','entitlement.recompiled')
  )
  WITH CHECK (
    tenant_id=core_tenancy.current_tenant_id()
    AND industry_context_id IS NULL
    AND scope_class='TENANT_CORE'
    AND event_type IN ('subscription.transitioned','entitlement.recompiled')
  );

CREATE POLICY audit_event_commercial_writer_restrictive
  ON core_audit.audit_event
  AS RESTRICTIVE
  FOR ALL
  TO sbg_commercial_transition_compiler_rw
  USING (
    tenant_id=core_tenancy.current_tenant_id()
    AND industry_context_id IS NULL
    AND source_industry_context_id IS NULL
    AND target_industry_context_id IS NULL
    AND scope_class='TENANT_CORE'
    AND source_module='Commercial'
  )
  WITH CHECK (
    tenant_id=core_tenancy.current_tenant_id()
    AND industry_context_id IS NULL
    AND source_industry_context_id IS NULL
    AND target_industry_context_id IS NULL
    AND scope_class='TENANT_CORE'
    AND source_module='Commercial'
  );

COMMIT;
