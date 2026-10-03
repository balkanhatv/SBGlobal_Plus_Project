-- SBGlobal Plus — Migration 0014: dedicated AI Gateway database role

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='sbg_ai_gateway_rw') THEN
    CREATE ROLE sbg_ai_gateway_rw NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
END $$;

REVOKE ALL ON SCHEMA core_ai FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA core_ai FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA core_ai FROM sbg_app_rw;
REVOKE ALL ON ALL TABLES IN SCHEMA core_ai FROM sbg_worker_rw;
REVOKE ALL ON ALL TABLES IN SCHEMA core_ai FROM sbg_monitor_ro;

GRANT USAGE ON SCHEMA core_ai TO sbg_ai_gateway_rw;
GRANT USAGE ON SCHEMA core_tenancy,core_identity,core_authz,core_commercial,core_config,core_document,core_audit TO sbg_ai_gateway_rw;

GRANT SELECT ON
  core_ai.ai_provider,
  core_ai.ai_model,
  core_ai.ai_capability,
  core_ai.ai_tool_definition
TO sbg_ai_gateway_rw;

GRANT SELECT,INSERT,UPDATE,DELETE ON
  core_ai.tenant_ai_config,
  core_ai.industry_ai_config,
  core_ai.ai_policy,
  core_ai.prompt_template,
  core_ai.ai_provisioning_snapshot,
  core_ai.ai_media_request,
  core_ai.assistant_definition,
  core_ai.ai_conversation,
  core_ai.ai_message,
  core_ai.token_usage,
  core_ai.ai_cost,
  core_ai.rag_source,
  core_ai.rag_chunk,
  core_ai.ai_memory_record,
  core_ai.agent_definition,
  core_ai.agent_run,
  core_ai.agent_step,
  core_ai.agent_approval
TO sbg_ai_gateway_rw;

GRANT SELECT ON
  core_tenancy.tenant,
  core_tenancy.industry_context,
  core_identity.platform_principal,
  core_identity.tenant_membership,
  core_commercial.subscription,
  core_commercial.license,
  core_commercial.entitlement_snapshot,
  core_commercial.entitlement_snapshot_fact,
  core_config.country_pack,
  core_config.tenant_country_pack_activation,
  core_config.brand_configuration,
  core_document.document_meta
TO sbg_ai_gateway_rw;

GRANT SELECT,INSERT ON
  core_audit.audit_event_identity,
  core_audit.audit_event
TO sbg_ai_gateway_rw;

ALTER DEFAULT PRIVILEGES IN SCHEMA core_ai
  REVOKE ALL ON TABLES FROM PUBLIC;
