-- SBGlobal Plus — Migration 0028: Document/Integration service roles + SyncCursor uniqueness hardening

ALTER TABLE core_integration.sync_cursor
  DROP CONSTRAINT IF EXISTS sync_cursor_tenant_integration_id_capability_code_industry_context_id_key;

CREATE UNIQUE INDEX sync_cursor_scope_capability_uq
  ON core_integration.sync_cursor(
    tenant_integration_id,
    capability_code,
    COALESCE(industry_context_id,'00000000-0000-0000-0000-000000000000'::uuid)
  );

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='sbg_document_service_rw') THEN
    CREATE ROLE sbg_document_service_rw NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='sbg_integration_service_rw') THEN
    CREATE ROLE sbg_integration_service_rw NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
END $$;

GRANT USAGE ON SCHEMA core_document,core_tenancy,core_identity,core_authz,core_audit,platform_directory TO sbg_document_service_rw;
GRANT SELECT,INSERT,UPDATE,DELETE ON
  core_document.storage_object,
  core_document.document_meta,
  core_document.document_upload_session,
  core_document.document_acl
TO sbg_document_service_rw;
GRANT SELECT ON
  core_tenancy.tenant,
  core_tenancy.industry_context,
  core_identity.platform_principal,
  platform_directory.data_home
TO sbg_document_service_rw;
GRANT SELECT,INSERT ON core_audit.audit_event_identity,core_audit.audit_event TO sbg_document_service_rw;

GRANT USAGE ON SCHEMA core_integration,core_tenancy,core_identity,core_authz,core_audit TO sbg_integration_service_rw;
GRANT SELECT ON
  core_integration.integration_definition,
  core_integration.integration_capability,
  core_integration.provider_adapter,
  core_integration.event_catalog
TO sbg_integration_service_rw;
GRANT SELECT,INSERT,UPDATE,DELETE ON
  core_integration.credential_reference,
  core_integration.tenant_integration,
  core_integration.sync_cursor
TO sbg_integration_service_rw;
GRANT SELECT,INSERT,UPDATE ON
  core_integration.idempotency_record,
  core_integration.outbox_event_identity,
  core_integration.outbox_event,
  core_integration.webhook_subscription,
  core_integration.webhook_delivery_identity,
  core_integration.webhook_delivery
TO sbg_integration_service_rw;
GRANT SELECT ON
  core_tenancy.tenant,
  core_tenancy.industry_context,
  core_identity.platform_principal
TO sbg_integration_service_rw;
GRANT SELECT,INSERT ON core_audit.audit_event_identity,core_audit.audit_event TO sbg_integration_service_rw;

-- Reaffirm ordinary application separation from private physical/provider metadata.
REVOKE ALL PRIVILEGES ON core_document.storage_object FROM sbg_app_rw;
REVOKE ALL PRIVILEGES ON core_integration.credential_reference FROM sbg_app_rw;
