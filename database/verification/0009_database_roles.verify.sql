-- Verification 0009: runtime role boundaries

DO $$
DECLARE
  bad integer;
BEGIN
  SELECT count(*) INTO bad
  FROM pg_roles
  WHERE rolname IN ('sbg_app_rw','sbg_worker_rw','sbg_monitor_ro')
    AND (rolsuper OR rolcreaterole OR rolcreatedb OR rolbypassrls);

  IF bad <> 0 THEN
    RAISE EXCEPTION 'Runtime roles must not be superuser/createdb/createrole/bypassrls';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='sbg_migration_admin') THEN
    RAISE EXCEPTION 'Missing migration admin role';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM pg_auth_members m
    JOIN pg_roles parent ON parent.oid=m.roleid
    JOIN pg_roles member ON member.oid=m.member
    WHERE parent.rolname='sbg_migration_admin'
      AND member.rolname IN ('sbg_app_rw','sbg_worker_rw','sbg_monitor_ro')
  ) THEN
    RAISE EXCEPTION 'Runtime group must not inherit migration admin';
  END IF;
END $$;

DO $$
BEGIN
  IF has_table_privilege('sbg_app_rw','core_document.storage_object','SELECT') THEN
    RAISE EXCEPTION 'Application role must not read physical storage_object table';
  END IF;
END $$;
