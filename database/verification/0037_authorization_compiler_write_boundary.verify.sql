-- Verification 0037 — dedicated Authorization compiler write boundary
DO $$
DECLARE
  role_row record;
BEGIN
  SELECT rolsuper,rolcreatedb,rolcreaterole,rolinherit,rolbypassrls,rolcanlogin
  INTO role_row
  FROM pg_roles
  WHERE rolname='sbg_authorization_compiler_rw';

  IF NOT FOUND
    OR role_row.rolsuper OR role_row.rolcreatedb OR role_row.rolcreaterole
    OR role_row.rolinherit OR role_row.rolbypassrls OR role_row.rolcanlogin THEN
    RAISE EXCEPTION '0037 Authorization compiler role is missing or unsafe';
  END IF;

  IF NOT has_schema_privilege('sbg_authorization_compiler_rw','core_authz','USAGE') THEN
    RAISE EXCEPTION '0037 compiler requires core_authz schema usage';
  END IF;

  IF NOT has_table_privilege('sbg_authorization_compiler_rw','core_authz.compiled_permission_subject','SELECT,INSERT,UPDATE')
    OR NOT has_table_privilege('sbg_authorization_compiler_rw','core_authz.compiled_permission_snapshot','SELECT,INSERT,UPDATE')
    OR NOT has_table_privilege('sbg_authorization_compiler_rw','core_authz.compiled_platform_permission_subject','SELECT,INSERT,UPDATE')
    OR NOT has_table_privilege('sbg_authorization_compiler_rw','core_authz.compiled_platform_permission_snapshot','SELECT,INSERT,UPDATE') THEN
    RAISE EXCEPTION '0037 compiler publication grants are incomplete';
  END IF;

  IF has_table_privilege('sbg_authorization_compiler_rw','core_authz.compiled_permission_subject','DELETE')
    OR has_table_privilege('sbg_authorization_compiler_rw','core_authz.compiled_permission_snapshot','DELETE')
    OR has_table_privilege('sbg_authorization_compiler_rw','core_authz.compiled_platform_permission_subject','DELETE')
    OR has_table_privilege('sbg_authorization_compiler_rw','core_authz.compiled_platform_permission_snapshot','DELETE') THEN
    RAISE EXCEPTION '0037 compiler must not delete compiled Authorization truth';
  END IF;

  IF has_table_privilege('sbg_authorization_compiler_rw','core_authz.platform_role_assignment','INSERT')
    OR has_table_privilege('sbg_authorization_compiler_rw','core_authz.abac_policy','UPDATE')
    OR has_table_privilege('sbg_authorization_compiler_rw','core_authz.role_template','UPDATE')
    OR has_table_privilege('sbg_authorization_compiler_rw','core_authz.role_permission','INSERT')
    OR has_table_privilege('sbg_authorization_compiler_rw','core_authz.role_assignment','UPDATE') THEN
    RAISE EXCEPTION '0037 compiler unexpectedly owns source/assignment/policy mutation';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='core_authz'
      AND tablename='compiled_platform_permission_subject'
      AND policyname='compiled_platform_permission_subject_compiler_policy'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='core_authz'
      AND tablename='compiled_platform_permission_snapshot'
      AND policyname='compiled_platform_permission_snapshot_compiler_policy'
  ) THEN
    RAISE EXCEPTION '0037 platform compiler RLS policies missing';
  END IF;

  IF has_table_privilege('sbg_app_rw','core_authz.compiled_permission_subject','INSERT')
    OR has_table_privilege('sbg_app_rw','core_authz.compiled_platform_permission_snapshot','UPDATE')
    OR has_table_privilege('sbg_control_plane_rw','core_authz.compiled_platform_permission_subject','INSERT')
    OR has_table_privilege('sbg_control_plane_rw','core_authz.compiled_platform_permission_snapshot','UPDATE') THEN
    RAISE EXCEPTION '0037 runtime/control-plane roles must remain non-compiler writers';
  END IF;
END $$;

-- Exercise PLATFORM_GLOBAL compiler RLS + monotonic publication/invalidation in rollback-only data.
BEGIN;

INSERT INTO core_identity.platform_principal
(id,principal_type,status,display_name,auth_epoch,created_at,updated_at)
VALUES
('37000000-0000-0000-0000-000000000001','PLATFORM_OPERATOR','ACTIVE','0037 compiler target',1,now(),now());

SET LOCAL ROLE sbg_authorization_compiler_rw;
SELECT set_config('app.scope_class','PLATFORM_GLOBAL',true);
SELECT set_config('app.tenant_id','',true);
SELECT set_config('app.industry_context_id','',true);
SELECT set_config('app.principal_id','37000000-0000-0000-0000-000000000099',true);

INSERT INTO core_authz.compiled_platform_permission_subject
(id,principal_id,current_version,created_at,updated_at)
VALUES
('37000000-0000-0000-0000-000000000010',
 '37000000-0000-0000-0000-000000000001',0,now(),now());

SET CONSTRAINTS ALL DEFERRED;

INSERT INTO core_authz.compiled_platform_permission_snapshot
(id,subject_id,version,status,role_ids,permission_schema_version,permission_set_json,source_fingerprint,compiled_at)
VALUES
('37000000-0000-0000-0000-000000000011',
 '37000000-0000-0000-0000-000000000010',1,'CURRENT','{}',1,
 '{"permissions":[]}'::jsonb,'0037-platform-version-one',now());

UPDATE core_authz.compiled_platform_permission_subject
SET current_snapshot_id='37000000-0000-0000-0000-000000000011',current_version=1
WHERE id='37000000-0000-0000-0000-000000000010';

UPDATE core_authz.compiled_platform_permission_snapshot
SET status='SUPERSEDED',superseded_at=now()
WHERE id='37000000-0000-0000-0000-000000000011' AND status='CURRENT';

INSERT INTO core_authz.compiled_platform_permission_snapshot
(id,subject_id,version,status,role_ids,permission_schema_version,permission_set_json,source_fingerprint,compiled_at)
VALUES
('37000000-0000-0000-0000-000000000012',
 '37000000-0000-0000-0000-000000000010',2,'CURRENT','{}',1,
 '{"permissions":[]}'::jsonb,'0037-platform-version-two',now());

UPDATE core_authz.compiled_platform_permission_subject
SET current_snapshot_id='37000000-0000-0000-0000-000000000012',current_version=2
WHERE id='37000000-0000-0000-0000-000000000010';

SET CONSTRAINTS ALL IMMEDIATE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM core_authz.compiled_platform_permission_subject
    WHERE id='37000000-0000-0000-0000-000000000010'
      AND current_version=2
      AND current_snapshot_id='37000000-0000-0000-0000-000000000012'
  ) OR NOT EXISTS (
    SELECT 1 FROM core_authz.compiled_platform_permission_snapshot
    WHERE id='37000000-0000-0000-0000-000000000011' AND status='SUPERSEDED'
  ) THEN
    RAISE EXCEPTION '0037 platform compiler monotonic publication failed';
  END IF;
END $$;

UPDATE core_authz.compiled_platform_permission_snapshot
SET status='INVALIDATED',invalidated_at=now()
WHERE id='37000000-0000-0000-0000-000000000012' AND status='CURRENT';

UPDATE core_authz.compiled_platform_permission_subject
SET current_snapshot_id=NULL
WHERE id='37000000-0000-0000-0000-000000000010' AND current_version=2;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM core_authz.compiled_platform_permission_subject
    WHERE id='37000000-0000-0000-0000-000000000010'
      AND current_version=2 AND current_snapshot_id IS NULL
  ) OR NOT EXISTS (
    SELECT 1 FROM core_authz.compiled_platform_permission_snapshot
    WHERE id='37000000-0000-0000-0000-000000000012' AND status='INVALIDATED'
  ) THEN
    RAISE EXCEPTION '0037 platform compiler invalidation failed';
  END IF;
END $$;

RESET ROLE;
ROLLBACK;
