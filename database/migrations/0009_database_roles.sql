-- SBGlobal Plus — Migration 0009: least-privilege database role classes
-- Concrete LOGIN roles are deployment-specific and should inherit only these groups.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='sbg_app_rw') THEN
    CREATE ROLE sbg_app_rw NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='sbg_worker_rw') THEN
    CREATE ROLE sbg_worker_rw NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='sbg_monitor_ro') THEN
    CREATE ROLE sbg_monitor_ro NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='sbg_migration_admin') THEN
    CREATE ROLE sbg_migration_admin NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE INHERIT BYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='sbg_backup_operator') THEN
    CREATE ROLE sbg_backup_operator NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
END $$;

REVOKE ALL ON SCHEMA platform_directory,core_identity,core_tenancy,core_authz,core_commercial,core_config,core_master,core_workflow,core_notification,core_document,core_audit,core_integration,core_projection FROM PUBLIC;
REVOKE ALL ON SCHEMA ind_hlt,ind_edu,ind_rtl,ind_hsp,ind_mfg,ind_psv,ind_gov,ind_ngo,ind_sfm FROM PUBLIC;

GRANT USAGE ON SCHEMA core_identity,core_tenancy,core_authz,core_commercial,core_config,core_master,core_workflow,core_notification,core_document,core_integration,core_projection TO sbg_app_rw;
GRANT USAGE ON SCHEMA ind_hlt,ind_edu,ind_rtl,ind_hsp,ind_mfg,ind_psv,ind_gov,ind_ngo,ind_sfm TO sbg_app_rw;

GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA core_identity,core_tenancy,core_authz,core_commercial,core_config,core_master,core_workflow,core_notification,core_document,core_projection TO sbg_app_rw;
GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA ind_hlt,ind_edu,ind_rtl,ind_hsp,ind_mfg,ind_psv,ind_gov,ind_ngo,ind_sfm TO sbg_app_rw;
GRANT SELECT,INSERT ON core_audit.audit_event_identity,core_audit.audit_event TO sbg_app_rw;
GRANT SELECT,INSERT ON core_integration.outbox_event_identity,core_integration.outbox_event TO sbg_app_rw;
GRANT SELECT ON core_integration.event_catalog,core_integration.webhook_subscription TO sbg_app_rw;

GRANT USAGE ON SCHEMA core_tenancy,core_identity,core_authz,core_commercial,core_config,core_document,core_audit,core_integration,core_projection TO sbg_worker_rw;
GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA core_projection TO sbg_worker_rw;
GRANT SELECT ON ALL TABLES IN SCHEMA core_tenancy,core_identity,core_authz,core_commercial,core_config,core_document TO sbg_worker_rw;
GRANT SELECT,INSERT ON core_audit.audit_event_identity,core_audit.audit_event TO sbg_worker_rw;
GRANT SELECT,INSERT,UPDATE ON core_integration.outbox_event_identity,core_integration.outbox_event TO sbg_worker_rw;
GRANT SELECT ON core_integration.event_catalog,core_integration.webhook_subscription TO sbg_worker_rw;
GRANT SELECT,INSERT,UPDATE ON core_integration.webhook_delivery_identity,core_integration.webhook_delivery TO sbg_worker_rw;

GRANT USAGE ON SCHEMA platform_directory,core_audit,core_integration TO sbg_monitor_ro;
GRANT SELECT ON platform_directory.migration_ledger TO sbg_monitor_ro;
GRANT SELECT ON core_integration.outbox_event,core_integration.webhook_delivery TO sbg_monitor_ro;
GRANT SELECT ON core_audit.audit_event TO sbg_monitor_ro;

ALTER DEFAULT PRIVILEGES IN SCHEMA core_identity,core_tenancy,core_authz,core_commercial,core_config,core_master,core_workflow,core_notification,core_document,core_projection
  GRANT SELECT,INSERT,UPDATE,DELETE ON TABLES TO sbg_app_rw;
ALTER DEFAULT PRIVILEGES IN SCHEMA ind_hlt,ind_edu,ind_rtl,ind_hsp,ind_mfg,ind_psv,ind_gov,ind_ngo,ind_sfm
  GRANT SELECT,INSERT,UPDATE,DELETE ON TABLES TO sbg_app_rw;

-- Migration/admin role receives broad DDL/DML only by explicit deployment membership.
GRANT USAGE,CREATE ON SCHEMA platform_directory,core_identity,core_tenancy,core_authz,core_commercial,core_config,core_master,core_workflow,core_notification,core_document,core_audit,core_integration,core_projection TO sbg_migration_admin;
GRANT USAGE,CREATE ON SCHEMA ind_hlt,ind_edu,ind_rtl,ind_hsp,ind_mfg,ind_psv,ind_gov,ind_ngo,ind_sfm TO sbg_migration_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA platform_directory,core_identity,core_tenancy,core_authz,core_commercial,core_config,core_master,core_workflow,core_notification,core_document,core_audit,core_integration,core_projection TO sbg_migration_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ind_hlt,ind_edu,ind_rtl,ind_hsp,ind_mfg,ind_psv,ind_gov,ind_ngo,ind_sfm TO sbg_migration_admin;
