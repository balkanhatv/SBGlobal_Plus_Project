-- SBGlobal Plus — Migration 0027: Workflow/Notification runtime-role hardening

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='sbg_workflow_worker_rw') THEN
    CREATE ROLE sbg_workflow_worker_rw NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='sbg_notification_worker_rw') THEN
    CREATE ROLE sbg_notification_worker_rw NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
END $$;

-- Transition / delivery-attempt evidence is append-only to runtime roles.
REVOKE UPDATE,DELETE ON core_workflow.workflow_transition FROM sbg_app_rw;
REVOKE UPDATE,DELETE ON core_notification.notification_delivery_attempt FROM sbg_app_rw;

GRANT USAGE ON SCHEMA core_workflow,core_tenancy,core_identity,core_authz,core_config,core_audit TO sbg_workflow_worker_rw;
GRANT SELECT ON core_workflow.workflow_definition,core_workflow.automation_definition TO sbg_workflow_worker_rw;
GRANT SELECT,INSERT,UPDATE ON core_workflow.workflow_instance,core_workflow.workflow_task,core_workflow.automation_run TO sbg_workflow_worker_rw;
GRANT SELECT,INSERT ON core_workflow.workflow_transition TO sbg_workflow_worker_rw;
GRANT SELECT ON core_tenancy.tenant,core_tenancy.industry_context,core_identity.platform_principal TO sbg_workflow_worker_rw;
GRANT SELECT,INSERT ON core_audit.audit_event_identity,core_audit.audit_event TO sbg_workflow_worker_rw;

GRANT USAGE ON SCHEMA core_notification,core_integration,core_tenancy,core_identity,core_audit TO sbg_notification_worker_rw;
GRANT SELECT ON core_notification.notification_template TO sbg_notification_worker_rw;
GRANT SELECT,INSERT,UPDATE ON core_notification.notification_delivery TO sbg_notification_worker_rw;
GRANT SELECT,INSERT ON core_notification.notification_delivery_attempt TO sbg_notification_worker_rw;
GRANT SELECT ON core_integration.tenant_integration,core_integration.integration_definition,core_integration.integration_capability TO sbg_notification_worker_rw;
GRANT SELECT ON core_tenancy.tenant,core_tenancy.industry_context,core_identity.platform_principal TO sbg_notification_worker_rw;
GRANT SELECT,INSERT ON core_audit.audit_event_identity,core_audit.audit_event TO sbg_notification_worker_rw;

-- Explicitly deny direct secret-reference metadata to Notification workers.
REVOKE ALL PRIVILEGES ON core_integration.credential_reference FROM sbg_notification_worker_rw;
