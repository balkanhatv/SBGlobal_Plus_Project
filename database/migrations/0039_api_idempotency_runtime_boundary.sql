-- SBGlobal Plus — Migration 0039: DD-06 idempotency runtime exact-scope boundary
BEGIN;

DROP POLICY IF EXISTS idempotency_record_context_policy
  ON core_integration.idempotency_record;

CREATE POLICY idempotency_record_context_policy
  ON core_integration.idempotency_record
  USING (
    tenant_id=core_tenancy.current_tenant_id()
    AND (
      (
        core_tenancy.current_scope_class()='TENANT_CORE'
        AND industry_context_id IS NULL
      )
      OR (
        core_tenancy.current_scope_class()='TENANT_INDUSTRY'
        AND industry_context_id=core_tenancy.current_industry_context_id()
      )
    )
  )
  WITH CHECK (
    tenant_id=core_tenancy.current_tenant_id()
    AND (
      (
        core_tenancy.current_scope_class()='TENANT_CORE'
        AND industry_context_id IS NULL
      )
      OR (
        core_tenancy.current_scope_class()='TENANT_INDUSTRY'
        AND industry_context_id=core_tenancy.current_industry_context_id()
      )
    )
  );

-- First-party protected API commands execute under sbg_app_rw. Give that role only
-- the state-machine privileges required for idempotency. DELETE remains prohibited.
GRANT SELECT,INSERT,UPDATE ON core_integration.idempotency_record TO sbg_app_rw;
REVOKE DELETE ON core_integration.idempotency_record FROM sbg_app_rw;

COMMIT;
