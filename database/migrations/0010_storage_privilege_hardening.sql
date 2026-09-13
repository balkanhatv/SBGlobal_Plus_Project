-- SBGlobal Plus — Migration 0010: physical storage privilege hardening

-- Application and ordinary worker roles must authorize through DocumentMeta and service contracts,
-- never directly through physical storage-object metadata.
REVOKE ALL PRIVILEGES ON core_document.storage_object FROM sbg_app_rw;
REVOKE ALL PRIVILEGES ON core_document.storage_object FROM sbg_worker_rw;
REVOKE ALL PRIVILEGES ON core_document.storage_object FROM sbg_monitor_ro;

-- Default privileges for core_document are intentionally narrowed:
-- future tables are not automatically granted to app/runtime roles.
ALTER DEFAULT PRIVILEGES IN SCHEMA core_document
  REVOKE ALL ON TABLES FROM sbg_app_rw;

-- Regrant only current logical document-plane tables.
GRANT SELECT,INSERT,UPDATE,DELETE ON
  core_document.document_meta,
  core_document.document_upload_session,
  core_document.document_acl
TO sbg_app_rw;

GRANT SELECT ON
  core_document.document_meta,
  core_document.document_upload_session,
  core_document.document_acl
TO sbg_worker_rw;
