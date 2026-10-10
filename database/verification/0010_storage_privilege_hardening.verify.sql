-- Verification 0010: physical storage privilege hardening

DO $$
DECLARE
  role_name text;
BEGIN
  FOREACH role_name IN ARRAY ARRAY['sbg_app_rw','sbg_worker_rw','sbg_monitor_ro']
  LOOP
    IF has_table_privilege(role_name,'core_document.storage_object','SELECT')
       OR has_table_privilege(role_name,'core_document.storage_object','INSERT')
       OR has_table_privilege(role_name,'core_document.storage_object','UPDATE')
       OR has_table_privilege(role_name,'core_document.storage_object','DELETE') THEN
      RAISE EXCEPTION '% must not have direct physical storage_object DML', role_name;
    END IF;
  END LOOP;
END $$;

DO $$
BEGIN
  IF NOT has_table_privilege('sbg_app_rw','core_document.document_meta','SELECT')
     OR NOT has_table_privilege('sbg_app_rw','core_document.document_meta','INSERT')
     OR NOT has_table_privilege('sbg_app_rw','core_document.document_meta','UPDATE') THEN
    RAISE EXCEPTION 'sbg_app_rw must retain logical DocumentMeta access';
  END IF;
END $$;
