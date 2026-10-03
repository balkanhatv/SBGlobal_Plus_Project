-- Verification 0028: dedicated Document/Integration role boundaries

DO $$
DECLARE bad integer;
BEGIN
 SELECT count(*) INTO bad
 FROM pg_roles
 WHERE rolname IN ('sbg_document_service_rw','sbg_integration_service_rw')
   AND (rolsuper OR rolcreatedb OR rolcreaterole OR rolbypassrls);
 IF bad<>0 THEN RAISE EXCEPTION 'Document/Integration service roles must remain least-privilege NOBYPASSRLS'; END IF;
END $$;

DO $$
BEGIN
 IF NOT has_table_privilege('sbg_document_service_rw','core_document.storage_object','SELECT')
    OR NOT has_table_privilege('sbg_document_service_rw','core_document.storage_object','UPDATE') THEN
   RAISE EXCEPTION 'Document service role lacks physical storage access';
 END IF;
 IF has_table_privilege('sbg_app_rw','core_document.storage_object','SELECT') THEN
   RAISE EXCEPTION 'General app role must not read StorageObject';
 END IF;
END $$;

DO $$
BEGIN
 IF NOT has_table_privilege('sbg_integration_service_rw','core_integration.credential_reference','SELECT')
    OR NOT has_table_privilege('sbg_integration_service_rw','core_integration.tenant_integration','UPDATE') THEN
   RAISE EXCEPTION 'Integration service role lacks registry management access';
 END IF;
 IF has_table_privilege('sbg_app_rw','core_integration.credential_reference','SELECT') THEN
   RAISE EXCEPTION 'General app role must not read CredentialReference';
 END IF;
END $$;

DO $$
BEGIN
 IF NOT EXISTS (
   SELECT 1 FROM pg_indexes
   WHERE schemaname='core_integration'
     AND indexname='sync_cursor_scope_capability_uq'
 ) THEN RAISE EXCEPTION 'Tenant-core/Industry SyncCursor uniqueness hardening missing'; END IF;
END $$;
