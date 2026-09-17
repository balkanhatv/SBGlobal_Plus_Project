-- Verification 0035 — PLATFORM_GLOBAL authorization persistence prerequisite
DO $$
DECLARE
  target text;
BEGIN
  FOREACH target IN ARRAY ARRAY[
    'platform_role_assignment',
    'compiled_platform_permission_subject',
    'compiled_platform_permission_snapshot'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='core_authz' AND c.relname=target AND c.relkind='r'
        AND c.relrowsecurity AND c.relforcerowsecurity
    ) THEN
      RAISE EXCEPTION '0035 expected forced-RLS table core_authz.%',target;
    END IF;
  END LOOP;

  IF NOT EXISTS (
    SELECT 1 FROM core_authz.rls_table_registry
    WHERE schema_name='core_authz' AND table_name='platform_role_assignment'
      AND scope_class='PLATFORM_GLOBAL' AND owner_module='Authorization'
      AND force_rls_required AND status='ACTIVE'
  ) OR NOT EXISTS (
    SELECT 1 FROM core_authz.rls_table_registry
    WHERE schema_name='core_authz' AND table_name='compiled_platform_permission_subject'
      AND scope_class='PLATFORM_GLOBAL' AND owner_module='Authorization'
      AND force_rls_required AND status='ACTIVE'
  ) OR NOT EXISTS (
    SELECT 1 FROM core_authz.rls_table_registry
    WHERE schema_name='core_authz' AND table_name='compiled_platform_permission_snapshot'
      AND scope_class='PLATFORM_GLOBAL' AND owner_module='Authorization'
      AND force_rls_required AND status='ACTIVE'
  ) THEN
    RAISE EXCEPTION '0035 PLATFORM_GLOBAL Authorization RLS registry incomplete';
  END IF;

  IF NOT has_table_privilege('sbg_app_rw','core_authz.platform_role_assignment','SELECT')
    OR NOT has_table_privilege('sbg_app_rw','core_authz.compiled_platform_permission_subject','SELECT')
    OR NOT has_table_privilege('sbg_app_rw','core_authz.compiled_platform_permission_snapshot','SELECT') THEN
    RAISE EXCEPTION '0035 app role requires read-only PDP persistence access';
  END IF;

  IF has_table_privilege('sbg_app_rw','core_authz.platform_role_assignment','INSERT')
    OR has_table_privilege('sbg_app_rw','core_authz.platform_role_assignment','UPDATE')
    OR has_table_privilege('sbg_app_rw','core_authz.platform_role_assignment','DELETE')
    OR has_table_privilege('sbg_app_rw','core_authz.compiled_platform_permission_subject','INSERT')
    OR has_table_privilege('sbg_app_rw','core_authz.compiled_platform_permission_subject','UPDATE')
    OR has_table_privilege('sbg_app_rw','core_authz.compiled_platform_permission_subject','DELETE')
    OR has_table_privilege('sbg_app_rw','core_authz.compiled_platform_permission_snapshot','INSERT')
    OR has_table_privilege('sbg_app_rw','core_authz.compiled_platform_permission_snapshot','UPDATE')
    OR has_table_privilege('sbg_app_rw','core_authz.compiled_platform_permission_snapshot','DELETE') THEN
    RAISE EXCEPTION '0035 app role must not mutate Authorization assignment/snapshot truth';
  END IF;

  IF NOT has_table_privilege('sbg_control_plane_rw','core_authz.platform_role_assignment','SELECT')
    OR NOT has_table_privilege('sbg_control_plane_rw','core_authz.platform_role_assignment','INSERT')
    OR NOT has_table_privilege('sbg_control_plane_rw','core_authz.platform_role_assignment','UPDATE')
    OR NOT has_table_privilege('sbg_control_plane_rw','core_authz.platform_role_assignment','DELETE') THEN
    RAISE EXCEPTION '0035 control plane must own platform role-assignment lifecycle';
  END IF;

  IF has_table_privilege('sbg_control_plane_rw','core_authz.compiled_platform_permission_subject','INSERT')
    OR has_table_privilege('sbg_control_plane_rw','core_authz.compiled_platform_permission_subject','UPDATE')
    OR has_table_privilege('sbg_control_plane_rw','core_authz.compiled_platform_permission_snapshot','INSERT')
    OR has_table_privilege('sbg_control_plane_rw','core_authz.compiled_platform_permission_snapshot','UPDATE') THEN
    RAISE EXCEPTION '0035 does not silently make Control Plane the Authorization compiler';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='core_authz.compiled_platform_permission_subject'::regclass
      AND conname='compiled_platform_permission_subject_current_snapshot_fk'
      AND condeferrable
  ) THEN
    RAISE EXCEPTION '0035 current platform snapshot pointer/version FK missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='core_authz'
      AND tablename='compiled_platform_permission_snapshot'
      AND indexname='compiled_platform_permission_snapshot_one_current_uq'
  ) THEN
    RAISE EXCEPTION '0035 one-current platform snapshot invariant missing';
  END IF;
END $$;

-- Executable integrity fixtures remain inside one rollback-only verification transaction.
BEGIN;
INSERT INTO core_identity.platform_principal
(id,principal_type,status,display_name,auth_epoch,created_at,updated_at)
VALUES
('35000000-0000-0000-0000-000000000001','PLATFORM_OPERATOR','ACTIVE','0035 operator',1,now(),now()),
('35000000-0000-0000-0000-000000000002','HUMAN','ACTIVE','0035 tenant human',1,now(),now());

INSERT INTO core_authz.role_template
(id,code,owner_scope,name,immutable_seed,version,status,created_at,updated_at)
VALUES
('35000000-0000-0000-0000-000000000010','PLATFORM_AUDITOR_0035','PLATFORM','0035 Platform Auditor',true,1,'ACTIVE',now(),now());

INSERT INTO core_authz.platform_role_assignment
(id,principal_id,role_id,status,created_by,created_at)
VALUES
('35000000-0000-0000-0000-000000000020','35000000-0000-0000-0000-000000000001','35000000-0000-0000-0000-000000000010','ACTIVE','35000000-0000-0000-0000-000000000001',now());

INSERT INTO core_authz.compiled_platform_permission_subject
(id,principal_id,current_version,created_at,updated_at)
VALUES
('35000000-0000-0000-0000-000000000030','35000000-0000-0000-0000-000000000001',0,now(),now());

SET CONSTRAINTS compiled_platform_permission_subject_current_snapshot_fk DEFERRED;
INSERT INTO core_authz.compiled_platform_permission_snapshot
(id,subject_id,version,status,role_ids,permission_schema_version,permission_set_json,source_fingerprint,compiled_at)
VALUES
('35000000-0000-0000-0000-000000000031','35000000-0000-0000-0000-000000000030',1,'CURRENT',ARRAY['35000000-0000-0000-0000-000000000010'::uuid],1,
 '{"permissions":[]}'::jsonb,'0035-platform-fixture-fingerprint',now());
UPDATE core_authz.compiled_platform_permission_subject
SET current_snapshot_id='35000000-0000-0000-0000-000000000031',current_version=1
WHERE id='35000000-0000-0000-0000-000000000030';
SET CONSTRAINTS compiled_platform_permission_subject_current_snapshot_fk IMMEDIATE;

DO $$
BEGIN
  BEGIN
    INSERT INTO core_authz.platform_role_assignment
    (id,principal_id,role_id,status,created_by,created_at)
    VALUES
    ('35000000-0000-0000-0000-000000000021','35000000-0000-0000-0000-000000000002','35000000-0000-0000-0000-000000000010','ACTIVE','35000000-0000-0000-0000-000000000001',now());
    RAISE EXCEPTION '0035 ordinary HUMAN unexpectedly accepted for platform role assignment';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  BEGIN
    UPDATE core_authz.compiled_platform_permission_snapshot
    SET permission_set_json='{"permissions":[{"code":"forbidden.rewrite","effect":"ALLOW"}]}'::jsonb
    WHERE id='35000000-0000-0000-0000-000000000031';
    RAISE EXCEPTION '0035 immutable compiled platform payload unexpectedly rewritable';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;
END $$;
ROLLBACK;
